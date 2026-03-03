import mongoose from "mongoose";

/**
 * Notification model — stores in-app notifications for a user.
 * Types: friend_request, friend_accept, message, system.
 */
const notificationSchema = new mongoose.Schema(
    {
        /** Recipient of the notification */
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        /** User who triggered the notification (optional for system notifications) */
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        type: {
            type: String,
            enum: ["friend_request", "friend_accept", "message", "system"],
            required: true,
        },
        /** Human-readable notification text */
        text: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        /** Optional deep-link URL */
        link: { type: String, default: "" },
    },
    { timestamps: true }
);

export default mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);
