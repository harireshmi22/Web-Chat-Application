import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Notification from "@/lib/models/Notification";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/contacts
 * Returns the current user's accepted contacts (friends) list.
 */
export async function GET(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const user = await User.findById(payload.id)
            .populate("contacts", "username displayName avatar isOnline lastSeen bio")
            .populate("friendRequests", "username displayName avatar isOnline")
            .populate("sentRequests", "username displayName avatar");

        return NextResponse.json({
            contacts: user.contacts,
            friendRequests: user.friendRequests,
            sentRequests: user.sentRequests,
        });
    } catch (err) {
        console.error("[/api/contacts GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * POST /api/contacts
 * Sends a friend request to another user.
 * Body: { targetId }
 */
export async function POST(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { targetId } = await req.json();

        if (targetId === payload.id) {
            return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
        }

        const [me, target] = await Promise.all([
            User.findById(payload.id),
            User.findById(targetId),
        ]);

        if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (me.contacts.includes(targetId)) {
            return NextResponse.json({ error: "Already friends" }, { status: 409 });
        }
        if (me.sentRequests.includes(targetId)) {
            return NextResponse.json({ error: "Request already sent" }, { status: 409 });
        }

        // If target already sent us a request, accept it immediately
        if (me.friendRequests.includes(targetId)) {
            me.contacts.push(targetId);
            me.friendRequests = me.friendRequests.filter((id) => id.toString() !== targetId);
            target.contacts.push(payload.id);
            target.sentRequests = target.sentRequests.filter((id) => id.toString() !== payload.id);
            await Promise.all([me.save(), target.save()]);

            await Notification.create({
                recipient: targetId,
                sender: payload.id,
                type: "friend_accept",
                text: `${me.username} accepted your friend request`,
                link: `/contacts`,
            });

            return NextResponse.json({ message: "Friend request accepted — you are now friends!" });
        }

        // Send the request
        me.sentRequests.push(targetId);
        target.friendRequests.push(payload.id);
        await Promise.all([me.save(), target.save()]);

        await Notification.create({
            recipient: targetId,
            sender: payload.id,
            type: "friend_request",
            text: `${me.username} sent you a friend request`,
            link: `/contacts`,
        });

        return NextResponse.json({ message: "Friend request sent" }, { status: 201 });
    } catch (err) {
        console.error("[/api/contacts POST]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/contacts
 * Removes a contact or rejects a friend request.
 * Body: { targetId, action: "remove" | "reject" }
 */
export async function DELETE(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { targetId } = await req.json();

        const [me, target] = await Promise.all([
            User.findById(payload.id),
            User.findById(targetId),
        ]);
        if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Remove from both sides
        me.contacts = me.contacts.filter((id) => id.toString() !== targetId);
        me.friendRequests = me.friendRequests.filter((id) => id.toString() !== targetId);
        me.sentRequests = me.sentRequests.filter((id) => id.toString() !== targetId);
        target.contacts = target.contacts.filter((id) => id.toString() !== payload.id);
        target.friendRequests = target.friendRequests.filter((id) => id.toString() !== payload.id);
        target.sentRequests = target.sentRequests.filter((id) => id.toString() !== payload.id);

        await Promise.all([me.save(), target.save()]);
        return NextResponse.json({ message: "Removed" });
    } catch (err) {
        console.error("[/api/contacts DELETE]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
