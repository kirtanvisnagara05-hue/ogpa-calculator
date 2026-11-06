const components = [
  { id: "lop", code: "LOP", name: "Learning Outcomes Passed", weight: 0.30 },
  { id: "lotp", code: "LOTP", name: "Learning Outcome Total Points", weight: 0.25 },
  { id: "gwk", code: "GWK", name: "General Working Knowledge", weight: 0.20 },
  { id: "aa", code: "AA", name: "Advanced Ability", weight: 0.15 },
  { id: "ica", code: "ICA", name: "In-Class Assignments", weight: 0.10 }
];

const state = Object.fromEntries(components.map(({ id }) => [id, 0]));
const componentList = document.querySelector("#component-list");
const contributionList = document.querySelector("#contributions");
const template = document.querySelector("#component-template");
const ogpaResult = document.querySelector("#ogpa-result");
const rawResult = document.querySelector("#raw-result");
const letterGrade = document.querySelector("#letter-grade");
const gradeOrbit = document.querySelector(".grade-orbit");
const scaleFill = document.querySelector("#scale-fill");
const scaleMarker = document.querySelector("#scale-marker");

function clamp(value) {
  return Math.min(4, Math.max(0, value));
}

function getLetterGrade(roundedOgpa) {
  if (roundedOgpa >= 3.5) return "A";
  if (roundedOgpa >= 2.5) return "B";
  if (roundedOgpa >= 1.8) return "C";
  if (roundedOgpa >= 0.5) return "D";
  return "F";
}

function renderResults() {
  const rawOgpa = components.reduce((sum, item) => sum + state[item.id] * item.weight, 0);
  const roundedOgpa = Math.round((rawOgpa + Number.EPSILON) * 10) / 10;
  const grade = getLetterGrade(roundedOgpa);
  const progress = `${(roundedOgpa / 4) * 100}%`;

  ogpaResult.textContent = roundedOgpa.toFixed(1);
  rawResult.textContent = `Weighted total ${rawOgpa.toFixed(3)}`;
  letterGrade.textContent = grade;
  gradeOrbit.setAttribute("aria-label", `Letter grade ${grade}`);
  scaleFill.style.width = progress;
  scaleMarker.style.left = progress;

  contributionList.innerHTML = components.map((item) => {
    const contribution = state[item.id] * item.weight;
    return `<div class="contribution-row"><span>${item.code} · ${Math.round(item.weight * 100)}%</span><strong>${contribution.toFixed(2)}</strong></div>`;
  }).join("");
}

function updateRangeTrack(input, value) {
  input.style.setProperty("--range-progress", `${(value / 4) * 100}%`);
}

components.forEach((item) => {
  const row = template.content.firstElementChild.cloneNode(true);
  const label = row.querySelector("label");
  const code = row.querySelector(".component-code");
  const weight = row.querySelector(".weight-pill");
  const range = row.querySelector(".range-input");
  const number = row.querySelector(".number-input");
  const error = row.querySelector(".field-error");

  label.textContent = item.name;
  label.htmlFor = `${item.id}-number`;
  code.textContent = item.code;
  weight.textContent = `${Math.round(item.weight * 100)}% weight`;
  range.id = `${item.id}-range`;
  range.setAttribute("aria-label", `${item.name} grade points`);
  number.id = `${item.id}-number`;
  number.name = item.id;
  number.value = "0.0";
  range.value = "0";
  updateRangeTrack(range, 0);

  range.addEventListener("input", () => {
    const value = Number(range.value);
    state[item.id] = value;
    number.value = value.toFixed(1);
    error.textContent = "";
    number.removeAttribute("aria-invalid");
    updateRangeTrack(range, value);
    renderResults();
  });

  number.addEventListener("input", () => {
    const parsed = Number(number.value);
    if (number.value === "" || !Number.isFinite(parsed) || parsed < 0 || parsed > 4) {
      error.textContent = "Enter a value between 0.0 and 4.0.";
      number.setAttribute("aria-invalid", "true");
      return;
    }

    const value = clamp(parsed);
    state[item.id] = value;
    range.value = String(value);
    error.textContent = "";
    number.removeAttribute("aria-invalid");
    updateRangeTrack(range, value);
    renderResults();
  });

  number.addEventListener("blur", () => {
    if (number.value === "" || number.getAttribute("aria-invalid") === "true") {
      number.value = state[item.id].toFixed(1);
      error.textContent = "";
      number.removeAttribute("aria-invalid");
      return;
    }
    number.value = Number(number.value).toFixed(1);
  });

  componentList.appendChild(row);
});

document.querySelector("#ogpa-form").addEventListener("reset", () => {
  window.requestAnimationFrame(() => {
    components.forEach((item) => {
      state[item.id] = 0;
      const range = document.querySelector(`#${item.id}-range`);
      const number = document.querySelector(`#${item.id}-number`);
      range.value = "0";
      number.value = "0.0";
      number.removeAttribute("aria-invalid");
      number.closest(".component-row").querySelector(".field-error").textContent = "";
      updateRangeTrack(range, 0);
    });
    renderResults();
  });
});

renderResults();
