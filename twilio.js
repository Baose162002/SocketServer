const twilio = require("twilio");

// Sử dụng thông tin tài khoản Twilio của bạn
const accountSid = "ACC4055aedb5e35b3daff470b3d2708495";
const authToken = "41e285dd875332daa2ebbac98548d63c";

// Tạo API endpoint để lấy TURN credentials
const getTwilioTurnCredentials = (req, res) => {
  const client = twilio(accountSid, authToken);

  client.tokens
    .create()
    .then((token) => {
      res.send({
        iceServers: token.iceServers,
      });
    })
    .catch((err) => {
      console.error("Error getting Twilio TURN credentials:", err);
      res.status(500).send({
        error: "Could not get TURN credentials",
      });
    });
};

module.exports = {
  getTwilioTurnCredentials,
};
