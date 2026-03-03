"use client";

import { useState, useEffect, useCallback } from "react";
import {
    AppShell, Box, Button, Card, Group, Stack, Text, Center,
    ThemeIcon, Loader, Badge, ActionIcon, Tooltip,
} from "@mantine/core";
import {
    IconBell, IconBellOff, IconCheck, IconUsers, IconMessage2,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";
import { NavbarSearch } from "@/app/components/NavbarSearch/NavbarSearch";
import classes from "../chat/chat.module.css";

const TYPE_ICON = {
    friend_request: IconUsers,
    friend_accept: IconCheck,
    message: IconMessage2,
    system: IconBell,
};
const TYPE_COLOR = {
    friend_request: "violet",
    friend_accept: "green",
    message: "blue",
    system: "gray",
};

export default function NotificationsPage() {
    const router = useRouter();
    const { user, loading: authLoading, getToken } = useAuth();

    const [notifs, setNotifs] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Stable empty array — prevents NavbarSearch getting a new [] on every re-render
    const emptyConversations = useState([])[0];

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth/login");
    }, [user, authLoading, router]);

    const loadNotifs = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        setLoading(true);
        const res = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.notifications) setNotifs(data.notifications);
        if (data.unreadCount != null) setUnreadCount(data.unreadCount);
        setLoading(false);
    }, [getToken]);

    useEffect(() => { loadNotifs(); }, [loadNotifs]);

    const markRead = async (id) => {
        const token = getToken();
        if (!token) return;
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id }),
        });
        setNotifs((p) => p.map((n) => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
    };

    const markAllRead = async () => {
        const token = getToken();
        if (!token) return;
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ markAll: true }),
        });
        setNotifs((p) => p.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    if (authLoading) return <Center h="100vh"><Loader color="violet" size="lg" /></Center>;

    return (
        <AppShell padding={0}>
            <Box className={classes.layout}>
                <Box className={classes.sidebar}>
                    <NavbarSearch conversations={emptyConversations} />
                </Box>

                <Box className={classes.chatArea} style={{ display: "block", padding: "24px 32px", overflowY: "auto" }}>
                    <Group justify="space-between" mb="xl">
                        <Group gap="sm">
                            <ThemeIcon size={40} radius="xl" variant="light" color="violet">
                                <IconBell size={22} />
                            </ThemeIcon>
                            <Box>
                                <Text fw={800} size="xl">Notifications</Text>
                                {unreadCount > 0 && (
                                    <Text size="sm" c="dimmed">{unreadCount} unread</Text>
                                )}
                            </Box>
                        </Group>
                        {unreadCount > 0 && (
                            <Button size="xs" variant="light" color="violet" radius="xl"
                                leftSection={<IconCheck size={14} />} onClick={markAllRead}>
                                Mark all read
                            </Button>
                        )}
                    </Group>

                    {loading && <Center py="xl"><Loader color="violet" /></Center>}

                    {!loading && notifs.length === 0 && (
                        <Center py="xl" style={{ flexDirection: "column", gap: 16 }}>
                            <ThemeIcon size={72} radius="xl" variant="light" color="gray"><IconBellOff size={36} /></ThemeIcon>
                            <Text fw={600}>All caught up!</Text>
                            <Text size="sm" c="dimmed">No notifications yet.</Text>
                        </Center>
                    )}

                    <Stack gap="xs">
                        {notifs.map((n) => {
                            const Icon = TYPE_ICON[n.type] || IconBell;
                            const color = TYPE_COLOR[n.type] || "gray";
                            return (
                                <Card
                                    key={n._id}
                                    withBorder
                                    style={{
                                        background: n.isRead ? "#1E293B" : "rgba(124,58,237,0.08)",
                                        borderColor: n.isRead ? "#334155" : "rgba(124,58,237,0.4)",
                                        cursor: "pointer",
                                    }}
                                    p="md"
                                    onClick={() => { if (!n.isRead) markRead(n._id); if (n.link) router.push(n.link); }}
                                >
                                    <Group gap="sm" justify="space-between">
                                        <Group gap="sm">
                                            <ThemeIcon size={36} radius="xl" variant="light" color={color}>
                                                <Icon size={18} />
                                            </ThemeIcon>
                                            <Box>
                                                <Text size="sm" fw={n.isRead ? 400 : 700}>{n.text}</Text>
                                                <Text size="xs" c="dimmed">
                                                    {new Date(n.createdAt).toLocaleString([], {
                                                        month: "short", day: "numeric",
                                                        hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </Text>
                                            </Box>
                                        </Group>
                                        {!n.isRead && <Badge size="xs" color="violet" variant="filled" circle />}
                                    </Group>
                                </Card>
                            );
                        })}
                    </Stack>
                </Box>
            </Box>
        </AppShell>
    );
}
