import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// verifies the httpOnly JWT cookie and attaches req.user
const protect = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ message: "Not authenticated — please log in" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: "Session expired — please log in again" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "Account no longer exists" });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

// blocks member accounts from caregiver-only mutations
const caregiverOnly = (req, res, next) => {
    if (req.user?.role !== "caregiver") {
        return res.status(403).json({ message: "Only caregivers can perform this action" });
    }
    next();
};

export { protect, caregiverOnly };
