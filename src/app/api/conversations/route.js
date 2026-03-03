import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/conversations
 * Returns all conversations for the current user, sorted by most recent.
 */
export async function GET(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const conversations = await Conversation.find({ participants: payload.id })
            .populate("participants", "username displayName avatar isOnline lastSeen")
            .sort({ updatedAt: -1 });

        return NextResponse.json({ conversations });
    } catch (err) {
        console.error("[/api/conversations GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * POST /api/conversations
 * Finds or creates a DM conversation with another user.
 * Body: { participantId }
 */
export async function POST(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { participantId } = await req.json();
        const conv = await Conversation.findOrCreate(payload.id, participantId);
        await conv.populate("participants", "username displayName avatar isOnline lastSeen");

        return NextResponse.json({ conversation: conv });
    } catch (err) {
        console.error("[/api/conversations POST]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
