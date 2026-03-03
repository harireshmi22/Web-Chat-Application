import { io } from "socket.io-client";

let socket;

/**
 * Returns a singleton Socket.io client instance.
 * Safe to call multiple times — always returns the same socket.
 */
export const getSocket = () => {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
            autoConnect: false,
            transports: ["websocket", "polling"],
        });
    }
    return socket;
};
