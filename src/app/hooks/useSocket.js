import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "../lib/socket";

/**
 * useSocket — real-time chat hook
 * @param {string}   room             - room/channel name to join
 * @param {string}   username         - display name of the current user
 * @param {Function} onReceiveMessage - optional callback invoked with each
 *                                      incoming message from other users
 */
export function useSocket(room, username, onReceiveMessage) {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    // onlineUsers now tracks ALL globally connected user IDs (not just room members)
    const [onlineUsers, setOnlineUsers] = useState([]);
    const typingTimeout = useRef(null);
    const onReceiveMessageRef = useRef(onReceiveMessage);
    const socket = getSocket();

    // Keep the callback ref up-to-date without re-running the effect
    useEffect(() => { onReceiveMessageRef.current = onReceiveMessage; }, [onReceiveMessage]);

    // Reset local messages whenever the active room changes
    useEffect(() => { setMessages([]); }, [room]);

    useEffect(() => {
        if (!room || !username) return;

        // Pass JWT token so server middleware can verify auth
        const token = typeof window !== "undefined" ? localStorage.getItem("ccl_token") : null;
        if (token) socket.auth = { token };

        // Connect and join the room
        socket.connect();

        const onConnect = () => {
            setIsConnected(true);
            socket.emit("join_room", { room, username });
        };

        const onDisconnect = () => setIsConnected(false);

        const onReceiveMessageHandler = (data) => {
            setMessages((prev) => [...prev, data]);
            onReceiveMessageRef.current?.(data);
        };

        // Server sends the in-memory history for global_chat when you join
        const onMessageHistory = (history) => {
            setMessages(history.map((m) => ({ ...m, own: m.author === username })));
        };

        const onUserTyping = ({ username: who }) => {
            setTypingUsers((prev) => prev.includes(who) ? prev : [...prev, who]);
        };

        const onUserStopTyping = ({ username: who }) => {
            setTypingUsers((prev) => prev.filter((u) => u !== who));
        };

        // ── Global presence tracking ─────────────────────────────────────
        // Server emits this once on connect with all currently online user IDs
        const onOnlineUsers = (userIds) => setOnlineUsers(userIds);

        // Server broadcasts these globally whenever someone connects/disconnects
        const onUserOnline = ({ userId }) =>
            setOnlineUsers((prev) => prev.includes(userId) ? prev : [...prev, userId]);

        const onUserOffline = ({ userId }) =>
            setOnlineUsers((prev) => prev.filter((id) => id !== userId));

        const onUserJoined = ({ username: who }) => {
            setMessages((prev) => [
                ...prev,
                { id: Date.now(), type: "system", text: `${who} joined the chat` },
            ]);
        };

        const onUserLeft = ({ username: who }) => {
            setMessages((prev) => [
                ...prev,
                { id: Date.now(), type: "system", text: `${who} left the chat` },
            ]);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("receive_message", onReceiveMessageHandler);
        socket.on("message_history", onMessageHistory);
        socket.on("user_typing", onUserTyping);
        socket.on("user_stop_typing", onUserStopTyping);
        socket.on("online_users", onOnlineUsers);
        socket.on("user_online", onUserOnline);
        socket.on("user_offline", onUserOffline);
        socket.on("user_joined", onUserJoined);
        socket.on("user_left", onUserLeft);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("receive_message", onReceiveMessageHandler);
            socket.off("message_history", onMessageHistory);
            socket.off("user_typing", onUserTyping);
            socket.off("user_stop_typing", onUserStopTyping);
            socket.off("online_users", onOnlineUsers);
            socket.off("user_online", onUserOnline);
            socket.off("user_offline", onUserOffline);
            socket.off("user_joined", onUserJoined);
            socket.off("user_left", onUserLeft);
            socket.disconnect();
        };
    }, [room, username]);

    // Send a message — adds to local state immediately and emits to server
    const sendMessage = useCallback(
        (text) => {
            if (!text.trim()) return;
            const msg = {
                id: Date.now(),
                author: username,
                avatar: username[0].toUpperCase(),
                color: "violet",
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                text,
                own: true,
                room,
            };
            setMessages((prev) => [...prev, msg]);
            socket.emit("send_message", msg);
            // Stop typing after sending
            socket.emit("stop_typing", { room, username });
        },
        [room, username, socket]
    );

    // Emit typing with auto-stop after 2 seconds of inactivity
    const emitTyping = useCallback(() => {
        socket.emit("typing", { room, username });
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket.emit("stop_typing", { room, username });
        }, 2000);
    }, [room, username, socket]);

    return {
        messages,
        isConnected,
        typingUsers,
        onlineUsers,
        sendMessage,
        emitTyping,
    };
}
