import mongoose from "mongoose";

/**
 * Message model — stores a single chat message.
 * Belongs to a Conversation and has a sender reference.
 * Supports edit history, soft-delete, and read receipts.
 */
const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: { type: String, required: true, maxlength: 5000 },
        /** true when the sender has deleted the message */
        isDeleted: { type: Boolean, default: false },
        /** Tracks all edits with timestamps */
        editHistory: [
            {
                text: String,
                editedAt: { type: Date, default: Date.now },
            },
        ],
        /** IDs of users who have read this message */
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
