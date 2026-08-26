from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import database
import subprocess
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BLOCKED_SITES_FILE = "/etc/firewall_blocked_sites.txt"

class BlockRequest(BaseModel):
    ip: str
    reason: str = "Manual Block"

class RuleRequest(BaseModel):
    rule_name: str
    protocol: str = "tcp"
    port: Optional[int] = None
    source_ip: Optional[str] = None
    dest_ip: Optional[str] = None
    mac_address: Optional[str] = None
    direction: str = "INPUT"
    action: str = "DROP"
    enable_log: bool = False
    position: Optional[int] = None

class WebsiteBlockRequest(BaseModel):
    domain: str
    reason: str = "Blocked Website"

class WhitelistRequest(BaseModel):
    ip_address: str
    description: str = ""

class LoginRequest(BaseModel):
    username: str
    password: str

class SettingRequest(BaseModel):
    setting_key: str
    setting_value: int

def build_rule_cmd(action_flag, protocol, port, source_ip, dest_ip, mac_address, direction, action, position=None):
    if action_flag == "-A" and position:
        cmd = ["sudo", "iptables", "-I", direction, str(position)]
    else:
        cmd = ["sudo", "iptables", action_flag, direction]
    if protocol and protocol != "all":
        cmd += ["-p", protocol]
    if source_ip:
        cmd += ["-s", source_ip]
    if dest_ip:
        cmd += ["-d", dest_ip]
    if mac_address:
        cmd += ["-m", "mac", "--mac-source", mac_address]
    if port and protocol != "all":
        cmd += ["--dport", str(port)]
    cmd += ["-j", action]
    return cmd

@app.on_event("startup")
def sync_iptables_from_db():
    try:
        for port in ["22", "8000", "3000", "53"]:
            check = subprocess.run([
                "sudo", "iptables", "-C", "INPUT",
                "-p", "tcp", "--dport", port, "-j", "ACCEPT"
            ], capture_output=True)
            if check.returncode != 0:
                subprocess.run([
                    "sudo", "iptables", "-I", "INPUT", "1",
                    "-p", "tcp", "--dport", port, "-j", "ACCEPT"
                ], capture_output=True)

        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT protocol, destination_port, source_ip, dest_ip,
                   mac_address, direction, action
            FROM rule WHERE is_active = 1
        """)
        rules = cursor.fetchall()
        for protocol, port, source_ip, dest_ip, mac_address, direction, action in rules:
            cmd = build_rule_cmd("-A", protocol, port, source_ip, dest_ip, mac_address, direction, action)
            subprocess.run(cmd, capture_output=True)

        conn.close()
        print(f"[STARTUP SYNC] สำเร็จ: {len(rules)} rules")
    except Exception as e:
        print(f"[STARTUP SYNC ERROR] {e}")

@app.get("/stats")
def get_stats(date: str = None):
    conn = database.get_connection()
    cursor = conn.cursor()
    if date:
        cursor.execute("SELECT COUNT(*) FROM packet_entry WHERE DATE(timestamp) = %s", (date,))
        total_packets = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM attack_list WHERE DATE(timestamp) = %s", (date,))
        total_attacks = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM block_list WHERE DATE(start_time) = %s", (date,))
        total_blocked = cursor.fetchone()[0]
    else:
        cursor.execute("SELECT COUNT(*) FROM packet_entry WHERE DATE(timestamp) = CURDATE()")
        total_packets = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM attack_list WHERE DATE(timestamp) = CURDATE()")
        total_attacks = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM block_list WHERE end_time IS NULL")
        total_blocked = cursor.fetchone()[0]
    conn.close()
    return {
        "total_packets": total_packets,
        "total_attacks": total_attacks,
        "total_blocked": total_blocked
    }

@app.get("/traffic-summary")
def get_traffic_summary(date: str = None):
    conn = database.get_connection()
    cursor = conn.cursor()
    if date:
        cursor.execute("""
            SELECT HOUR(timestamp) as hr, COUNT(*) as cnt
            FROM packet_entry WHERE DATE(timestamp) = %s
            GROUP BY HOUR(timestamp)
        """, (date,))
    else:
        cursor.execute("""
            SELECT HOUR(timestamp) as hr, COUNT(*) as cnt
            FROM packet_entry WHERE DATE(timestamp) = CURDATE()
            GROUP BY HOUR(timestamp)
        """)
    rows = cursor.fetchall()
    conn.close()
    summary = {f"{h:02d}:00": 0 for h in range(24)}
    for hr, cnt in rows:
        summary[f"{hr:02d}:00"] = cnt
    return summary

@app.get("/packets")
def get_packets():
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT packet_id, source_ip, destination_ip, protocol, port, timestamp
        FROM packet_entry ORDER BY timestamp DESC LIMIT 100
    """)
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "source_ip": r[1], "destination_ip": r[2],
             "protocol": r[3], "port": r[4], "timestamp": str(r[5])} for r in rows]

