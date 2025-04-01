const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Or specify the exact frontend origin
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// Store room and user information
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle join-room
  socket.on("join-room", ({ roomId, userId }) => {
    console.log(`User ${userId} joining room ${roomId}`);

    // Join the room
    socket.join(roomId);

    // Save user info with default state
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    rooms.get(roomId).set(userId, {
      socketId: socket.id,
      isMuted: false,
      isVideoOff: false,
    });

    // Notify other users in the room
    socket.to(roomId).emit("user-connected", userId);

    // Send list of participants
    const participants = Array.from(rooms.get(roomId).keys());
    io.to(roomId).emit("room-participants", { participants });

    // Save info for easy cleanup
    socket.roomId = roomId;
    socket.userId = userId;
  });

  // Handle user-toggle-audio
  socket.on("user-toggle-audio", ({ userId, roomId }) => {
    console.log(`User ${userId} toggled audio in room ${roomId}`);
    socket.to(roomId).emit("user-toggle-audio", userId);
  });

  // Handle user-toggle-video
  socket.on("user-toggle-video", ({ userId, roomId }) => {
    console.log(`User ${userId} toggled video in room ${roomId}`);
    socket.to(roomId).emit("user-toggle-video", userId);
  });

  // Handle user-leave
  socket.on("user-leave", ({ userId, roomId }) => {
    console.log(`User ${userId} is leaving room ${roomId}`);
    socket.to(roomId).emit("user-leave", userId);

    // Remove user from room
    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(userId);

      // If room is empty, delete room
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
    }

    // Leave socket room
    socket.leave(roomId);
  });

  // Handle send-message
  socket.on("send-message", ({ roomId, message }) => {
    console.log(
      `Message in room ${roomId} from ${message.sender}: ${message.content}`
    );
    socket.to(roomId).emit("chat-message", message);
  });

  // Handle user-state-update
  socket.on("user-state-update", ({ userId, roomId, isMuted, isVideoOff }) => {
    console.log(
      `User ${userId} updated state: muted=${isMuted}, videoOff=${isVideoOff}`
    );

    // Lưu trạng thái vào rooms
    if (rooms.has(roomId) && rooms.get(roomId).has(userId)) {
      const userInfo = rooms.get(roomId).get(userId);
      userInfo.isMuted = isMuted;
      userInfo.isVideoOff = isVideoOff;
    }

    // Gửi trạng thái mới đến tất cả user trong phòng
    socket
      .to(roomId)
      .emit("user-state-update", { userId, isMuted, isVideoOff });
  });

  // Handle request-all-states
  socket.on("request-all-states", ({ roomId }) => {
    console.log(
      `User ${socket.userId} requested all states for room ${roomId}`
    );

    if (rooms.has(roomId)) {
      const roomUsers = rooms.get(roomId);

      // Gửi trạng thái của tất cả user trong phòng đến user vừa kết nối
      roomUsers.forEach((userInfo, userId) => {
        if (userId !== socket.userId) {
          socket.emit("user-state-update", {
            userId,
            isMuted: userInfo.isMuted || false,
            isVideoOff: userInfo.isVideoOff || false,
          });
        }
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.roomId && socket.userId) {
      const roomId = socket.roomId;
      const userId = socket.userId;

      // Remove user from room
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(userId);

        // If room is empty, delete room
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        } else {
          // Notify other users
          socket.to(roomId).emit("user-leave", userId);

          // Update participant list
          const participants = Array.from(rooms.get(roomId).keys());
          io.to(roomId).emit("room-participants", { participants });
        }
      }
    }
  });

  // Thêm xử lý cho sự kiện signal (cho Simple-Peer)
  socket.on("signal", ({ to, from, signal }) => {
    console.log(`Forwarding signal from ${from} to ${to}`);
    io.to(to).emit("signal", { from, signal });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
