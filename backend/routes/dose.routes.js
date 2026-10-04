import { Router } from "express";
import {
    getDosesForDay,
    getDoseHistory,
    confirmTaken,
    confirmSkipped,
    snoozeDose,
} from "../controllers/dose.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/today", getDosesForDay);
router.get("/history", getDoseHistory);
router.patch("/:id/taken", confirmTaken);
router.patch("/:id/skipped", confirmSkipped);
router.patch("/:id/snooze", snoozeDose);

export default router;
