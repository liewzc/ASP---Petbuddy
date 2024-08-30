const express = require("express");
const router = express.Router();
const db = require('../models/db'); // Import the database connection
const isAuthenticated = require('../middleware'); // Import the authentication middleware

const nodemailer = require('nodemailer');

// Set up the transporter
const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: 'petbuddyTeam78@outlook.com',
        pass: 'Petbuddy@78'
    }
});

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

// Route to render the booking page
router.get('/booking', isAuthenticated, (req, res) => {
    res.render('bookingPage');
});

// Route for the confirmation page
router.get('/booking/confirmation', isAuthenticated, (req, res) => {
    res.render('bookingConfirmation');
});

router.get('/booking/bookingform', isAuthenticated, (req, res) => {
    const cart = req.session.cart || []; // Retrieve the cart from the session
    let totalAmount = 0;

    // Calculate the total amount
    cart.forEach(item => {
        totalAmount += parseFloat(item.price); // Assuming price is a string, convert to float
    });

    // Render the bookingForm with cart and totalAmount
    res.render('bookingForm', { cart: cart, totalAmount: totalAmount });
});

// Route to add items to the cart
router.post('/add-to-cart', isAuthenticated, (req, res) => {
    const { packageName, packagePrice } = req.body;

    if (!req.session.cart) {
        req.session.cart = [];
    }

    req.session.cart.push({ name: packageName, price: packagePrice });

    res.redirect('/booking'); // Redirect to the booking page or wherever appropriate
});

// Route for handling the booking form
router.post('/booking/bookingform', isAuthenticated, (req, res) => {
    const cart = JSON.parse(req.body.cart || '[]');
    let totalAmount = 0;

    cart.forEach(item => {
        totalAmount += parseFloat(item.price);
    });

    res.render('bookingForm', { cart: cart, totalAmount: totalAmount });
});

// Route to get available time slots
router.get('/booking/available-slots', isAuthenticated, (req, res) => {
    const { staffName, bookingDate } = req.query;

    if (!staffName || !bookingDate) {
        return res.status(400).json({ error: 'Missing staffName or bookingDate' });
    }

    // Query the database for booked slots
    const query = 'SELECT timeSlot FROM StaffBookings WHERE staffName = ? AND bookingDate = ?';
    db.all(query, [staffName, bookingDate], (err, rows) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Extract booked slots
        const bookedSlots = rows.map(row => row.timeSlot);

        // Define all possible slots
        const allSlots = [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
            "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
            "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
            "21:00"
        ];

        // Determine available slots
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        res.json({ availableSlots });
    });
});

// Route for booking confirmation
router.post('/booking/confirmation', (req, res) => {
    const { name, email, address, phone, date, time, cart, staff } = req.body;  // Ensure staff is extracted here
    let parsedCart = [];

    console.log('Received staff:', staff);
    console.log('Received cart:', req.body.cart);

    try {
        parsedCart = JSON.parse(cart);
    } catch (error) {
        console.error('Error parsing cart data:', error.message);
        res.status(400).send('Invalid cart data');
        return;
    }

    // Calculate total price
    const totalPrice = parsedCart.reduce((total, item) => total + parseFloat(item.price), 0);

    // Assuming userId is optional and can be null
    const userId = req.session.userId || null;

    // Insert booking into the database
    db.run(`INSERT INTO Bookings (userId, name, email, address, phone, date, time, packageDetails, totalPrice)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, email, address, phone, date, time, JSON.stringify(parsedCart), totalPrice],
        function(err) {
            if (err) {
                console.error('Error inserting booking:', err.message);
                res.status(500).send('Error saving booking');
                return;
            }

            // Get the booking ID
            const bookingId = this.lastID;

            // Insert into StaffBookings table
            db.run(`INSERT INTO StaffBookings (bookingId, staffName, bookingDate, timeSlot)
                    VALUES (?, ?, ?, ?)`,
                [bookingId, staff, date, time],  // Use the correct staff variable here
                function(err) {
                    if (err) {
                        console.error('Error inserting staff booking:', err.message);
                        res.status(500).send('Error saving staff booking');
                        return;
                    }

                    // Optionally, clear the cart after booking
                    req.session.cart = [];

                    // Send the booking confirmation email
                    sendBookingConfirmationEmail(email, {
                        name,
                        packageDetails: JSON.stringify(parsedCart),
                        staff,
                        date,
                        time,
                        address,
                        totalPrice
                    });

                    // Redirect to the confirmation page or render it with the booking details
                    res.render('bookingConfirmation', { 
                        name, 
                        email, 
                        address, 
                        phone, 
                        date, 
                        time, 
                        staff,  
                        cart: parsedCart, 
                        totalPrice 
                    });
                });
        });
});

module.exports = router;
