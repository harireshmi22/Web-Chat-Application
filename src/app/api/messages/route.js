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

        // Fetch sender display info for the UI
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
