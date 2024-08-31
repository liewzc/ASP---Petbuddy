const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fileUpload = require('express-fileupload'); // Import express-fileupload
const session = require("express-session"); // Import express-session
const nodemailer = require('nodemailer');
const bookingRoutes = require('./routes/booking');
const reviewRoutes = require('./routes/review');

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

// Import the database connection
const db = require('./models/db');
const {isAuthenticated, ensureProfileComplete} = require('./middleware');

app.use('/', bookingRoutes); // Use the booking routes
app.use('/', reviewRoutes); // Use the review routes

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

  // Route for the contact us page
  app.get('/contact', (req, res) => {
    res.render('contactUsPage');
  });

// Set up the transporter
const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
      user: 'petbuddyTeam78@outlook.com',
      pass: 'Petbuddy@78'
  }
});

// Function to send email
const sendFeedbackEmail = (userMessage) => {
  const mailOptions = {
      from: 'petbuddyTeam78@outlook.com',
      to: 'petbuddyTeam78@outlook.com',
      subject: 'Feedback',
      text: `User Feedback: \n\n${userMessage}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Email sent: ' + info.response);
  });
};

const sendBookingConfirmationEmail = (email, bookingDetails) => {
  const mailOptions = {
      from: 'petbuddyTeam78@outlook.com',
      to: email, // Send the email to the user's email address
      subject: 'Booking Confirmation',
      text: `Dear ${bookingDetails.name},

Thank you for booking with us. Here are your booking details:

- Service: ${bookingDetails.packageDetails}
- Staff: ${bookingDetails.staff}
- Date: ${bookingDetails.date}
- Time: ${bookingDetails.time}
- Address: ${bookingDetails.address}

Total Price: SGD $${bookingDetails.totalPrice}

We look forward to serving you.

Best regards,
Petbuddy Team`
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Booking confirmation email sent: ' + info.response);
  });
};

// POST route to handle feedback form submission
app.post('/contact-us', (req, res) => {
  const { message } = req.body;

  // Send the feedback via email
  sendFeedbackEmail(message);

  // Redirect to the confirmation page after email is sent
  res.redirect('/contactUsConfirmPage');
});

app.get('/contactUsConfirmPage', (req, res) => {
  res.render('contactUsConfirmPage'); 
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

        // Set session for the newly registered customer
        req.session.user = {
          username: username,
          role: "customer",
          userId: this.lastID, // Use the last inserted ID as the user ID
        };

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
        return res.render("loginPage", { error: "Database error" });
      }

      if (!user) {
        // If no user found, check in the Staff table
        db.get(
          "SELECT * FROM Staff WHERE username = ? AND userpassword = ?",
          [username, password],
          (err, worker) => {
            if (err) {
              console.error("Error querying database:", err.message);
              return res.render("loginPage", { error: "Database error" });
            }

            if (!worker) {
              // Invalid credentials
              console.log("Invalid username or password for staff.");
              return res.render("loginPage", { error: "Invalid username or password" });
            } else {
              // Staff login successful
              console.log("Staff authenticated:", username);
              req.session.user = { username, role: "staff" }; // Set session for staff
              return res.redirect("/"); // Redirect staff to the homepage or dashboard
            }
          }
        );
      } else {
        // Customer login successful
        console.log("Customer authenticated:", username);
        req.session.user = { username, role: "customer", userId: user.id }; // Set session for customer

        // Check if the user's profile is complete
        db.get(
          "SELECT * FROM UserProfile WHERE userId = ?",
          [user.id],
          (err, profile) => {
            if (err) {
              console.error("Error querying user profile:", err.message);
              return res.redirect("/profile"); // Redirect to profile page on error
            }

            console.log("Performing profile completeness check for user:", username);

            if (!profile || !profile.fullName || !profile.contactNumber || !profile.address) {
              // If the profile is incomplete, redirect to the profile page
              console.log("Profile incomplete for user:", username);
              return res.redirect("/profile");
            } else {
              // If the profile is complete, redirect to the homepage
              console.log("Profile complete for user:", username);
              return res.redirect("/");
            }
          }
        );
      }
    }
  );
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