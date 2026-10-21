import "dotenv/config";
import mongoose from "mongoose";

// Connectivity check for MongoDB Atlas — tries each candidate URI in order
// and reports which one actually authenticates and connects.
//
//   npm run atlas-check
//
// Background: some networks break the DNS SRV lookup that mongodb+srv://
// relies on; in that case the explicit shard-host form below still works.

const PASSWORD = process.env.ATLAS_PASSWORD || "duttasai";
const DB = process.env.ATLAS_DB || "carecircle_med";

const candidates = [
    {
        label: "mongodb+srv (standard)",
        uri: `mongodb+srv://nkc2521_db_user:${PASSWORD}@cluster0.grxwf5e.mongodb.net/${DB}?appName=Cluster0&authSource=admin`,
    },
    {
        label: "shard hosts (SRV-free fallback)",
        uri: `mongodb://nkc2521_db_user:${PASSWORD}@ac-vswh6a8-shard-00-00.grxwf5e.mongodb.net:27017,ac-vswh6a8-shard-00-01.grxwf5e.mongodb.net:27017,ac-vswh6a8-shard-00-02.grxwf5e.mongodb.net:27017/${DB}?tls=true&authSource=admin&replicaSet=atlas-2w2ww2-shard-0&retryWrites=true&w=majority&appName=Cluster0`,
    },
];

const tryConnect = (uri, timeoutMs = 15000) =>
    new Promise((resolve) => {
        let done = false;
        const finish = (ok, info) => {
            if (done) return;
            done = true;
            mongoose.connection
                .close()
                .catch(() => {})
                .finally(() => resolve({ ok, info }));
        };
        const timer = setTimeout(() => finish(false, "timed out after 15s"), timeoutMs);
        mongoose
            .connect(uri, { serverSelectionTimeoutMS: timeoutMs - 1000 })
            .then((conn) => {
                clearTimeout(timer);
                finish(true, `${conn.connection.host}/${conn.connection.name}`);
            })
            .catch((err) => {
                clearTimeout(timer);
                finish(false, err.message);
            });
    });

let winner = null;
for (const { label, uri } of candidates) {
    console.log(`→ trying ${label} …`);
    const { ok, info } = await tryConnect(uri);
    console.log(`  ${ok ? "✅ connected" : "❌ failed"} — ${info}`);
    if (ok && !winner) {
        winner = uri;
        break;
    }
}

if (winner) {
    console.log("\nWorking MONGO_URI:\n" + winner.replace(/:\/\/([^:]+):[^@]+@/, "://$1:<PASSWORD>@"));
    process.exit(0);
}
console.log("\nNo candidate connected. If both failed with 'bad auth : authentication failed',");
console.log("reset the password in Atlas → Database Access and set ATLAS_PASSWORD before rerunning.");
process.exit(1);
