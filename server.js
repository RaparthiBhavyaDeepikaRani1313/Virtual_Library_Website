const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

// Enable CORS for all origins, including file:// protocol requests
app.use(cors());
app.use(express.json());

let pool;

// Connect to MySQL server first to make sure virtual_library database exists
const initialConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '' // Default XAMPP MySQL password is empty
});

initialConnection.query('CREATE DATABASE IF NOT EXISTS virtual_library', (err) => {
  if (err) {
    console.error('Error checking/creating MySQL database "virtual_library":');
    console.error(err.message);
    console.error('--------------------------------------------------');
    console.error('Please make sure XAMPP is running and the MySQL module is started!');
    console.error('--------------------------------------------------');
    process.exit(1);
  }
  
  console.log('MySQL Database "virtual_library" verified/created.');
  initialConnection.end();

  // Initialize pool connecting to virtual_library
  pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'virtual_library',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  initializeDatabaseTables();
});

// Create tables if they do not exist
function initializeDatabaseTables() {
  // 1. Users Table
  pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      join_date VARCHAR(50) NOT NULL
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err.message);
  });

  // 2. Rentals Table
  pool.query(`
    CREATE TABLE IF NOT EXISTS rentals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      book_title VARCHAR(255) NOT NULL,
      book_author VARCHAR(255),
      book_description TEXT,
      book_image TEXT,
      book_price DECIMAL(10,2),
      rented_on VARCHAR(50) NOT NULL
    )
  `, (err) => {
    if (err) console.error('Error creating rentals table:', err.message);
  });

  // 3. Reviews Table
  pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      book_title VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      review_text TEXT NOT NULL,
      rating INT NOT NULL,
      created_at VARCHAR(50) NOT NULL
    )
  `, (err) => {
    if (err) console.error('Error creating reviews table:', err.message);
  });

  console.log('MySQL Database tables initialized.');
}

// 1. Sign Up Endpoint
app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const username = email.split('@')[0];
  const joinDate = new Date().toISOString().split('T')[0];

  const sql = 'INSERT INTO users (email, username, password, join_date) VALUES (?, ?, ?, ?)';
  pool.query(sql, [email, username, password, joinDate], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, error: 'Email already registered.' });
      }
      return res.status(500).json({ success: false, error: 'Failed to create account: ' + err.message });
    }
    res.json({ success: true, message: 'Sign up successful!' });
  });
});

// 2. Sign In Endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  pool.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'Account not found. Please sign up first.' });
    }
    const user = results[0];
    if (user.password !== password) {
      return res.status(401).json({ success: false, error: 'Incorrect password.' });
    }

    res.json({
      success: true,
      email: user.email,
      username: user.username,
      joinDate: user.join_date
    });
  });
});

// 3. Get User Profile Endpoint
app.get('/api/profile', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const sqlUser = 'SELECT * FROM users WHERE email = ?';
  pool.query(sqlUser, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    const user = results[0];

    // Get number of rented books and the last rented book
    const sqlRentals = 'SELECT * FROM rentals WHERE user_email = ? ORDER BY id DESC';
    pool.query(sqlRentals, [email], (err, rentals) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error fetching rentals: ' + err.message });
      }

      const booksRented = rentals.length;
      const currentlyReading = rentals.length > 0 ? rentals[0].book_title : 'None';

      res.json({
        success: true,
        username: user.username,
        email: user.email,
        joinDate: user.join_date,
        booksRented: booksRented,
        currentlyReading: currentlyReading
      });
    });
  });
});

// 4. Update User Profile Endpoint
app.put('/api/profile', (req, res) => {
  const { oldEmail, newEmail, username } = req.body;

  if (!oldEmail || !newEmail || !username) {
    return res.status(400).json({ success: false, error: 'Missing required parameters (oldEmail, newEmail, username).' });
  }

  // Update user details
  const sqlUpdateUser = 'UPDATE users SET email = ?, username = ? WHERE email = ?';
  pool.query(sqlUpdateUser, [newEmail, username, oldEmail], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, error: 'Email already in use by another account.' });
      }
      return res.status(500).json({ success: false, error: 'Failed to update profile: ' + err.message });
    }

    // Update rentals and reviews if email changed
    if (oldEmail !== newEmail) {
      const sqlUpdateRentals = 'UPDATE rentals SET user_email = ? WHERE user_email = ?';
      pool.query(sqlUpdateRentals, [newEmail, oldEmail], (err) => {
        if (err) {
          return res.status(500).json({ success: false, error: 'Failed to update rentals: ' + err.message });
        }

        const sqlUpdateReviews = 'UPDATE reviews SET user_email = ? WHERE user_email = ?';
        pool.query(sqlUpdateReviews, [newEmail, oldEmail], (err) => {
          if (err) {
            return res.status(500).json({ success: false, error: 'Failed to update reviews: ' + err.message });
          }

          res.json({ success: true, message: 'Profile updated successfully!' });
        });
      });
    } else {
      res.json({ success: true, message: 'Profile updated successfully!' });
    }
  });
});

// 5. Rent a Book Endpoint
app.post('/api/rent', (req, res) => {
  const { email, title, author, description, image, price } = req.body;

  if (!email || !title) {
    return res.status(400).json({ success: false, error: 'Email and Book Title are required.' });
  }

  const rentedOn = new Date().toLocaleDateString();

  const sql = `
    INSERT INTO rentals (user_email, book_title, book_author, book_description, book_image, book_price, rented_on)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  pool.query(sql, [email, title, author, description, image, price, rentedOn], (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to record rental: ' + err.message });
    }
    res.json({ success: true, message: `You have successfully rented "${title}"!` });
  });
});

// 6. Get Rented Books Endpoint
app.get('/api/rented-books', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const sql = 'SELECT * FROM rentals WHERE user_email = ? ORDER BY id DESC';
  pool.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve rented books: ' + err.message });
    }
    
    const books = results.map(r => ({
      title: r.book_title,
      author: r.book_author,
      description: r.book_description,
      image: r.book_image,
      price: r.book_price,
      rentedOn: r.rented_on
    }));

    res.json({ success: true, books });
  });
});

// 7. Get Reviews Endpoint
app.get('/api/reviews', (req, res) => {
  const { title } = req.query;

  if (!title) {
    return res.status(400).json({ success: false, error: 'Book title is required.' });
  }

  const sql = 'SELECT * FROM reviews WHERE book_title = ? ORDER BY id DESC';
  pool.query(sql, [title], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve reviews: ' + err.message });
    }

    const reviews = results.map(r => ({
      review: r.review_text,
      rating: r.rating,
      userEmail: r.user_email,
      createdAt: r.created_at
    }));

    res.json({ success: true, reviews });
  });
});

// 8. Submit Review Endpoint
app.post('/api/reviews', (req, res) => {
  const { title, userEmail, reviewText, rating } = req.body;

  if (!title || !reviewText || rating === undefined) {
    return res.status(400).json({ success: false, error: 'Book title, review text, and rating are required.' });
  }

  const createdAt = new Date().toISOString().split('T')[0];

  const sql = 'INSERT INTO reviews (book_title, user_email, review_text, rating, created_at) VALUES (?, ?, ?, ?, ?)';
  pool.query(sql, [title, userEmail || 'anonymous', reviewText, rating, createdAt], (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to save review: ' + err.message });
    }
    res.json({ success: true, message: 'Review submitted successfully!' });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  console.log('Connecting to MySQL database inside XAMPP...');
});
