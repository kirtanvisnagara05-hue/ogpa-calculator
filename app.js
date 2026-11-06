const components = [
  { id: "lop", code: "LOP", name: "Learning Outcomes Passed", weight: 0.30 },
  { id: "lotp", code: "LOTP", name: "Learning Outcome Total Points", weight: 0.25 },
  { id: "gwk", code: "GWK", name: "General Working Knowledge", weight: 0.20 },
  { id: "aa", code: "AA", name: "Advanced Ability", weight: 0.15 },
  { id: "ica", code: "ICA", name: "In-Class Assignments", weight: 0.10 }
];

const assessmentCategories = [
  { id: "lotp", itemName: "LO", maximum: 25 },
  { id: "gwk", itemName: "GWK", maximum: 25 },
  { id: "aa", itemName: "AA", maximum: 25 },
  { id: "ica", itemName: "ICA", maximum: 30 }
];

const state = {
  gradePoints: Object.fromEntries(components.map(({ id }) => [id, 0])),
  scores: Object.fromEntries(assessmentCategories.map(({ id }) => [id, []]))
};

const contributionList = document.querySelector("#contributions");
const markTemplate = document.querySelector("#mark-template");
const ogpaResult = document.querySelector("#ogpa-result");
const rawResult = document.querySelector("#raw-result");
const letterGrade = document.querySelector("#letter-grade");
const gradeOrbit = document.querySelector(".grade-orbit");
const scaleFill = document.querySelector("#scale-fill");
const scaleMarker = document.querySelector("#scale-marker");
const loPassedInput = document.querySelector("#lo-passed");
const loPassedError = document.querySelector("#lo-passed-error");
const lopGradePoint = document.querySelector("#lop-grade-point");

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getLopGradePoint(passed) {
  if (passed <= 3) return 0;
  if (passed === 4) return 0.5;
  if (passed === 5) return 1;
  if (passed === 6) return 1.5;
  if (passed === 7) return 2;
  if (passed === 8) return 3;
  if (passed === 9) return 3.5;
  return 4;
}

function getLetterGrade(roundedOgpa) {
  if (roundedOgpa >= 3.5) return "A";
  if (roundedOgpa >= 2.5) return "B";
  if (roundedOgpa >= 1.8) return "C";
  if (roundedOgpa >= 0.5) return "D";
  return "F";
}

function renderResults() {
  const rawOgpa = components.reduce((sum, item) => sum + state.gradePoints[item.id] * item.weight, 0);
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
    const points = state.gradePoints[item.id];
    const contribution = points * item.weight;
    return `<div class="contribution-row"><span>${item.code} · ${points.toFixed(2)} × ${Math.round(item.weight * 100)}%</span><strong>${contribution.toFixed(2)}</strong></div>`;
  }).join("");
}

function updateLop() {
  const parsed = Number(loPassedInput.value);
  const isValid = loPassedInput.value !== "" && Number.isInteger(parsed) && parsed >= 0 && parsed <= 10;

  if (!isValid) {
    loPassedError.textContent = "Enter a whole number from 0 to 10.";
    loPassedInput.setAttribute("aria-invalid", "true");
    return;
  }

  loPassedError.textContent = "";
  loPassedInput.removeAttribute("aria-invalid");
  const points = getLopGradePoint(parsed);
  state.gradePoints.lop = points;
  lopGradePoint.textContent = points.toFixed(1);
  renderResults();
}

function updateCategory(category, card) {
  const scores = state.scores[category.id];
  const obtained = scores.reduce((sum, value) => sum + value, 0);
  const total = scores.length * category.maximum;
  const percentage = total > 0 ? (obtained / total) * 100 : 0;
  const points = total > 0 ? clamp((obtained / total) * 4, 0, 4) : 0;

  state.gradePoints[category.id] = points;
  card.querySelector(".marks-summary").textContent = `${obtained.toFixed(1)} / ${total} marks · ${percentage.toFixed(1)}%`;
  card.querySelector(".points-summary").textContent = `${points.toFixed(2)} / 4`;
  renderResults();
}

function createMarkField(category, card, index) {
  const field = markTemplate.content.firstElementChild.cloneNode(true);
  const input = field.querySelector(".mark-input");
  const error = field.querySelector(".mark-error");

  field.querySelector(".mark-label").textContent = `${category.itemName} ${index + 1}`;
  field.querySelector(".mark-maximum").textContent = `/ ${category.maximum}`;
  input.id = `${category.id}-mark-${index + 1}`;
  input.name = `${category.id}-mark-${index + 1}`;
  input.max = String(category.maximum);
  input.value = (state.scores[category.id][index] ?? 0).toFixed(1);

  input.addEventListener("input", () => {
    const parsed = Number(input.value);
    const isValid = input.value !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= category.maximum;

    if (!isValid) {
      error.textContent = `Use 0–${category.maximum}.`;
      input.setAttribute("aria-invalid", "true");
      return;
    }

    error.textContent = "";
    input.removeAttribute("aria-invalid");
    state.scores[category.id][index] = parsed;
    updateCategory(category, card);
  });

  input.addEventListener("blur", () => {
    if (input.value === "" || input.getAttribute("aria-invalid") === "true") {
      input.value = (state.scores[category.id][index] ?? 0).toFixed(1);
      error.textContent = "";
      input.removeAttribute("aria-invalid");
      return;
    }
    input.value = Number(input.value).toFixed(1);
  });

  return field;
}

function renderMarkFields(category, card, count) {
  const marksGrid = card.querySelector(".marks-grid");
  const existing = state.scores[category.id];
  state.scores[category.id] = Array.from({ length: count }, (_, index) => existing[index] ?? 0);
  marksGrid.replaceChildren(...state.scores[category.id].map((_, index) => createMarkField(category, card, index)));
  updateCategory(category, card);
}

assessmentCategories.forEach((category) => {
  const card = document.querySelector(`[data-category="${category.id}"]`);
  const countInput = card.querySelector(`#${category.id}-count`);
  const countError = card.querySelector(".count-error");

  countInput.addEventListener("input", () => {
    const parsed = Number(countInput.value);
    const maximum = Number(countInput.max);
    const isValid = countInput.value !== "" && Number.isInteger(parsed) && parsed >= 0 && parsed <= maximum;

    if (!isValid) {
      countError.textContent = `Enter a whole number from 0 to ${maximum}.`;
      countInput.setAttribute("aria-invalid", "true");
      return;
    }

    countError.textContent = "";
    countInput.removeAttribute("aria-invalid");
    renderMarkFields(category, card, parsed);
  });

  renderMarkFields(category, card, 0);
});

loPassedInput.addEventListener("input", updateLop);

document.querySelector("#ogpa-form").addEventListener("reset", () => {
  window.requestAnimationFrame(() => {
    state.gradePoints = Object.fromEntries(components.map(({ id }) => [id, 0]));
    lopGradePoint.textContent = "0.0";
    loPassedError.textContent = "";
    loPassedInput.removeAttribute("aria-invalid");

    assessmentCategories.forEach((category) => {
      const card = document.querySelector(`[data-category="${category.id}"]`);
      const countInput = card.querySelector(`#${category.id}-count`);
      countInput.removeAttribute("aria-invalid");
      card.querySelector(".count-error").textContent = "";
      state.scores[category.id] = [];
      renderMarkFields(category, card, 0);
    });

    renderResults();
  });
});

updateLop();
