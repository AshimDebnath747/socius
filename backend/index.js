import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route.js"
import "./config/passport.js"
import passport from 'passport';
const app = express();
app.use(passport.initialize());
app.use(express.json())
app.use(cors());
app.use(cookieParser());

app.use('/api/auth', authRouter);

app.listen(8000, () => console.log('Server running on http://localhost:8000'));