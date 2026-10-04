import mongoose from "mongoose";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const medicationSchema = new mongoose.Schema(
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
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        dosage: {
            type: String,
            trim: true,
            maxlength: 60,
        },
        form: {
            type: String,
            enum: ["tablet", "capsule", "syrup", "injection", "drops", "inhaler", "other"],
            default: "tablet",
        },
        instructions: {
            type: String,
            trim: true,
            maxlength: 300,
        },
        // family-local wall-clock times, "HH:mm" — validated below
        doseTimes: {
            type: [String],
            required: true,
            validate: {
                validator(times) {
                    return Array.isArray(times) && times.length > 0 && times.length <= 6 &&
                        times.every((t) => TIME_RE.test(t)) &&
                        new Set(times).size === times.length;
                },
                message: "Provide 1–6 unique dose times in 24h HH:mm format",
            },
        },
        // 0 = Sunday … 6 = Saturday. Empty/omitted = every day.
        daysOfWeek: {
            type: [Number],
            default: [0, 1, 2, 3, 4, 5, 6],
            validate: {
                validator(days) {
                    return days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
                },
            },
        },
        stockCount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        // when stockCount drops to/below this, caregivers get a refill alert
        stockThreshold: {
            type: Number,
            required: true,
            min: 0,
            default: 5,
        },
        refillNotifiedAt: {
            type: Date,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
        active: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

medicationSchema.index({ family: 1, member: 1, active: 1 });

const Medication = mongoose.model("Medication", medicationSchema);

export { TIME_RE };
export default Medication;
