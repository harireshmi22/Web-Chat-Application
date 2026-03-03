import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getAuthUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Requires: Authorization: Bearer <token>
 */
export async function GET(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const user = await User.findById(payload.id).select("-password").populate("contacts", "username displayName avatar isOnline lastSeen");
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json({ user });
    } catch (err) {
        console.error("[/api/auth/me]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * PATCH /api/auth/me
 * Updates the authenticated user's profile (displayName, bio, avatar, theme).
 */
export async function PATCH(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const updates = await req.json();

        // Only allow safe profile fields to be updated via the filtered path
        const allowed = ["displayName", "bio", "avatar", "theme", "notificationsEnabled"];
        const filtered = Object.fromEntries(
            Object.entries(updates).filter(([k]) => allowed.includes(k))
        );

        // Handle password change separately — must be hashed before storing
        // (findByIdAndUpdate bypasses the pre-save bcrypt hook, so we do it manually)
        if (updates.password && typeof updates.password === "string" && updates.password.length >= 6) {
            filtered.password = await bcrypt.hash(updates.password, 12);
        }

        const user = await User.findByIdAndUpdate(payload.id, filtered, { new: true }).select("-password");
        return NextResponse.json({ user });
    } catch (err) {
        console.error("[/api/auth/me PATCH]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
