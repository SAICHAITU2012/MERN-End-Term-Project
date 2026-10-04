import { Router } from "express";
import {
    getMemberReport,
    getFamilyReport,
} from "../controllers/report.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/family", getFamilyReport);
router.get("/member/:memberId", getMemberReport);

export default router;
