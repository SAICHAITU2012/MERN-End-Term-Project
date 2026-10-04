import { Router } from "express";
import {
    getMyFamily,
    updateFamily,
    rotateInvite,
    createMember,
    createMemberLogin,
    updateMember,
    deactivateMember,
} from "../controllers/family.controller.js";
import { protect, caregiverOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getMyFamily);
router.patch("/", caregiverOnly, updateFamily);
router.post("/invite/rotate", caregiverOnly, rotateInvite);

// member (patient) profiles
router.post("/members", caregiverOnly, createMember);
router.post("/members/:id/login", caregiverOnly, createMemberLogin);
router.patch("/members/:id", caregiverOnly, updateMember);
router.delete("/members/:id", caregiverOnly, deactivateMember);

export default router;
