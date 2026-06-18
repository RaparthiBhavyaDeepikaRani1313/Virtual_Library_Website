# 📚 Virtual Library Management System
A modern, full-stack Virtual Library web application built with a responsive frontend design and a backend powered by **Node.js, Express, and XAMPP MySQL** database. Users can register accounts, sign in, search and rent books, write ratings/reviews, and customize their user profiles.
---
## ✨ Features
- **🔐 Secure Authentication**: User registration (Sign Up) and login (Sign In) powered by a secure MySQL database (replaces simple `localStorage` storage).
- **📖 Book Renting System**: Browse the catalog of books across multiple categories (Fiction, Literary Fiction, Mystery/Thriller, Fantasy, Science) and rent books dynamically.
- **📢 Reviews & Ratings**: Submit star-based reviews (1-5 ⭐) and comments on books. View reviews left by other library users.
- **👥 Customizable Profile**: Check account statistics (join date, total books rented, currently reading) and edit profile details (username and email) with automatic cascading updates in the database.
- **📱 Fully Responsive Design**: Seamless viewing experience on all screen sizes, from mobile phones to desktops.
---
## 🛠️ Technology Stack
- **Frontend**: HTML5, Vanilla CSS3 (custom layouts and animations), JavaScript (ES6 Fetch API)
- **Backend**: Node.js, Express.js, CORS
- **Database**: MySQL / MariaDB (via XAMPP)
- **Database Client**: `mysql2` (connection pool manager)

  🚀 **Setup & Installation Instructions**
Follow these steps to run the application locally on your computer:

**Prerequisites**
Install Node.js (v16.0 or higher recommended).
Install XAMPP (to run the MySQL database).

**Step 1:** Run XAMPP MySQL
1.Open the XAMPP Control Panel.
2.Click the Start button next to MySQL (ensure it turns green and runs on port 3306).
Note: You do not need to start Apache unless you want to host files locally through http://localhost, but double-clicking the HTML files directly in the browser works perfectly.

**Step 2:** Install Node Dependencies
1.Open your terminal or Command Prompt.
2.Navigate to the project directory.
3.Install the required Node packages.

**Step 3: Run the Backend Server**

**Step 4: Open the Web Application**
1.Double-click the index.html or login.html file in your file explorer to open it in any web browser.
2.Register a new account on the Sign Up page.
3.Log in, browse books, and test rentals/reviews!

📊 **Viewing the Database (phpMyAdmin)**
Open your browser and go to http://localhost/phpmyadmin.
Select the virtual_library database from the left-side list.
You will see three main tables:
**users:** Contains account emails, usernames, passwords, and signup dates.
**rentals:** Logs book rental titles, user emails, authors, prices, and rented dates.
**reviews:** Holds book reviews, user emails, comments, and star ratings.
