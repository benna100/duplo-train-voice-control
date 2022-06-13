import { PitchDetector } from "https://esm.sh/pitchy@4";

const MIN_TRAIN_SPEED = 25;
const MAX_TRAIN_SPEED = 100;
const MIN_VOICE_FREQUENCY = 80;
const MAX_VOICE_FREQUENCY = 700;

let pitches = [];
let clarities = [];
let characteristic;

function updatePitch(analyserNode, detector, input, sampleRate) {
  analyserNode.getFloatTimeDomainData(input);
  const [pitch, clarity] = detector.findPitch(input, sampleRate);

  pitches.push(pitch);
  clarities.push(clarity);

  window.setTimeout(
    () => updatePitch(analyserNode, detector, input, sampleRate),
    10
  );
}

const speedTag = document.querySelector("p.speed");
const p = document.querySelector("p.success");

async function connect() {
  try {
    let device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: ["00001623-1212-efde-1623-785feabcd123"],
        },
      ],
    });

    let server = await device.gatt.connect();

    let service = await server.getPrimaryService(
      "00001623-1212-efde-1623-785feabcd123"
    );

    characteristic = await service.getCharacteristic(
      "00001624-1212-efde-1623-785feabcd123"
    );
  } catch (e) {
    alert(e);
  }

  p.innerText = "Successfully connected to train 🥳";

  const average = (array) => array.reduce((a, b) => a + b) / array.length;

  setInterval(() => {
    const averagePitch = average(pitches);
    const avegareClarity = average(clarities);

    console.log(parseInt(averagePitch), avegareClarity);

    const roundedPitch = Math.round(averagePitch * 10) / 10;
    const scaledPitchForDuploTrain = d3
      .scaleLinear()
      .domain([MIN_VOICE_FREQUENCY, MAX_VOICE_FREQUENCY])
      .range([MIN_TRAIN_SPEED, MAX_TRAIN_SPEED]);

    pitches = [];
    clarities = [];

    const scaledPitch =
      avegareClarity > 0.8 ? scaledPitchForDuploTrain(averagePitch) : -100;

    if (scaledPitch > 0 && scaledPitch < 100) {
      drive(scaledPitch);
      speedTag.innerText = `The speed is ${scaledPitch}`;
    } else {
      drive(0);
      speedTag.innerText = `The speed is 0`;
    }
  }, 300);
}

function drive(speed) {
  write([0x81, 0x00, 0x00, 0x51, 0x00, speed]);
}

function write(data) {
  var message = new Int8Array(2 + data.length);
  message[0] = message.length;
  message.set(data, 2);
  characteristic.writeValue(message);
}

const buttonListen = document.querySelector("button.listen");
buttonListen.addEventListener("click", () => {
  const audioContext = new window.AudioContext();
  const analyserNode = audioContext.createAnalyser();
  audioContext.resume();

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    audioContext.createMediaStreamSource(stream).connect(analyserNode);
    const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
    const input = new Float32Array(detector.inputLength);
    updatePitch(analyserNode, detector, input, audioContext.sampleRate);
  });

  buttonListen.disabled = true;
});

const buttonConnect = document.querySelector("button.connect");
buttonConnect.addEventListener("click", () => {
  connect();
  buttonConnect.disabled = true;
});
