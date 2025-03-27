const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép tất cả các origin trong quá trình phát triển
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Lưu trữ thông tin phòng và người dùng
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Xử lý join-room
  socket.on("join-room", ({ roomId, userId }) => {
    console.log(`User ${userId} joining room ${roomId}`);

    // Tham gia vào room
    socket.join(roomId);

    // Lưu thông tin user
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    rooms.get(roomId).set(userId, { socketId: socket.id });

    // Thông báo cho người dùng khác trong phòng
    socket.to(roomId).emit("user-connected", userId);

    // Gửi danh sách người tham gia
    const participants = Array.from(rooms.get(roomId).keys());
    io.to(roomId).emit("room-participants", { participants });

    // Lưu thông tin để dễ dàng cleanup
    socket.roomId = roomId;
    socket.userId = userId;
  });

  // Xử lý user-toggle-audio
  socket.on("user-toggle-audio", ({ userId, roomId }) => {
    console.log(`User ${userId} toggled audio in room ${roomId}`);
    socket.to(roomId).emit("user-toggle-audio", userId);
  });

  // Xử lý user-toggle-video
  socket.on("user-toggle-video", ({ userId, roomId }) => {
    console.log(`User ${userId} toggled video in room ${roomId}`);
    socket.to(roomId).emit("user-toggle-video", userId);
  });

  // Xử lý user-leave
  socket.on("user-leave", ({ userId, roomId }) => {
    console.log(`User ${userId} is leaving room ${roomId}`);
    socket.to(roomId).emit("user-leave", userId);

    // Xóa user khỏi room
    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(userId);

      // Nếu room trống, xóa room
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
    }

    // Rời khỏi room socket
    socket.leave(roomId);
  });

  // Xử lý send-message
  socket.on("send-message", ({ roomId, message }) => {
    console.log(
      `Message in room ${roomId} from ${message.sender}: ${message.content}`
    );
    socket.to(roomId).emit("chat-message", message);
  });

  // Xử lý disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.roomId && socket.userId) {
      const roomId = socket.roomId;
      const userId = socket.userId;

      // Xóa user khỏi room
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(userId);

        // Nếu room trống, xóa room
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        } else {
          // Thông báo cho người dùng khác
          socket.to(roomId).emit("user-leave", userId);

          // Cập nhật danh sách người tham gia
          const participants = Array.from(rooms.get(roomId).keys());
          io.to(roomId).emit("room-participants", { participants });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
