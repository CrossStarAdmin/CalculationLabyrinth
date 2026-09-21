"use strict";

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  coin: 1200,
  gem: 20,

  toastDuration: 1800, // 通知が自動で消えるまでの時間（ミリ秒）

  // モード一覧。値段は仮（別資料で決定予定）
  modes: [
    { id: "casual", name: "お手軽モード", desc: "1フロア20問。短時間で遊べる基本の構成。", unlocked: true, coinPrice: 0, gemPrice: 0 },
    { id: "standard", name: "通常モード", desc: "3フロア。遺物を選びながら進む標準の構成。", unlocked: true, coinPrice: 0, gemPrice: 0 },
    { id: "longJourney", name: "長旅モード", desc: "5フロア。長く積み上げるハイスコア向けの構成。", unlocked: false, coinPrice: 3000, gemPrice: 30 },
    { id: "noRelic", name: "遺物なしモード", desc: "遺物なし。計算力だけで勝負する構成。", unlocked: false, coinPrice: 2000, gemPrice: 20 },
    { id: "endless", name: "エンドレスモード", desc: "眠るまで終わらない。どこまで行けるかに挑む構成。", unlocked: false, coinPrice: 5000, gemPrice: 50 },
  ],

  // 難易度一覧。解放状況はモードごとに持つ（モード解放時は簡単・普通が開く）
  difficulties: [
    { id: "easy", name: "簡単", coinPrice: 0, gemPrice: 0 },
    { id: "normal", name: "普通", coinPrice: 0, gemPrice: 0 },
    { id: "hard", name: "難しい", coinPrice: 1500, gemPrice: 15 },
    { id: "nightmare", name: "鬼難", coinPrice: 3000, gemPrice: 30 },
  ],

  // モードID -> 解放済み難易度ID
  unlockedDifficulties: {
    casual: ["easy", "normal", "hard"],
    standard: ["easy", "normal"],
    longJourney: [],
    noRelic: [],
    endless: [],
  },

  // モードID -> 難易度IDごとの自己ベスト（モードが選ばれたときに取得する想定）
  bestScores: {
    casual: { easy: 12400, normal: 9800, hard: 4200 },
    standard: { easy: 21500, normal: 15600 },
  },

  bestScoreFailedText: "取得できません。", // ベストスコアが取れないときの表示
};

// ==========================================================
// 画面の状態
// ==========================================================
const state = {
  selectedModeId: null,
  selectedDifficultyId: null,
  bestScoreFailed: false, // ベストスコアの取得に失敗したか
  unlockTarget: null, // 解放しようとしている対象
  payCurrency: "coin", // 解放モーダルで選んでいる通貨
};

// ==========================================================
// 要素の取得
// ==========================================================
const coinValueEl = document.getElementById("coinValue");
const gemValueEl = document.getElementById("gemValue");
const modeListEl = document.getElementById("modeList");
const detailPanelEl = document.getElementById("detailPanel");
const detailNameEl = document.getElementById("detailName");
const detailDescEl = document.getElementById("detailDesc");
const difficultyListEl = document.getElementById("difficultyList");
const challengeButtonEl = document.getElementById("challengeButton");

const navToastEl = document.getElementById("navToast");
const errorToastEl = document.getElementById("errorToast");
const errorToastMessageEl = document.getElementById("errorToastMessage");
const successToastEl = document.getElementById("successToast");
const successToastMessageEl = document.getElementById("successToastMessage");

const unlockModalEl = document.getElementById("unlockModal");
const unlockTitleEl = document.getElementById("unlockTitle");
const unlockCoinPriceEl = document.getElementById("unlockCoinPrice");
const unlockGemPriceEl = document.getElementById("unlockGemPrice");
const unlockCancelEl = document.getElementById("unlockCancel");
const unlockConfirmEl = document.getElementById("unlockConfirm");

