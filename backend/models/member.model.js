import mongoose from "mongoose";

// A Member is a person medications are managed FOR (e.g. "Dad", 68).
// A Member may optionally have a User account (role=member) linked,
// so they can confirm their own doses from their device.
const memberSchema = new mongoose.Schema(
    {
        family: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Family",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        age: {
            type: Number,
            min: 0,
            max: 130,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other", ""],
            default: "",
        },
        conditions: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        doctor: {
            type: String,
            trim: true,
            maxlength: 120,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        avatar: {
            type: String,
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

memberSchema.index({ family: 1, name: 1 });

const Member = mongoose.model("Member", memberSchema);

export default Member;
