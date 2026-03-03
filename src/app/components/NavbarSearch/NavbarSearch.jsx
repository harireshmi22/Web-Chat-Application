"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  IconMessageCircle, IconPlus, IconSearch, IconUsers,
  IconBell, IconSettings, IconMoon, IconSun, IconLogout, IconWorld,
} from "@tabler/icons-react";
import {
  ActionIcon, Badge, Box, Group, Text, TextInput,
  Tooltip, UnstyledButton, Avatar, Indicator, Divider,
  ScrollArea, Menu, rem, useMantineColorScheme,
} from "@mantine/core";
import useAuth from "@/app/hooks/useAuth";
import classes from "./NavbarSearch.module.css";

const NAV_LINKS = [
  { icon: IconMessageCircle, label: "Messages", href: "/chat" },
  { icon: IconWorld, label: "Global Chat", href: "/chat/global" },
  { icon: IconUsers, label: "Contacts", href: "/contacts" },
  { icon: IconBell, label: "Notifications", href: "/notifications" },
  { icon: IconSettings, label: "Settings", href: "/settings" },
];

export function NavbarSearch({ onlineUsers = [], conversations = [], activeConv, onConvSelect }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const [search, setSearch] = useState("");
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("ccl_token") : null;
    if (!token) return;
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => d.unreadCount != null && setNotifCount(d.unreadCount))
      .catch(() => { });
  }, [pathname]);

  const filtered = conversations.filter((c) => {
    const name = c.otherUser?.displayName || c.otherUser?.username || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const activeSection = (() => {
    if (pathname === "/chat/global") return "Global Chat";
    if (pathname?.startsWith("/chat")) return "Messages";
    if (pathname?.startsWith("/contacts")) return "Contacts";
    if (pathname?.startsWith("/notifications")) return "Notifications";
    if (pathname?.startsWith("/settings")) return "Settings";
    return "";
  })();

  return (
    <nav className={classes.navbar}>
      {/* User profile */}
      <Box className={classes.section} px="xs" py="sm">
        <Menu shadow="md" width={200} position="bottom-start" withArrow>
          <Menu.Target>
            <UnstyledButton style={{ width: "100%", borderRadius: rem(12), padding: "6px 8px" }}
              className={classes.userBtn}>
              <Group gap="sm" wrap="nowrap">
                <Indicator color={user ? "green" : "gray"} size={9} offset={2} position="bottom-end">
                  <Avatar radius="xl" size="md" color="violet" src={user?.avatar}>
                    {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "?"}
                  </Avatar>
                </Indicator>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={700} truncate>{user?.displayName || user?.username || "You"}</Text>
                  {/* Current user is always "Online" while they're using the app */}
                  <Text size="xs" c="green" truncate fw={500}>{user ? "Online" : "Offline"}</Text>
                </Box>
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown style={{ background: "#1E293B", borderColor: "#334155" }}>
            <Menu.Label c="dimmed">Account</Menu.Label>
            <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => router.push("/settings")}>Settings</Menu.Item>
            <Menu.Item leftSection={colorScheme === "dark" ? <IconSun size={14} /> : <IconMoon size={14} />} onClick={() => toggleColorScheme()}>
              {colorScheme === "dark" ? "Light mode" : "Dark mode"}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={logout}>Log out</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>

      <Divider mb="sm" />

      {/* Search */}
      <TextInput
        placeholder="Search conversations…"
        size="sm" radius="xl"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        leftSection={<IconSearch size={14} stroke={1.5} />}
        mb="md" px={4}
        styles={{ input: { background: "var(--mantine-color-dark-7)" } }}
      />

      {/* Nav links */}
      <div className={classes.section}>
        <div className={classes.mainLinks}>
          {NAV_LINKS.map((link) => {
            const isActive = link.label === activeSection;
            const badge = link.label === "Notifications" && notifCount > 0 ? notifCount : null;
            return (
              <Tooltip key={link.label} label={link.label} position="right" withArrow>
                <UnstyledButton
                  className={`${classes.mainLink} ${isActive ? classes.mainLinkActive : ""}`}
                  onClick={() => router.push(link.href)}
                >
                  <div className={classes.mainLinkInner}>
                    <link.icon size={20} className={classes.mainLinkIcon} stroke={1.5} />
                    <span>{link.label}</span>
                  </div>
                  {badge && (
                    <Badge size="sm" variant="filled" color="violet" className={classes.mainLinkBadge}>{badge}</Badge>
                  )}
                </UnstyledButton>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <Divider mb="sm" />

      {/* DM list */}
      <Group justify="space-between" px="xs" mb="xs">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" ls={1}>Direct Messages</Text>
        <Tooltip label="New conversation" withArrow position="right">
          <ActionIcon variant="subtle" color="violet" size="sm" radius="xl" onClick={() => router.push("/contacts")}>
            <IconPlus size={14} stroke={2} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <ScrollArea style={{ flex: 1 }}>
        <div className={classes.contacts}>
          {filtered.length === 0 && (
            <Box ta="center" py="lg" px="xs">
              <Text size="xs" c="dimmed">
                {conversations.length === 0 ? "No conversations yet." : "No results."}
              </Text>
            </Box>
          )}
          {filtered.map((conv) => {
            const other = conv.otherUser;
            const isOnline = onlineUsers.includes(other?._id) || other?.isOnline;
            const isActive = activeConv === conv._id;
            // unreadCount is a Mongoose Map serialised to a plain object { userId: count }
            const unread = (user?._id && conv.unreadCount && typeof conv.unreadCount === "object")
              ? (conv.unreadCount[user._id.toString()] || 0)
              : 0;
            const lastMsg = "Start a conversation";
            const lastTime = conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
            const name = other?.displayName || other?.username || "Unknown";
            return (
              <UnstyledButton
                key={conv._id}
                className={`${classes.contactRow} ${isActive ? classes.contactRowActive : ""}`}
                onClick={() => onConvSelect?.(conv)}
              >
                <Group gap="sm" wrap="nowrap">
                  <Indicator color={isOnline ? "green" : "gray"} size={9} offset={2} position="bottom-end">
                    <Avatar radius="xl" color="violet" size="md" src={other?.avatar}>
                      {name[0]?.toUpperCase()}
                    </Avatar>
                  </Indicator>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group justify="space-between" gap={0}>
                      <Text size="sm" fw={600} truncate>{name}</Text>
                      <Text size="xs" c="dimmed">
                        {lastTime}
                      </Text>
                    </Group>
                    <Group justify="space-between" gap={0}>
                      <Text size="xs" c="dimmed" truncate style={{ maxWidth: 140 }}>{lastMsg}</Text>
                      {unread > 0 && <Badge size="xs" variant="filled" color="violet" circle>{unread}</Badge>}
                    </Group>
                  </Box>
                </Group>
              </UnstyledButton>
            );
          })}
        </div>
      </ScrollArea>

      {onlineUsers.length > 0 && (
        <Box px="xs" py="xs" style={{ borderTop: "1px solid var(--mantine-color-dark-5)" }}>
          <Group gap={6}><Indicator color="green" size={8} processing /><Text size="xs" c="dimmed">{onlineUsers.length} online</Text></Group>
        </Box>
      )}
    </nav>
  );
}
