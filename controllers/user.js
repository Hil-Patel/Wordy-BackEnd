const User = require('../models/user');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

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

exports.postSignUp = (req, res, next) => {
    const { userName, password, email } = req.body;
    User.findOne({ email: email })
        .then(user => {
            if (user) {
                return res.status(400).json({ message: 'Email already in use.' });
            }
            return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    const newUser = new User({
                        email: email,
                        password: hashedPassword,
                        userName: userName
                    });
                    return newUser.save();
                })
                .then(result => {
                    res.status(201).json({ message: 'User created successfully!' });
                })
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Database Error.' });
        });
};

exports.postLogin = (req, res, next) => {
    const { email, password } = req.body;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(400).json({ message: "User Not Found!" });
            }
            return bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        return res.status(201).json({ message: "User Login Successfull" });
                    }
                    res.status(400).json({ message: "User Not Found!" });
                })
                .catch()
        })
        .catch(err => {
            res.status(500).json({ message: "Internal Server Issue" });
        });
};

const generateToken = () => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(20, (err, buf) => {
            if (err) {
                reject(err);
            } else {
                resolve(buf.toString('hex'));
            }
        });
    });
};

exports.forgotPassword = (req, res) => {
    const email = req.body.email;
    console.log(email);
    generateToken()
        .then((token) => {
            return User.findOne({ email: email })
                .then((user) => {
                    if (!user) {
                        return Promise.reject({ status: 400, message: 'No account with that email address exists.' });
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3000;
                    return user.save();
                });
        })
        .then((user) => {
            const mailOptions = {
                to: user.email,
                from: process.env.EMAIL_USER,
                subject: 'Password Reset',
                text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                    `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                    `http://localhost:5173/reset/${user.resetPasswordToken}\n\n` +
                    `If you did not request this, please ignore this email and your password will remain unchanged.\n`
            };

            return transporter.sendMail(mailOptions);
        })
        .then(() => {
            res.status(200).json({ message: 'An e-mail has been sent with further instructions.' });
        })
        .catch((err) => {
            console.log("HElo");
            console.error(err);
            res.status(err.status || 500).json({ message: err.message || 'An error occurred.' });
        });
};
exports.resetPassword = (req, res) => {
    const token = req.params.token;

    User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } })
        .then((user) => {
            if (!user) {
                return Promise.reject({ status: 400, message: 'Password reset token is invalid or has expired.' });
            }

            return bcrypt.hash(req.body.password, 12)
                .then((hash) => {
                    user.password = hash;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    return user.save();
                });
        })
        .then(() => {
            res.status(200).json({ message: 'Your password has been updated.' });
        })
        .catch((err) => {
            console.error(err);
            res.status(err.status || 500).json({ message: 'An error occurred.' });
        });
};