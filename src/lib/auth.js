import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev_secret";

/**
 * signToken — creates a signed JWT containing the user's id and username.
 * Expires in 7 days by default.
 */
export function signToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

/**
 * verifyToken — verifies a JWT string and returns the decoded payload.
 * Returns null if the token is invalid or expired.
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET);
    } catch {
        return null;
    }
}

/**
 * getAuthUser — extracts and verifies the Bearer token from a Next.js
 * Request object's Authorization header.
 * Returns the decoded user payload or null if missing / invalid.
 */
export function getAuthUser(request) {
    const header = request.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return null;
    return verifyToken(token);
}
