"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    AppShell, Box, Stack, ScrollArea, Text, Group, Avatar,
    TextInput, ActionIcon, Tooltip, Indicator, Paper, Divider,
    Badge, Loader, ThemeIcon, Menu, Modal, Button,
} from "@mantine/core";
import {
    IconSend, IconMoodSmile, IconPaperclip, IconMicrophone,
    IconPhone, IconVideo, IconDotsVertical, IconSearch,
    IconWifi, IconWifiOff, IconMessage2, IconEdit, IconTrash, IconCheck,
} from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { NavbarSearch } from "../components/NavbarSearch/NavbarSearch";
import { useSocket } from "../hooks/useSocket";
import useAuth from "../hooks/useAuth";
import classes from "./chat.module.css";

export default function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, getToken } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [msgLoading, setMsgLoading] = useState(false);
    const [convLoading, setConvLoading] = useState(false);

    const viewport = useRef(null);

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth/login");
    }, [user, authLoading, router]);

    // Socket — join active conversation room
    const room = activeConv?._id || null;

    // Load conversations from API (defined early so handleSocketMessage can reference it)
    const loadConversations = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        setConvLoading(true);
        try {
            const res = await fetch("/api/conversations", { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.conversations) {
                // Add otherUser to each conversation (the participant who isn't us)
                const mapped = data.conversations.map((conv) => ({
                    ...conv,
                    otherUser: conv.participants?.find((p) => p._id !== user?._id && p._id?.toString() !== user?._id?.toString()),
                }));
                setConversations(mapped);
            }
        } catch { }
        setConvLoading(false);
    }, [getToken, user?._id]);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    // Auto-select a conversation when ?convId=xxx is in the URL
    const pendingConvId = searchParams?.get("convId");
    useEffect(() => {
        if (!pendingConvId || conversations.length === 0) return;
        const target = conversations.find((c) => c._id === pendingConvId);
        if (target) {
            setActiveConv(target);
            // Clean the URL param without reloading the page
            router.replace("/chat", { scroll: false });
        }
    }, [pendingConvId, conversations, router]);

    // Callback invoked when a real-time message arrives from another user
    const handleSocketMessage = useCallback((data) => {
        // Normalize socket payload to match the DB-loaded message shape:
        // socket uses { author, time } but render expects { sender.username, createdAt }
        const normalized = {
            ...data,
            _id: data._id || `socket_${Date.now()}`,
            sender: data.sender ?? {
                _id: data.authorId || null,
                username: data.author || "?",
                displayName: data.author || "?",
                avatar: null,
            },
            createdAt: data.createdAt || new Date().toISOString(),
            own: false,
        };
        setMessages((prev) => [...prev, normalized]);
        loadConversations(); // refresh sidebar last-message preview
    }, [loadConversations]);

    const { isConnected, typingUsers, onlineUsers, sendMessage, emitTyping } =
        useSocket(room, user?.username, handleSocketMessage);

    // Load messages when conversation changes
    useEffect(() => {
        if (!activeConv) return;
        const token = getToken();
        if (!token) return;
        setMsgLoading(true);
        fetch(`/api/messages?conversationId=${activeConv._id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.messages) setMessages([...d.messages].reverse());
                // Refresh sidebar so the cleared unread counter is reflected
                loadConversations();
            })
            .catch(() => { })
            .finally(() => setMsgLoading(false));
    }, [activeConv, getToken, loadConversations]);

    // Auto-scroll whenever messages update
    useEffect(() => {
        viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    // Handle sending a message
    const handleSend = async () => {
        if (!input.trim() || !activeConv) return;
        const text = input.trim();
        setInput("");
        const token = getToken();
        if (!token) return;

        // Optimistic add
        const temp = { _id: "temp_" + Date.now(), text, sender: { _id: user._id, username: user.username }, createdAt: new Date().toISOString(), own: true };
        setMessages((p) => [...p, temp]);

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ conversationId: activeConv._id, text }),
            });
            const data = await res.json();
            if (data.message) {
                setMessages((p) => p.map((m) => m._id === temp._id ? { ...data.message, own: true } : m));
                sendMessage(text);     // also broadcast via socket
                loadConversations();   // refresh sidebar
            }
        } catch { }
    };

    // Edit message
    const handleEdit = async (id) => {
        if (!editText.trim()) return;
        const token = getToken();
        if (!token) return;
        const res = await fetch(`/api/messages/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ text: editText.trim() }),
        });
        const data = await res.json();
        if (data.message) {
            setMessages((p) => p.map((m) => m._id === id ? { ...m, text: data.message.text, isEdited: true } : m));
        }
        setEditingId(null);
        setEditText("");
    };

    // Delete message
    const handleDelete = async (id) => {
        const token = getToken();
        if (!token) return;
        await fetch(`/api/messages/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setMessages((p) => p.map((m) => m._id === id ? { ...m, isDeleted: true, text: "Message deleted" } : m));
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const typingText =
        typingUsers.length === 1 ? `${typingUsers[0]} is typing…` :
            typingUsers.length > 1 ? `${typingUsers.join(", ")} are typing…` : null;

    const otherUser = activeConv?.otherUser;

    if (authLoading) return (
        <Box style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader color="violet" size="lg" />
        </Box>
    );

    return (
        <AppShell padding={0}>
            <Box className={classes.layout}>

                {/* Sidebar */}
                <Box className={classes.sidebar}>
                    <NavbarSearch
                        onlineUsers={onlineUsers}
                        conversations={conversations}
                        activeConv={activeConv?._id}
                        onConvSelect={(conv) => setActiveConv(conv)}
                    />
                </Box>

                {/* Chat Area */}
                <Box className={classes.chatArea}>

                    {!activeConv ? (
                        // Empty state
                        <Box style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
                            <ThemeIcon size={72} radius="xl" variant="light" color="violet">
                                <IconMessage2 size={36} />
                            </ThemeIcon>
                            <Text fw={700} size="lg">Select a conversation</Text>
                            <Text size="sm" c="dimmed">Choose a contact from the sidebar to start chatting</Text>
                        </Box>
                    ) : (
                        <>
                            {/* Header */}
                            <Box className={classes.chatHeader}>
                                <Group justify="space-between" w="100%">
                                    <Group gap="sm">
                                        <Indicator color={onlineUsers.includes(otherUser?._id) || otherUser?.isOnline ? "green" : "gray"} size={10} offset={2} position="bottom-end">
                                            <Avatar radius="xl" color="violet" size="md" src={otherUser?.avatar}>
                                                {(otherUser?.displayName || otherUser?.username || "?")[0].toUpperCase()}
                                            </Avatar>
                                        </Indicator>
                                        <Box>
                                            <Group gap={6}>
                                                <Text fw={700} size="sm">{otherUser?.displayName || otherUser?.username}</Text>
                                                {isConnected ? (
                                                    <Group gap={4}><IconWifi size={11} color="var(--mantine-color-green-6)" /><Text size="xs" c="green" fw={500}>Connected</Text></Group>
                                                ) : (
                                                    <Group gap={4}><IconWifiOff size={11} color="var(--mantine-color-red-6)" /><Text size="xs" c="red" fw={500}>Disconnected</Text></Group>
                                                )}
                                            </Group>
                                            <Text size="xs" c="dimmed">{otherUser?.username}</Text>
                                        </Box>
                                    </Group>
                                    <Group gap="xs">
                                        <Tooltip label="Voice call" withArrow><ActionIcon variant="subtle" color="gray" radius="xl" size="lg"><IconPhone size={18} stroke={1.5} /></ActionIcon></Tooltip>
                                        <Tooltip label="Video call" withArrow><ActionIcon variant="subtle" color="gray" radius="xl" size="lg"><IconVideo size={18} stroke={1.5} /></ActionIcon></Tooltip>
                                        <Tooltip label="Search messages" withArrow><ActionIcon variant="subtle" color="gray" radius="xl" size="lg"><IconSearch size={18} stroke={1.5} /></ActionIcon></Tooltip>
                                    </Group>
                                </Group>
                            </Box>

                            <Divider />

                            {/* Messages */}
                            <ScrollArea className={classes.messages} viewportRef={viewport}>
                                <Stack gap="md" p="lg">
                                    {msgLoading && <Box ta="center"><Loader color="violet" size="sm" /></Box>}

                                    {!msgLoading && messages.length === 0 && (
                                        <Box ta="center" py="xl">
                                            <ThemeIcon size={56} radius="xl" variant="light" color="violet" mx="auto" mb="md">
                                                <IconMessage2 size={28} />
                                            </ThemeIcon>
                                            <Text fw={600} size="sm">Start the conversation!</Text>
                                            <Text size="xs" c="dimmed" mt={4}>Say hello to {otherUser?.displayName || otherUser?.username}</Text>
                                        </Box>
                                    )}

                                    {messages.map((msg) => {
                                        const isOwn = msg.own || msg.sender?._id === user?._id || msg.sender === user?._id;
                                        const senderName = msg.sender?.displayName || msg.sender?.username || msg.author || otherUser?.displayName || otherUser?.username || "Unknown";
                                        const msgDate = msg.createdAt ? new Date(msg.createdAt) : null;
                                        const timeStr = msgDate && !isNaN(msgDate) ? msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : (msg.time || "");
                                        return (
                                            <Group key={msg._id} align="flex-start" justify={isOwn ? "flex-end" : "flex-start"} gap="sm">
                                                {!isOwn && (
                                                    <Avatar radius="xl" color="blue" size="md" src={msg.sender?.avatar}>
                                                        {senderName[0]?.toUpperCase()}
                                                    </Avatar>
                                                )}
                                                <Box style={{ maxWidth: "62%" }}>
                                                    {!isOwn && (
                                                        <Group gap={6} mb={4}>
                                                            <Text size="xs" fw={700}>{senderName}</Text>
                                                            <Text size="xs" c="dimmed">{timeStr}</Text>
                                                        </Group>
                                                    )}

                                                    {editingId === msg._id ? (
                                                        <Group gap="xs">
                                                            <TextInput
                                                                value={editText}
                                                                onChange={(e) => setEditText(e.currentTarget.value)}
                                                                onKeyDown={(e) => e.key === "Enter" && handleEdit(msg._id)}
                                                                size="sm" radius="xl" autoFocus
                                                                style={{ flex: 1 }}
                                                            />
                                                            <ActionIcon color="green" variant="filled" radius="xl" onClick={() => handleEdit(msg._id)}><IconCheck size={14} /></ActionIcon>
                                                            <ActionIcon color="red" variant="light" radius="xl" onClick={() => setEditingId(null)}><IconTrash size={14} /></ActionIcon>
                                                        </Group>
                                                    ) : (
                                                        <Menu shadow="md" position={isOwn ? "left" : "right"} withArrow>
                                                            <Menu.Target>
                                                                <Paper
                                                                    px="md" py="sm" radius="xl"
                                                                    className={isOwn ? classes.bubbleOwn : classes.bubbleOther}
                                                                    style={{ cursor: "pointer", opacity: msg.isDeleted ? 0.5 : 1 }}
                                                                >
                                                                    <Text size="sm" style={{ lineHeight: 1.6, wordBreak: "break-word", fontStyle: msg.isDeleted ? "italic" : "normal" }}>
                                                                        {msg.isDeleted ? "🗑 Message deleted" : msg.text}
                                                                    </Text>
                                                                    {(msg.isEdited || msg.editHistory?.length > 0) && !msg.isDeleted && <Text size="xs" c="dimmed">(edited)</Text>}
                                                                </Paper>
                                                            </Menu.Target>
                                                            {isOwn && !msg.isDeleted && (
                                                                <Menu.Dropdown style={{ background: "#1E293B", borderColor: "#334155" }}>
                                                                    <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => { setEditingId(msg._id); setEditText(msg.text); }}>Edit</Menu.Item>
                                                                    <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(msg._id)}>Delete</Menu.Item>
                                                                </Menu.Dropdown>
                                                            )}
                                                        </Menu>
                                                    )}

                                                    {isOwn && (
                                                        <Text size="xs" c="dimmed" ta="right" mt={4}>
                                                            {timeStr}
                                                        </Text>
                                                    )}
                                                </Box>
                                                {isOwn && (
                                                    <Avatar radius="xl" color="violet" size="md" src={user?.avatar}>
                                                        {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
                                                    </Avatar>
                                                )}
                                            </Group>
                                        );
                                    })}

                                    {typingText && (
                                        <Group gap={6} align="center" pl={4}>
                                            <Loader size={14} color="violet" type="dots" />
                                            <Text size="xs" c="dimmed" fs="italic">{typingText}</Text>
                                        </Group>
                                    )}
                                </Stack>
                            </ScrollArea>

                            <Divider />

                            {/* Input bar */}
                            <Box className={classes.inputBar}>
                                <Group gap="xs" align="center" style={{ width: "100%" }}>
                                    <Tooltip label="Attach file" withArrow>
                                        <ActionIcon variant="subtle" color="gray" radius="xl" size="lg"><IconPaperclip size={18} stroke={1.5} /></ActionIcon>
                                    </Tooltip>
                                    <TextInput
                                        placeholder={`Message ${otherUser?.displayName || otherUser?.username || ""}…`}
                                        className={classes.input}
                                        radius="xl" size="md"
                                        value={input}
                                        onChange={(e) => { setInput(e.currentTarget.value); emitTyping(); }}
                                        onKeyDown={handleKeyDown}
                                        rightSection={
                                            <Tooltip label="Emoji" withArrow>
                                                <ActionIcon variant="subtle" color="gray" radius="xl"><IconMoodSmile size={18} stroke={1.5} /></ActionIcon>
                                            </Tooltip>
                                        }
                                    />
                                    {input.trim() ? (
                                        <Tooltip label="Send (Enter)" withArrow>
                                            <ActionIcon size="lg" radius="xl" variant="filled" color="violet" onClick={handleSend}>
                                                <IconSend size={17} stroke={1.5} />
                                            </ActionIcon>
                                        </Tooltip>
                                    ) : (
                                        <ActionIcon size="lg" radius="xl" variant="light" color="violet">
                                            <IconMicrophone size={17} stroke={1.5} />
                                        </ActionIcon>
                                    )}
                                </Group>
                            </Box>
                        </>
                    )}
                </Box>
            </Box>
        </AppShell>
    );
}
