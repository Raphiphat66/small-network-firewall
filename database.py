import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="firewall_user",
        password="firewall1234",
        database="firewall_db"
    )

def test_connection():
    try:
        conn = get_connection()
        print("เชื่อมต่อ Database สำเร็จ!")
        conn.close()
    except Exception as e:
        print(f"เชื่อมต่อไม่ได้: {e}")

if __name__ == "__main__":
    test_connection()
