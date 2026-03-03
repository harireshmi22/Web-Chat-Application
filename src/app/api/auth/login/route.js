import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";

/**
 * POST /api/auth/login
 * Authenticates a user by email + password and returns a signed JWT.
 * Body: { email, password }
 */
export async function POST(req) {
    try {
        await connectDB();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        // Find user and include password for comparison
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const valid = await user.comparePassword(password);
        if (!valid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = signToken({ id: user._id, username: user.username, email: user.email });
        return NextResponse.json({ token, user: user.toSafeObject() });
    } catch (err) {
        console.error("[/api/auth/login]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
