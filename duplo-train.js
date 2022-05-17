const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

const PoweredUP = require("node-poweredup");
const poweredUP = new PoweredUP.PoweredUP();
const TRAIN_LED_COLOR = PoweredUP.Consts.Color.PURPLE;

let scaledPitch = 0;
io.on("connection", (socket) => {
  socket.on("pitch", async (pitchFromWeb) => {
    scaledPitch = pitchFromWeb;
  });
});

poweredUP.on("discover", async (hub) => {
  console.log("Train connected");
  await hub.connect();
  if (hub instanceof PoweredUP.DuploTrainBase) {
    let train = hub;

    let motor = await train.waitForDeviceByType(
      PoweredUP.Consts.DeviceType.DUPLO_TRAIN_BASE_MOTOR
    );

    setInterval(async () => {
      console.log(scaledPitch);
      if (scaledPitch > 0 && scaledPitch < 100) {
        console.log("set power");
        motor.setPower(scaledPitch);
        //motor.rampPower(previousSpeed, nextSpeed, 1200);
      } else {
        motor.setPower(0);
      }
    }, 300);
  }
});

poweredUP.scan();

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/index.js", (req, res) => {
  res.sendFile(__dirname + "/index.js");
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
