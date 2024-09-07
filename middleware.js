// middleware.js
const db = require('./models/db');

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next(); // User is authenticated, proceed to the next middleware or route handler
    } else {
        res.redirect('/login'); // User is not logged in, redirect to the login page
    }
}

// Middleware to check if the user has completed their profile
function ensureProfileComplete(req, res, next) {
    if (!req.session.user) {
      return res.redirect('/login');
    }
  
    const userId = req.session.user.userId;
  
    db.get("SELECT * FROM UserProfile WHERE userId = ?", [userId], (err, profile) => {
      if (err) {
        console.error("Error checking profile completeness:", err.message);
        return res.redirect('/login');
      }
  
      if (!profile || !profile.fullName || !profile.contactNumber || !profile.address) {
        // Redirect to profile page if essential fields are not filled
        return res.redirect('/profile');
      }
  
      next(); // If profile is complete, proceed to the next middleware or route
    });
}

// Export both middleware functions
module.exports = {isAuthenticated, ensureProfileComplete};