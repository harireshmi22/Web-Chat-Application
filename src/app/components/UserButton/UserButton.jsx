"use client";

import { Avatar, Group, Text, UnstyledButton, rem } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import classes from "./UserButton.module.css";

export function UserButton() {
    return (
        <UnstyledButton className={classes.user}>
            <Group>
                <Avatar radius="xl" color="blue">
                    U
                </Avatar>

                <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                        User Name
                    </Text>
                    <Text c="dimmed" size="xs">
                        user@example.com
                    </Text>
                </div>

                <IconChevronRight
                    style={{ width: rem(14), height: rem(14) }}
                    stroke={1.5}
                />
            </Group>
        </UnstyledButton>
    );
}
