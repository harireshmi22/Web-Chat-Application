"use client";

import { useState, useEffect } from "react";
import {
    AppShell, Box, Button, Card, Center, Divider, Group, Loader,
    PasswordInput, Stack, Text, TextInput, Textarea, ThemeIcon,
    Avatar, Badge, Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
    IconSettings, IconUser, IconLock, IconLogout, IconCamera,
    IconMoon, IconSun,
} from "@tabler/icons-react";
import { useMantineColorScheme } from "@mantine/core";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import useAuth from "@/app/hooks/useAuth";
import { NavbarSearch } from "@/app/components/NavbarSearch/NavbarSearch";
import classes from "../chat/chat.module.css";

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading, getToken, refreshUser, logout } = useAuth();
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();

    const [saving, setSaving] = useState(false);

    // Stable empty array — prevents NavbarSearch getting a new [] on every re-render
    const emptyConversations = useState([])[0];

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth/login");
    }, [user, authLoading, router]);

    const profileForm = useForm({
        initialValues: {
            displayName: user?.displayName || "",
            bio: user?.bio || "",
        },
    });

    const pwForm = useForm({
        initialValues: { currentPassword: "", newPassword: "", confirm: "" },
        validate: {
            newPassword: (v) => (v && v.length < 6 ? "At least 6 characters" : null),
            confirm: (v, vals) => (v !== vals.newPassword ? "Passwords do not match" : null),
        },
    });

    // Sync form when user loads or profile fields change
    useEffect(() => {
        if (user) {
            profileForm.setValues({ displayName: user.displayName || "", bio: user.bio || "" });
        }
        // profileForm reference changes every render; depend only on the actual data
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.displayName, user?.bio]);

    const saveProfile = async (values) => {
        const token = getToken();
        if (!token) return;
        setSaving(true);
        const res = await fetch("/api/auth/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(values),
        });
        const data = await res.json();
        if (data.user) {
            await refreshUser();
            notifications.show({ title: "Saved", message: "Profile updated!", color: "green" });
        } else {
            notifications.show({ title: "Error", message: data.error || "Update failed", color: "red" });
        }
        setSaving(false);
    };

    const changePassword = async (values) => {
        const token = getToken();
        if (!token || !values.newPassword) return;
        setSaving(true);
        const res = await fetch("/api/auth/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ password: values.newPassword }),
        });
        const data = await res.json();
        if (data.user) {
            pwForm.reset();
            notifications.show({ title: "Password changed", message: "Your password has been updated.", color: "green" });
        } else {
            notifications.show({ title: "Error", message: data.error || "Update failed", color: "red" });
        }
        setSaving(false);
    };

    if (authLoading) return <Center h="100vh"><Loader color="violet" size="lg" /></Center>;

    return (
        <AppShell padding={0}>
            <Box className={classes.layout}>
                <Box className={classes.sidebar}>
                    <NavbarSearch conversations={emptyConversations} />
                </Box>

                <Box className={classes.chatArea} style={{ display: "block", padding: "24px 32px", overflowY: "auto" }}>
                    <Group gap="sm" mb="xl">
                        <ThemeIcon size={40} radius="xl" variant="light" color="violet">
                            <IconSettings size={22} />
                        </ThemeIcon>
                        <Box>
                            <Text fw={800} size="xl">Settings</Text>
                            <Text size="sm" c="dimmed">Manage your account</Text>
                        </Box>
                    </Group>

                    {/* Profile card */}
                    <Card withBorder style={{ background: "#1E293B", borderColor: "#334155" }} mb="lg" p="xl">
                        <Group gap="lg" mb="lg">
                            <Box style={{ position: "relative" }}>
                                <Avatar radius="xl" size={72} color="violet" src={user?.avatar}>
                                    {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
                                </Avatar>
                                <Button
                                    size="xs" radius="xl" variant="filled" color="violet"
                                    style={{ position: "absolute", bottom: -4, right: -4, minWidth: 0, padding: "2px 6px" }}
                                >
                                    <IconCamera size={12} />
                                </Button>
                            </Box>
                            <Box>
                                <Text fw={700} size="lg">{user?.displayName || user?.username}</Text>
                                <Text size="sm" c="dimmed">@{user?.username}</Text>
                                <Text size="sm" c="dimmed">{user?.email}</Text>
                            </Box>
                        </Group>

                        <form onSubmit={profileForm.onSubmit(saveProfile)}>
                            <Stack gap="md">
                                <TextInput
                                    label="Display Name"
                                    placeholder="Your display name"
                                    {...profileForm.getInputProps("displayName")}
                                    styles={{ input: { background: "#0F172A", borderColor: "#334155" } }}
                                />
                                <Textarea
                                    label="Bio"
                                    placeholder="A short bio…"
                                    rows={3}
                                    {...profileForm.getInputProps("bio")}
                                    styles={{ input: { background: "#0F172A", borderColor: "#334155" } }}
                                />
                                <Button
                                    type="submit" variant="light" color="violet" radius="xl"
                                    loading={saving} leftSection={<IconUser size={16} />}
                                >
                                    Save Profile
                                </Button>
                            </Stack>
                        </form>
                    </Card>

                    {/* Appearance */}
                    <Card withBorder style={{ background: "#1E293B", borderColor: "#334155" }} mb="lg" p="xl">
                        <Text fw={700} mb="md">Appearance</Text>
                        <Group justify="space-between">
                            <Group gap="sm">
                                {colorScheme === "dark" ? <IconMoon size={20} /> : <IconSun size={20} />}
                                <Box>
                                    <Text size="sm" fw={600}>{colorScheme === "dark" ? "Dark Mode" : "Light Mode"}</Text>
                                    <Text size="xs" c="dimmed">Switch between dark and light themes</Text>
                                </Box>
                            </Group>
                            <Switch
                                checked={colorScheme === "dark"}
                                onChange={() => toggleColorScheme()}
                                color="violet"
                                size="md"
                            />
                        </Group>
                    </Card>

                    {/* Change password */}
                    <Card withBorder style={{ background: "#1E293B", borderColor: "#334155" }} mb="lg" p="xl">
                        <Text fw={700} mb="md">Change Password</Text>
                        <form onSubmit={pwForm.onSubmit(changePassword)}>
                            <Stack gap="md">
                                <PasswordInput
                                    label="New Password"
                                    placeholder="Min 6 characters"
                                    {...pwForm.getInputProps("newPassword")}
                                    styles={{ input: { background: "#0F172A", borderColor: "#334155" } }}
                                />
                                <PasswordInput
                                    label="Confirm Password"
                                    placeholder="Repeat new password"
                                    {...pwForm.getInputProps("confirm")}
                                    styles={{ input: { background: "#0F172A", borderColor: "#334155" } }}
                                />
                                <Button
                                    type="submit" variant="light" color="indigo" radius="xl"
                                    loading={saving} leftSection={<IconLock size={16} />}
                                >
                                    Change Password
                                </Button>
                            </Stack>
                        </form>
                    </Card>

                    {/* Danger zone */}
                    <Card withBorder style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.3)" }} p="xl">
                        <Text fw={700} c="red.4" mb="sm">Danger Zone</Text>
                        <Button
                            color="red" variant="light" radius="xl"
                            leftSection={<IconLogout size={16} />}
                            onClick={logout}
                        >
                            Log Out
                        </Button>
                    </Card>
                </Box>
            </Box>
        </AppShell>
    );
}