const previewBestScoreErrorEl = document.getElementById("previewBestScoreError");
const previewUnlockErrorEl = document.getElementById("previewUnlockError");

// ==========================================================
// 通知（画面遷移の代わり・アラート相当）
// ==========================================================
const toastTimers = new Map();

function showToast(el) {
  el.classList.add("show");
  clearTimeout(toastTimers.get(el));
  toastTimers.set(el, setTimeout(() => el.classList.remove("show"), CONFIG.toastDuration));
}

function showNavToast(label) {
  navToastEl.textContent = "（本来は" + label + "画面へ遷移）";
  showToast(navToastEl);
}

function showErrorToast(message) {
  errorToastMessageEl.textContent = message;
  showToast(errorToastEl);
}

function showSuccessToast(message) {
  successToastMessageEl.textContent = message;
  showToast(successToastEl);
}

// ==========================================================
// 描画
// ==========================================================
function renderCurrency() {
  coinValueEl.textContent = CONFIG.coin.toLocaleString();
  gemValueEl.textContent = CONFIG.gem.toLocaleString();
}

function findMode(modeId) {
  return CONFIG.modes.find((mode) => mode.id === modeId);
}

function priceText(item) {
  return "● " + item.coinPrice.toLocaleString() + " / ◆ " + item.gemPrice;
}

function renderModeList() {
  modeListEl.replaceChildren();

  CONFIG.modes.forEach((mode) => {
    const button = document.createElement("button");
    button.className = "mode-row";
    if (!mode.unlocked) button.classList.add("locked");
    if (mode.id === state.selectedModeId) button.classList.add("selected");

    const icon = document.createElement("span");
    icon.className = "mode-row-icon";
    icon.textContent = mode.unlocked ? "⚔" : "🔒";

    const name = document.createElement("span");
    name.className = "mode-row-name";
    name.textContent = mode.name;

    button.append(icon, name);

    if (!mode.unlocked) {
      const price = document.createElement("span");
      price.className = "mode-row-price";
      price.textContent = priceText(mode);
      button.append(price);
    }

    button.addEventListener("click", () => {
      if (mode.unlocked) {
        selectMode(mode.id);
        return;
      }
      openUnlockModal({ type: "mode", mode: mode });
    });

    modeListEl.append(button);
  });
}

// ベストスコアは取得できなくても進行に支障はないため、文言だけ差し替える
function bestScoreText(modeId, difficultyId) {
  if (state.bestScoreFailed) return CONFIG.bestScoreFailedText;

  const best = (CONFIG.bestScores[modeId] || {})[difficultyId];
  return best === undefined ? "ベスト -" : "ベスト " + best.toLocaleString();
}

function renderDifficultyList() {
  difficultyListEl.replaceChildren();

  const modeId = state.selectedModeId;
  const unlockedIds = CONFIG.unlockedDifficulties[modeId] || [];

  CONFIG.difficulties.forEach((difficulty) => {
    const unlocked = unlockedIds.includes(difficulty.id);

    const cell = document.createElement("button");
    cell.className = "difficulty-cell";
    if (!unlocked) cell.classList.add("locked");
    if (difficulty.id === state.selectedDifficultyId) cell.classList.add("selected");

    const name = document.createElement("span");
    name.className = "difficulty-name";
    name.textContent = unlocked ? difficulty.name : "🔒 " + difficulty.name;

    const sub = document.createElement("span");
    sub.className = unlocked ? "difficulty-best" : "difficulty-price";
    sub.textContent = unlocked ? bestScoreText(modeId, difficulty.id) : priceText(difficulty);

    cell.append(name, sub);

    cell.addEventListener("click", () => {
      if (unlocked) {
        state.selectedDifficultyId = difficulty.id;
        renderDifficultyList();
        renderChallengeButton();
        return;
      }
      openUnlockModal({ type: "difficulty", mode: findMode(modeId), difficulty: difficulty });
    });

    difficultyListEl.append(cell);
  });
}

