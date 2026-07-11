from scapy.all import sniff, IP, TCP, UDP, ICMP
from datetime import datetime
import database
import subprocess
from collections import defaultdict

packet_count = defaultdict(lambda: {
    "tcp": 0, "udp": 0, "icmp": 0,
    "ports": set(),
    "ssh_attempts": 0,
    "warned": False,
    "last_reset": datetime.now()
})

BRUTE_FORCE_PORTS = [22, 21, 23, 3389]

WHITELIST = [
    "127.0.0.1",
    "10.0.2.2",
    "192.168.1.1"
]

def get_threshold():
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT setting_key, setting_value FROM settings")
        rows = cursor.fetchall()
        conn.close()
        return {r[0]: r[1] for r in rows}
    except Exception as e:
        print(f"Error loading threshold: {e}")
        return {
            "port_scan_warn": 10,
            "port_scan_block": 20,
            "syn_flood_warn": 50,
            "syn_flood_block": 100,
            "udp_flood_warn": 50,
            "udp_flood_block": 100,
            "icmp_flood_warn": 25,
            "icmp_flood_block": 50,
            "brute_force_warn": 3,
            "brute_force_block": 5,
        }

def block_ip(ip, attack_name):
    try:
        subprocess.run(["sudo", "iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"])
        save_block(ip, attack_name)
        send_notification("BLOCK", attack_name, ip)
        print(f"[BLOCKED] {ip} เนื่องจาก {attack_name}")
    except Exception as e:
        print(f"Error blocking IP: {e}")

def warn_admin(attack_name, src_ip):
    try:
        send_notification("WARNING", attack_name, src_ip)
        print(f"[WARNING] ตรวจพบพฤติกรรมน่าสงสัย {attack_name} จาก {src_ip}")
    except Exception as e:
        print(f"Error warning admin: {e}")

def send_notification(level, attack_name, src_ip):
    try:
        from notifier import send_alert as notify
        if level == "WARNING":
            notify(
                f"⚠️ WARNING - {attack_name}",
                src_ip,
                f"ตรวจพบพฤติกรรมน่าสงสัยจาก {src_ip}\nยังไม่ได้บล็อก กรุณาตรวจสอบ"
            )
        elif level == "BLOCK":
            notify(
                f"🚫 BLOCKED - {attack_name}",
                src_ip,
                f"บล็อก {src_ip} แล้ว เนื่องจาก {attack_name}"
            )
    except Exception as e:
        print(f"Error sending notification: {e}")

