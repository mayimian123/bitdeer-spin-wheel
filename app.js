const wheelSvg = document.getElementById("wheelSvg");
const wheelWrap = document.getElementById("wheelWrap");
const lucaCorner = document.getElementById("lucaCorner");
const resultModal = document.getElementById("resultModal");
const modalCard = document.getElementById("modalCard");
const resultText = document.getElementById("resultText");
const celebrateBurst = document.getElementById("celebrateBurst");
const closeModalBtn = document.getElementById("closeModalBtn");
const settingsPanel = document.getElementById("settingsPanel");
const settingsTrigger = document.getElementById("settingsTrigger");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const settingsError = document.getElementById("settingsError");
const weightFirstInput = document.getElementById("weightFirst");
const weightSecondInput = document.getElementById("weightSecond");
const weightThirdInput = document.getElementById("weightThird");

const SEGMENT_COUNT = 12;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
const POINTER_ANGLE = -90;
const SPIN_PREP_MS = 2000;
const SPIN_DURATION_MS = 5000;

const prizeOrder = [
  { key: "first", label: "First Prize", color: "#FFB03A" },
  { key: "third", label: "Third Prize", color: "#2E9D71" },
  { key: "second", label: "Second Prize", color: "#03930A" },
  { key: "third", label: "Third Prize", color: "#2E9D71" },
  { key: "first", label: "First Prize", color: "#FFB03A" },
  { key: "third", label: "Third Prize", color: "#2E9D71" },
  { key: "second", label: "Second Prize", color: "#03930A" },
  { key: "third", label: "Third Prize", color: "#2E9D71" },
  { key: "first", label: "First Prize", color: "#FFB03A" },
  { key: "third", label: "Third Prize", color: "#2E9D71" },
  { key: "second", label: "Second Prize", color: "#03930A" },
  { key: "third", label: "Third Prize", color: "#2E9D71" }
];

const lucaByState = {
  idle: "./素材/luca/站立.png",
  expect: "./素材/luca/期待.png",
  clap: "./素材/luca/拍手.png",
  celebrate: "./素材/luca/庆祝.png"
};

const state = {
  spinning: false,
  currentAngle: 0,
  weights: { first: 20, second: 30, third: 50 }
};

var sharedAudioCtx = null;
function getAudioCtx() {
  var Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new Ctor();
  }
  return sharedAudioCtx;
}

function unlockAudio() {
  var ac = getAudioCtx();
  if (!ac) return;
  if (ac.state === "suspended") {
    ac.resume();
  }
  var buf = ac.createBuffer(1, 1, ac.sampleRate);
  var src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(ac.destination);
  src.start(0);
}

document.addEventListener("touchstart", unlockAudio);
document.addEventListener("touchend", unlockAudio);
document.addEventListener("click", unlockAudio);

