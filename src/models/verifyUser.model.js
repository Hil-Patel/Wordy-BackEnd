import mongoose from 'mongoose';

const { Schema } = mongoose;

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
}, { timestamps: true });

export const VerifyUser = mongoose.model('verifyUser', verifyUserSchema);