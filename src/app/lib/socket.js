import { io } from "socket.io-client";

let socket;

/**
 * Returns a singleton Socket.io client instance.
 * In production the client connects to the same origin (same server handles both HTTP and WS).
 * In development it falls back to localhost:3000.
 */
export const getSocket = () => {
    if (!socket) {
        // Use explicit env var if set, otherwise auto-detect origin (works on Render/Railway/etc.)
        const url =
            process.env.NEXT_PUBLIC_SOCKET_URL ||
            (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

        socket = io(url, {
            autoConnect: false,
            transports: ["websocket", "polling"],
        });
    }
    return socket;
};
