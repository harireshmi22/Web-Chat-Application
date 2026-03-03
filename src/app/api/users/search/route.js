import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/users/search?q=<query>
 * Searches users by username or displayName.
 * Excludes the current user and returns max 20 results.
 */
export async function GET(req) {
    try {
        const payload = getAuthUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();

        if (!q || q.length < 2) {
            return NextResponse.json({ users: [] });
        }

        await connectDB();
        const regex = new RegExp(q, "i");

        const users = await User.find({
            _id: { $ne: payload.id },
            $or: [{ username: regex }, { displayName: regex }],
        })
            .select("username displayName avatar isOnline lastSeen")
            .limit(20);

        return NextResponse.json({ users });
    } catch (err) {
        console.error("[/api/users/search]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
