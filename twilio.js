const twilio = require("twilio");

// Thay thế bằng thông tin tài khoản Twilio của bạn
const accountSid = "SK7a2f82a2e35fb2955118699f3a229345"; // SID bạn đã chia sẻ
const authToken = ""; // Bạn cần thêm auth token

// Tạo function để lấy TURN credentials
const getTwilioTurnCredentials = () => {
  const client = twilio(accountSid, authToken);

  return client.tokens.create().then((token) => {
    return {
      iceServers: token.iceServers,
    };
  });
};

module.exports = { getTwilioTurnCredentials };
