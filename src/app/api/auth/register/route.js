import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";

/**
 * POST /api/auth/register
 * Creates a new user account and returns a signed JWT.
 * Body: { username, email, password, displayName? }
 */
export async function POST(req) {
    try {
        await connectDB();
        const { username, email, password, displayName } = await req.json();

        // Validate required fields
        if (!username || !email || !password) {
            return NextResponse.json({ error: "username, email and password are required" }, { status: 400 });
        }

        // Check for existing account
        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) {
            const field = exists.email === email ? "Email" : "Username";
            return NextResponse.json({ error: `${field} is already taken` }, { status: 409 });
        }

        // Create user — password is hashed via pre-save hook
        const user = await User.create({
            username,
            email,
            password,
            displayName: displayName || username,
        });

        const token = signToken({ id: user._id, username: user.username, email: user.email });
        return NextResponse.json({ token, user: user.toSafeObject() }, { status: 201 });
    } catch (err) {
        console.error("[/api/auth/register]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
