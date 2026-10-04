import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Avatars are uploaded to memory/disk and stored on Cloudinary when
// credentials exist; otherwise they are served from backend/uploads.
// This keeps the project runnable with zero external accounts.

const uploadRoot = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadRoot),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
        cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
    },
});

export const avatarUpload = multer({
    storage: diskStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) return cb(null, true);
        cb(new Error("Only PNG, JPG, WEBP or GIF images are allowed"));
    },
});

export { uploadRoot };
