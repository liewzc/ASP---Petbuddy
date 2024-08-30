// authMiddleware.js

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next(); // User is authenticated, proceed to the next middleware or route handler
    } else {
        res.redirect('/login'); // User is not logged in, redirect to the login page
    }
}

module.exports = isAuthenticated;
