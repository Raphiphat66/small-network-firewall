# Small Firewall Network System
### ระบบไฟร์วอลล์สำหรับเครือข่ายขนาดเล็ก

A real-time **Intrusion Detection and Prevention System (IDS/IPS)** built from scratch using Python and tcpdump, with a React.js web dashboard for monitoring and managing network security.

> Senior Project — Computer Engineering 
---

##  Features

###  Attack Detection & Prevention
- Detects and blocks **5 types of attacks** automatically
  - ICMP Flood
  - SYN Flood
  - UDP Flood
  - Port Scan
  - Brute Force (SSH)
- **2-level alert system** — Warning → Block (reduces false positives)
- **Auto-unblock** after configurable duration 
- **IP Whitelist** to prevent blocking trusted addresses

###  Web Dashboard
- Real-time traffic monitoring with charts
- Attack history with WARNING/BLOCK indicators
- Blocked IP management (manual block/unblock)
- Firewall rule management (add/delete iptables rules)
- Adjustable detection thresholds via UI

###  Advanced Firewall Features
- **MAC Address Filtering**
- **Destination IP Filtering**
- **Logging Rules** (stores to `/var/log/syslog`)
- **DNS-based Website Blocking** — blocks by domain name (not IP), immune to IP changes
- **Custom iptables rules** with direction (INPUT/OUTPUT/FORWARD) and action (DROP/ACCEPT/REJECT)

###  Notifications
- Automated **Gmail email alerts** for both WARNING and BLOCK events

---

##  Architecture

```
Internet
    ↓
Firewall Server (Ubuntu Linux)
├── Python + Scapy      ← Packet capture & analysis
├── iptables            ← Packet filtering & blocking
├── dnsmasq             ← DNS-based website blocking
├── MySQL               ← Data storage
└── FastAPI             ← REST API backend
    ↓
React.js Dashboard (Web Browser)
```

### Network Setup

```
VM Firewall   192.168.1.1   (enp0s3 = WAN, enp0s8 = LAN)
VM Client     192.168.1.2   (simulates regular user)
VM Attacker   192.168.1.3   (simulates attacker)
```

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Packet Capture | Python 3, Scapy |
| Firewall | iptables (Linux netfilter) |
| DNS Blocking | dnsmasq |
| Backend API | FastAPI, Uvicorn |
| Database | MySQL 8.0 |
| Frontend | React.js, Recharts |
| Notifications | Gmail SMTP |
| Infrastructure | VirtualBox, Ubuntu 24.04 LTS |

---

##  Project Structure

```
firewall_project/          ← Backend (on Firewall VM)
├── database.py            ← MySQL connection helper
├── detector.py            ← Core IDS/IPS — packet capture & analysis
├── firewall.py            ← iptables management
├── notifier.py            ← Email alert system
├── auto_unblock.py        ← Auto-unblock IPs after timeout
├── api.py                 ← FastAPI REST API


firewall-frontend/         ← Frontend (React.js)
└── src/
    ├── App.js             ← Router + Login gate
    └── pages/
        ├── Dashboard.js   ← Real-time stats & charts
        ├── Logs.js        ← Attack history
        ├── BlockList.js   ← Blocked IP management
        ├── Rules.js       ← iptables rule management
        ├── Whitelist.js
        ├── Settings.js    ← Detection threshold settings
        └── WebsiteBlock.js ← DNS website blocking
```

---

##  Database Schema

```sql
packet_entry   ← All captured packets
attack_list    ← Detected attacks (WARNING/BLOCK)
block_list     ← Blocked IPs with timestamps
rule           ← Custom iptables rules
settings       ← Detection thresholds
user           ← Admin login credentials
```

---

##  Installation

### Prerequisites
- VirtualBox with Ubuntu 24.04 LTS
- Python 3.x
- Node.js 16+
- MySQL 8.0

### Backend Setup (on Firewall VM)

```bash
# Install dependencies
sudo apt install -y python3 python3-pip mysql-server iptables dnsmasq net-tools openssh-server

# Install Python packages
sudo pip3 install scapy fastapi uvicorn mysql-connector-python --break-system-packages

# Setup MySQL
sudo mysql
```

```sql
CREATE DATABASE firewall_db;
CREATE USER 'firewall_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON firewall_db.* TO 'firewall_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Clone and configure
git clone https://github.com/yourusername/firewall-project.git
cd firewall-project/firewall_project

# Edit database credentials
nano database.py

# Edit email settings
nano notifier.py

# Run the system
sudo python3 detector.py & python3 -m uvicorn api:app --host 0.0.0.0 --port 8000 & python3 auto_unblock.py
```

### Frontend Setup (on your machine)

```bash
cd firewall-frontend
npm install
npm start
```

Open `http://localhost:3000` — Login with `admin` / `admin1234`

---

##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Overview statistics |
| GET | `/packets` | Recent packet list |
| GET | `/attacks` | Attack history |
| GET | `/blocklist` | Blocked IPs |
| POST | `/blocklist` | Manually block an IP |
| DELETE | `/blocklist/{ip}` | Unblock an IP |
| GET | `/rules` | All iptables rules |
| POST | `/rules` | Add a new rule |
| DELETE | `/rules/{id}` | Delete a rule |
| GET | `/settings` | Detection thresholds |
| PUT | `/settings/{key}` | Update a threshold |
| GET | `/website-blocks` | Blocked websites |
| POST | `/website-blocks` | Block a website |
| DELETE | `/website-blocks/{id}` | Unblock a website |
| POST | `/login` | Admin authentication |

---

##  Attack Simulation (Testing)

Run these commands from the **Attacker VM** (`192.168.1.3`)

```bash
# ICMP Flood
sudo hping3 -1 --flood 192.168.1.1

# SYN Flood
sudo hping3 -S --flood 192.168.1.1

# UDP Flood
sudo hping3 -2 --flood 192.168.1.1

# Port Scan
sudo nmap -sS 192.168.1.1

# Brute Force (SSH)
hydra -l admin -P passwords.txt 192.168.1.1 ssh -t 4
```

---

##  Detection Thresholds

Thresholds are configurable from the web dashboard under **Settings**.

| Attack Type | Warning | Block |
|-------------|---------|-------|
| ICMP Flood | 25 packets/3s | 50 packets/3s |
| SYN Flood | 50 packets/3s | 100 packets/3s |
| UDP Flood | 50 packets/3s | 100 packets/3s |
| Port Scan | 10 ports/3s | 20 ports/3s |
| Brute Force | 3 attempts/3s | 5 attempts/3s |

---

##  Limitations

This system is designed for **small networks** (home, small office, café). It is **not** suitable for:
- Enterprise-scale networks
- Protection against distributed DDoS (multiple IPs)
- Encrypted traffic inspection (HTTPS, VPN)
- Application-layer attacks (SQL Injection, XSS)
- Zero-day attacks

---

##  Future Improvements

- [ ] Anomaly Detection (behavior-based, not rule-based)
- [ ] Machine Learning for unknown attack patterns
- [ ] Deploy on Raspberry Pi for real hardware use
- [ ] Password hashing (bcrypt)
- [ ] Rate limiting per IP
- [ ] GeoIP blocking

---

##  License

This project is for educational purposes as part of a senior thesis.

---

##  Author

Developed as a Senior Project in partial fulfillment of the requirements for a Bachelor's Degree in Computer Engineering.
