const express = require("express");
const router = express.Router();
const {sendFeedbackEmail} = require('../nodeMailer'); // Import the sendBookingConfirmationEmail function

  // Route for the contact us page
  router.get('/contact', (req, res) => {
    res.render('contactUsPage');
  });

  router.get('/contactUsConfirmPage', (req, res) => {
    res.render('contactUsConfirmPage'); 
  });  

  // POST route to handle feedback form submission
router.post('/contact-us', (req, res) => {
  const { message } = req.body;

  // Send the feedback via email
  sendFeedbackEmail(message);

  // Redirect to the confirmation page after email is sent
  res.redirect('/contactUsConfirmPage');
});

module.exports = router;