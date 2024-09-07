const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fileUpload = require('express-fileupload'); // Import express-fileupload
const session = require("express-session"); // Import express-session
const bookingRoutes = require('./routes/booking');
const reviewRoutes = require('./routes/review');
const userRoutes = require('./routes/user');
const contactUsRoutes = require('./routes/contactUs');
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
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/', bookingRoutes); // Use the booking routes
app.use('/', reviewRoutes); // Use the review routes
app.use('/', userRoutes); // Use the review routes
app.use('/', contactUsRoutes); // Use the review routes

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Petbuddy is running at http://localhost:${PORT}`);
});