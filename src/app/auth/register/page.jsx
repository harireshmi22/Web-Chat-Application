"use client";
import {
    Box, Button, Card, Center, Divider, Group,
    PasswordInput, Stack, Text, TextInput, Title, Anchor, rem,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconMessage2, IconArrowRight } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useAuth from "@/app/hooks/useAuth";

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const form = useForm({
        initialValues: { username: "", displayName: "", email: "", password: "", confirm: "" },
        validate: {
            username: (v) =>
                v.length < 3
                    ? "At least 3 characters"
                    : /^[a-zA-Z0-9_]+$/.test(v)
                        ? null
                        : "Letters, numbers and _ only",
            displayName: (v) => (v.trim().length < 2 ? "At least 2 characters" : null),
            email: (v) => (/\S+@\S+\.\S+/.test(v) ? null : "Invalid email"),
            password: (v) => (v.length < 6 ? "At least 6 characters" : null),
            confirm: (v, values) => (v !== values.password ? "Passwords do not match" : null),
        },
    });

    async function handleSubmit(values) {
        setLoading(true);
        setError("");
        const result = await register({
            username: values.username,
            displayName: values.displayName,
            email: values.email,
            password: values.password,
        });
        if (result.success) {
            router.push("/chat");
        } else {
            setError(result.error || "Registration failed");
        }
        setLoading(false);
    }

    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)",
                display: "flex", alignItems: "center",
            }}
        >
            <Center w="100%" px="md">
                <Stack w="100%" maw={480} gap="xl">
                    {/* Logo */}
                    <Center>
                        <Stack align="center" gap="xs">
                            <Box
                                w={52} h={52}
                                style={{
                                    background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
                                    borderRadius: rem(16), display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 0 24px rgba(124,58,237,0.5)",
                                }}
                            >
                                <IconMessage2 size={28} color="#fff" />
                            </Box>
                            <Title
                                order={2} fw={900}
                                style={{
                                    background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
                                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                }}
                            >
                                Cognitive Chat Lab
                            </Title>
                            <Text size="sm" c="dimmed">Create your free account</Text>
                        </Stack>
                    </Center>

                    {/* Card */}
                    <Card
                        padding="xl" withBorder
                        style={{ background: "#1E293B", borderColor: "#334155", borderRadius: rem(20) }}
                    >
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Stack gap="md">
                                <Group grow>
                                    <TextInput
                                        label="Username"
                                        placeholder="cooluser42"
                                        size="md"
                                        {...form.getInputProps("username")}
                                        styles={{ input: { background: "#0F172A", borderColor: "#334155", color: "#F1F5F9" } }}
                                    />
                                    <TextInput
                                        label="Display Name"
                                        placeholder="Cool User"
                                        size="md"
                                        {...form.getInputProps("displayName")}
                                        styles={{ input: { background: "#0F172A", borderColor: "#334155", color: "#F1F5F9" } }}
                                    />
                                </Group>

                                <TextInput
                                    label="Email"
                                    placeholder="you@example.com"
                                    size="md"
                                    {...form.getInputProps("email")}
                                    styles={{ input: { background: "#0F172A", borderColor: "#334155", color: "#F1F5F9" } }}
                                />

                                <PasswordInput
                                    label="Password"
                                    placeholder="Min 6 characters"
                                    size="md"
                                    {...form.getInputProps("password")}
                                    styles={{ input: { background: "#0F172A", borderColor: "#334155", color: "#F1F5F9" } }}
                                />

                                <PasswordInput
                                    label="Confirm Password"
                                    placeholder="Repeat password"
                                    size="md"
                                    {...form.getInputProps("confirm")}
                                    styles={{ input: { background: "#0F172A", borderColor: "#334155", color: "#F1F5F9" } }}
                                />

                                {error && (
                                    <Text size="sm" c="red.4" ta="center">{error}</Text>
                                )}

                                <Button
                                    type="submit"
                                    size="md"
                                    fullWidth
                                    loading={loading}
                                    rightSection={<IconArrowRight size={16} />}
                                    style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", marginTop: 8 }}
                                >
                                    Create Account
                                </Button>

                                <Divider label="Already have an account?" labelPosition="center" color="dark.4" />

                                <Button
                                    variant="light" color="violet" fullWidth size="md"
                                    onClick={() => router.push("/auth/login")}
                                >
                                    Sign in instead
                                </Button>
                            </Stack>
                        </form>
                    </Card>

                    <Center>
                        <Anchor size="sm" c="dimmed" onClick={() => router.push("/")}>
                            ← Back to home
                        </Anchor>
                    </Center>
                </Stack>
            </Center>
        </Box>
    );
}
