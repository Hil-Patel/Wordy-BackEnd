import { type } from "mocha/lib/utils";
import mongoose from "mongoose";

const { Schema } = mongoose;

const gameSchema = new Schema({
    wordLength: {
        type: Number,
        required: true
    },
    word: {
        type: String
    },
    gussedWords: {
        type: Array
    },
    highScore: {
        type: Number,
        required: true,
        default: 0
    },
    score: {
        type: Number,
        required: true,
        default: 0
    },
    streak: {
        type: Number,
        required: true,
        default: 0
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

export const GameData = new mongoose.model("GameData", gameSchema);