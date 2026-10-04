import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    updateMe,
    uploadAvatar,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { avatarUpload } from "../middlewares/upload.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();

// gentle brute-force protection on credential routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts — try again in a few minutes" },
});

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/logout", logoutUser);

router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.patch("/avatar", protect, avatarUpload.single("avatar"), uploadAvatar);

export default router;
