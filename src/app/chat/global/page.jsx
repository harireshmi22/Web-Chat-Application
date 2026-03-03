"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    AppShell, Box, Stack, ScrollArea, Text, Group, Avatar,
    TextInput, ActionIcon, Tooltip, Paper, Divider,
    Badge, Loader, ThemeIcon,
} from "@mantine/core";
import {
    IconSend, IconMoodSmile, IconWorld, IconWifi, IconWifiOff,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { NavbarSearch } from "../../components/NavbarSearch/NavbarSearch";
import { useSocket } from "../../hooks/useSocket";
import useAuth from "../../hooks/useAuth";
import classes from "../chat.module.css";

const GLOBAL_ROOM = "global_chat";

export default function GlobalChatPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [input, setInput] = useState("");
    const viewport = useRef(null);

    // Stable empty array so NavbarSearch never gets a new [] reference
    const emptyConversations = useState([])[0];

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth/login");
    }, [user, authLoading, router]);

    const { isConnected, messages, typingUsers, onlineUsers, sendMessage, emitTyping } =
        useSocket(GLOBAL_ROOM, user?.username);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const handleSend = useCallback(() => {
        if (!input.trim()) return;
        sendMessage(input.trim());
        setInput("");
    }, [input, sendMessage]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const typingText =
        typingUsers.length === 1 ? `${typingUsers[0]} is typing…` :
            typingUsers.length > 1 ? `${typingUsers.join(", ")} are typing…` : null;

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
                        conversations={emptyConversations}
                    />
                </Box>

                {/* Chat area */}
                <Box className={classes.chatArea}>

                    {/* Header */}
                    <Box className={classes.chatHeader}>
                        <Group justify="space-between" w="100%">
                            <Group gap="sm">
                                <ThemeIcon size={42} radius="xl" variant="light" color="violet">
                                    <IconWorld size={22} />
                                </ThemeIcon>
                                <Box>
                                    <Group gap={6}>
                                        <Text fw={700} size="sm">Global Chat</Text>
                                        {isConnected ? (
                                            <Group gap={4}>
                                                <IconWifi size={11} color="var(--mantine-color-green-6)" />
                                                <Text size="xs" c="green" fw={500}>Connected</Text>
                                            </Group>
                                        ) : (
                                            <Group gap={4}>
                                                <IconWifiOff size={11} color="var(--mantine-color-red-6)" />
                                                <Text size="xs" c="red" fw={500}>Disconnected</Text>
                                            </Group>
                                        )}
                                    </Group>
                                    <Text size="xs" c="dimmed">Public room — everyone can see messages</Text>
                                </Box>
                            </Group>
                            <Badge variant="light" color="violet" size="sm">
                                {onlineUsers.length} online
                            </Badge>
                        </Group>
                    </Box>

                    <Divider />

                    {/* Messages */}
                    <ScrollArea className={classes.messages} viewportRef={viewport}>
                        <Stack gap="sm" p="lg">
                            {messages.length === 0 && !typingText && (
                                <Box ta="center" py="xl">
                                    <ThemeIcon size={56} radius="xl" variant="light" color="violet" mx="auto" mb="md">
                                        <IconWorld size={28} />
                                    </ThemeIcon>
                                    <Text fw={600} size="sm">Welcome to Global Chat!</Text>
                                    <Text size="xs" c="dimmed" mt={4}>Say hello — everyone can see your messages</Text>
                                </Box>
                            )}

                            {messages.map((msg, i) => {
                                // System messages (user joined/left)
                                if (msg.type === "system") {
                                    return (
                                        <Text key={msg.id ?? i} size="xs" c="dimmed" ta="center" fs="italic">
                                            {msg.text}
                                        </Text>
                                    );
                                }

                                const isOwn = msg.own || msg.author === user?.username;
                                const senderName = msg.author || "Unknown";
                                const initials = senderName[0]?.toUpperCase();

                                return (
                                    <Group
                                        key={msg.id ?? i}
                                        align="flex-start"
                                        justify={isOwn ? "flex-end" : "flex-start"}
                                        gap="sm"
                                    >
                                        {!isOwn && (
                                            <Avatar radius="xl" color="blue" size="md">
                                                {initials}
                                            </Avatar>
                                        )}
                                        <Box style={{ maxWidth: "62%" }}>
                                            {!isOwn && (
                                                <Group gap={6} mb={4}>
                                                    <Text size="xs" fw={700}>{senderName}</Text>
                                                    <Text size="xs" c="dimmed">
                                                        {msg.time || (msg.timestamp
                                                            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                                            : "")}
                                                    </Text>
                                                </Group>
                                            )}
                                            <Paper
                                                px="md" py="sm" radius="xl"
                                                className={isOwn ? classes.bubbleOwn : classes.bubbleOther}
                                            >
                                                <Text size="sm" style={{ lineHeight: 1.6, wordBreak: "break-word" }}>
                                                    {msg.text}
                                                </Text>
                                            </Paper>
                                            {isOwn && (
                                                <Text size="xs" c="dimmed" ta="right" mt={4}>
                                                    {msg.time || ""}
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
                            <TextInput
                                placeholder="Send a message to everyone…"
                                className={classes.input}
                                radius="xl" size="md"
                                value={input}
                                onChange={(e) => { setInput(e.currentTarget.value); emitTyping(); }}
                                onKeyDown={handleKeyDown}
                                rightSection={
                                    <Tooltip label="Emoji" withArrow>
                                        <ActionIcon variant="subtle" color="gray" radius="xl">
                                            <IconMoodSmile size={18} stroke={1.5} />
                                        </ActionIcon>
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
                                <ActionIcon size="lg" radius="xl" variant="light" color="violet" disabled>
                                    <IconSend size={17} stroke={1.5} />
                                </ActionIcon>
                            )}
                        </Group>
                    </Box>
                </Box>
            </Box>
        </AppShell>
    );
}
