import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
        },
        role: {
            type: String,
            enum: ["caregiver", "member"],
            default: "caregiver",
        },
        family: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Family",
            required: true,
        },
        // for role=member: the patient profile this account confirms doses for
        linkedMember: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
        },
        avatar: {
            type: String,
        },
    },
    { timestamps: true }
);

// never leak the hash when a user document is serialized
userSchema.set("toJSON", {
    transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    },
});

const User = mongoose.model("User", userSchema);

export default User;
