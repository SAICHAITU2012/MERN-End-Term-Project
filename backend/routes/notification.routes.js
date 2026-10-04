import { Router } from "express";
import {
    getNotifications,
    markRead,
} from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getNotifications);
router.post("/read", markRead);

export default router;
