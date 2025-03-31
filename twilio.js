// Fallback TURN servers không cần Twilio
const getTwilioTurnCredentials = () => {
  return Promise.resolve({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },

      // Thêm các TURN server mới
      {
        urls: "turn:turn.anyfirewall.com:443?transport=tcp",
        username: "webrtc",
        credential: "webrtc",
      },
      {
        urls: "turn:turn.anyfirewall.com:443",
        username: "webrtc",
        credential: "webrtc",
      },
      {
        urls: "turn:numb.viagenie.ca",
        username: "webrtc@live.com",
        credential: "muazkh",
      },
      {
        urls: "turn:192.158.29.39:3478?transport=udp",
        username: "28224511:1379330808",
        credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      },
      {
        urls: "turn:192.158.29.39:3478?transport=tcp",
        username: "28224511:1379330808",
        credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      },

      // Giữ lại một số TURN server cũ
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:relay.metered.ca:80",
        username: "83eebabf8bf7d2c252ee6c3d",
        credential: "OZoV0r7Ien5ZdLkA",
      },
    ],
  });
};

module.exports = { getTwilioTurnCredentials };
