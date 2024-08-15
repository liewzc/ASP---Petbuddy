const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // Import SQLite library
const fileUpload = require('express-fileupload'); // Import express-fileupload
const session = require("express-session"); // Import express-session

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload()); // Use express-fileupload middleware

app.use(
  session({
    secret: "your_secret_key", // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
  })
);

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
  calculateAverageRatings((averageRatings) => {
      res.render('reviewPage', { averageRatings });
  });
});

app.post('/submit-review', (req, res) => {
  const { staffName, rating, feedback } = req.body;
  console.log(`Received: ${staffName}, ${rating}, ${feedback}`); // Debugging line
  db.run("INSERT INTO reviews (staffName, rating, feedback) VALUES (?, ?, ?)", [staffName, rating, feedback], (err) => {
      if (err) {
          console.error(err.message);
      }else {
        console.log('Review inserted successfully'); // Debugging line
    }
      res.redirect('/reviews');
  });
});

app.get('/show-reviews', (req, res) => {
  db.all("SELECT * FROM reviews", (err, rows) => {
      if (err) {
          console.error(err.message);
          res.send("Error retrieving reviews");
      } else {
          res.json(rows);
      }
  });
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
app.post("/register", (req, res) => {
  const { username, useremail, password, role } = req.body;
  console.log("Registration Request:", { username, useremail, password, role });

  if (role === "customer") {
    db.run(
      "INSERT INTO User (username, email, userpassword) VALUES (?, ?, ?)",
      [username, useremail, password],
      function (err) {
        if (err) {
          console.error("Error inserting user:", err.message);
          res.redirect("/register?error=user");
          return;
        }
        console.log("User registered successfully:", username);
        res.redirect("/login");
      }
    );
  } else {
    res.redirect("/register");
  }
});

// Route for the login page
app.get("/login", (req, res) => {
  res.render("loginPage", { error: req.query.error || "" });
});

// Handle login requests
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM User WHERE username = ? AND userpassword = ?",
    [username, password],
    (err, user) => {
      if (err) {
        console.error("Error querying database:", err.message);
        res.render("loginPage", { error: "Database error" });
        return;
      }
      if (!user) {
        db.get(
          "SELECT * FROM Staff WHERE username = ? AND userpassword = ?",
          [username, password],
          (err, worker) => {
            if (err) {
              console.error("Error querying database:", err.message);
              res.render("loginPage", { error: "Database error" });
              return;
            }
            if (!worker) {
              res.render("loginPage", {
                error: "Invalid username or password",
              });
            } else {
              req.session.user = { username, role: "staff" }; // Set session for staff
              res.redirect("/");
            }
          }
        );
      } else {
        req.session.user = { username, role: "customer", userId: user.id }; // Set session for user with ID
        res.redirect("/");
      }
    }
  );
});

// Route to render the booking page
app.get('/booking', (req, res) => {
  res.render('bookingPage');
});

// Route for the booking form page
app.get('/booking/bookingform', (req, res) => {
  const packageName = req.query.package || 'Default Package';
  res.render('bookingForm', { package: packageName });
});

// Route for the confirmation page
app.get('/booking/confirmation', (req, res) => {
  res.render('bookingConfirmation');
});

// Route to render the booking page
app.get('/booking', (req, res) => {
  res.render('bookingPage');
});

// Route for the booking form page
app.get('/booking/bookingform', (req, res) => {
  const packageName = req.query.package || 'Default Package';
  res.render('bookingForm', { package: packageName });
});

// Route for the confirmation page
app.get('/booking/confirmation', (req, res) => {
  res.render('bookingConfirmation');
});


// Route for the forgot password page
app.get("/forgot-password", (req, res) => {
  res.render("forgotPasswordPage", { error: "" });
});

// Handle reset password requests
app.post("/reset-password", (req, res) => {
  const { email, newPassword } = req.body;

  db.run(
    "UPDATE User SET userpassword = ? WHERE email = ?",
    [newPassword, email],
    function (err) {
      if (err) {
        console.error("Error updating user password:", err.message);
        res.render("forgotPasswordPage", { error: "Error updating password" });
        return;
      }
      if (this.changes === 0) {
        db.run(
          "UPDATE Staff SET userpassword = ? WHERE email = ?",
          [newPassword, email],
          function (err) {
            if (err) {
              console.error("Error updating staff password:", err.message);
              res.render("forgotPasswordPage", {
                error: "Error updating password",
              });
              return;
            }
            if (this.changes === 0) {
              res.render("forgotPasswordPage", { error: "Email not found" });
            } else {
              res.redirect("/login");
            }
          }
        );
      } else {
        res.redirect("/login");
      }
    }
  );
});

// Profile customer Start-----------------------------------
// Route for the profile page
app.get("/profile", (req, res) => {
  if (!req.session.user || req.session.user.role !== "customer") {
    res.redirect("/login");
    return;
  }

  const userId = req.session.user.userId;
  db.get(
    "SELECT * FROM UserProfile WHERE userId = ?",
    [userId],
    (err, profile) => {
      if (err) {
        console.error("Error fetching profile:", err.message);
        res.render("profileCustomer", { profile: null });
        return;
      }
      res.render("profileCustomer", { profile });
    }
  );
});

