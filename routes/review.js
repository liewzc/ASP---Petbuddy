const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Adjust the path to your db connection file
const {isAuthenticated, ensureProfileComplete} = require('../middleware'); // Import the authentication middleware


// Route for the reviews page
router.get('/reviews', (req, res) => {
    calculateAverageRatings((averageRatings) => {
        res.render('reviewPage', { averageRatings });
    });
  });

  // Protect the submit-review route with the authentication middleware
router.post('/submit-review', isAuthenticated, ensureProfileComplete, (req, res) => {
    const { staffName, rating, feedback } = req.body;
    console.log(`Received: ${staffName}, ${rating}, ${feedback}`); // Debugging line
    db.run("INSERT INTO reviews (staffName, rating, feedback) VALUES (?, ?, ?)", [staffName, rating, feedback], (err) => {
        if (err) {
            console.error(err.message);
        } else {
          console.log('Review inserted successfully'); // Debugging line
        }
        res.redirect('/reviews');
    });
  });

  router.get('/show-reviews', (req, res) => {
    db.all("SELECT * FROM reviews", (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send("Error retrieving reviews");
        } else {
            res.render('showReviews', { reviews: rows }); // Assuming you have a showReviews.ejs file to display the reviews
        }
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

  module.exports = router;