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
const loTotalInput = document.querySelector("#lo-total");
const loTotalError = document.querySelector("#lo-total-error");
const loTotalDisplay = document.querySelector("#lo-total-display");
const loPassedInput = document.querySelector("#lo-passed");
const loPassedError = document.querySelector("#lo-passed-error");
const lopGradePoint = document.querySelector("#lop-grade-point");
const lopPercentage = document.querySelector("#lop-percentage");
const upgradeCard = document.querySelector("#upgrade-card");
const upgradeRoute = document.querySelector("#upgrade-route");
const gradeGap = document.querySelector("#grade-gap");
const gapSuffix = document.querySelector("#gap-suffix");
const upgradeNote = document.querySelector("#upgrade-note");

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getLopGradePoint(passed, total) {
  const passRate = passed / total;
  if (passRate < 0.4) return 0;
  if (passRate < 0.5) return 0.5;
  if (passRate < 0.6) return 1;
  if (passRate < 0.7) return 1.5;
  if (passRate < 0.8) return 2;
  if (passRate < 0.9) return 3;
  if (passRate < 1) return 3.5;
  return 4;
}

function getLetterGrade(roundedOgpa) {
  if (roundedOgpa >= 3.5) return "A";
  if (roundedOgpa >= 2.5) return "B";
  if (roundedOgpa >= 1.8) return "C";
  if (roundedOgpa >= 0.5) return "D";
  return "F";
}

function renderUpgradeTarget(grade, roundedOgpa) {
  const targets = {
    F: { next: "D", threshold: 0.5 },
    D: { next: "C", threshold: 1.8 },
    C: { next: "B", threshold: 2.5 },
    B: { next: "A", threshold: 3.5 }
  };

  if (grade === "A") {
    upgradeCard.classList.add("is-complete");
    upgradeRoute.textContent = "A achieved";
    gradeGap.textContent = "Top grade";
    gapSuffix.textContent = "";
    upgradeNote.textContent = "You have reached the highest letter-grade band.";
    return;
  }

  const target = targets[grade];
  const gap = Math.max(0, target.threshold - roundedOgpa);
  upgradeCard.classList.remove("is-complete");
  upgradeRoute.textContent = `${grade} → ${target.next}`;
  gradeGap.textContent = gap.toFixed(1);
  gapSuffix.textContent = " more";
  upgradeNote.textContent = `Reach an OGPA of ${target.threshold.toFixed(1)} for ${target.next === "A" ? "an" : "a"} ${target.next}.`;
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
  renderUpgradeTarget(grade, roundedOgpa);

  contributionList.innerHTML = components.map((item) => {
    const points = state.gradePoints[item.id];
    const contribution = points * item.weight;
    return `<div class="contribution-row"><span>${item.code} · ${points.toFixed(2)} × ${Math.round(item.weight * 100)}%</span><strong>${contribution.toFixed(2)}</strong></div>`;
  }).join("");
}

function updateLop() {
  const total = Number(loTotalInput.value);
  const hasTotal = loTotalInput.value !== "";
  const totalIsValid = hasTotal && Number.isInteger(total) && total >= 1 && total <= 100;

  if (!hasTotal) {
    loTotalError.textContent = "";
    loTotalInput.removeAttribute("aria-invalid");
    loPassedInput.disabled = true;
    loPassedInput.max = "0";
    loPassedInput.value = "0";
    loTotalDisplay.textContent = "—";
    lopPercentage.textContent = "Enter the total LOs to begin.";
    state.gradePoints.lop = 0;
    lopGradePoint.textContent = "0.0";
    renderResults();
    return;
  }

  if (!totalIsValid) {
    loTotalError.textContent = "Enter a whole number from 1 to 100.";
    loTotalInput.setAttribute("aria-invalid", "true");
    loPassedInput.disabled = true;
    return;
  }

  loTotalError.textContent = "";
  loTotalInput.removeAttribute("aria-invalid");
  loPassedInput.disabled = false;
  loPassedInput.max = String(total);
  loTotalDisplay.textContent = String(total);

  const passed = Number(loPassedInput.value);
  const isValid = loPassedInput.value !== "" && Number.isInteger(passed) && passed >= 0 && passed <= total;

  if (!isValid) {
    loPassedError.textContent = `Enter a whole number from 0 to ${total}.`;
    loPassedInput.setAttribute("aria-invalid", "true");
    return;
  }

  loPassedError.textContent = "";
  loPassedInput.removeAttribute("aria-invalid");
  const points = getLopGradePoint(passed, total);
  const passRate = (passed / total) * 100;
  state.gradePoints.lop = points;
  lopGradePoint.textContent = points.toFixed(1);
  lopPercentage.textContent = `${passed} of ${total} passed · ${passRate.toFixed(1)}%`;
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

loTotalInput.addEventListener("input", updateLop);
loPassedInput.addEventListener("input", updateLop);

document.querySelector("#ogpa-form").addEventListener("reset", () => {
  window.requestAnimationFrame(() => {
    state.gradePoints = Object.fromEntries(components.map(({ id }) => [id, 0]));
    lopGradePoint.textContent = "0.0";
    lopPercentage.textContent = "Enter the total LOs to begin.";
    loTotalDisplay.textContent = "—";
    loTotalError.textContent = "";
    loPassedError.textContent = "";
    loTotalInput.removeAttribute("aria-invalid");
    loPassedInput.removeAttribute("aria-invalid");
    loPassedInput.disabled = true;
    loPassedInput.max = "0";

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