function renderChallengeButton() {
  challengeButtonEl.disabled = !(state.selectedModeId && state.selectedDifficultyId);
}

// ==========================================================
// モードを選ぶ（選ばれた時点でそのモードの自己ベストを取得する想定）
// ==========================================================
function selectMode(modeId) {
  state.selectedModeId = modeId;
  state.selectedDifficultyId = null;

  const mode = findMode(modeId);
  detailNameEl.textContent = mode.name;
  detailDescEl.textContent = mode.desc;
  detailPanelEl.hidden = false;

  renderModeList();
  renderDifficultyList();
  renderChallengeButton();
}

// ==========================================================
// 解放（コインかジェムを使い、確認してから購入する）
// ==========================================================
function openUnlockModal(target) {
  state.unlockTarget = target;
  state.payCurrency = "coin";

  const isMode = target.type === "mode";
  const item = isMode ? target.mode : target.difficulty;

  unlockTitleEl.textContent = isMode
    ? item.name + "を解放しますか？"
    : target.mode.name + "の「" + item.name + "」を解放しますか？";
  unlockCoinPriceEl.textContent = item.coinPrice.toLocaleString();
  unlockGemPriceEl.textContent = item.gemPrice.toLocaleString();

  renderPayChoice();
  unlockModalEl.hidden = false;
}

function renderPayChoice() {
  document.querySelectorAll(".pay-button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.currency === state.payCurrency);
  });
}

document.querySelectorAll(".pay-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.payCurrency = button.dataset.currency;
    renderPayChoice();
  });
});

unlockCancelEl.addEventListener("click", () => {
  unlockModalEl.hidden = true;
});

unlockConfirmEl.addEventListener("click", () => {
  const target = state.unlockTarget;
  const isMode = target.type === "mode";
  const item = isMode ? target.mode : target.difficulty;
  const useCoin = state.payCurrency === "coin";
  const price = useCoin ? item.coinPrice : item.gemPrice;

  // 所持している通貨が足りないときは解放しない
  if (useCoin && CONFIG.coin < price) {
    showErrorToast("コインが足りません");
    return;
  }
  if (!useCoin && CONFIG.gem < price) {
    showErrorToast("ジェムが足りません");
    return;
  }

  if (useCoin) CONFIG.coin -= price;
  else CONFIG.gem -= price;

  if (isMode) {
    target.mode.unlocked = true;
    CONFIG.unlockedDifficulties[target.mode.id] = ["easy", "normal"];
  } else {
    CONFIG.unlockedDifficulties[target.mode.id].push(item.id);
  }

  unlockModalEl.hidden = true;
  renderCurrency();
  renderModeList();
  if (state.selectedModeId) renderDifficultyList();
  showSuccessToast(item.name + "を解放しました");
});

// ==========================================================
// 画面遷移（実際には遷移せず、通知でどこへ行くかだけ知らせる）
// ==========================================================
document.querySelectorAll("[data-nav]").forEach((el) => {
  el.addEventListener("click", () => showNavToast(el.dataset.nav));
});

challengeButtonEl.addEventListener("click", () => showNavToast("ゲーム"));

// ==========================================================
// 例外系の表示を確認するためのボタン（実際の操作フローとは独立したデモ用）
// ==========================================================
previewBestScoreErrorEl.addEventListener("click", () => {
  state.bestScoreFailed = !state.bestScoreFailed;
  if (!state.selectedModeId) selectMode(CONFIG.modes[0].id);
  else renderDifficultyList();
});

// 解放に失敗した場合はアラートを出すだけで、コイン・ジェムは元に戻る
previewUnlockErrorEl.addEventListener("click", () => {
  showErrorToast("モードの解放に失敗しました");
});

// ==========================================================
// 初期表示
// ==========================================================
renderCurrency();
renderModeList();
renderChallengeButton();
