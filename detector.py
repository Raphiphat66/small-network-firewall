import subprocess
import re
import threading
import time
from datetime import datetime
from collections import defaultdict
import database

packet_buffer = []
BUFFER_SIZE = 50
blocked_ips = set()
THRESHOLD_CACHE = {}
THRESHOLD_LAST_LOAD = None

packet_count = defaultdict(lambda: {
    "tcp": 0, "udp": 0, "icmp": 0,
    "tcp_total": 0,
    "ports": set(),
    "ssh_attempts": 0,
    "warned": False,
    "last_reset": datetime.now()
})

def get_whitelist():
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ip_address FROM whitelist")
        rows = cursor.fetchall()
        conn.close()
        return [r[0] for r in rows]
    except:
        return ["127.0.0.1", "10.0.2.2", "192.168.1.1"]

def get_threshold():
    global THRESHOLD_CACHE, THRESHOLD_LAST_LOAD
    now = datetime.now()
    if THRESHOLD_LAST_LOAD is None or (now - THRESHOLD_LAST_LOAD).total_seconds() > 30:
        try:
            conn = database.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT setting_key, setting_value FROM settings")
            rows = cursor.fetchall()
            conn.close()
            THRESHOLD_CACHE = {r[0]: r[1] for r in rows}
            THRESHOLD_LAST_LOAD = now
        except:
            if not THRESHOLD_CACHE:
                THRESHOLD_CACHE = {
                    "port_scan_warn": 10, "port_scan_block": 20,
                    "syn_flood_warn": 50, "syn_flood_block": 100,
                    "udp_flood_warn": 50, "udp_flood_block": 100,
                    "icmp_flood_warn": 50, "icmp_flood_block": 100,
                    "brute_force_warn": 3, "brute_force_block": 5,
                }
    return THRESHOLD_CACHE

def block_ip(ip, attack_name):
    global blocked_ips
    try:
        if ip in blocked_ips:
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"[{ts}] ℹ️  SKIP     {ip} บล็อกอยู่แล้ว")
            return
        check = subprocess.run(
            ["sudo", "iptables", "-C", "INPUT", "-s", ip, "-j", "DROP"],
            capture_output=True
        )
        if check.returncode == 0:
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"[{ts}] ℹ️  SKIP     {ip} บล็อกอยู่แล้ว")
            return
        blocked_ips.add(ip)
        subprocess.run(["sudo", "iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"])
        save_block(ip, attack_name)
        send_notification("BLOCK", attack_name, ip)
        ts = datetime.now().strftime("%H:%M:%S")
        print(f"[{ts}] 🚫 BLOCKED  {attack_name:<15} จาก {ip}")
    except Exception as e:
        print(f"Error blocking IP: {e}")

def warn_admin(attack_name, src_ip):
    if src_ip in blocked_ips:
        return
    check = subprocess.run(
        ["sudo", "iptables", "-C", "INPUT", "-s", src_ip, "-j", "DROP"],
        capture_output=True
    )
    if check.returncode == 0:
        return
    send_notification("WARNING", attack_name, src_ip)
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] ⚠️  WARNING  {attack_name:<15} จาก {src_ip}")

def send_notification(level, attack_name, src_ip):
    try:
        from notifier import send_alert as notify
        if level == "WARNING":
            notify(f"⚠️ WARNING - {attack_name}", src_ip,
                   f"ตรวจพบพฤติกรรมน่าสงสัยจาก {src_ip}")
        elif level == "BLOCK":
            notify(f"🚫 BLOCKED - {attack_name}", src_ip,
                   f"บล็อก {src_ip} เนื่องจาก {attack_name}")
    except Exception as e:
        print(f"Error sending notification: {e}")

def flush_packets():
    global packet_buffer
    if not packet_buffer:
        return
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.executemany("""
            INSERT INTO packet_entry
            (source_ip, destination_ip, protocol, port, timestamp)
            VALUES (%s, %s, %s, %s, %s)
        """, packet_buffer)
        conn.commit()
        conn.close()
        packet_buffer = []
    except Exception as e:
        print(f"Error flushing packets: {e}")

