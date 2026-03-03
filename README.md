# Cognitive Chat Lab

A full-stack real-time chat application built with **Next.js 15**, **Socket.io**, **MongoDB**, and **Mantine UI**.

## Features

- **Real-time messaging** — WebSocket-powered chat with Socket.io, typing indicators, online presence
- **JWT Authentication** — Secure register/login with bcrypt hashing and 7-day tokens
- **Friend system** — Send/accept/decline friend requests, manage contacts
- **Edit & delete messages** — Right-click any bubble to edit or soft-delete
- **Notifications** — In-app notifications for friend requests and messages
- **Dark slate theme** — Custom Mantine theme with violet/indigo gradients and Inter font
- **Light/Dark toggle** — Color scheme switch from navbar and settings
- **Settings page** — Edit display name, bio, and password

## Tech Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Frontend  | Next.js 15 (App Router), React 19, Mantine v8 |
| Real-time | Socket.io v4 (custom combined Node.js server) |
| Auth      | `jsonwebtoken` + `bcryptjs`                   |
| Database  | MongoDB + Mongoose                            |

## Quick Start

### Prerequisites

- Node.js v18+
- MongoDB running locally or a MongoDB Atlas URI

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/cognitive-chat-lab
JWT_SECRET=your_super_secret_key_change_in_production
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 3. Start the dev server

```bash
npm run dev
```

App runs on **http://localhost:3000**.

> `npm run dev` uses `node server.js` (Next.js + Socket.io combined). Do **not** use `next dev` directly.

## Pages

| Route            | Description                           |
| ---------------- | ------------------------------------- |
| `/`              | Landing page                          |
| `/auth/login`    | Sign in                               |
| `/auth/register` | Create account                        |
| `/chat`          | Real-time messaging                   |
| `/contacts`      | Friends list, search, friend requests |
| `/notifications` | Notification center                   |
| `/settings`      | Profile, theme, password              |

## API Routes

| Method          | Endpoint               | Description           |
| --------------- | ---------------------- | --------------------- |
| POST            | `/api/auth/register`   | Create account        |
| POST            | `/api/auth/login`      | Login, returns JWT    |
| GET/PATCH       | `/api/auth/me`         | Get or update profile |
| GET             | `/api/users/search?q=` | Search users          |
| GET/POST/DELETE | `/api/contacts`        | Friend management     |
| GET/POST        | `/api/conversations`   | DM threads            |
| GET/POST        | `/api/messages`        | List / send messages  |
| PUT/DELETE      | `/api/messages/:id`    | Edit / soft-delete    |
| GET/PATCH       | `/api/notifications`   | List / mark-read      |

## Socket.io Events

**Client → Server:** `join_room`, `send_message`, `typing`, `stop_typing`  
**Server → Client:** `receive_message`, `user_typing`, `user_stop_typing`, `room_users`, `user_joined`, `user_left`, `user_online`, `user_offline`

## License

MIT
