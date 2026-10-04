import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        family: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Family",
            required: true,
        },
        // who should see it: "caregivers" | "all" | "user" (then userId is the single target)
        audience: {
            type: String,
            enum: ["caregivers", "all", "user"],
            default: "caregivers",
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        type: {
            type: String,
            enum: [
                "dose_due",
                "dose_missed",
                "refill_low",
                "weekly_digest",
                "member_added",
                "med_added",
                "system",
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
            maxlength: 160,
        },
        body: {
            type: String,
            maxlength: 500,
        },
        meta: {
            doseEvent: { type: mongoose.Schema.Types.ObjectId, ref: "DoseEvent" },
            medication: { type: mongoose.Schema.Types.ObjectId, ref: "Medication" },
            member: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

notificationSchema.index({ family: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
