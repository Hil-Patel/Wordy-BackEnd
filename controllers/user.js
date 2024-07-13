const User = require('../models/user');

const bcrypt = require('bcrypt');

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
                    res.status(201).json({ message: 'User created successfully!', userId: result.userName });
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
                        return res.status(201).json({ message: "User Found" });
                    }
                    res.status(400).json({ message: "User Not Found!" });
                })
                .catch()
        })
        .catch(err => {
            res.status(500).json({ message: "Internal Server Issue" });
        });
};