function polarToCartesian(cx, cy, r, degree) {
  const rad = (degree * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildWheel() {
  const ns = "http://www.w3.org/2000/svg";
  wheelSvg.innerHTML = "";

  const outerGlow = document.createElementNS(ns, "circle");
  outerGlow.setAttribute("cx", "500");
  outerGlow.setAttribute("cy", "500");
  outerGlow.setAttribute("r", "488");
  outerGlow.setAttribute("fill", "none");
  outerGlow.setAttribute("stroke", "rgba(0,216,158,.26)");
  outerGlow.setAttribute("stroke-width", "8");
  wheelSvg.appendChild(outerGlow);

  for (let i = 0; i < SEGMENT_COUNT; i += 1) {
    const startDeg = POINTER_ANGLE + i * SEGMENT_ANGLE;
    const endDeg = startDeg + SEGMENT_ANGLE;
    const centerDeg = startDeg + SEGMENT_ANGLE / 2;

    const p0 = polarToCartesian(500, 500, 470, startDeg);
    const p1 = polarToCartesian(500, 500, 470, endDeg);
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", `M 500 500 L ${p0.x} ${p0.y} A 470 470 0 0 1 ${p1.x} ${p1.y} Z`);
    path.setAttribute("fill", prizeOrder[i].color);
    path.setAttribute("stroke", "none");
    wheelSvg.appendChild(path);

    const labelGroup = document.createElementNS(ns, "g");
    labelGroup.setAttribute("transform", `translate(500 500) rotate(${centerDeg + 90})`);
    const text = document.createElementNS(ns, "text");
    text.setAttribute("x", "0");
    text.setAttribute("y", "-292");
    text.setAttribute("fill", "#f9fff7");
    text.setAttribute("font-size", "37");
    text.setAttribute("font-weight", "800");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("transform", "rotate(90 0 -292)");
    text.style.textShadow = "0 0 6px rgba(0,0,0,.3)";
    text.textContent = prizeOrder[i].label;
    labelGroup.appendChild(text);
    wheelSvg.appendChild(labelGroup);
  }

  const rimBase = document.createElementNS(ns, "circle");
  rimBase.setAttribute("cx", "500");
  rimBase.setAttribute("cy", "500");
  rimBase.setAttribute("r", "470");
  rimBase.setAttribute("fill", "none");
  rimBase.setAttribute("stroke", "#006831");
  rimBase.setAttribute("stroke-width", "26");
  wheelSvg.appendChild(rimBase);

  const rimHighlight = document.createElementNS(ns, "circle");
  rimHighlight.setAttribute("cx", "500");
  rimHighlight.setAttribute("cy", "500");
  rimHighlight.setAttribute("r", "470");
  rimHighlight.setAttribute("fill", "none");
  rimHighlight.setAttribute("stroke", "rgba(170, 255, 214, 0.35)");
  rimHighlight.setAttribute("stroke-width", "5");
  wheelSvg.appendChild(rimHighlight);
}

function getWeightedPrize() {
  const { first, second, third } = state.weights;
  const rand = Math.random() * 100;
  if (rand < first) return "first";
  if (rand < first + second) return "second";
  return "third";
}

function pickSectorByPrize(prizeKey) {
  const indexes = [];
  for (let i = 0; i < prizeOrder.length; i += 1) {
    if (prizeOrder[i].key === prizeKey) {
      indexes.push(i);
    }
  }
  return indexes[Math.floor(Math.random() * indexes.length)];
}

function normalizeAngle(deg) {
  return ((deg % 360) + 360) % 360;
}

function setLucaState(mode) {
  lucaCorner.src = lucaByState[mode];
  lucaCorner.classList.remove("sway-x", "luca-expect");
  if (mode === "expect") {
    lucaCorner.classList.add("luca-expect");
  }
  if (mode !== "celebrate") {
    lucaCorner.classList.add("sway-x");
  }
}

function showResult(prizeLabel) {
  resultText.textContent = prizeLabel;
  resultModal.classList.remove("hidden");
  resultModal.setAttribute("aria-hidden", "false");
  modalCard.classList.remove("celebrate");
  void modalCard.offsetWidth;
  modalCard.classList.add("celebrate");
  startCelebrationFx();
  lucaCorner.style.display = "none";
  playWinSound();
}

function hideResult() {
  resultModal.classList.add("hidden");
  resultModal.setAttribute("aria-hidden", "true");
  modalCard.classList.remove("celebrate");
  celebrateBurst.innerHTML = "";
  lucaCorner.style.display = "block";
  setLucaState("idle");
}

function spinOnce() {
  if (state.spinning || !resultModal.classList.contains("hidden") || !settingsPanel.classList.contains("hidden")) {
    return;
  }

  state.spinning = true;

  const prizeKey = getWeightedPrize();
  const sectorIndex = pickSectorByPrize(prizeKey);
  const targetCenterDeg = POINTER_ANGLE + sectorIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const finalAngle = normalizeAngle(POINTER_ANGLE - targetCenterDeg);
  const baseSpins = 360 * (5 + Math.floor(Math.random() * 2));
  const currentNorm = normalizeAngle(state.currentAngle);
  const delta = normalizeAngle(finalAngle - currentNorm);
  const destination = state.currentAngle + baseSpins + delta;

  setLucaState("expect");

  setTimeout(() => {
    setLucaState("clap");
    wheelWrap.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.08, 0.75, 0.12, 1)`;
    wheelWrap.style.transform = `rotate(${destination}deg)`;

    window.setTimeout(() => {
      state.currentAngle = destination;
      state.spinning = false;
      const label = prizeOrder[sectorIndex].label;
      showResult(label);
    }, SPIN_DURATION_MS + 40);
  }, SPIN_PREP_MS);
}

function onGlobalTap(event) {
  const inModal = Boolean(event.target.closest(".modal-card"));
  const inSettings = Boolean(event.target.closest(".settings-card"));
  const inSettingsBtn = Boolean(event.target.closest(".settings-trigger"));
  if (inModal || inSettings || inSettingsBtn) return;
  spinOnce();
}

function startCelebrationFx() {
  celebrateBurst.innerHTML = "";
  const colors = ["#00ED7C", "#00D89E", "#FBD16A", "#FF7300", "#D6FFF2"];
  for (let i = 0; i < 28; i += 1) {
    const dot = document.createElement("span");
    dot.className = "burst-dot";
    const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.22;
    const distance = 120 + Math.random() * 220;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 40;
    const size = 6 + Math.random() * 8;
    dot.style.setProperty("--dx", `${dx}px`);
    dot.style.setProperty("--dy", `${dy}px`);
    dot.style.setProperty("--rot", `${Math.floor(Math.random() * 540 - 270)}deg`);
    dot.style.width = `${size}px`;
    dot.style.height = `${size * 1.8}px`;
    dot.style.background = colors[Math.floor(Math.random() * colors.length)];
    dot.style.animationDelay = `${Math.random() * 0.35}s`;
    celebrateBurst.appendChild(dot);
  }
}

function playWinSound() {
  var ac = getAudioCtx();
  if (!ac) return;
  if (ac.state === "suspended") {
    ac.resume();
  }
  var now = ac.currentTime;
  var notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach(function (freq, i) {
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now + i * 0.1);
    gain.gain.setValueAtTime(0.0001, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.17);
    osc.connect(gain).connect(ac.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.19);
  });

  var burst = ac.createOscillator();
  var burstGain = ac.createGain();
  burst.type = "triangle";
  burst.frequency.setValueAtTime(1320, now + 0.42);
  burst.frequency.exponentialRampToValueAtTime(680, now + 0.7);
  burstGain.gain.setValueAtTime(0.0001, now + 0.42);
  burstGain.gain.exponentialRampToValueAtTime(0.1, now + 0.44);
  burstGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
  burst.connect(burstGain).connect(ac.destination);
  burst.start(now + 0.42);
  burst.stop(now + 0.72);
}

function updateWeightInputs() {
  weightFirstInput.value = String(state.weights.first);
  weightSecondInput.value = String(state.weights.second);
  weightThirdInput.value = String(state.weights.third);
}

function trySaveWeights() {
  const first = Number(weightFirstInput.value);
  const second = Number(weightSecondInput.value);
  const third = Number(weightThirdInput.value);
  if (
    Number.isNaN(first) ||
    Number.isNaN(second) ||
    Number.isNaN(third) ||
    first < 0 ||
    second < 0 ||
    third < 0
  ) {
    settingsError.textContent = "Please enter valid non-negative numbers.";
    return;
  }

  const sum = first + second + third;
  if (sum !== 100) {
    settingsError.textContent = "Total must equal 100%.";
    return;
  }

  state.weights = { first, second, third };
  settingsError.textContent = "";
  settingsPanel.classList.add("hidden");
  settingsPanel.setAttribute("aria-hidden", "true");
}

function toggleSettings(show) {
  if (show) {
    updateWeightInputs();
    settingsError.textContent = "";
    settingsPanel.classList.remove("hidden");
    settingsPanel.setAttribute("aria-hidden", "false");
    return;
  }
  settingsPanel.classList.add("hidden");
  settingsPanel.setAttribute("aria-hidden", "true");
}

buildWheel();
setLucaState("idle");

document.addEventListener("click", onGlobalTap);
closeModalBtn.addEventListener("click", hideResult);
settingsTrigger.addEventListener("click", function () {
  toggleSettings(settingsPanel.classList.contains("hidden"));
});
saveSettingsBtn.addEventListener("click", trySaveWeights);
closeSettingsBtn.addEventListener("click", () => toggleSettings(false));
