import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import User from "@/lib/models/User";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/messages?conversationId=<id>
 * Messages are not persisted — always returns an empty array.
 */
export async function GET(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // Messages are ephemeral (not stored in DB)
        return NextResponse.json({ messages: [] });
    } catch (err) {
        console.error("[/api/messages GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * POST /api/messages
 * Does NOT persist the message — builds an ephemeral message object and returns it.
 * Only touches conversation.updatedAt so the sidebar stays sorted.
 * Body: { conversationId, text }
 */
export async function POST(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { conversationId, text } = await req.json();

        if (!conversationId || !text?.trim()) {
            return NextResponse.json({ error: "conversationId and text are required" }, { status: 400 });
        }

        // Verify participant
        const conv = await Conversation.findOne({ _id: conversationId, participants: payload.id });
        if (!conv) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Touch updatedAt so the sidebar stays sorted by most recent activity
        await Conversation.findByIdAndUpdate(conversationId, { $set: { updatedAt: new Date() } });

        // Fetch sender display info (displayName, avatar) for the UI
        const sender = await User.findById(payload.id).select("username displayName avatar").lean();

        // Build an ephemeral message object (never saved to DB)
        const message = {
            _id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            conversation: conversationId,
            sender: sender ?? { _id: payload.id, username: payload.username, displayName: payload.username, avatar: null },
            text: text.trim(),
            createdAt: new Date().toISOString(),
            isDeleted: false,
            isEdited: false,
        };

        return NextResponse.json({ message }, { status: 201 });
    } catch (err) {
        console.error("[/api/messages POST]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}


/**
 * GET /api/messages?conversationId=<id>&page=<n>
 * Returns paginated messages for a conversation (20 per page, newest first).
 */
export async function GET(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = 30;

        if (!conversationId) {
            return NextResponse.json({ error: "conversationId required" }, { status: 400 });
        }

        // Ensure the user is a participant
        const conv = await Conversation.findOne({ _id: conversationId, participants: payload.id });
        if (!conv) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Fetch all messages (including soft-deleted) so the client can
        // display "Message deleted" consistently across page refreshes
        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username displayName avatar")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Clear the unread counter for this user when they load the messages
        await Conversation.findByIdAndUpdate(conversationId, {
            $set: { [`unreadCount.${payload.id}`]: 0 },
        });

        // Return in chronological order
        return NextResponse.json({ messages: messages.reverse() });
    } catch (err) {
        console.error("[/api/messages GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * POST /api/messages
 * Sends a new message in a conversation and updates the lastMessage pointer.
 * Body: { conversationId, text }
 */
export async function POST(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { conversationId, text } = await req.json();

        if (!conversationId || !text?.trim()) {
            return NextResponse.json({ error: "conversationId and text are required" }, { status: 400 });
        }

        // Verify participant
        const conv = await Conversation.findOne({ _id: conversationId, participants: payload.id });
        if (!conv) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const message = await Message.create({
            conversation: conversationId,
            sender: payload.id,
            text: text.trim(),
        });

        // Update unread counts for other participants
        const others = conv.participants.filter((p) => p.toString() !== payload.id);
        others.forEach((uid) => {
            conv.unreadCount.set(uid.toString(), (conv.unreadCount.get(uid.toString()) || 0) + 1);
        });
        conv.lastMessage = message._id;
        await conv.save();

        await message.populate("sender", "username displayName avatar");
        return NextResponse.json({ message }, { status: 201 });
    } catch (err) {
        console.error("[/api/messages POST]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