@app.get("/attacks")
def get_attacks():
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT attack_id, source_ip, packetpersec, description, timestamp
        FROM attack_list ORDER BY timestamp DESC LIMIT 500
    """)
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "source_ip": r[1], "packetpersec": r[2],
             "attack_type": r[3], "timestamp": str(r[4])} for r in rows]

@app.get("/blocklist")
def get_blocklist():
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT block_id, ip_address, attack_name, start_time, end_time
        FROM block_list ORDER BY start_time DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "ip_address": r[1], "attack_name": r[2],
             "start_time": str(r[3]), "end_time": str(r[4]) if r[4] else None} for r in rows]

@app.post("/blocklist")
def block_ip(req: BlockRequest):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM block_list WHERE ip_address = %s AND end_time IS NULL LIMIT 1", (req.ip,))
        if cursor.fetchone():
            conn.close()
            return {"message": f"{req.ip} ถูกบล็อกอยู่แล้ว"}
        check = subprocess.run(
            ["sudo", "iptables", "-C", "INPUT", "-s", req.ip, "-j", "DROP"],
            capture_output=True
        )
        if check.returncode == 0:
            conn.close()
            return {"message": f"{req.ip} ถูกบล็อกใน iptables อยู่แล้ว"}
        result = subprocess.run(["sudo", "iptables", "-A", "INPUT", "-s", req.ip, "-j", "DROP"], capture_output=True, text=True)
        if result.returncode != 0:
            conn.close()
            return {"error": f"iptables ล้มเหลว: {result.stderr.strip()}"}
        cursor.execute("INSERT INTO block_list (ip_address, attack_name, start_time) VALUES (%s, %s, %s)",
                       (req.ip, req.reason, datetime.now()))
        conn.commit()
        conn.close()
        return {"message": f"บล็อก {req.ip} สำเร็จ"}
    except Exception as e:
        return {"error": str(e)}

@app.delete("/blocklist/{ip}")
def unblock_ip(ip: str):
    try:
        subprocess.run(["sudo", "iptables", "-D", "INPUT", "-s", ip, "-j", "DROP"])
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE block_list SET end_time = %s WHERE ip_address = %s AND end_time IS NULL",
                       (datetime.now(), ip))
        conn.commit()
        conn.close()
        return {"message": f"ปลดบล็อก {ip} สำเร็จ"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/whitelist")
def get_whitelist():
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT whitelist_id, ip_address, description, created_at FROM whitelist ORDER BY whitelist_id")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "ip_address": r[1], "description": r[2], "created_at": str(r[3])} for r in rows]

@app.post("/whitelist")
def add_whitelist(req: WhitelistRequest):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO whitelist (ip_address, description) VALUES (%s, %s)",
                       (req.ip_address, req.description))
        conn.commit()
        conn.close()
        return {"message": f"เพิ่ม {req.ip_address} ใน Whitelist สำเร็จ"}
    except Exception as e:
        return {"error": str(e)}

@app.delete("/whitelist/{whitelist_id}")
def delete_whitelist(whitelist_id: int):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM whitelist WHERE whitelist_id = %s", (whitelist_id,))
        conn.commit()
        conn.close()
        return {"message": "ลบออกจาก Whitelist สำเร็จ"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/rules")
def get_rules():
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rule_id, rule_name, protocol, destination_port,
               source_ip, dest_ip, mac_address, direction, action, is_active
        FROM rule ORDER BY rule_id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "rule_name": r[1], "protocol": r[2], "port": r[3],
             "source_ip": r[4], "dest_ip": r[5], "mac_address": r[6],
             "direction": r[7], "action": r[8], "is_active": r[9]} for r in rows]

@app.post("/rules")
def add_rule(req: RuleRequest):
    try:
        drop_position = 6 if req.enable_log else 5
        cmd = build_rule_cmd("-A", req.protocol, req.port, req.source_ip, req.dest_ip,
                             req.mac_address, req.direction, req.action, position=drop_position)
        if req.enable_log:
            log_cmd = ["sudo", "iptables", "-I", req.direction, "5"]
            if req.protocol and req.protocol != "all":
                log_cmd += ["-p", req.protocol]
            if req.source_ip:
                log_cmd += ["-s", req.source_ip]
            if req.dest_ip:
                log_cmd += ["-d", req.dest_ip]
            if req.mac_address:
                log_cmd += ["-m", "mac", "--mac-source", req.mac_address]
            if req.port and req.protocol != "all":
                log_cmd += ["--dport", str(req.port)]
            log_cmd += ["-j", "LOG", "--log-prefix", f"[{req.rule_name}] ", "--log-level", "4"]
            log_result = subprocess.run(log_cmd, capture_output=True, text=True)
            if log_result.returncode != 0:
                return {"error": f"iptables (log) ล้มเหลว: {log_result.stderr.strip()}"}
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return {"error": f"iptables ล้มเหลว: {result.stderr.strip()}"}
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO rule (rule_name, protocol, destination_port, source_ip, dest_ip,
                              mac_address, direction, action, is_active, enable_log)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (req.rule_name, req.protocol, req.port, req.source_ip,
              req.dest_ip, req.mac_address, req.direction, req.action, True, req.enable_log))
        conn.commit()
        conn.close()
        return {"message": f"เพิ่มกฎ {req.rule_name} สำเร็จ"}
    except Exception as e:
        return {"error": str(e)}

@app.delete("/rules/{rule_id}")
def delete_rule(rule_id: int):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT protocol, destination_port, source_ip, dest_ip,
                   mac_address, direction, action, rule_name, enable_log
            FROM rule WHERE rule_id = %s
        """, (rule_id,))
        rule = cursor.fetchone()
        if rule:
            protocol, port, source_ip, dest_ip, mac_address, direction, action, rule_name, enable_log = rule
            if enable_log:
                log_cmd = ["sudo", "iptables", "-D", direction]
                if protocol and protocol != "all":
                    log_cmd += ["-p", protocol]
                if source_ip:
                    log_cmd += ["-s", source_ip]
                if dest_ip:
                    log_cmd += ["-d", dest_ip]
                if mac_address:
                    log_cmd += ["-m", "mac", "--mac-source", mac_address]
                if port and protocol != "all":
                    log_cmd += ["--dport", str(port)]
                log_cmd += ["-j", "LOG", "--log-prefix", f"[{rule_name}] ", "--log-level", "4"]
                subprocess.run(log_cmd, capture_output=True)
            cmd = build_rule_cmd("-D", protocol, port, source_ip, dest_ip, mac_address, direction, action)
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                conn.close()
                return {"error": f"iptables ล้มเหลว: {result.stderr.strip()}"}
            cursor.execute("DELETE FROM rule WHERE rule_id = %s", (rule_id,))
            conn.commit()
        conn.close()
        return {"message": f"ลบกฎสำเร็จ"}
    except Exception as e:
        return {"error": str(e)}

