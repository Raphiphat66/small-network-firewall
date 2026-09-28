# สรุปคำสั่งทั้งหมด — ระบบไฟร์วอลล์สำหรับเครือข่ายขนาดเล็ก (Raspberry Pi)

## ข้อมูลอ้างอิงเครื่อง

| เครื่อง | IP | SSH |
|---------|-----|-----|
| Raspberry Pi (LAN) | 192.168.0.115 | `ssh firewall@192.168.0.115` |
| Raspberry Pi (WiFi) | 192.168.0.114 | `ssh firewall@192.168.0.114` |
| VM Attacker | 192.168.0.108 | `ssh attacker@127.0.0.1 -p 2224` |

- MySQL: `firewall_user` / `firewall1234` (database: `firewall_db`)
- Web Login: `admin` / `admin1234`
- Backend API: `http://192.168.0.115:8000`
- Frontend: `http://localhost:3000`

---

## 1. เปิดใช้งานทุกครั้งที่เริ่มทำงาน

### เชื่อมต่อ Pi ผ่านสายแลน
```
Router → สายแลน → Port LAN ของ Pi
```

### SSH เข้า Pi (จาก Mac)
```bash
ssh firewall@192.168.0.115
```

---

## 2. รันระบบ Backend (ใน Raspberry Pi)

```bash
cd ~/firewall_project
source venv/bin/activate

# รัน detector (ดักจับ + วิเคราะห์ + บล็อกอัตโนมัติ)
sudo venv/bin/python3 -u detector.py 2>&1 | tee ~/detector.log &

# รัน API
python3 -m uvicorn api:app --host 0.0.0.0 --port 8000 &

# รัน Auto Unblock
python3 auto_unblock.py &
```

### เช็ค log detector
```bash
tail -f ~/detector.log
```

### เช็คว่า process รันอยู่ไหม
```bash
ps aux | grep python3
```

### หยุด process ทั้งหมด
```bash
sudo pkill -f detector.py
sudo fuser -k 8000/tcp
pkill -f auto_unblock.py
```

---

## 3. รันระบบ Frontend (บน Mac)

### เปลี่ยน API URL ให้ชี้มาที่ Pi
```bash
find ~/Desktop/firewall-frontend/src/pages/ -name "*.js" -exec sed -i '' 's|http://127.0.0.1:8000|http://192.168.0.115:8000|g' {} \;
```

### รัน Frontend
```bash
cd ~/Desktop/firewall-frontend
npm start
```

เปิดดูที่ `http://localhost:3000`

---

## 4. คำสั่งจำลองการโจมตี (จาก VM Attacker)

```bash
# สร้างไฟล์ passwords.txt (ถ้ายังไม่มี)
cat > ~/passwords.txt << 'EOF'
123456
password
admin
root
1234
12345
qwerty
abc123
letmein
monkey

find ~/Desktop/firewall-frontend/src/pages/ -name "*.js" -exec sed -i '' 's|http://192.168.0.115:8000|http://raspberrypi.local:8000|g' {} \;

ssh firewall@raspberrypi.local
sudo /home/firewall/start.sh