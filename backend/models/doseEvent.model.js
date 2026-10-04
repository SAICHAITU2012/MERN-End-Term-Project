import mongoose from "mongoose";

// One DoseEvent = (medication, family-local date, dose time).
// Created by the scheduler tick when a dose becomes due in the family's timezone.
const doseEventSchema = new mongoose.Schema(
    {
        family: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Family",
            required: true,
        },
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true,
        },
        medication: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Medication",
            required: true,
        },
        // "YYYY-MM-DD" in the family's timezone
        dateLabel: {
            type: String,
            required: true,
        },
        // "HH:mm" as scheduled
        timeLabel: {
            type: String,
            required: true,
        },
        // absolute UTC instant this dose was scheduled for (moves on snooze)
        scheduledFor: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "taken", "skipped", "missed", "cancelled"],
            default: "pending",
        },
        actedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        actedAt: {
            type: Date,
        },
        note: {
            type: String,
            trim: true,
            maxlength: 300,
        },
        snoozeCount: {
            type: Number,
            default: 0,
        },
        // set once the escalation notification for this dose has been sent
        escalatedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// idempotency: the scheduler can never create two events for the same slot
doseEventSchema.index(
    { medication: 1, dateLabel: 1, timeLabel: 1 },
    { unique: true }
);
doseEventSchema.index({ family: 1, dateLabel: 1, timeLabel: 1 });

const DoseEvent = mongoose.model("DoseEvent", doseEventSchema);

export default DoseEvent;
