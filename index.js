import { PitchDetector } from "https://esm.sh/pitchy@4";
let pitches = [];
let clarities = [];
function updatePitch(analyserNode, detector, input, sampleRate) {
  analyserNode.getFloatTimeDomainData(input);
  const [pitch, clarity] = detector.findPitch(input, sampleRate);

  pitches.push(pitch);
  clarities.push(clarity);

  window.setTimeout(
    () => updatePitch(analyserNode, detector, input, sampleRate),
    50
  );
}
const average = (array) => array.reduce((a, b) => a + b) / array.length;

setInterval(() => {
  const averagePitch = average(pitches);
  const avegareClarity = average(clarities);

  const roundedPitch = Math.round(averagePitch * 10) / 10;
  const scaledPitchForDuploTrain = d3
    .scaleLinear()
    .domain([80, 650])
    .range([25, 100]);

  pitches = [];
  clarities = [];

  console.log(avegareClarity);

  socket.emit(
    "pitch",
    avegareClarity > 0.8 ? scaledPitchForDuploTrain(averagePitch) : -100
  );
}, 300);

document.addEventListener("DOMContentLoaded", () => {
  const audioContext = new window.AudioContext();
  const analyserNode = audioContext.createAnalyser();
  audioContext.resume();

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    audioContext.createMediaStreamSource(stream).connect(analyserNode);
    const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
    const input = new Float32Array(detector.inputLength);
    updatePitch(analyserNode, detector, input, audioContext.sampleRate);
  });
});

var socket = io();
