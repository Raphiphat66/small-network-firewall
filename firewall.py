import subprocess
import database
from datetime import datetime

def block_ip(ip, attack_name):
    try:
        subprocess.run([
            "sudo", "iptables", "-A", "INPUT",
            "-s", ip, "-j", "DROP"
        ])
        save_block(ip, attack_name)
        print(f"[BLOCKED] {ip} เนื่องจาก {attack_name}")
    except Exception as e:
        print(f"Error blocking IP: {e}")

def unblock_ip(ip):
    try:
        subprocess.run([
            "sudo", "iptables", "-D", "INPUT",
            "-s", ip, "-j", "DROP"
        ])
        update_block(ip)
        print(f"[UNBLOCKED] {ip}")
    except Exception as e:
        print(f"Error unblocking IP: {e}")

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

def update_block(ip):
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE block_list 
            SET end_time = %s
            WHERE ip_address = %s 
            AND end_time IS NULL
        """, (datetime.now(), ip))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error updating block: {e}")

def get_block_list():
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ip_address, attack_name, start_time 
            FROM block_list 
            WHERE end_time IS NULL
        """)
        result = cursor.fetchall()
        conn.close()
        return result
    except Exception as e:
        print(f"Error getting block list: {e}")
        return []

if __name__ == "__main__":
    print("รายการ IP ที่ถูกบล็อกอยู่:")
    blocks = get_block_list()
    for b in blocks:
        print(f"IP: {b[0]} | เหตุผล: {b[1]} | เวลา: {b[2]}")
