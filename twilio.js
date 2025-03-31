// Fallback TURN servers không cần Twilio
const getTwilioTurnCredentials = () => {
  return Promise.resolve({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:relay.metered.ca:80",
        username: "83eebabf8bf7d2c252ee6c3d",
        credential: "OZoV0r7Ien5ZdLkA",
      },
      {
        urls: "turn:relay.metered.ca:443",
        username: "83eebabf8bf7d2c252ee6c3d",
        credential: "OZoV0r7Ien5ZdLkA",
      },
      {
        urls: "turn:relay.metered.ca:443?transport=tcp",
        username: "83eebabf8bf7d2c252ee6c3d",
        credential: "OZoV0r7Ien5ZdLkA",
      },
    ],
  });
};

module.exports = { getTwilioTurnCredentials };
