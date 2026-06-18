import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'library.db')

def view_all_data():
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}. Run server.js first to create it.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("==================================================")
    print("           VIRTUAL LIBRARY DATABASE               ")
    print("==================================================")

    # 1. View Users
    print("\n--- 👥 USERS TABLE ---")
    try:
        cursor.execute("SELECT id, email, username, password, join_date FROM users")
        users = cursor.fetchall()
        if not users:
            print("No users found.")
        for u in users:
            print(f"ID: {u[0]} | Email: {u[1]} | Username: {u[2]} | Password: {u[3]} | Joined: {u[4]}")
    except sqlite3.OperationalError as e:
        print("Error reading users table:", e)

    # 2. View Rentals
    print("\n--- 📖 RENTALS TABLE ---")
    try:
        cursor.execute("SELECT id, user_email, book_title, book_price, rented_on FROM rentals")
        rentals = cursor.fetchall()
        if not rentals:
            print("No rentals found.")
        for r in rentals:
            print(f"ID: {r[0]} | User: {r[1]} | Book: {r[2]} | Price: ₹{r[3]} | Rented On: {r[4]}")
    except sqlite3.OperationalError as e:
        print("Error reading rentals table:", e)

    # 3. View Reviews
    print("\n--- 📢 REVIEWS TABLE ---")
    try:
        cursor.execute("SELECT id, book_title, user_email, review_text, rating, created_at FROM reviews")
        reviews = cursor.fetchall()
        if not reviews:
            print("No reviews found.")
        for rv in reviews:
            stars = "⭐" * rv[4]
            print(f"ID: {rv[0]} | Book: {rv[1]} | User: {rv[2]} | Rating: {stars} | Review: {rv[3]} | On: {rv[5]}")
    except sqlite3.OperationalError as e:
        print("Error reading reviews table:", e)

    print("\n==================================================")
    conn.close()

if __name__ == '__main__':
    view_all_data()
