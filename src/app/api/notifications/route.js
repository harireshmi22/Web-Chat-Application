import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/lib/models/Notification";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/notifications
 * Returns all notifications for the current user, newest first.
 */
export async function GET(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const notifications = await Notification.find({ recipient: payload.id })
            .populate("sender", "username displayName avatar")
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = notifications.filter((n) => !n.isRead).length;
        return NextResponse.json({ notifications, unreadCount });
    } catch (err) {
        console.error("[/api/notifications GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * PATCH /api/notifications
 * Marks all notifications as read (or a specific one by id in body).
 * Body: { id? }  — omit id to mark all as read.
 */
export async function PATCH(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const body = await req.json().catch(() => ({}));

        if (body.id) {
            await Notification.findOneAndUpdate(
                { _id: body.id, recipient: payload.id },
                { isRead: true }
            );
        } else {
            await Notification.updateMany({ recipient: payload.id, isRead: false }, { isRead: true });
        }

        return NextResponse.json({ message: "Marked as read" });
    } catch (err) {
        console.error("[/api/notifications PATCH]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
