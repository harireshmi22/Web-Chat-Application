import mongoose from "mongoose";

/**
 * Conversation model — represents a DM thread between two users
 * (or a group in the future). Tracks the last message for sidebar previews.
 */
const conversationSchema = new mongoose.Schema(
    {
        /** Participants in this conversation */
        participants: [
            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        ],
        /** Reference to the most recent message (for sidebar preview) */
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        /** Unread count per participant */
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
        isGroup: { type: Boolean, default: false },
        groupName: { type: String, default: "" },
    },
    { timestamps: true }
);

/**
 * Static method — find or create a DM conversation between two users.
 * Prevents duplicate conversations.
 */
conversationSchema.statics.findOrCreate = async function (userA, userB) {
    let conv = await this.findOne({
        isGroup: false,
        participants: { $all: [userA, userB], $size: 2 },
    });
    if (!conv) {
        conv = await this.create({ participants: [userA, userB] });
    }
    return conv;
};

export default mongoose.models.Conversation ||
    mongoose.model("Conversation", conversationSchema);