def read_blocked_sites():
    sites = []
    try:
        with open(BLOCKED_SITES_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split()
                    if len(parts) >= 2:
                        sites.append({"ip": parts[0], "domain": parts[1]})
    except FileNotFoundError:
        pass
    return sites

def write_blocked_sites(sites):
    with open(BLOCKED_SITES_FILE, "w") as f:
        for site in sites:
            f.write(f"{site['ip']} {site['domain']}\n")
            f.write(f"{site['ip']} www.{site['domain']}\n")
    subprocess.run(["sudo", "systemctl", "restart", "dnsmasq"])

@app.get("/website-blocks")
def get_website_blocks():
    sites = read_blocked_sites()
    seen = set()
    result = []
    for i, site in enumerate(sites):
        domain = site["domain"].replace("www.", "")
        if domain not in seen:
            seen.add(domain)
            result.append({"id": i, "domain": domain, "ip": site["ip"]})
    return result

@app.post("/website-blocks")
def block_website(req: WebsiteBlockRequest):
    try:
        domain = req.domain.strip().replace("https://", "").replace("http://", "").replace("www.", "")
        sites = read_blocked_sites()
        existing_domains = [s["domain"].replace("www.", "") for s in sites]
        if domain in existing_domains:
            return {"message": f"{domain} ถูกบล็อกอยู่แล้ว"}
        sites.append({"ip": "0.0.0.0", "domain": domain})
        write_blocked_sites(sites)
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT block_id FROM website_block WHERE domain = %s", (domain,))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("UPDATE website_block SET is_active = TRUE, blocked_at = %s WHERE domain = %s",
                           (datetime.now(), domain))
        else:
            cursor.execute("INSERT INTO website_block (domain, blocked_at, is_active) VALUES (%s, %s, %s)",
                           (domain, datetime.now(), True))
        conn.commit()
        conn.close()
        return {"message": f"บล็อก {domain} สำเร็จ"}
    except Exception as e:
        return {"error": str(e)}