// Handle profile updates
app.post("/profile", (req, res) => {
  if (!req.session.user || req.session.user.role !== "customer") {
    res.redirect("/login");
    return;
  }

  const userId = req.session.user.userId;
  const {
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
    serviceFrequency,
    specialRequirements
  } = req.body;

  let petPhoto = "";
  if (req.files && req.files.petPhoto) {
    petPhoto = req.files.petPhoto.name;
    req.files.petPhoto.mv(`./public/uploads/${petPhoto}`, (err) => {
      if (err) {
        console.error("Error uploading file:", err.message);
      }
    });
  }

  db.run(
    `INSERT INTO UserProfile (userId, fullName, contactNumber, address, emergencyContact, 
                              petName, petBreed, petAge, petWeight, petHealth, petDiet, 
                              petAllergies, serviceFrequency, specialRequirements, petPhoto) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(userId) DO UPDATE SET
            fullName = excluded.fullName,
            contactNumber = excluded.contactNumber,
            address = excluded.address,
            emergencyContact = excluded.emergencyContact,
            petName = excluded.petName,
            petBreed = excluded.petBreed,
            petAge = excluded.petAge,
            petWeight = excluded.petWeight,
            petHealth = excluded.petHealth,
            petDiet = excluded.petDiet,
            petAllergies = excluded.petAllergies,
            serviceFrequency = excluded.serviceFrequency,
            specialRequirements = excluded.specialRequirements,
            petPhoto = excluded.petPhoto`,
    [
      userId,
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
      serviceFrequency,
      specialRequirements,
      petPhoto,
    ],
    function (err) {
      if (err) {
        console.error("Error updating profile:", err.message);
        res.redirect("/profile");
        return;
      }
      res.redirect("/profile");
    }
  );
});

// Route for editing profile
app.get("/edit-profile", (req, res) => {
  if (!req.session.user || req.session.user.role !== "customer") {
    res.redirect("/login");
    return;
  }

  const userId = req.session.user.userId;
  db.get(
    "SELECT * FROM UserProfile WHERE userId = ?",
    [userId],
    (err, profile) => {
      if (err) {
        console.error("Error fetching profile for editing:", err.message);
        res.render("editProfileCustomer", { profile: null });
        return;
      }
      res.render("editProfileCustomer", { profile });
    }
  );
});

// Handle profile updates
app.post("/update-profile", (req, res) => {
  if (!req.session.user || req.session.user.role !== "customer") {
    res.redirect("/login");
    return;
  }

  const userId = req.session.user.userId;
  const {
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
    serviceFrequency,
    specialRequirements
  } = req.body;

  let petPhoto = "";
  if (req.files && req.files.petPhoto) {
    petPhoto = req.files.petPhoto.name;
    req.files.petPhoto.mv(`./public/uploads/${petPhoto}`, (err) => {
      if (err) {
        console.error("Error uploading file:", err.message);
        return;
      }
    });
  }

  const query = `INSERT INTO UserProfile (
                    userId, fullName, contactNumber, address, emergencyContact,
                    petName, petBreed, petAge, petWeight, petHealth, petDiet,
                    petAllergies, serviceFrequency, specialRequirements,
                    petPhoto)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(userId) DO UPDATE SET
                    fullName = excluded.fullName,
                    contactNumber = excluded.contactNumber,
                    address = excluded.address,
                    emergencyContact = excluded.emergencyContact,
                    petName = excluded.petName,
                    petBreed = excluded.petBreed,
                    petAge = excluded.petAge,
                    petWeight = excluded.petWeight,
                    petHealth = excluded.petHealth,
                    petDiet = excluded.petDiet,
                    petAllergies = excluded.petAllergies,
                    serviceFrequency = excluded.serviceFrequency,
                    specialRequirements = excluded.specialRequirements,
                    petPhoto = excluded.petPhoto`;

  db.run(
    query,
    [
      userId,
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
      serviceFrequency,
      specialRequirements,
      petPhoto,
    ],
    function (err) {
      if (err) {
        console.error("Error updating profile:", err.message);
        res.redirect("/edit-profile?error=update");
        return;
      }
      res.redirect("/profile");
    }
  );
});

// Route for logging out
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err.message);
    }
    res.redirect("/");
  });
});

// Profile customer END-------------------------------------------

// Handle form submission
app.post('/booking/bookingform', (req, res) => {
  const { package, name, date, time, address, phone } = req.body;

  // Insert booking data into the database
  db.run(`INSERT INTO Bookings (package, name, date, time, address, phone) VALUES (?, ?, ?, ?, ?, ?)`,
    [package, name, date, time, address, phone],
    function(err) {
      if (err) {
        console.error('Error inserting booking:', err.message);
        res.status(500).send('Error saving booking');
        return;
      }
      // Pass booking details to the confirmation page
      res.render('bookingConfirmation', { package, name, date, time, address, phone });
    });
});

function calculateAverageRatings(callback) {
  const averageRatings = {};
  db.each("SELECT staffName, AVG(rating) as avgRating FROM reviews GROUP BY staffName", (err, row) => {
      if (err) {
          console.error(err.message);
      } else {
          
          averageRatings[row.staffName] = row.avgRating;
      }
  }, () => {
      
      callback(averageRatings);
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Petbuddy is running at http://localhost:${PORT}`);
});