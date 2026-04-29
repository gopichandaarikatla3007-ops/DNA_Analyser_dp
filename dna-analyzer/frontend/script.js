const form = document.getElementById("dna-form");
const s1Input = document.getElementById("sequence-1");
const s2Input = document.getElementById("sequence-2");
const errorBox = document.getElementById("error-box");
const resultPanel = document.getElementById("result-panel");
const lcsOutput = document.getElementById("lcs-output");
const lengthOutput = document.getElementById("length-output");
const similarityOutput = document.getElementById("similarity-output");
const dpGridWrapper = document.getElementById("dp-grid-wrapper");
const buildOutput = document.getElementById("build-output");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const stepCounter = document.getElementById("step-counter");
const stepExplanation = document.getElementById("step-explanation");

const state = {
  s1: "",
  s2: "",
  table: [],
  steps: [],
  path: [],
  lcs: "",
  currentStep: 0,
  isPaused: true,
  isAnimating: false,
  speed: 1,
  cancelRequested: false,
};

function validateDNA(sequence) {
  return /^[ATGC]*$/i.test(sequence);
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function nucleotideClass(ch) {
  const map = { A: "nucleotide-a", T: "nucleotide-t", G: "nucleotide-g", C: "nucleotide-c" };
  return map[ch] || "";
}

function renderGrid(s1, s2, table) {
  dpGridWrapper.innerHTML = "";
  const tbl = document.createElement("table");
  tbl.className = "dp-grid";

  const rows = s1.length + 2;
  const cols = s2.length + 2;

  for (let i = 0; i < rows; i += 1) {
    const tr = document.createElement("tr");
    for (let j = 0; j < cols; j += 1) {
      const isHeader = i === 0 || j === 0;
      const cell = document.createElement(isHeader ? "th" : "td");

      if (i === 0 && j === 0) {
        cell.textContent = "S1\\S2";
      } else if (i === 0 && j === 1) {
        cell.textContent = "0";
      } else if (j === 0 && i === 1) {
        cell.textContent = "0";
      } else if (i === 0 && j > 1) {
        const ch = s2[j - 2];
        cell.textContent = `${ch}${j - 1}`;
        cell.classList.add(nucleotideClass(ch));
      } else if (j === 0 && i > 1) {
        const ch = s1[i - 2];
        cell.textContent = `${ch}${i - 1}`;
        cell.classList.add(nucleotideClass(ch));
      } else if (i === 1 || j === 1) {
        const value = i === 1 && j === 1 ? 0 : 0;
        cell.innerHTML = `<span class="cell-value">${value}</span>`;
      } else {
        const row = i - 1;
        const col = j - 1;
        const val = table[row][col];
        cell.id = `cell-${row}-${col}`;
        cell.innerHTML = `<span class="cell-value">${val}</span><span class="arrow"></span>`;
      }
      tr.appendChild(cell);
    }
    tbl.appendChild(tr);
  }

  dpGridWrapper.appendChild(tbl);
}

function clearHighlights() {
  document.querySelectorAll(".active-cell").forEach((el) => el.classList.remove("active-cell"));
}

function computeArrow(step) {
  const i = step.i;
  const j = step.j;
  const value = step.value;
  const up = state.table[i - 1][j];
  const left = state.table[i][j - 1];
  const diag = state.table[i - 1][j - 1];
  const isMatch = state.s1[i - 1] === state.s2[j - 1];

  if (isMatch && value === diag + 1) return "↖";
  if (up >= left) return "↑";
  return "←";
}

function updateStepExplanation(step, stepIndex) {
  const a = state.s1[step.i - 1];
  const b = state.s2[step.j - 1];
  const up = state.table[step.i - 1][step.j];
  const left = state.table[step.i][step.j - 1];
  const arrow = computeArrow(step);
  let message = `Comparing ${a} and ${b}. `;

  if (arrow === "↖") {
    message += `They match, so we move diagonally and add 1. Cell value becomes ${step.value}.`;
  } else if (arrow === "↑") {
    message += `They do not match, so we pick the upper value (${up}).`;
  } else {
    message += `They do not match, so we pick the left value (${left}).`;
  }

  stepCounter.textContent = `Step: ${stepIndex + 1} / ${state.steps.length}`;
  stepExplanation.textContent = message;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeLCSData(s1, s2) {
  const n = s1.length;
  const m = s2.length;
  const table = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  const steps = [];

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      if (s1[i - 1] === s2[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
      steps.push({ i, j, value: table[i][j] });
    }
  }

  const path = [];
  const chars = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    path.push({ i, j });
    if (s1[i - 1] === s2[j - 1]) {
      chars.push(s1[i - 1]);
      i -= 1;
      j -= 1;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }

  const lcs = chars.reverse().join("");
  return {
    lcs,
    length: lcs.length,
    table,
    steps,
    path,
  };
}

async function waitUntilResumed() {
  while (state.isPaused && !state.cancelRequested) {
    await sleep(80);
  }
}

async function animateFilling() {
  const baseDelay = 400;
  while (state.currentStep < state.steps.length && !state.cancelRequested) {
    await waitUntilResumed();
    if (state.cancelRequested) break;

    clearHighlights();
    const step = state.steps[state.currentStep];
    updateStepExplanation(step, state.currentStep);
    const cell = document.getElementById(`cell-${step.i}-${step.j}`);

    if (cell) {
      cell.classList.add("active-cell");
      if (state.s1[step.i - 1] === state.s2[step.j - 1]) {
        cell.classList.add("match-cell");
      }

      const valueEl = cell.querySelector(".cell-value");
      valueEl.textContent = step.value;
      valueEl.classList.add("bump");
      const arrowEl = cell.querySelector(".arrow");
      arrowEl.textContent = computeArrow(step);
      setTimeout(() => valueEl.classList.remove("bump"), 150);
    }

    state.currentStep += 1;
    await sleep(baseDelay / state.speed);
  }
}

async function animateBacktracking() {
  let built = "";
  stepCounter.textContent = "Backtracking phase";
  stepExplanation.textContent =
    "Now we trace back through green cells to build the final common pattern.";
  for (let idx = 0; idx < state.path.length && !state.cancelRequested; idx += 1) {
    await waitUntilResumed();
    if (state.cancelRequested) break;

    const point = state.path[idx];
    const cell = document.getElementById(`cell-${point.i}-${point.j}`);
    if (cell) {
      cell.classList.add("path-cell");
    }

    if (idx < state.path.length - 1) {
      const nextPoint = state.path[idx + 1];
      if (nextPoint.i === point.i - 1 && nextPoint.j === point.j - 1) {
        built = state.s1[point.i - 1] + built;
        buildOutput.textContent = built;
        stepExplanation.textContent = `Match found at (${point.i}, ${point.j}). LCS so far: ${built}`;
      }
    }

    await sleep(350 / state.speed);
  }
}

async function runAnimation() {
  if (state.isAnimating) return;
  state.isAnimating = true;
  state.cancelRequested = false;
  state.isPaused = false;
  buildOutput.textContent = "-";
  startBtn.textContent = "Start Again";
  stepCounter.textContent = "Step: 0 / 0";
  stepExplanation.textContent = "Animation started. Watch each decision below.";

  renderGrid(state.s1, state.s2, state.table);
  await animateFilling();
  if (!state.cancelRequested) {
    await animateBacktracking();
  }
  state.isAnimating = false;
}

function resetAnimationState() {
  state.currentStep = 0;
  state.isPaused = true;
  state.isAnimating = false;
  state.cancelRequested = true;
  buildOutput.textContent = "-";
  stepCounter.textContent = `Step: 0 / ${state.steps.length}`;
  stepExplanation.textContent =
    "Press \"Start Animation\" to begin. We will explain each cell decision in plain words.";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearError();

  const s1 = s1Input.value.trim().toUpperCase();
  const s2 = s2Input.value.trim().toUpperCase();

  if (!s1 || !s2) {
    showError("Both sequences are required.");
    return;
  }
  if (!validateDNA(s1) || !validateDNA(s2)) {
    showError("Only A, T, G, C characters are allowed.");
    return;
  }

  const data = computeLCSData(s1, s2);

  state.s1 = s1;
  state.s2 = s2;
  state.table = data.table;
  state.steps = data.steps;
  state.path = data.path;
  state.lcs = data.lcs;
  resetAnimationState();

  const similarity = ((2 * data.length) / (s1.length + s2.length)) * 100;
  lcsOutput.textContent = data.lcs || "(empty)";
  lengthOutput.textContent = String(data.length);
  similarityOutput.textContent = `${similarity.toFixed(2)}%`;
  resultPanel.classList.remove("hidden");

  renderGrid(s1, s2, data.table);
});

startBtn.addEventListener("click", () => {
  if (!state.steps.length) {
    showError("Run analysis first.");
    return;
  }

  if (state.isAnimating) {
    state.cancelRequested = true;
    setTimeout(() => {
      state.currentStep = 0;
      state.isPaused = false;
      state.cancelRequested = false;
      runAnimation();
    }, 30);
    return;
  }

  state.currentStep = 0;
  state.isPaused = false;
  runAnimation();
});

pauseBtn.addEventListener("click", () => {
  if (!state.steps.length) return;
  state.isPaused = !state.isPaused;
  pauseBtn.textContent = state.isPaused ? "Resume" : "Pause";
});

speedSlider.addEventListener("input", () => {
  state.speed = Number(speedSlider.value);
  speedValue.textContent = `${state.speed.toFixed(2)}x`;
});
