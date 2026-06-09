import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";
import chatRouter from "./routes/chatRoute.js";
import businessRouter from "./routes/businessRoute.js";
dotenv.config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────
// Allow requests from the widget CDN and local dev origins.
const allowedOrigins = [
    process.env.WIDGET_ORIGIN || "https://grow-digitally-chatbot-6tky.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (curl, Postman, server-to-server)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

// ── Security headers (Helmet + CSP) ──────────────────────────
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    // Allow the widget bundle loaded by host pages
                    process.env.WIDGET_ORIGIN ||
                        "https://grow-digitally-chatbot-6tky.vercel.app",
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'", // needed by Tailwind-in-shadow-DOM
                    "https://fonts.googleapis.com",
                ],
                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com",
                    "https://fonts.googleapis.com",
                ],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: [
                    "'self'",
                    // n8n webhook host
                    process.env.N8N_HOST || "https://n8n.kasunpremarathna.com",
                ],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        // Prevent the API server from being embedded in iframes
        frameguard: { action: "deny" },
        // Remove X-Powered-By header
        hidePoweredBy: true,
    })
);

app.use(express.json());

// ── Lazy DB connection ─────────────────────────────────────────
let isConnected = false;
const ensureDB = async () => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
};

app.use(async (req, res, next) => {
    try {
        await ensureDB();
        next();
    } catch (err) {
        res.status(500).json({ success: false, error: "Database connection failed" });
    }
});

// ── Routes ────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.send(
        "<h1>ChatBot Application</h1> <p>Server is running successfully</p> <a href='https://github.com/'>GitHub</a> "
    );
});

app.use("/api/chat", chatRouter);
app.use("/api/business", businessRouter);

export default app;