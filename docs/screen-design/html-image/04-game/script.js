"use strict";

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  // ラン開始情報の送信後にサーバーから受け取る値
  runId: "run-20260919-0001",
  seed: 483920175,

  mode: "通常モード",
  difficulty: "普通",

  floorCount: 3, // フロア数（動作確認を短くしたいときは減らす）
  questionsPerFloor: 20, // 1フロアの問題数（同上）

  timeLimitMs: 8000, // 1問あたりの制限時間
  warningRatio: 0.3, // 残り時間がこの割合を切ったら赤くする

  maxConsciousness: 3, // 不正解のたびに減り、0になると眠る
  wakingBell: 1, // 目覚めの鈴の所持数

  baseScore: 100, // 正解1問ごとの固定点
  speedBonusMax: 50, // 残り時間に応じて加算される点の最大値
  comboStep: 0.1, // 連続正解1回ごとに増える倍率
  awakenScoreRatio: 0.7, // 目覚めたときにスコアへ掛ける割合
  awakenConsciousness: 2, // 目覚めたときに戻る意識

  rewardAdSeconds: 3, // リワード広告の長さ（デモ用に短くしてあります）
  answerFeedbackMs: 500, // 正誤を見せてから次の問題に進むまでの時間
  toastDuration: 1800,

  bgmVolume: 70,
  seVolume: 70,

  guardians: ["石守りのゴーレム", "刻を継ぐ番人", "深層の守護者"],

  // 遺物はフロア開始時に3つ提示され、そのうち1つを選ぶ
  relics: [
    { name: "砂時計の欠片", rarity: "★★", effect: "制限時間が1秒のびる" },
    { name: "静寂の羽根", rarity: "★", effect: "意識が1回復する" },
    { name: "連なりの護符", rarity: "★★★", effect: "連続正解の倍率が2倍になる" },
    { name: "石英のペンダント", rarity: "★", effect: "ベースのスコアが20%上がる" },
    { name: "反響の水晶", rarity: "★★", effect: "速度ボーナスが1.5倍になる" },
    { name: "古びた羅針盤", rarity: "★★", effect: "問題がやさしい範囲に寄る" },
  ],

  errorMessages: {
    runStart: "ゲームを開始できません。",
    runResult: "スコアを送信できませんでした。",
  },
};

// ==========================================================
// 画面の状態
// ==========================================================
const state = {
  floor: 1,
  questionIndex: 0,
  score: 0,
  combo: 0,
  consciousness: CONFIG.maxConsciousness,
  bell: CONFIG.wakingBell,
  question: null,
  remainingMs: CONFIG.timeLimitMs,
  paused: false,
  running: false,
  tickerId: null,
};

// ==========================================================
// 要素の取得
// ==========================================================
const floorLabelEl = document.getElementById("floorLabel");
const consciousnessValueEl = document.getElementById("consciousnessValue");
const bellValueEl = document.getElementById("bellValue");
const scoreValueEl = document.getElementById("scoreValue");
const comboValueEl = document.getElementById("comboValue");

const battleAreaEl = document.getElementById("battleArea");
const guardianNameEl = document.getElementById("guardianName");
const questionCountEl = document.getElementById("questionCount");
const questionTextEl = document.getElementById("questionText");
const questionHiddenEl = document.getElementById("questionHidden");
const timeFillEl = document.getElementById("timeFill");
const choiceGridEl = document.getElementById("choiceGrid");

const relicAreaEl = document.getElementById("relicArea");
const relicListEl = document.getElementById("relicList");

const navToastEl = document.getElementById("navToast");

const howToModalEl = document.getElementById("howToModal");
const howToCloseEl = document.getElementById("howToClose");

const pauseModalEl = document.getElementById("pauseModal");
const pauseButtonEl = document.getElementById("pauseButton");
const resumeButtonEl = document.getElementById("resumeButton");
const bgmVolumeEl = document.getElementById("bgmVolume");
const seVolumeEl = document.getElementById("seVolume");

const bellModalEl = document.getElementById("bellModal");
const bellAcceptEl = document.getElementById("bellAccept");
const bellDeclineEl = document.getElementById("bellDecline");

const rewardAdModalEl = document.getElementById("rewardAdModal");
const rewardAdCountdownEl = document.getElementById("rewardAdCountdown");

const errorModalEl = document.getElementById("errorModal");
const errorMessageEl = document.getElementById("errorMessage");
const errorNoteEl = document.getElementById("errorNote");
const reconnectButtonEl = document.getElementById("reconnectButton");

const previewStartErrorEl = document.getElementById("previewStartError");
const previewResultErrorEl = document.getElementById("previewResultError");

// ==========================================================
// 画面遷移の代わりの通知
// ==========================================================
let navToastTimer = null;

function showNavToast(label) {
  navToastEl.textContent = "（本来は" + label + "画面へ遷移）";
  navToastEl.classList.add("show");
  clearTimeout(navToastTimer);
  navToastTimer = setTimeout(() => navToastEl.classList.remove("show"), CONFIG.toastDuration);
}

