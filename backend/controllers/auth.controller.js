import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import Family from "../models/family.model.js";
import User from "../models/user.model.js";
import Member from "../models/member.model.js";
import genToken, { cookieOptions } from "../utils/genToken.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import { isValidTimezone } from "../utils/timezone.js";

const fail = (res, status, message) => res.status(status).json({ message });

const newInviteCode = () => crypto.randomBytes(5).toString("hex").toUpperCase();

// POST /api/auth/register
// Body: { name, email, password, familyName?, timezone?, inviteCode? }
// - with inviteCode → joins an existing family as a caregiver
// - without        → creates a new family
export const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, familyName, timezone, inviteCode } = req.body;

        if (!name || !email || !password) {
            return fail(res, 422, "Name, email and password are required");
        }
        if (String(password).length < 8) {
            return fail(res, 422, "Password must be at least 8 characters");
        }

        const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (emailExists) {
            return fail(res, 409, "An account with this email already exists");
        }

        let family;
        if (inviteCode) {
            family = await Family.findOne({ inviteCode: inviteCode.toUpperCase().trim() });
            if (!family) return fail(res, 404, "Invalid invite code");
        } else {
            if (!familyName || !familyName.trim()) {
                return fail(res, 422, "Family name is required");
            }
            if (timezone && !isValidTimezone(timezone)) {
                return fail(res, 422, "Unknown timezone");
            }
            family = await Family.create({
                name: familyName.trim(),
                timezone: timezone || "Asia/Kolkata",
                inviteCode: newInviteCode(),
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "caregiver",
            family: family._id,
        });

        if (!family.createdBy) {
            family.createdBy = user._id;
            await family.save();
        }

        res.cookie("token", genToken(user._id), cookieOptions());
        res.status(201).json({ user });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/login
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return fail(res, 422, "Email and password are required");
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return fail(res, 401, "Invalid email or password");
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return fail(res, 401, "Invalid email or password");
        }

        res.cookie("token", genToken(user._id), cookieOptions());
        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/logout
export const logoutUser = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ message: "Logged out" });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
    const family = await Family.findById(req.user.family).lean();
    const memberCount = await Member.countDocuments({ family: req.user.family, active: true });
    res.status(200).json({
        user: req.user,
        family,
        onboardingNeeded: req.user.role === "caregiver" && memberCount === 0,
    });
};

// PATCH /api/auth/me  { name }
export const updateMe = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (name !== undefined) {
            if (!name.trim()) return fail(res, 422, "Name cannot be empty");
            req.user.name = name.trim();
        }
        await req.user.save();
        res.status(200).json({ user: req.user });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/auth/avatar  (multipart form field: "avatar")
export const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) return fail(res, 422, "No image uploaded");
        const cloudUrl = await uploadToCloudinary(req.file.path);
        if (cloudUrl) {
            fs.unlink(req.file.path, () => {});
            req.user.avatar = cloudUrl;
        } else {
            // local fallback: served by express static at /uploads
            req.user.avatar = `/uploads/${req.file.filename}`;
        }
        await req.user.save();
        res.status(200).json({ user: req.user });
    } catch (error) {
        next(error);
    }
};
