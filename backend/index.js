import "dotenv/config";
import http from "http";
import connectDB, { isDbConnected } from "./config/db.js";
import app from "./app.js";
import { startScheduler, tick } from "./jobs/scheduler.js";

const port = Number(process.env.PORT || 5000);

const server = http.createServer(app);

const start = async () => {
    try {
        await connectDB();
        server.listen(port, () => {
            console.log(`MedMate API running at http://localhost:${port}`);
        });
        // run one tick immediately (catches up after restarts), then every minute
        await tick();
        startScheduler();
    } catch (error) {
        console.error("Failed to start:", error.message);
        process.exit(1);
    }
};

// graceful shutdown — finish in-flight requests, close the cron and DB
process.on("SIGTERM", () => {
    console.log("SIGTERM received — shutting down");
    server.close(() => process.exit(0));
});
process.on("SIGINT", () => {
    console.log("SIGINT received — shutting down");
    server.close(() => process.exit(0));
});

start();

export { server, isDbConnected };
