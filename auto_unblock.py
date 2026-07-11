import subprocess
import database
from datetime import datetime, timedelta
import time

BLOCK_DURATION_MINUTES = 30

def auto_unblock():
    while True:
        try:
            conn = database.get_connection()
            cursor = conn.cursor()
            
            # หา IP ที่ถูกบล็อกเกิน 30 นาทีแล้ว
            cursor.execute("""
                SELECT ip_address FROM block_list
                WHERE end_time IS NULL
                AND start_time < %s
            """, (datetime.now() - timedelta(minutes=BLOCK_DURATION_MINUTES),))
            
            rows = cursor.fetchall()
            
            for row in rows:
                ip = row[0]
                # ปลดบล็อกใน iptables
                subprocess.run([
                    "sudo", "iptables", "-D", "INPUT",
                    "-s", ip, "-j", "DROP"
                ])
                # อัพเดท Database
                cursor.execute("""
                    UPDATE block_list SET end_time = %s
                    WHERE ip_address = %s AND end_time IS NULL
                """, (datetime.now(), ip))
                print(f"[AUTO UNBLOCK] {ip} ปลดบล็อกแล้ว")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"Error auto unblock: {e}")
        
        # เช็คทุก 1 นาที
        time.sleep(60)

if __name__ == "__main__":
    print(f"เริ่ม Auto Unblock ทุก {BLOCK_DURATION_MINUTES} นาที")
    auto_unblock()
