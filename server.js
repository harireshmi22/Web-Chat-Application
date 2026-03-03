require("dotenv").config({ path: ".env.local" });
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// ── MongoDB presence updates ─────────────────────────────────────────────────
// Uses the same mongoose singleton that the Next.js API routes use, so no
// duplicate connection is created once the routes are first loaded.
async function connectPresenceDB() {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGODB_URI) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  } catch (err) {
    console.error("[server.js] MongoDB connect error:", err.message);
  }
}

async function setUserOnline(userId, isOnline) {
  if (!userId) return;
  try {
    await connectPresenceDB();
    if (!mongoose.connection.db) return;
    await mongoose.connection.db.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { isOnline, lastSeen: new Date() } }
    );
  } catch { /* non-critical — ignore */ }
}

// ── In-memory global chat history (last 100 messages) ───────────────────────
const globalMessages = [];

/** Verify a JWT and return its payload (or null on failure) */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Track { userId -> socketId } and room -> Set<userId>
  const onlineUsers = new Map();   // userId -> socketId
  const roomUsers = new Map();   // room   -> Set<userId>

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        socket.data.userId = payload.userId || payload.id;
        socket.data.username = payload.username;
      }
    }
    // Allow unauthenticated connections (they just won't have userId set)
    next();
  });

  io.on("connection", (socket) => {
    const { userId, username } = socket.data;
    console.log(`[Socket.io] Connected: ${socket.id}${username ? " (" + username + ")" : ""}`);

    // Mark user online
    if (userId) {
      onlineUsers.set(userId, socket.id);
      setUserOnline(userId, true);
      io.emit("user_online", { userId, username });
    }
    // Send the current list of online user IDs to the newly connected socket
    socket.emit("online_users", Array.from(onlineUsers.keys()));

    // ── Join a conversation room ──────────────────────────────────────────
    socket.on("join_room", ({ room, username: nameOverride }) => {
      socket.join(room);
      const name = socket.data.username || nameOverride;
      socket.data.room = room;
      socket.data.username = name;

      if (!roomUsers.has(room)) roomUsers.set(room, new Set());
      if (userId) roomUsers.get(room).add(userId);

      io.to(room).emit("room_users", Array.from(roomUsers.get(room) || []));
      socket.to(room).emit("user_joined", { username: name, time: new Date().toISOString() });

      // Send the in-memory chat history when joining the global room
      if (room === "global_chat") {
        socket.emit("message_history", globalMessages.slice(-100));
      }

      console.log(`[Socket.io] ${name} joined room: ${room}`);
    });

    // ── Broadcast message ─────────────────────────────────────────────────
    socket.on("send_message", (data) => {
      // Store global chat messages in memory so history can be replayed
      if (data.room === "global_chat") {
        const stored = { ...data, own: false, timestamp: new Date().toISOString() };
        globalMessages.push(stored);
        if (globalMessages.length > 100) globalMessages.shift();
      }
      socket.to(data.room).emit("receive_message", { ...data, own: false });
    });

    // ── Typing indicators ─────────────────────────────────────────────────
    socket.on("typing", ({ room, username: u }) => socket.to(room).emit("user_typing", { username: socket.data.username || u }));
    socket.on("stop_typing", ({ room, username: u }) => socket.to(room).emit("user_stop_typing", { username: socket.data.username || u }));

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const { userId: uid, username: name, room } = socket.data;
      if (uid) {
        onlineUsers.delete(uid);
        setUserOnline(uid, false);
      }
      if (room) {
        const set = roomUsers.get(room);
        if (set) { if (uid) set.delete(uid); io.to(room).emit("room_users", Array.from(set)); }
        socket.to(room).emit("user_left", { username: name, time: new Date().toISOString() });
      }
      if (uid) io.emit("user_offline", { userId: uid, username: name });
      console.log(`[Socket.io] Disconnected: ${socket.id}${name ? " (" + name + ")" : ""}`);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Cognitive Chat Lab ready on http://localhost:${PORT}`);
  });
});