function closeAllModals() {
  pauseModalEl.hidden = true;
  bellModalEl.hidden = true;
  errorModalEl.hidden = true;
}

document.querySelectorAll("[data-nav]").forEach((el) => {
  el.addEventListener("click", () => {
    showNavToast(el.dataset.nav);
    closeAllModals();
  });
});

// ==========================================================
// HUDの描画
// ==========================================================
function renderHud() {
  floorLabelEl.textContent = "B" + state.floor + " ・ " + CONFIG.mode;

  const filled = "♥".repeat(state.consciousness);
  const empty = "♡".repeat(CONFIG.maxConsciousness - state.consciousness);
  consciousnessValueEl.textContent = "意識 " + filled + empty;

  bellValueEl.textContent = "🔔 " + state.bell;
  scoreValueEl.textContent = Math.floor(state.score).toLocaleString();
  comboValueEl.textContent = state.combo > 0 ? state.combo + " 連続正解" : "連続正解 -";
}

// ==========================================================
// 問題の生成（本来はサーバーから受け取ったシードを基に作る）
// ==========================================================
function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function createQuestion() {
  const left = 2 + Math.floor(Math.random() * 97);
  const right = 2 + Math.floor(Math.random() * 97);
  const isPlus = Math.random() < 0.5;

  const large = Math.max(left, right);
  const small = Math.min(left, right);

  const answer = isPlus ? left + right : large - small;
  const text = isPlus ? left + " + " + right : large + " − " + small;

  const choices = new Set([answer]);
  while (choices.size < 4) {
    const noise = answer + (Math.floor(Math.random() * 21) - 10);
    if (noise >= 0) choices.add(noise);
  }

  return { text: text, answer: answer, choices: shuffle(Array.from(choices)) };
}

// ==========================================================
// 計算モード
// ==========================================================
function startFloorQuestions() {
  relicAreaEl.hidden = true;
  battleAreaEl.hidden = false;
  state.questionIndex = 0;
  guardianNameEl.textContent = CONFIG.guardians[(state.floor - 1) % CONFIG.guardians.length];
  nextQuestion();
}

function nextQuestion() {
  if (state.questionIndex >= CONFIG.questionsPerFloor) {
    finishFloor();
    return;
  }

  state.questionIndex += 1;
  state.question = createQuestion();
  state.remainingMs = CONFIG.timeLimitMs;
  state.running = true;

  questionCountEl.textContent = state.questionIndex + " / " + CONFIG.questionsPerFloor + " 問目";
  questionTextEl.textContent = state.question.text;
  renderChoices();
  renderTimeBar();
  startTicker();
}

function renderChoices() {
  choiceGridEl.replaceChildren();

  state.question.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.textContent = choice;
    button.addEventListener("click", () => answer(button, choice));
    choiceGridEl.append(button);
  });
}

function renderTimeBar() {
  const ratio = Math.max(0, state.remainingMs / CONFIG.timeLimitMs);
  timeFillEl.style.width = ratio * 100 + "%";
  timeFillEl.classList.toggle("warning", ratio <= CONFIG.warningRatio);
}

function startTicker() {
  clearInterval(state.tickerId);
  state.tickerId = setInterval(() => {
    if (state.paused) return;
    if (!state.running) return;

    state.remainingMs -= 100;
    renderTimeBar();

    // 制限時間内に解答しなかった場合は不正解になる
    if (state.remainingMs <= 0) judge(null, false);
  }, 100);
}

function answer(button, value) {
  if (!state.running) return;
  judge(button, value === state.question.answer);
}

function markCorrectChoice() {
  Array.from(choiceGridEl.children).forEach((child) => {
    if (Number(child.textContent) === state.question.answer) child.classList.add("correct");
  });
}

function judge(button, isCorrect) {
  state.running = false;
  clearInterval(state.tickerId);

  if (isCorrect) {
    state.combo += 1;
    const speedBonus = CONFIG.speedBonusMax * (state.remainingMs / CONFIG.timeLimitMs);
    const multiplier = 1 + (state.combo - 1) * CONFIG.comboStep;
    state.score += (CONFIG.baseScore + speedBonus) * multiplier;
    if (button) button.classList.add("correct");
  } else {
    state.combo = 0;
    state.consciousness -= 1;
    if (button) button.classList.add("wrong");
    markCorrectChoice();
  }

  renderHud();

  setTimeout(() => {
    if (state.consciousness <= 0) {
      handleSleep();
      return;
    }
    nextQuestion();
  }, CONFIG.answerFeedbackMs);
}

