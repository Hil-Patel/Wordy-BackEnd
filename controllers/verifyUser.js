const verifyUser = require('../models/verifyUser');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    port: 465,
    debug: true,
    logger: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnAuthorized: true
    }
});


exports.postSendVerifyEmail = (req, res, next) => {
    const email = req.body.email;
    const OTP = Math.floor(100000 + Math.random() * 900000) + "";

    verifyUser.findOne({ email: email })
        .then(user => {
            if (user && user.verified === true) {
                return res.status(200).json({ message: 'Email already verified.', verified: user.verified });
            }

            if (user && !user.verified) {
                user.OTP = OTP;
                user.OTPExpires = Date.now() + 600000;
                return user.save();
            }

            const newUser = new verifyUser({
                email: email,
                verified: false,
                OTP: OTP,
                OTPExpires: Date.now() + 600000
            });
            return newUser.save();
        })
        .then(savedUser => {
            if (!savedUser) {
                throw new Error('User saving failed');
            }

            const mailOptions = {
                to: savedUser.email,  // Ensure 'savedUser.email' is defined
                from: process.env.EMAIL_USER,
                subject: 'Your OTP for Email Verification',
                html: `
                    <div style="text-align:center;">
                    <p>You are receiving this because you (or someone else) have requested the verification of the email on Wordy.</p>
                    <p>Your OTP is as follows:</p>
                    <p style="font-size: 24px; font-weight: bold;">${OTP}</p>
                    <p>If you did not request this, please ignore this email.</p>
                    </div>
                `
            };

            // Check if 'savedUser.email' is defined before sending email
            if (savedUser && savedUser.email) {
                return transporter.sendMail(mailOptions);
            } else {
                throw new Error('No recipients defined');
            }
        })
        .then(() => {
            return res.status(201).json({ message: 'An e-mail has been sent with further instructions.', verified: false });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ message: err.message || 'An error occurred.' });
        });
};




exports.postVerifyEmailOTP = (req, res, next) => {
    const { email, OTP } = req.body;

    verifyUser.findOne({ OTP: OTP, email: email, OTPExpires: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                return res.status(400).json({ message: 'Email or OTP is invalid.', verified: user.verified });
            }
            user.verified = true;
            user.OTP = undefined;
            user.OTPExpires = undefined;

            return user.save();
        })
        .then(savedUser => {
            return res.status(201).json({ message: 'Email is verified', verified: savedUser.verified });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        });
};

exports.verifyEmail = (req, res, next) => {
    const { email } = req.body;

    verifyUser.findOne({ email: email })
        .then(user => {
            if (user && user.verified === true) {
                return res.status(200).json({ message: "Email already verified.", verified: user.verified })
            }
            return res.status(200).json({ message: "Email not verified.", verified: user.verified });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ message: "Internal server issue" });
        });

}