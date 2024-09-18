import { VerifyUser } from '../models/verifyUser.model.js';
import nodemailer from 'nodemailer';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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


const postSendVerifyEmail = asyncHandler(async (req, res, next) => {
    try {
        const email = req.body.email;

        if (
            [email].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "Email is required")
        }

        const OTP = Math.floor(100000 + Math.random() * 900000) + "";

        const user = await VerifyUser.findOne({ email });

        if (user && user.verified === true) {
            return res.status(200).json(new ApiResponse(200, user, "Email is already verified!"),);
        }

        let savedUser;
        if (user && !user.verified) {
            user.OTP = OTP;
            user.OTPExpires = Date.now() + 600000;
            savedUser = await user.save();
        } else {
            const newUser = await VerifyUser.create({
                email: email,
                verified: false,
                OTP: OTP,
                OTPExpires: Date.now() + 600000
            });
            savedUser = newUser;
        }

        if (!savedUser) {
            throw new ApiError(500, 'User saving failed');
        }

        const mailOptions = {
            to: savedUser.email,
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

        await transporter.sendMail(mailOptions);

        return res.status(201).json(new ApiResponse(200, savedUser, 'An e-mail has been sent with OTP for verification.'));
    } catch (error) {
        throw new ApiError(500, error?.message || "Email is not sent due to some sesrver error")
    }
});


const postVerifyEmailOTP = asyncHandler(async (req, res, next) => {
    try {
        const { email, OTP } = req.body;


        if (
            [email, OTP].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }


        const user = await VerifyUser.findOne({ OTP: OTP, email: email, OTPExpires: { $gt: Date.now() } });

        if (!user) {
            return res.status(200).json(new ApiResponse(200, user, "OTP is invalid or expired"));
        }

        user.verified = true;
        user.OTP = undefined;
        user.OTPExpires = undefined;

        await user.save();

        return res.status(200).json(new ApiResponse(200, user, "Email is verified"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Someting went wrong while verifing OTP")
    }
});


const verifyEmail = asyncHandler(async (req, res, next) => {
    try {
        const { email } = req.body;

        if (
            [email].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "Email is required")
        }

        const user = await VerifyUser.findOne({ email });

        if (!user) {
            return res.status(200).json(new ApiResponse(200, user, "Email not found."));
        }

        if (user.verified === true) {
            return res.status(200).json(new ApiResponse(200, user, "Email already verified."));
        } else {
            return res.status(200).json(new ApiResponse(200, user, "Email not verified."));
        }
    } catch (error) {
        throw new ApiError(500, error?.message || "Someting went wrong while verifing OTP")
    }
});


export {
    verifyEmail,
    postVerifyEmailOTP,
    postSendVerifyEmail,
}
