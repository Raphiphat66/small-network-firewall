
import smtplib

from email.mime.text import MIMEText

from email.mime.multipart import MIMEMultipart

from datetime import datetime

EMAIL_SENDER = "rphiphathr8329@gmail.com"

EMAIL_PASSWORD = "eyldyxyhvlqjmwpt"

EMAIL_RECEIVER = "66022039@up.ac.th"

def send_alert(attack_type, src_ip, detail=""):

    try:

        msg = MIMEMultipart()

        msg["From"] = EMAIL_SENDER

        msg["To"] = EMAIL_RECEIVER

        msg["Subject"] = f"[ALERT] ตรวจพบการโจมตี {attack_type}"

        body = f"""

        แจ้งเตือนความปลอดภัย

        

        ประเภทการโจมตี : {attack_type}

        IP ต้นทาง      : {src_ip}

        เวลาที่พบ      : {datetime.now()}

        รายละเอียด     : {detail}

        

        กรุณาตรวจสอบระบบด่วน!

        """

        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)

        server.login(EMAIL_SENDER, EMAIL_PASSWORD)

        server.send_message(msg)

        server.quit()

        print(f"[EMAIL] ส่งแจ้งเตือนสำเร็จ: {attack_type} จาก {src_ip}")

    except Exception as e:

        print(f"Error sending email: {e}")

if __name__ == "__main__":

    send_alert("Test Alert", "192.168.1.1", "ทดสอบระบบแจ้งเตือน")

