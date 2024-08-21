import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from "cors"
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())
app.use(bodyParser.json());

import userRoutes from './routes/user.routes.js';
import verifyUserRoutes from './routes/verifyUser.routes.js';
import mainGameRoutes from './routes/mainGame.routes.js';

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/verifyUser", verifyUserRoutes);
app.use("/api/v1/mainGame", mainGameRoutes);

export { app }
