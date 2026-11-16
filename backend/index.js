import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.development" });

import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import http from 'http';
import { Server } from 'socket.io';
import authRouter from "./routes/auth.route.js"
import userRouter from "./routes/user.route.js"
import CommunityRouter from "./routes/communities.route.js"
import HelpRouter from "./routes/help.route.js"
import sessionRouter from "./routes/session.route.js"
import reviewRouter from "./routes/reviews.route.js"
import notificationRouter from './routes/notifications.route.js'
import path from "path";
import fs from "fs";
import "./config/passport.js"
import passport from 'passport';
import { initSocket } from './sockets/index.js';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use(passport.initialize());
app.use(express.json())
app.use(cors({
    origin: true,
    credentials: true,               // <-- allow cookies
}));
console.log("enfdd:", process.env.FEV)
app.use(cookieParser());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  "/uploads",
  express.static(uploadsDir)
);

app.use('/api/auth', authRouter);
app.use("/api/user", userRouter);
app.use("/api/users", userRouter);
app.use("/api/communities", CommunityRouter)
app.use("/api/help-requests", HelpRouter)
app.use("/api/sessions", sessionRouter)
app.use("/api/review", reviewRouter)
app.use("/api/notifications", notificationRouter)


//socket.io setup -- reminder for later -- incase I forget
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    },
    pingTimeout: 60000,   // 60 seconds to wait for pong
    pingInterval: 25000,  // ping every 25 seconds
});

app.set("io", io);
initSocket(io);
const port = process.env.PORT || 8000
server.listen(port, "0.0.0.0", () => console.log(`Server running on port ${port}`));