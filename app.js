const state = {
  currentEmotion: null,
  emotionLog: [
    { label: "nervous", time: "Before court" },
    { label: "confused", time: "Document review" },
  ],
  helpChances: 3,
  selectedHelp: "",
  helpRequests: [],
  documentResponses: [],
};

const emotions = [
  { label: "anxious", face: ":-|" },
  { label: "confused", face: "?" },
  { label: "relaxed", face: ":)" },
  { label: "happy", face: ":D" },
  { label: "scared", face: ":(" },
  { label: "nervous", face: ":/" },
];

const helpOptions = [
  "I do not understand",
  "I feel scared",
  "I need a break",
  "Can someone explain this?",
];

const screens = [...document.querySelectorAll(".screen")];
const navButtons = [...document.querySelectorAll("[data-screen]")];
const emotionGrid = document.querySelector("#emotionGrid");
const presetGrid = document.querySelector("#presetGrid");
const emotionConfirmation = document.querySelector("#emotionConfirmation");
const helpConfirmation = document.querySelector("#helpConfirmation");
const helpText = document.querySelector("#helpText");
const helpChances = document.querySelector("#helpChances");
const decisionModal = document.querySelector("#decisionModal");
const brandButton = document.querySelector(".brand-mark");

function showScreen(screenId) {
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === screenId));
  document.querySelectorAll(".rail-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === screenId);
  });
  brandButton.classList.toggle("active", screenId === "staff");
  render();
}

function renderEmotions() {
  emotionGrid.innerHTML = emotions
    .map(
      (emotion) => `
        <button class="emotion-button ${state.currentEmotion === emotion.label ? "selected" : ""}"
          data-emotion="${emotion.label}" aria-pressed="${state.currentEmotion === emotion.label}">
          <span class="emotion-face">${emotion.face}</span>
          <span class="emotion-label">${emotion.label}</span>
        </button>
      `,
    )
    .join("");
}

function renderHelpOptions() {
  presetGrid.innerHTML = helpOptions
    .map(
      (option) => `
        <button class="preset-button ${state.selectedHelp === option ? "selected" : ""}"
          data-help="${option}" aria-pressed="${state.selectedHelp === option}">
          ${option}
        </button>
      `,
    )
    .join("");
  helpChances.textContent = state.helpChances;
}

function countResponses(type) {
  return state.documentResponses.filter((response) => response.type === type).length;
}

function renderUnderstanding() {
  const understood = countResponses("understood");
  const unsure = countResponses("unsure");
  const review = countResponses("review");
  const cards = [
    { title: "Understood", score: understood, tone: "mint", note: "The child chose 'I understand'." },
    { title: "Unsure", score: unsure, tone: "peach", note: "Needs a support worker check-in." },
    { title: "Needs explanation", score: review, tone: "lavender", note: "Marked to review later." },
  ];

  document.querySelector("#understandingCards").innerHTML = cards
    .map(
      (card) => `
        <article class="result-card ${card.tone}">
          <strong>${card.title}</strong>
          <div class="score">${card.score}</div>
          <small>${card.note}</small>
        </article>
      `,
    )
    .join("");

  const followUpItems = state.documentResponses.filter((response) => response.type !== "understood");
  document.querySelector("#followUpList").innerHTML = followUpItems.length
    ? followUpItems.map((item) => `<div class="log-item">${item.label}<small>${item.time}</small></div>`).join("")
    : "No items have been marked yet.";
}

function renderStaffView() {
  const understood = countResponses("understood");
  const unsure = countResponses("unsure");
  const review = countResponses("review");

  document.querySelector("#staffUnderstandingSummary").innerHTML = [
    { label: "Understood", value: understood },
    { label: "Unsure", value: unsure },
    { label: "Needs explanation", value: review },
  ]
    .map(
      (item) => `
        <div class="summary-pill">
          <strong>${item.value}</strong>
          <span>${item.label}</span>
        </div>
      `,
    )
    .join("");

  document.querySelector("#emotionTimeline").innerHTML = state.emotionLog
    .map((entry, index) => {
      const height = 42 + index * 16;
      return `
        <div class="bar-wrap">
          <div class="bar" style="height: ${height}px"></div>
          <span>${entry.label}</span>
        </div>
      `;
    })
    .join("");

  document.querySelector("#staffQuestions").innerHTML = state.helpRequests.length
    ? state.helpRequests
        .map((request) => `<div class="log-item">${request.message}<small>${request.time}</small></div>`)
        .join("")
    : "No help requests yet.";

  const unclear = state.documentResponses.filter((response) => response.type === "unsure");
  document.querySelector("#staffDocuments").innerHTML = unclear.length
    ? unclear.map((item) => `<div class="log-item">${item.label}<small>${item.time}</small></div>`).join("")
    : "No unclear document items yet.";

  const reviewLater = state.documentResponses.filter((response) => response.type === "review");
  document.querySelector("#reviewLater").innerHTML = reviewLater.length
    ? reviewLater.map((item) => `<div class="log-item">${item.label}<small>${item.time}</small></div>`).join("")
    : "No review-later items yet.";
}

function render() {
  renderEmotions();
  renderHelpOptions();
  renderUnderstanding();
  renderStaffView();
}

function getTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

document.addEventListener("click", (event) => {
  const navTarget = event.target.closest("[data-screen]");
  if (navTarget) {
    showScreen(navTarget.dataset.screen);
    return;
  }

  const emotionTarget = event.target.closest("[data-emotion]");
  if (emotionTarget) {
    state.currentEmotion = emotionTarget.dataset.emotion;
    emotionConfirmation.textContent = "";
    renderEmotions();
    return;
  }

  const helpTarget = event.target.closest("[data-help]");
  if (helpTarget) {
    state.selectedHelp = helpTarget.dataset.help;
    helpConfirmation.textContent = "";
    renderHelpOptions();
    return;
  }

  const decisionTarget = event.target.closest("[data-decision]");
  if (decisionTarget) {
    const type = decisionTarget.dataset.decision;
    const labels = {
      understood: "Court decision understood",
      unsure: "Court decision marked as not sure",
      review: "Court decision marked review later",
    };
    state.documentResponses.push({
      type,
      label: labels[type],
      time: getTimeLabel(),
    });
    decisionModal.classList.add("hidden");
    showScreen(type === "understood" ? "understanding" : "staff");
  }
});

document.querySelector("#submitEmotion").addEventListener("click", () => {
  if (!state.currentEmotion) {
    emotionConfirmation.textContent = "Please choose a feeling first.";
    return;
  }

  state.emotionLog.push({ label: state.currentEmotion, time: getTimeLabel() });
  emotionConfirmation.textContent = "Thank you. A support worker can see how you are feeling.";
  renderStaffView();
});

document.querySelector("#sendHelp").addEventListener("click", () => {
  const typedMessage = helpText.value.trim();
  const message = typedMessage || state.selectedHelp;

  if (!message) {
    helpConfirmation.textContent = "Please choose a message or type one.";
    return;
  }

  if (state.helpChances <= 0) {
    helpConfirmation.textContent = "A support worker has already been notified.";
    return;
  }

  state.helpRequests.push({ message, time: getTimeLabel() });
  state.helpChances -= 1;
  state.selectedHelp = "";
  helpText.value = "";
  helpConfirmation.textContent = "Your message has been sent quietly.";
  render();
});

document.querySelector("#openDecision").addEventListener("click", () => {
  decisionModal.classList.remove("hidden");
});

decisionModal.addEventListener("click", (event) => {
  if (event.target === decisionModal) {
    decisionModal.classList.add("hidden");
  }
});

render();