def save_packet(src_ip, dst_ip, protocol, port):
    global packet_buffer
    packet_buffer.append((src_ip, dst_ip, protocol, port, datetime.now()))
    if len(packet_buffer) >= BUFFER_SIZE:
        flush_packets()

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
    except Exception as e:
        print(f"Error saving attack: {e}")

def save_block(ip, attack_name):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) FROM block_list
            WHERE ip_address = %s AND end_time IS NULL
        """, (ip,))
        count = cursor.fetchone()[0]
        if count > 0:
            conn.close()
            return
        cursor.execute("""
            INSERT INTO block_list (ip_address, attack_name, start_time)
            VALUES (%s, %s, %s)
        """, (ip, attack_name, datetime.now()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving block: {e}")

def check_attack(src_ip):
    if src_ip in get_whitelist():
        return

    data = packet_count[src_ip]
    now = datetime.now()
    elapsed = (now - data["last_reset"]).total_seconds()

    if elapsed >= 1:
        T = get_threshold()

        already_blocked = src_ip in blocked_ips

        is_port_scan = len(data["ports"]) >= T["port_scan_warn"]
        is_brute_force = data["ssh_attempts"] >= T["brute_force_warn"]

        # Brute Force
        if not is_port_scan:
            if data["ssh_attempts"] >= T["brute_force_block"]:
                save_attack(src_ip, "Brute Force", data["ssh_attempts"], "BLOCK")
                block_ip(src_ip, "Brute Force")
                packet_count[src_ip]["warned"] = True
            elif data["ssh_attempts"] >= T["brute_force_warn"] and not data["warned"]:
                level = "BLOCK" if already_blocked else "WARNING"
                save_attack(src_ip, "Brute Force", data["ssh_attempts"], level)
                warn_admin("Brute Force", src_ip)
                packet_count[src_ip]["warned"] = True

        # Port Scan
        if len(data["ports"]) >= T["port_scan_block"]:
            save_attack(src_ip, "Port Scan", len(data["ports"]), "BLOCK")
            block_ip(src_ip, "Port Scan")
            packet_count[src_ip]["warned"] = True
        elif len(data["ports"]) >= T["port_scan_warn"] and not data["warned"]:
            level = "BLOCK" if already_blocked else "WARNING"
            save_attack(src_ip, "Port Scan", len(data["ports"]), level)
            warn_admin("Port Scan", src_ip)
            packet_count[src_ip]["warned"] = True

        # SYN Flood
        if not is_port_scan and not is_brute_force:
            if data["tcp"] >= T["syn_flood_block"]:
                save_attack(src_ip, "SYN Flood", data["tcp"], "BLOCK")
                block_ip(src_ip, "SYN Flood")
                packet_count[src_ip]["warned"] = True
            elif data["tcp"] >= T["syn_flood_warn"] and not data["warned"]:
                level = "BLOCK" if already_blocked else "WARNING"
                save_attack(src_ip, "SYN Flood", data["tcp"], level)
                warn_admin("SYN Flood", src_ip)
                packet_count[src_ip]["warned"] = True

        # UDP Flood
        if data["udp"] >= T["udp_flood_block"]:
            save_attack(src_ip, "UDP Flood", data["udp"], "BLOCK")
            block_ip(src_ip, "UDP Flood")
            packet_count[src_ip]["warned"] = True
        elif data["udp"] >= T["udp_flood_warn"] and not data["warned"]:
            level = "BLOCK" if already_blocked else "WARNING"
            save_attack(src_ip, "UDP Flood", data["udp"], level)
            warn_admin("UDP Flood", src_ip)
            packet_count[src_ip]["warned"] = True

        # ICMP Flood
        if data["icmp"] >= T["icmp_flood_block"]:
            save_attack(src_ip, "ICMP Flood", data["icmp"], "BLOCK")
            block_ip(src_ip, "ICMP Flood")
            packet_count[src_ip]["warned"] = True
        elif data["icmp"] >= T["icmp_flood_warn"] and not data["warned"]:
            level = "BLOCK" if already_blocked else "WARNING"
            save_attack(src_ip, "ICMP Flood", data["icmp"], level)
            warn_admin("ICMP Flood", src_ip)
            packet_count[src_ip]["warned"] = True

        flush_packets()
        was_warned = packet_count[src_ip]["warned"]
        was_tcp_total = packet_count[src_ip]["tcp_total"]
        packet_count[src_ip] = {
            "tcp": 0, "udp": 0, "icmp": 0,
            "tcp_total": was_tcp_total,
            "ports": set(), "ssh_attempts": 0,
            "warned": was_warned,
            "last_reset": now
        }

def parse_tcpdump(line):
    try:
        ip_pattern = r'(\d+\.\d+\.\d+\.\d+)[\.\d]* > (\d+\.\d+\.\d+\.\d+)'
        ip_match = re.search(ip_pattern, line)
        if not ip_match:
            return

        src_ip = ip_match.group(1)
        dst_ip = ip_match.group(2)

        protocol = "TCP"
        port = 0

        if "ICMP" in line or "icmp" in line:
            protocol = "ICMP"
            packet_count[src_ip]["icmp"] += 1

        elif "UDP" in line or "udp" in line:
            protocol = "UDP"
            port_match = re.search(r'\.(\d+) >', line)
            if port_match:
                port = int(port_match.group(1))
            packet_count[src_ip]["udp"] += 1

        elif "Flags" in line or "tcp" in line.lower():
            protocol = "TCP"
            port_match = re.search(r'\.(\d+):', line)
            if port_match:
                port = int(port_match.group(1))
            packet_count[src_ip]["tcp"] += 1
            packet_count[src_ip]["tcp_total"] += 1
            packet_count[src_ip]["ports"].add(port)
            if port == 22 and "Flags [S]" in line:
                T = get_threshold()
                if len(packet_count[src_ip]["ports"]) <= 5:
                    packet_count[src_ip]["ssh_attempts"] += 1

        save_packet(src_ip, dst_ip, protocol, port)

    except Exception as e:
        pass

def background_checker():
    while True:
        time.sleep(0.1)
        for src_ip in list(packet_count.keys()):
            check_attack(src_ip)

def start_detection():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    T = get_threshold()
    print(f"")
    print(f"{'='*55}")
    print(f"  🛡️  Firewall IDS/IPS — tcpdump mode")
    print(f"  เริ่มต้น: {now}")
    print(f"  Interface: enp0s8")
    print(f"{'='*55}")
    print(f"  Threshold ที่ตั้งไว้:")
    print(f"    ICMP  WARN={T.get('icmp_flood_warn')}  BLOCK={T.get('icmp_flood_block')}")
    print(f"    SYN   WARN={T.get('syn_flood_warn')}  BLOCK={T.get('syn_flood_block')}")
    print(f"    UDP   WARN={T.get('udp_flood_warn')}  BLOCK={T.get('udp_flood_block')}")
    print(f"    Scan  WARN={T.get('port_scan_warn')}   BLOCK={T.get('port_scan_block')}")
    print(f"    SSH   WARN={T.get('brute_force_warn')}    BLOCK={T.get('brute_force_block')}")
    print(f"{'='*55}")
    print(f"  รอรับ packet...")
    print(f"")

    t = threading.Thread(target=background_checker, daemon=True)
    t.start()

    proc = subprocess.Popen(
        ["sudo", "tcpdump", "-i", "enp0s8", "-nn", "-l"],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL
    )

    import io
    reader = io.TextIOWrapper(proc.stdout, encoding="utf-8", errors="ignore")
    for line in reader:
        line = line.strip()
        if line:
            parse_tcpdump(line)

if __name__ == "__main__":
    try:
        start_detection()
    except KeyboardInterrupt:
        print("\n[ระบบหยุดทำงาน]")