def save_packet(src_ip, dst_ip, protocol, port):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO packet_entry 
            (source_ip, destination_ip, protocol, port, timestamp)
            VALUES (%s, %s, %s, %s, %s)
        """, (src_ip, dst_ip, protocol, port, datetime.now()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving packet: {e}")

def save_attack(src_ip, attack_name, pps, level="BLOCK"):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO attack_list 
            (source_ip, packetpersec, description, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (src_ip, pps, f"[{level}] {attack_name}", datetime.now()))
        conn.commit()
        conn.close()
        print(f"[{level}] {attack_name} จาก {src_ip} ({pps} pps)")
    except Exception as e:
        print(f"Error saving attack: {e}")

def save_block(ip, attack_name):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO block_list 
            (ip_address, attack_name, start_time)
            VALUES (%s, %s, %s)
        """, (ip, attack_name, datetime.now()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving block: {e}")

def check_attack(src_ip):
    if src_ip in WHITELIST:
        return

    data = packet_count[src_ip]
    now = datetime.now()
    elapsed = (now - data["last_reset"]).seconds

    if elapsed >= 3:
        T = get_threshold()

        # ตรวจจับ Brute Force ก่อน
        if data["ssh_attempts"] >= T["brute_force_block"]:
            save_attack(src_ip, "Brute Force", data["ssh_attempts"], "BLOCK")
            block_ip(src_ip, "Brute Force")

        elif data["ssh_attempts"] >= T["brute_force_warn"] and not data["warned"]:
            save_attack(src_ip, "Brute Force", data["ssh_attempts"], "WARNING")
            warn_admin("Brute Force", src_ip)
            packet_count[src_ip]["warned"] = True

        # ตรวจจับ Port Scan
        if len(data["ports"]) >= T["port_scan_block"]:
            save_attack(src_ip, "Port Scan", len(data["ports"]), "BLOCK")
            block_ip(src_ip, "Port Scan")

        elif len(data["ports"]) >= T["port_scan_warn"] and not data["warned"]:
            save_attack(src_ip, "Port Scan", len(data["ports"]), "WARNING")
            warn_admin("Port Scan", src_ip)
            packet_count[src_ip]["warned"] = True

        # ตรวจจับ SYN Flood
        if data["tcp"] >= T["syn_flood_block"]:
            save_attack(src_ip, "SYN Flood", data["tcp"], "BLOCK")
            block_ip(src_ip, "SYN Flood")

        elif data["tcp"] >= T["syn_flood_warn"] and not data["warned"]:
            save_attack(src_ip, "SYN Flood", data["tcp"], "WARNING")
            warn_admin("SYN Flood", src_ip)
            packet_count[src_ip]["warned"] = True

        # ตรวจจับ UDP Flood
        if data["udp"] >= T["udp_flood_block"]:
            save_attack(src_ip, "UDP Flood", data["udp"], "BLOCK")
            block_ip(src_ip, "UDP Flood")

        elif data["udp"] >= T["udp_flood_warn"] and not data["warned"]:
            save_attack(src_ip, "UDP Flood", data["udp"], "WARNING")
            warn_admin("UDP Flood", src_ip)
            packet_count[src_ip]["warned"] = True

        # ตรวจจับ ICMP Flood
        if data["icmp"] >= T["icmp_flood_block"]:
            save_attack(src_ip, "ICMP Flood", data["icmp"], "BLOCK")
            block_ip(src_ip, "ICMP Flood")

        elif data["icmp"] >= T["icmp_flood_warn"] and not data["warned"]:
            save_attack(src_ip, "ICMP Flood", data["icmp"], "WARNING")
            warn_admin("ICMP Flood", src_ip)
            packet_count[src_ip]["warned"] = True

        # Reset counter
        packet_count[src_ip] = {
            "tcp": 0, "udp": 0, "icmp": 0,
            "ports": set(), "ssh_attempts": 0,
            "warned": False,
            "last_reset": now
        }

def analyze_packet(packet):
    if not packet.haslayer(IP):
        return

    src_ip = packet[IP].src
    dst_ip = packet[IP].dst
    protocol = ""
    port = 0

    if packet.haslayer(TCP):
        protocol = "TCP"
        port = packet[TCP].dport
        packet_count[src_ip]["tcp"] += 1
        packet_count[src_ip]["ports"].add(port)

        if port in BRUTE_FORCE_PORTS:
            packet_count[src_ip]["ssh_attempts"] += 1
            print(f"[SSH ATTEMPT] จาก {src_ip} ครั้งที่ {packet_count[src_ip]['ssh_attempts']}")

    elif packet.haslayer(UDP):
        protocol = "UDP"
        port = packet[UDP].dport
        packet_count[src_ip]["udp"] += 1

    elif packet.haslayer(ICMP):
        protocol = "ICMP"
        packet_count[src_ip]["icmp"] += 1

    save_packet(src_ip, dst_ip, protocol, port)
    check_attack(src_ip)
    print(f"[{datetime.now()}] {protocol} {src_ip} → {dst_ip}:{port}")

def start_detection():
    print("เริ่มดักจับแพ็กเก็ต...")
    T = get_threshold()
    print(f"Threshold ปัจจุบัน: {T}")
    sniff(iface="enp0s8", prn=analyze_packet, store=False)

if __name__ == "__main__":
    start_detection()
