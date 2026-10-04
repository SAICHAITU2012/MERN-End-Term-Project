import { Router } from "express";
import {
    getMedications,
    createMedication,
    updateMedication,
    deactivateMedication,
} from "../controllers/medication.controller.js";
import { protect, caregiverOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getMedications);
router.post("/", caregiverOnly, createMedication);
router.patch("/:id", caregiverOnly, updateMedication);
router.delete("/:id", caregiverOnly, deactivateMedication);

export default router;
