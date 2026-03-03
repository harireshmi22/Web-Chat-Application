import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import { getAuthUser } from "@/lib/auth";

/**
 * PUT /api/messages/[id]
 * Edits a message's text. Only the original sender can edit.
 * Body: { text }
 */
export async function PUT(req, { params }) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const message = await Message.findById(params.id);
        if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
        if (message.sender.toString() !== payload.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { text } = await req.json();
        if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });

        // Save old version to edit history before overwriting
        message.editHistory.push({ text: message.text, editedAt: new Date() });
        message.text = text.trim();
        await message.save();

        return NextResponse.json({ message });
    } catch (err) {
        console.error("[/api/messages/[id] PUT]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/messages/[id]
 * Soft-deletes a message (sets isDeleted = true). Only the sender can delete.
 */
export async function DELETE(req, { params }) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const message = await Message.findById(params.id);
        if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
        if (message.sender.toString() !== payload.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        message.isDeleted = true;
        await message.save();

        return NextResponse.json({ message: "Deleted" });
    } catch (err) {
        console.error("[/api/messages/[id] DELETE]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
