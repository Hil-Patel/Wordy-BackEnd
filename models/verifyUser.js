const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const verifyUserSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    OTP: {
        type: String
    },
    OTPExpires: {
        type: Date
    },
    verified: {
        type: Boolean,
        required: true
    }
});

module.exports = mongoose.model("verifyUser", verifyUserSchema);