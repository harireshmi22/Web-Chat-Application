"use client";
import {
    Box, Button, Card, Center, Group, PasswordInput, Stack,
    Text, TextInput, Title, Anchor, Divider, rem,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconMessage2, IconArrowRight } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useAuth from "@/app/hooks/useAuth";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const form = useForm({
        initialValues: { email: "", password: "" },
        validate: {
            email: (v) => (/\S+@\S+\.\S+/.test(v) ? null : "Invalid email"),
            password: (v) => (v.length < 6 ? "At least 6 characters" : null),
        },
    });

    async function handleSubmit(values) {
        setLoading(true);
        setError("");
        const result = await login(values.email, values.password);
        if (result.success) {
            router.push("/chat");
        } else {
            setError(result.error || "Login failed");
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
                <Stack w="100%" maw={440} gap="xl">
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
                            <Text size="sm" c="dimmed">Welcome back — sign in to continue</Text>
                        </Stack>
                    </Center>

                    {/* Card */}
                    <Card
                        padding="xl" withBorder
                        style={{ background: "#1E293B", borderColor: "#334155", borderRadius: rem(20) }}
                    >
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Stack gap="md">
                                <TextInput
                                    label="Email"
                                    placeholder="you@example.com"
                                    size="md"
                                    {...form.getInputProps("email")}
                                    styles={{ input: { background: "#0F172A", borderColor: "#334155", color: "#F1F5F9" } }}
                                />
                                <PasswordInput
                                    label="Password"
                                    placeholder="Your password"
                                    size="md"
                                    {...form.getInputProps("password")}
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
                                    Sign In
                                </Button>

                                <Divider label="Don't have an account?" labelPosition="center" color="dark.4" />

                                <Button
                                    variant="light" color="violet" fullWidth size="md"
                                    onClick={() => router.push("/auth/register")}
                                >
                                    Create an account
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
