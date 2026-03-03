"use client";
import {
  Box, Button, Container, Group, Text, Title, Stack, Badge,
  SimpleGrid, Card, ThemeIcon, Anchor, rem, Center,
} from "@mantine/core";
import {
  IconMessage2, IconShield, IconBolt, IconUsers, IconBrandGithub,
  IconArrowRight, IconCheck, IconMoon, IconSun,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMantineColorScheme } from "@mantine/core";

/** Feature card data displayed on the landing page */
const FEATURES = [
  {
    icon: IconBolt,
    color: "violet",
    title: "Real-Time Messaging",
    desc: "Instant message delivery with Socket.io WebSockets. Zero latency, always in sync.",
  },
  {
    icon: IconUsers,
    color: "indigo",
    title: "Friend System",
    desc: "Send and accept friend requests, manage contacts, and start DMs with one click.",
  },
  {
    icon: IconShield,
    color: "blue",
    title: "Secure Auth",
    desc: "JWT-based authentication with bcrypt password hashing and MongoDB persistence.",
  },
  {
    icon: IconMessage2,
    color: "cyan",
    title: "Full Chat Features",
    desc: "Edit, delete messages, see typing indicators, online presence, and read receipts.",
  },
];

/** Home / Landing page component */
export default function HomePage() {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Box style={{ minHeight: "100vh", background: colorScheme === "dark" ? "#0F172A" : "#F8FAFC" }}>

      {/* ── Nav bar ── */}
      <Box
        style={{
          position: "sticky", top: 0, zIndex: 100,
          borderBottom: colorScheme === "dark" ? "1px solid #1E293B" : "1px solid #E2E8F0",
          background: colorScheme === "dark" ? "rgba(15,23,42,0.85)" : "rgba(248,250,252,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Container size="xl" h={64}>
          <Group h={64} justify="space-between">
            {/* Logo */}
            <Group gap={8}>
              <Box
                w={34} h={34} style={{
                  background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
                  borderRadius: 10, display: "flex", alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconMessage2 size={18} color="#fff" stroke={2} />
              </Box>
              <Text fw={800} size="lg" style={{
                background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Cognitive Chat Lab
              </Text>
            </Group>

            <Group gap="xs">
              <Button
                variant="subtle" color="gray" radius="xl" size="xs"
                leftSection={colorScheme === "dark" ? <IconSun size={14} /> : <IconMoon size={14} />}
                onClick={() => toggleColorScheme()}
              >
                {colorScheme === "dark" ? "Light" : "Dark"}
              </Button>
              <Button variant="subtle" color="violet" radius="xl" onClick={() => router.push("/auth/login")}>
                Sign In
              </Button>
              <Button
                radius="xl"
                style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)" }}
                onClick={() => router.push("/auth/register")}
              >
                Get Started
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* ── Hero ── */}
      <Container size="xl" pt={80} pb={60}>
        <Center>
          <Stack align="center" gap="xl" maw={680} ta="center">
            <Badge
              size="lg" radius="xl" variant="light" color="violet"
              leftSection={<IconBolt size={14} />}
            >
              Now with real-time WebSocket support
            </Badge>

            <Title
              order={1}
              style={{ fontSize: rem(54), fontWeight: 900, lineHeight: 1.1 }}
            >
              Chat{" "}
              <span style={{
                background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                smarter
              </span>
              {", "}collaborate{" "}
              <span style={{
                background: "linear-gradient(135deg,#06B6D4,#4F46E5)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                faster
              </span>
            </Title>

            <Text size="xl" c="dimmed" maw={500}>
              Cognitive Chat Lab is a full-stack real-time chat application built
              with Next.js, Socket.io, and MongoDB. WhatsApp meets Discord.
            </Text>

            <Group gap="md">
              <Button
                size="lg" radius="xl" rightSection={<IconArrowRight size={18} />}
                style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", boxShadow: "0 0 24px rgba(124,58,237,0.4)" }}
                onClick={() => router.push("/auth/register")}
              >
                Start chatting — it's free
              </Button>
              <Button
                size="lg" radius="xl" variant="light" color="violet"
                onClick={() => router.push("/auth/login")}
              >
                Sign in
              </Button>
            </Group>

            {/* Trust badges */}
            <Group gap="xl" c="dimmed">
              {["End-to-end JWT auth", "MongoDB persistence", "Real-time typing"].map((t) => (
                <Group key={t} gap={6}>
                  <IconCheck size={14} color="#7C3AED" />
                  <Text size="sm">{t}</Text>
                </Group>
              ))}
            </Group>
          </Stack>
        </Center>
      </Container>

      {/* ── Features ── */}
      <Container size="xl" pb={80}>
        <Center mb={48}>
          <Stack align="center" gap="xs" ta="center">
            <Title order={2} fw={800}>Everything you need to connect</Title>
            <Text c="dimmed" maw={440}>
              Built from the ground up with a focus on speed, security, and great UX.
            </Text>
          </Stack>
        </Center>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              padding="xl"
              withBorder
              style={{
                background: colorScheme === "dark" ? "#1E293B" : "#fff",
                borderColor: colorScheme === "dark" ? "#334155" : "#E2E8F0",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              styles={{ root: { "&:hover": { transform: "translateY(-4px)" } } }}
            >
              <ThemeIcon size={48} radius="xl" variant="light" color={f.color} mb="md">
                <f.icon size={24} />
              </ThemeIcon>
              <Text fw={700} size="md" mb={6}>{f.title}</Text>
              <Text size="sm" c="dimmed">{f.desc}</Text>
            </Card>
          ))}
        </SimpleGrid>
      </Container>

      {/* ── CTA Banner ── */}
      <Container size="xl" pb={80}>
        <Box
          p="xl"
          style={{
            background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
            borderRadius: rem(24), textAlign: "center",
            boxShadow: "0 0 40px rgba(124,58,237,0.3)",
          }}
        >
          <Title order={3} c="white" mb="sm">Ready to dive in?</Title>
          <Text c="rgba(255,255,255,0.8)" mb="lg">
            Create your free account in seconds and start messaging.
          </Text>
          <Button
            size="lg" radius="xl" color="white" variant="white" c="violet"
            rightSection={<IconArrowRight size={18} />}
            onClick={() => router.push("/auth/register")}
          >
            Create free account
          </Button>
        </Box>
      </Container>

      {/* ── Footer ── */}
      <Box style={{ borderTop: colorScheme === "dark" ? "1px solid #1E293B" : "1px solid #E2E8F0" }} py="xl">
        <Container size="xl">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">© 2026 Cognitive Chat Lab</Text>
            <Group gap="xs">
              <Anchor href="https://github.com" size="sm" c="dimmed" target="_blank">
                <Group gap={4}><IconBrandGithub size={16} /> GitHub</Group>
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}

