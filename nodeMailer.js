const nodemailer = require('nodemailer');

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
  
  module.exports = { sendFeedbackEmail, sendBookingConfirmationEmail };