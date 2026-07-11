from detector import start_detection
from notifier import send_alert
import threading

def run_detector():
    print("เริ่มระบบตรวจจับการบุกรุก...")
    start_detection()

if __name__ == "__main__":
    print("=== Small Firewall Network System ===")
    
    # รัน detector ใน thread แยก
    detector_thread = threading.Thread(target=run_detector)
    detector_thread.daemon = True
    detector_thread.start()
    
    print("ระบบพร้อมทำงานแล้ว!")
    print("กด Ctrl+C เพื่อหยุดระบบ")
    
    try:
        detector_thread.join()
    except KeyboardInterrupt:
        print("\nหยุดระบบแล้ว")