// ==========================================================
// フロアの進行（遺物選択モードと計算モードをループする）
// ==========================================================
function showRelicSelection() {
  battleAreaEl.hidden = true;
  relicAreaEl.hidden = false;
  relicListEl.replaceChildren();

  shuffle(CONFIG.relics).slice(0, 3).forEach((relic) => {
    const card = document.createElement("button");
    card.className = "relic-card";

    const head = document.createElement("div");
    head.className = "relic-card-head";

    const name = document.createElement("span");
    name.className = "relic-card-name";
    name.textContent = relic.name;

    const rarity = document.createElement("span");
    rarity.className = "relic-card-rarity";
    rarity.textContent = relic.rarity;

    head.append(name, rarity);

    const effect = document.createElement("p");
    effect.className = "relic-card-effect";
    effect.textContent = relic.effect;

    card.append(head, effect);
    card.addEventListener("click", startFloorQuestions);
    relicListEl.append(card);
  });
}

function finishFloor() {
  if (state.floor >= CONFIG.floorCount) {
    finishRun("クリア");
    return;
  }

  state.floor += 1;
  renderHud();
  showRelicSelection();
}

// ==========================================================
// ランの終了（結果をサーバーに送ってから結果画面へ進む）
// ==========================================================
function finishRun(reason) {
  clearInterval(state.tickerId);
  state.running = false;
  showNavToast(reason + " ・ 結果");
}

// ==========================================================
// 眠り・目覚め
// ==========================================================
function playRewardAd() {
  rewardAdModalEl.hidden = false;
  let remaining = CONFIG.rewardAdSeconds;
  rewardAdCountdownEl.textContent = "あと " + remaining + " 秒";

  const adTimerId = setInterval(() => {
    remaining -= 1;
    rewardAdCountdownEl.textContent = "あと " + remaining + " 秒";

    if (remaining > 0) return;

    clearInterval(adTimerId);
    rewardAdModalEl.hidden = true;
    awaken();
  }, 1000);
}

// 視聴が完了したらスコアを70%にして意識を2戻し、ゲームを再開する
function awaken() {
  state.score = Math.floor(state.score * CONFIG.awakenScoreRatio);
  state.consciousness = CONFIG.awakenConsciousness;
  state.bell -= 1;
  renderHud();
  nextQuestion();
}

function handleSleep() {
  // 目覚めの鈴が残っていれば、使うかどうかを確認する
  if (state.bell > 0) {
    bellModalEl.hidden = false;
    return;
  }
  finishRun("眠り");
}

bellAcceptEl.addEventListener("click", () => {
  bellModalEl.hidden = true;
  playRewardAd();
});

bellDeclineEl.addEventListener("click", () => {
  bellModalEl.hidden = true;
  finishRun("眠り");
});

// ==========================================================
// ポーズ（制限時間を止め、問題を隠す）
// ==========================================================
function openPause() {
  state.paused = true;
  questionTextEl.hidden = true;
  questionHiddenEl.hidden = false;
  pauseModalEl.hidden = false;
}

function closePause() {
  state.paused = false;
  questionTextEl.hidden = false;
  questionHiddenEl.hidden = true;
  pauseModalEl.hidden = true;
}

pauseButtonEl.addEventListener("click", openPause);
resumeButtonEl.addEventListener("click", closePause);

// アプリがバックグラウンドに移ったときもポーズにする
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (state.running) openPause();
  }
});

bgmVolumeEl.addEventListener("input", () => {
  CONFIG.bgmVolume = Number(bgmVolumeEl.value); // 本来は端末側に保存する
});
seVolumeEl.addEventListener("input", () => {
  CONFIG.seVolume = Number(seVolumeEl.value); // 本来は端末側に保存する
});

// ==========================================================
// エラーモーダル
// ==========================================================
function showErrorModal(message, withNote) {
  clearInterval(state.tickerId);
  state.running = false;
  errorMessageEl.textContent = message;
  errorNoteEl.hidden = !withNote;
  errorModalEl.hidden = false;
}

reconnectButtonEl.addEventListener("click", () => {
  errorModalEl.hidden = true;
  startRun();
});

// ==========================================================
// ランの開始（遊び方を見せてから始める）
// ==========================================================
function startRun() {
  state.floor = 1;
  state.questionIndex = 0;
  state.score = 0;
  state.combo = 0;
  state.consciousness = CONFIG.maxConsciousness;
  state.bell = CONFIG.wakingBell;
  state.paused = false;

  renderHud();
  battleAreaEl.hidden = false;
  relicAreaEl.hidden = true;
  howToModalEl.hidden = false;
}

howToCloseEl.addEventListener("click", () => {
  howToModalEl.hidden = true;
  startFloorQuestions();
});

// ==========================================================
// 例外系の表示を確認するためのボタン（実際の操作フローとは独立したデモ用）
// ==========================================================
previewStartErrorEl.addEventListener("click", () => {
  howToModalEl.hidden = true;
  showErrorModal(CONFIG.errorMessages.runStart, false);
});

previewResultErrorEl.addEventListener("click", () => {
  howToModalEl.hidden = true;
  showErrorModal(CONFIG.errorMessages.runResult, true);
});

// ==========================================================
// 初期表示
// ==========================================================
bgmVolumeEl.value = CONFIG.bgmVolume;
seVolumeEl.value = CONFIG.seVolume;
startRun();
