import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import chatRouter from "./routes/chatRoute.js";

dotenv.config();

const app = express();

let isConnected = false;
const ensureDB = async () => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
};

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
    try {
        await ensureDB();
        next();
    } catch (err) {
        res.status(500).json({ success: false, error: "Database connection failed" });
    }
});

app.get("/", (req, res) => {
    res.send(
        "<h1>ChatBot Application</h1> <p>Server is running successfully</p> <a href='https://github.com/'>GitHub</a> "
    );
});

app.use("/api/chat", chatRouter);


export default app;