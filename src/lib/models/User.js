import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User model — stores account info, contacts list, online status.
 */
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 32,
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
            minlength: 6,
        },
        displayName: { type: String, default: "" },
        avatar: { type: String, default: "" },         // URL to avatar image
        bio: { type: String, default: "", maxlength: 200 },
        /** List of accepted friend/contact user IDs */
        contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        /** Pending incoming friend requests (sender IDs) */
        friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        /** Pending outgoing friend requests (receiver IDs) */
        sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },
        notificationsEnabled: { type: Boolean, default: true },
        theme: { type: String, enum: ["light", "dark"], default: "dark" },
    },
    { timestamps: true }
);

/**
 * Pre-save hook — hashes the password before storing it.
 * Only runs when the password field is modified.
 */
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

/**
 * comparePassword — compares a plain-text password against the stored hash.
 */
userSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

/**
 * toSafeObject — returns user data without the password field.
 */
userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

export default mongoose.models.User || mongoose.model("User", userSchema);
