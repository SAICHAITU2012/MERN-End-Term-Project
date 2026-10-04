import mongoose from "mongoose";

const familySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        // IANA timezone — all dose times are interpreted in this zone
        timezone: {
            type: String,
            required: true,
            default: "Asia/Kolkata",
        },
        // invite code so another caregiver can join this family
        inviteCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        escalationAfterMin: {
            type: Number,
            default: 60,
            min: 5,
            max: 720,
        },
        // prevents duplicate weekly digest notifications (format: YYYY-Www)
        lastDigestKey: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

const Family = mongoose.model("Family", familySchema);

export default Family;