@app.delete("/website-blocks/{rule_id}")
def unblock_website(rule_id: int):
    try:
        sites = read_blocked_sites()
        filtered = []
        domain_to_remove = ""
        for i, site in enumerate(sites):
            domain = site["domain"].replace("www.", "")
            if i == rule_id or (rule_id < len(sites) and domain == sites[rule_id]["domain"].replace("www.", "")):
                domain_to_remove = domain
                continue
            filtered.append(site)
        write_blocked_sites(filtered)
        if domain_to_remove:
            conn = database.get_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE website_block SET is_active = FALSE WHERE domain = %s AND is_active = TRUE",
                           (domain_to_remove,))
            conn.commit()
            conn.close()
        return {"message": "ปลดบล็อกสำเร็จ"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/login")
def login(req: LoginRequest):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, username FROM user WHERE username = %s AND password = %s",
                       (req.username, req.password))
        user = cursor.fetchone()
        conn.close()
        if user:
            return {"success": True, "username": user[1]}
        else:
            return {"success": False, "message": "Username หรือ Password ไม่ถูกต้อง"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/settings")
def get_settings():
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, setting_key, setting_value, description FROM settings ORDER BY id")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "key": r[1], "value": r[2], "description": r[3]} for r in rows]

@app.put("/settings/{setting_key}")
def update_setting(setting_key: str, req: SettingRequest):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE settings SET setting_value = %s WHERE setting_key = %s",
                       (req.setting_value, setting_key))
        conn.commit()
        conn.close()
        return {"message": f"อัพเดท {setting_key} เป็น {req.setting_value} สำเร็จ"}
    except Exception as e:
        return {"error": str(e)}
