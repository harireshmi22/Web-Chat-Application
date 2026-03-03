import { Inter } from "next/font/google";
import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/**
 * Cognitive Chat Lab custom Mantine theme.
 * Dark slate base with violet/indigo gradient accents.
 * Supports light and dark colour schemes with a toggle.
 */
const theme = createTheme({
  primaryColor: "violet",
  defaultRadius: "lg",
  fontFamily: `var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  white: "#F8FAFC",
  black: "#0F172A",
  colors: {
    // Custom violet palette matching the brand gradient
    violet: [
      "#F5F0FF", "#EDE5FF", "#D9C8FE", "#C2A8FD",
      "#A885FC", "#8F63FA", "#7C3AED", "#6D28D9",
      "#5B21B6", "#4C1D95",
    ],
    // Custom slate palette for backgrounds
    slate: [
      "#F8FAFC", "#F1F5F9", "#E2E8F0", "#CBD5E1",
      "#94A3B8", "#64748B", "#475569", "#334155",
      "#1E293B", "#0F172A",
    ],
  },
  components: {
    Button: { defaultProps: { radius: "xl" } },
    TextInput: { defaultProps: { radius: "xl" } },
    PasswordInput: { defaultProps: { radius: "xl" } },
    Paper: { defaultProps: { radius: "xl" } },
    Modal: {
      defaultProps: {
        radius: "xl",
        overlayProps: { blur: 6, backgroundOpacity: 0.5 },
      },
    },
    Card: { defaultProps: { radius: "xl" } },
    ActionIcon: { defaultProps: { radius: "xl" } },
  },
  shadows: {
    xs: "0 1px 3px rgba(0,0,0,0.08)",
    sm: "0 2px 8px rgba(0,0,0,0.12)",
    md: "0 4px 16px rgba(0,0,0,0.16)",
    lg: "0 8px 32px rgba(0,0,0,0.20)",
    xl: "0 16px 48px rgba(0,0,0,0.24)",
  },
  other: {
    // Reusable gradient string for buttons and headers
    brandGradient: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
  },
});

export const metadata = {
  title: "Cognitive Chat Lab",
  description: "Real-time chat — connect, message, collaborate",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className={inter.variable}>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <Notifications position="top-right" zIndex={9999} />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}


// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// const theme = createTheme({
//   primaryColor: "violet",
//   defaultRadius: "md",
//   fontFamily: `${geistSans.style?.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
//   fontFamilyMonospace: `${geistMono.style?.fontFamily}, monospace`,
//   white: "#ffffff",
//   black: "#111111",
//   colors: {
//     violet: [
//       "#f5f0ff", "#ede5ff", "#d9c8fe", "#c2a8fd",
//       "#a885fc", "#8f63fa", "#7c3aed", "#6d28d9",
//       "#5b21b6", "#4c1d95",
//     ],
//   },
//   components: {
//     Button: { defaultProps: { radius: "md" } },
//     TextInput: { defaultProps: { radius: "md" } },
//     Paper: { defaultProps: { radius: "md" } },
//     Modal: { defaultProps: { radius: "lg", overlayProps: { blur: 4 } } },
//   },
//   shadows: {
//     xs: "0 1px 2px rgba(0,0,0,0.05)",
//     sm: "0 1px 4px rgba(0,0,0,0.07)",
//     md: "0 4px 12px rgba(0,0,0,0.08)",
//   },
// });


// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <head>
//         <ColorSchemeScript defaultColorScheme="light" />
//       </head>
//       <body className={`${geistSans.variable} ${geistMono.variable}`}>
//         <MantineProvider theme={theme} defaultColorScheme="light">
//           {children}
//         </MantineProvider>
//       </body>
//     </html>
//   );
// }
