import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import familyRoutes from "./routes/family.routes.js";
import medicationRoutes from "./routes/medication.routes.js";
import doseRoutes from "./routes/dose.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import reportRoutes from "./routes/report.routes.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set("trust proxy", 1); // correct client IPs behind Render/Vercel proxies
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
    cors({
        origin: (origin, cb) => {
            // allow same-origin/no-origin (curl, mobile) and the configured client
            if (!origin || origin === process.env.CLIENT_URL) return cb(null, true);
            cb(new Error("Not allowed by CORS"));
        },
        credentials: true,
    })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// locally-stored avatars
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "medmate-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/doses", doseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
