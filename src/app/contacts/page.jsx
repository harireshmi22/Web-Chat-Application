"use client";

import { useState, useEffect, useCallback } from "react";
import {
    AppShell, Box, Button, Card, Group, Stack, Text, TextInput,
    Avatar, Badge, Divider, Loader, Center, ThemeIcon, ActionIcon,
    Tabs, Tooltip,
} from "@mantine/core";
import {
    IconSearch, IconUserPlus, IconUserCheck, IconUserX,
    IconUsers, IconMessage2, IconCheck, IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";
import { NavbarSearch } from "@/app/components/NavbarSearch/NavbarSearch";
import classes from "../chat/chat.module.css";

export default function ContactsPage() {
    const router = useRouter();
    const { user, loading: authLoading, getToken } = useAuth();

    const [tab, setTab] = useState("contacts");
    const [contacts, setContacts] = useState([]);
    const [requests, setRequests] = useState({ received: [], sent: [] });
    const [searchQ, setSearchQ] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);

    // Stable empty array so NavbarSearch never gets a new [] reference on re-render
    const emptyConversations = useState([])[0];

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth/login");
    }, [user, authLoading, router]);

    const loadContacts = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        setLoading(true);
        const res = await fetch("/api/contacts", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.contacts) setContacts(data.contacts);
        if (data.friendRequests) setRequests({ received: data.friendRequests, sent: data.sentRequests || [] });
        setLoading(false);
    }, [getToken]);

    useEffect(() => { loadContacts(); }, [loadContacts]);

    const doSearch = useCallback(async () => {
        // Bail out without a state update when query is empty and results are already clear
        if (!searchQ.trim()) {
            setSearchResults((prev) => (prev.length === 0 ? prev : []));
            return;
        }
        const token = getToken();
        if (!token) return;
        setSearching(true);
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQ)}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSearchResults(data.users || []);
        setSearching(false);
    }, [searchQ, getToken]);

    useEffect(() => {
        const t = setTimeout(doSearch, 350);
        return () => clearTimeout(t);
    }, [doSearch]);

    const sendRequest = async (userId) => {
        const token = getToken();
        if (!token) return;
        await fetch("/api/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ targetId: userId }),
        });
        loadContacts();
        doSearch();
    };

    // Accept: POST with targetId (API auto-accepts mutual requests)
    // Decline: DELETE with body { targetId }
    const respondRequest = async (userId, accept) => {
        const token = getToken();
        if (!token) return;
        if (accept) {
            await fetch("/api/contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ targetId: userId }),
            });
            // Auto-create the DM conversation so both users can chat right away
            const convRes = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ participantId: userId }),
            });
            const convData = await convRes.json();
            // Navigate to chat and auto-select the new conversation
            const convId = convData.conversation?._id;
            router.push(convId ? `/chat?convId=${convId}` : "/chat");
        } else {
            await fetch("/api/contacts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ targetId: userId }),
            });
            loadContacts();
        }
    };

    const removeContact = async (userId) => {
        const token = getToken();
        if (!token) return;
        await fetch("/api/contacts", {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ targetId: userId }),
        });
        loadContacts();
    };

    const openDM = async (userId) => {
        const token = getToken();
        if (!token) return;
        await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ participantId: userId }),
        });
        router.push("/chat");
    };

    const pendingCount = requests.received.length;

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
                                <IconUsers size={22} />
                            </ThemeIcon>
                            <Box>
                                <Text fw={800} size="xl">Contacts</Text>
                                <Text size="sm" c="dimmed">{contacts.length} friends</Text>
                            </Box>
                        </Group>
                    </Group>

                    {/* Search users */}
                    <Card withBorder style={{ background: "#1E293B", borderColor: "#334155" }} mb="xl" p="lg">
                        <Text fw={700} mb="sm">Find People</Text>
                        <TextInput
                            placeholder="Search by username or display name…"
                            leftSection={<IconSearch size={16} />}
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.currentTarget.value)}
                            radius="xl" size="md" mb="md"
                            styles={{ input: { background: "#0F172A", borderColor: "#334155" } }}
                        />
                        {searching && <Center py="sm"><Loader size="sm" color="violet" /></Center>}
                        {searchResults.map((u) => {
                            const isContact = contacts.some((c) => c._id === u._id);
                            const sentReq = requests.sent?.some((s) => s._id === u._id);
                            return (
                                <Group key={u._id} justify="space-between" py="xs">
                                    <Group gap="sm">
                                        <Avatar radius="xl" color="violet" src={u.avatar}>{u.displayName?.[0] || u.username[0]}</Avatar>
                                        <Box>
                                            <Text size="sm" fw={600}>{u.displayName || u.username}</Text>
                                            <Text size="xs" c="dimmed">@{u.username}</Text>
                                        </Box>
                                    </Group>
                                    {isContact ? (
                                        <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>Friends</Badge>
                                    ) : sentReq ? (
                                        <Badge color="gray" variant="light">Request sent</Badge>
                                    ) : (
                                        <Button size="xs" radius="xl" color="violet" leftSection={<IconUserPlus size={14} />}
                                            onClick={() => sendRequest(u._id)}>Add</Button>
                                    )}
                                </Group>
                            );
                        })}
                    </Card>

                    <Tabs value={tab} onChange={setTab}>
                        <Tabs.List mb="lg">
                            <Tabs.Tab value="contacts" leftSection={<IconUsers size={16} />}>Friends</Tabs.Tab>
                            <Tabs.Tab value="requests" leftSection={<IconUserPlus size={16} />}
                                rightSection={pendingCount > 0 ? <Badge size="xs" color="violet" variant="filled" circle>{pendingCount}</Badge> : null}>
                                Requests
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="contacts">
                            {loading && <Center py="xl"><Loader color="violet" /></Center>}
                            {!loading && contacts.length === 0 && (
                                <Center py="xl" style={{ flexDirection: "column", gap: 12 }}>
                                    <ThemeIcon size={56} radius="xl" variant="light" color="violet"><IconUsers size={28} /></ThemeIcon>
                                    <Text c="dimmed" ta="center">No friends yet. Search above to find people!</Text>
                                </Center>
                            )}
                            <Stack gap="xs">
                                {contacts.map((c) => (
                                    <Card key={c._id} withBorder style={{ background: "#1E293B", borderColor: "#334155" }} p="md">
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                <Avatar radius="xl" color="violet" src={c.avatar}>{c.displayName?.[0] || c.username[0]}</Avatar>
                                                <Box>
                                                    <Text size="sm" fw={600}>{c.displayName || c.username}</Text>
                                                    <Text size="xs" c="dimmed">@{c.username}</Text>
                                                </Box>
                                            </Group>
                                            <Group gap="xs">
                                                <Tooltip label="Send message" withArrow>
                                                    <ActionIcon variant="light" color="violet" radius="xl" onClick={() => openDM(c._id)}>
                                                        <IconMessage2 size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Remove friend" withArrow>
                                                    <ActionIcon variant="light" color="red" radius="xl" onClick={() => removeContact(c._id)}>
                                                        <IconUserX size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Group>
                                    </Card>
                                ))}
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="requests">
                            {requests.received.length > 0 && (
                                <>
                                    <Text fw={700} mb="sm" size="sm">Received</Text>
                                    <Stack gap="xs" mb="lg">
                                        {requests.received.map((r) => (
                                            <Card key={r._id} withBorder style={{ background: "#1E293B", borderColor: "#334155" }} p="md">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <Avatar radius="xl" color="violet" src={r.avatar}>{r.displayName?.[0] || r.username[0]}</Avatar>
                                                        <Box>
                                                            <Text size="sm" fw={600}>{r.displayName || r.username}</Text>
                                                            <Text size="xs" c="dimmed">@{r.username}</Text>
                                                        </Box>
                                                    </Group>
                                                    <Group gap="xs">
                                                        <Button size="xs" color="green" radius="xl" leftSection={<IconCheck size={14} />}
                                                            onClick={() => respondRequest(r._id, true)}>Accept</Button>
                                                        <Button size="xs" color="red" variant="light" radius="xl" leftSection={<IconX size={14} />}
                                                            onClick={() => respondRequest(r._id, false)}>Decline</Button>
                                                    </Group>
                                                </Group>
                                            </Card>
                                        ))}
                                    </Stack>
                                </>
                            )}

                            {requests.sent?.length > 0 && (
                                <>
                                    <Text fw={700} mb="sm" size="sm" c="dimmed">Sent</Text>
                                    <Stack gap="xs">
                                        {requests.sent.map((r) => (
                                            <Card key={r._id} withBorder style={{ background: "#1E293B", borderColor: "#334155" }} p="md">
                                                <Group gap="sm">
                                                    <Avatar radius="xl" color="violet" src={r.avatar}>{r.displayName?.[0] || r.username[0]}</Avatar>
                                                    <Box>
                                                        <Text size="sm" fw={600}>{r.displayName || r.username}</Text>
                                                        <Badge size="xs" color="gray" variant="light">Pending</Badge>
                                                    </Box>
                                                </Group>
                                            </Card>
                                        ))}
                                    </Stack>
                                </>
                            )}

                            {requests.received.length === 0 && requests.sent?.length === 0 && (
                                <Center py="xl" style={{ flexDirection: "column", gap: 12 }}>
                                    <ThemeIcon size={56} radius="xl" variant="light" color="violet"><IconUserPlus size={28} /></ThemeIcon>
                                    <Text c="dimmed">No pending friend requests</Text>
                                </Center>
                            )}
                        </Tabs.Panel>
                    </Tabs>
                </Box>
            </Box>
        </AppShell>
    );
}
