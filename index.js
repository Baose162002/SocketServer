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
const userStates = new Map(); // Lưu trạng thái mic/camera của mỗi user

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle join-room
  socket.on("join-room", ({ roomId, userId }) => {
    console.log(`User ${userId} joining room ${roomId}`);

    // Join the room
    socket.join(roomId);

    // Save user info
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    // Khởi tạo trạng thái mặc định nếu chưa có
    if (!userStates.has(userId)) {
      userStates.set(userId, {
        isMuted: false,
        isVideoOff: false,
      });
    }

    // Lưu thông tin user với trạng thái hiện tại
    rooms.get(roomId).set(userId, {
      socketId: socket.id,
      ...userStates.get(userId),
    });

    // Notify other users in the room
    socket.to(roomId).emit("user-connected", userId);

    // Gửi trạng thái mic/camera của tất cả users trong phòng
    const roomParticipants = Array.from(rooms.get(roomId).entries()).map(
      ([id, data]) => ({
        id,
        ...data,
      })
    );

    io.to(roomId).emit("room-participants", { participants: roomParticipants });

    // Save info for easy cleanup
    socket.roomId = roomId;
    socket.userId = userId;
  });

  // Handle user-toggle-audio
  socket.on("user-toggle-audio", ({ userId, roomId, isMuted }) => {
    console.log(`User ${userId} toggled audio in room ${roomId} to ${isMuted}`);

    // Cập nhật trạng thái
    if (userStates.has(userId)) {
      userStates.get(userId).isMuted = isMuted;
    } else {
      userStates.set(userId, { isMuted, isVideoOff: false });
    }

    // Cập nhật thông tin trong phòng
    if (rooms.has(roomId) && rooms.get(roomId).has(userId)) {
      rooms.get(roomId).get(userId).isMuted = isMuted;
    }

    // Thông báo cho các user khác
    socket.to(roomId).emit("user-toggle-audio", { userId, isMuted });
  });

  // Handle user-toggle-video
  socket.on("user-toggle-video", ({ userId, roomId, isVideoOff }) => {
    console.log(
      `User ${userId} toggled video in room ${roomId} to ${isVideoOff}`
    );

    // Cập nhật trạng thái
    if (userStates.has(userId)) {
      userStates.get(userId).isVideoOff = isVideoOff;
    } else {
      userStates.set(userId, { isMuted: false, isVideoOff });
    }

    // Cập nhật thông tin trong phòng
    if (rooms.has(roomId) && rooms.get(roomId).has(userId)) {
      rooms.get(roomId).get(userId).isVideoOff = isVideoOff;
    }

    // Thông báo cho các user khác
    socket.to(roomId).emit("user-toggle-video", { userId, isVideoOff });
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
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
