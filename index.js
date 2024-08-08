const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // Import SQLite library
const fileUpload = require('express-fileupload'); // Import express-fileupload

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload()); // Use express-fileupload middleware

// Connect to the SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  }
});

// Route for the homepage
app.get('/', (req, res) => {
  res.render('homepage');
});

// Route for the about us page
app.get('/about', (req, res) => {
  res.render('aboutUsPage');
});

// Route for the services page
app.get('/services', (req, res) => {
  res.render('servicePage');
});

// Route for the reviews page
app.get('/reviews', (req, res) => {
  res.render('reviewPage');
});

// Route for the contact us page
app.get('/contact', (req, res) => {
  res.render('contactUsPage');
});

// Route for the register page
app.get('/register', (req, res) => {
  res.render('registerPage');
});

// Handle registration requests
app.post('/register', (req, res) => {
  const { username, useremail, password, role } = req.body;
  console.log('Registration Request:', { username, useremail, password, role }); // Log the form data
  
  if (role === 'customer') {
    // Insert user data into User table
    db.run('INSERT INTO User (username, email, userpassword) VALUES (?, ?, ?)', [username, useremail, password], function(err) {
      if (err) {
        console.error('Error inserting user:', err.message);
        res.redirect('/register?error=user');
        return;
      }
      console.log('User registered successfully:', username);
      res.redirect('/login');
    });
  } else if (role === 'worker') {
    // Insert worker data into Staff table
    db.run('INSERT INTO Staff (username, email, userpassword) VALUES (?, ?, ?)', [username, useremail, password], function(err) {
      if (err) {
        console.error('Error inserting worker:', err.message);
        res.redirect('/register?error=worker');
        return;
      }
      console.log('Worker registered successfully:', username);
      res.redirect('/login');
    });
  } else {
    res.redirect('/register');
  }
});

// Route for the login page
app.get('/login', (req, res) => {
  res.render('loginPage', { error: req.query.error || '' });
});

// Handle login requests
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM User WHERE username = ? AND userpassword = ?', [username, password], (err, user) => {
    if (err) {
      console.error('Error querying database:', err.message);
      res.render('loginPage', { error: 'Database error' });
      return;
    }
    if (!user) {
      db.get('SELECT * FROM Staff WHERE username = ? AND userpassword = ?', [username, password], (err, worker) => {
        if (err) {
          console.error('Error querying database:', err.message);
          res.render('loginPage', { error: 'Database error' });
          return;
        }
        if (!worker) {
          res.render('loginPage', { error: 'Invalid username or password' });
        } else {
          // Login successful, redirect to the homepage or worker dashboard
          res.redirect('/');
        }
      });
    } else {
      // Login successful, redirect to the homepage or user dashboard
      res.redirect('/');
    }
  });
});

// Route for the forgot password page
app.get('/forgot-password', (req, res) => {
  res.render('forgotPasswordPage', { error: '' });
});

// Handle reset password requests
app.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;

  // Update password for User
  db.run('UPDATE User SET userpassword = ? WHERE email = ?', [newPassword, email], function(err) {
    if (err) {
      console.error('Error updating user password:', err.message);
      res.render('forgotPasswordPage', { error: 'Error updating password' });
      return;
    }
    if (this.changes === 0) {
      // Update password for Staff if email not found in User table
      db.run('UPDATE Staff SET userpassword = ? WHERE email = ?', [newPassword, email], function(err) {
        if (err) {
          console.error('Error updating staff password:', err.message);
          res.render('forgotPasswordPage', { error: 'Error updating password' });
          return;
        }
        if (this.changes === 0) {
          res.render('forgotPasswordPage', { error: 'Email not found' });
        } else {
          res.redirect('/login');
        }
      });
    } else {
      res.redirect('/login');
    }
  });
});

// Profile customer Start-----------------------------------
// Route for the profile page
app.get('/profile', (req, res) => {
  res.render('profileCustomer', { profile: null });
});

// Handle profile updates
app.post('/profile', (req, res) => {
  const {
    fullName,
    contactNumber,
    email,
    address,
    emergencyContact,
    petName,
    petBreed,
    petAge,
    petWeight,
    petHealth,
    petDiet,
    petAllergies,
    petBehavior,
    serviceType,
    serviceFrequency,
    serviceTime,
    specialRequirements,
    additionalNotes
  } = req.body;
  
  // Handle file upload
  let petPhoto = '';
  if (req.files && req.files.petPhoto) {
    petPhoto = req.files.petPhoto.name;
    req.files.petPhoto.mv(`./public/uploads/${petPhoto}`, err => {
      if (err) {
        console.error('Error uploading file:', err.message);
      }
    });
  }
  
  // In a real application, you would save this information to a database
  // For demonstration purposes, we'll just render it back to the user
  
  const profile = {
    fullName,
    contactNumber,
    address,
    emergencyContact,
    petName,
    petBreed,
    petAge,
    petWeight,
    petHealth,
    petDiet,
    petAllergies,
    petBehavior,
    serviceFrequency,
    specialRequirements,
    petPhoto,
    additionalNotes
  };

  res.render('profileCustomer', { profile });
});

// Route for editing profile
app.get('/edit-profile', (req, res) => {
  res.render('profileCustomer', { profile: null });
});

// Route for logging out
app.post('/logout', (req, res) => {
  // Implement logout logic here, e.g., clearing session
  res.redirect('/login');
});

// Profile customer END-------------------------------------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Petbuddy is running at http://localhost:${PORT}`);
});
