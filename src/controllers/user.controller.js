import { User } from '../models/user.model.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
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

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const postSignUp = asyncHandler(async (req, res) => {
    const { username, password, email } = req.body;

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne(email)

    if (existedUser) {
        throw new ApiError(409, "User with given email already exists")
    }

    const user = await User.create({
        email,
        password,
        username
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went the user while registering the user")
    }
    console.log(createdUser);
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
});

const postLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (
        [email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged In successfully"
            )
        )
});

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

const forgotPassword = asyncHandler(async (req, res) => {
    try {
        const email = req.body.email;

        if (
            [email].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }

        const token = await generateToken()

        const user = await User.findOne({ email })

        if (!user) {
            throw new ApiError(400, "No account with that email address exists.")
        }

        user.resetPasswordToken = token
        user.resetPasswordExpire = Date.now() + 3600000

        await user.save()

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                `http://localhost:5173/reset/${user.resetPasswordToken}\n\n` +
                `If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await transporter.sendMail(mailOptions)

        return res.status(200)
            .json(new ApiResponse(200, user, "An e-mail has been sent with further instructions."))

    } catch (error) {
        throw new ApiError(500, error?.message || "An internal error occured.")
    }
    // generateToken()
    //     .then((token) => {
    //         return User.findOne({ email: email })
    //             .then((user) => {
    //                 if (!user) {
    //                     return Promise.reject({ status: 400, message: 'No account with that email address exists.' });
    //                 }
    //                 user.resetPasswordToken = token;
    //                 user.resetPasswordExpire = Date.now() + 3600000;
    //                 console.log("Time:" + user.resetPasswordExpire);
    //                 return user.save().then(() => ({ user, token }));
    //             });
    //     })

    //     .then(({ user, token }) => {
    //         const mailOptions = {
    //             to: user.email,
    //             from: process.env.EMAIL_USER,
    //             subject: 'Password Reset',
    //             text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
    //                 `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
    //                 `http://localhost:5173/reset/${user.resetPasswordToken}\n\n` +
    //                 `If you did not request this, please ignore this email and your password will remain unchanged.\n`
    //         };

    //         return transporter.sendMail(mailOptions).then(() => token);
    //     })
    //     .then((token) => {
    //         res.status(200).json({ message: 'An e-mail has been sent with further instructions.', resetPasswordToken: token });
    //     })
    //     .catch((err) => {
    //         console.error(err);
    //         res.status(err.status || 500).json({ message: err.message || 'An error occurred.' });
    //     });
});

const resetPassword = asyncHandler(async (req, res) => {
    try {
        const token = req.params.token;
        const { password } = req.body;

        if (
            [password].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } })

        if (!user) {
            throw new ApiError(400, "Password reset token is invalid or has expired.")
        }

        user.password = password
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save()

        return res.status(200)
            .json(new ApiResponse(200, user, "Your password has been updated."))
    } catch (error) {
        throw new ApiError(500, error?.message || "An error occured.")
    }
    // console.log(token);
    // User.findOne({ resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } })
    //     .then((user) => {
    //         if (!user) {
    //             return Promise.reject({ status: 400, message: 'Password reset token is invalid or has expired.' });
    //         }

    //         return bcrypt.hash(req.body.password, 12)
    //             .then((hash) => {
    //                 user.password = hash;
    //                 user.resetPasswordToken = undefined;
    //                 user.resetPasswordExpire = undefined;
    //                 return user.save();
    //             });
    //     })
    //     .then(() => {
    //         res.status(200).json({ message: 'Your password has been updated.' });
    //     })
    //     .catch((err) => {
    //         console.error(err);
    //         res.status(err.status || 500).json({ message: 'An error occurred.' });
    //     });
});
export {
    postSignUp,
    postLogin,
    forgotPassword,
    resetPassword
};
