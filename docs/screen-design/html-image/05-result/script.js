"use strict";

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  clear: true, // クリアして終わったか（false なら眠り）
  board: "通常モード / 普通 / 4択形式",
  score: 18420,
  accuracy: 92, // 正答率（%）
  floor: 3, // 到達フロア
  earnedCoin: 120, // このランで獲得するコイン

  adRemoval: false, // 広告解除を購入していると動画広告を出さずに加算して遷移する
  videoAdSeconds: 3, // 動画広告の長さ（デモ用に短くしてあります）
  toastDuration: 1800,

  // ローカルランキング（自己ベスト5件）
  localRanking: [
    { position: 1, score: 21500 },
    { position: 2, score: 18420, self: true },
    { position: 3, score: 15600 },
    { position: 4, score: 14100 },
    { position: 5, score: 12800 },
  ],

  // グローバルランキング（Best100のうち上位のみ表示）
  globalRanking: [
    { position: 1, name: "カルクくん", score: 48200 },
    { position: 2, name: "名無し冒険者", score: 44100 },
    { position: 3, name: "そろばん王", score: 41800 },
  ],
  myGlobalPosition: 1284,

  fetchFailedText: "取得できません。",

  errorMessages: {
    coin: "コインを獲得できませんでした。",
    ad: "広告を表示できませんでした。",
  },
  errorNote: "メニューに戻るとコインを獲得できません",
};

// ==========================================================
// 画面の状態
// ==========================================================
const state = {
  rankingFailed: false, // ランキングの取得に失敗したか
  pendingNav: null, // 遷移しようとしている先（広告のあとに進む）
};

// ==========================================================
// 要素の取得
// ==========================================================
const resultTitleEl = document.getElementById("resultTitle");
const resultBoardEl = document.getElementById("resultBoard");
const resultScoreEl = document.getElementById("resultScore");
const accuracyValueEl = document.getElementById("accuracyValue");
const floorValueEl = document.getElementById("floorValue");
const earnedCoinValueEl = document.getElementById("earnedCoinValue");

const localRankListEl = document.getElementById("localRankList");
const globalRankListEl = document.getElementById("globalRankList");
const myGlobalRankEl = document.getElementById("myGlobalRank");

const backToMenuButtonEl = document.getElementById("backToMenuButton");
const replayButtonEl = document.getElementById("replayButton");

const navToastEl = document.getElementById("navToast");
const successToastEl = document.getElementById("successToast");
const successToastMessageEl = document.getElementById("successToastMessage");

const videoAdModalEl = document.getElementById("videoAdModal");
const videoAdCountdownEl = document.getElementById("videoAdCountdown");

const errorModalEl = document.getElementById("errorModal");
const errorMessageEl = document.getElementById("errorMessage");
const errorNoteEl = document.getElementById("errorNote");
const errorLeaveButtonEl = document.getElementById("errorLeaveButton");
const reconnectButtonEl = document.getElementById("reconnectButton");

const previewRankErrorEl = document.getElementById("previewRankError");
const previewCoinErrorEl = document.getElementById("previewCoinError");
const previewAdErrorEl = document.getElementById("previewAdError");

// ==========================================================
// 通知
// ==========================================================
let navToastTimer = null;
let successToastTimer = null;

function showNavToast(label) {
  navToastEl.textContent = "（本来は" + label + "画面へ遷移）";
  navToastEl.classList.add("show");
  clearTimeout(navToastTimer);
  navToastTimer = setTimeout(() => navToastEl.classList.remove("show"), CONFIG.toastDuration);
}

function showSuccessToast(message) {
  successToastMessageEl.textContent = message;
  successToastEl.classList.add("show");
  clearTimeout(successToastTimer);
  successToastTimer = setTimeout(() => successToastEl.classList.remove("show"), CONFIG.toastDuration);
}

// ==========================================================
// 結果の描画
// ==========================================================
function renderResult() {
  resultTitleEl.textContent = CONFIG.clear ? "CLEAR" : "SLEEP";
  resultBoardEl.textContent = CONFIG.board;
  resultScoreEl.textContent = CONFIG.score.toLocaleString();
  accuracyValueEl.textContent = CONFIG.accuracy + "%";
  floorValueEl.textContent = "B" + CONFIG.floor;
  earnedCoinValueEl.textContent = CONFIG.earnedCoin;
}

function appendEmptyRow(listEl) {
  const row = document.createElement("li");
  row.className = "rank-empty";
  row.textContent = CONFIG.fetchFailedText;
  listEl.append(row);
}

function appendRankRow(listEl, position, name, score, isSelf) {
  const row = document.createElement("li");
  row.className = isSelf ? "rank-row self" : "rank-row";

  const positionEl = document.createElement("span");
  positionEl.className = "rank-position";
  positionEl.textContent = position + "位";

  const nameEl = document.createElement("span");
  nameEl.className = "rank-name";
  nameEl.textContent = name;

  const scoreEl = document.createElement("span");
  scoreEl.className = "rank-score";
  scoreEl.textContent = score.toLocaleString();

  row.append(positionEl, nameEl, scoreEl);
  listEl.append(row);
}

function renderLocalRanking() {
  localRankListEl.replaceChildren();

  if (state.rankingFailed) {
    appendEmptyRow(localRankListEl);
    return;
  }

  CONFIG.localRanking.forEach((entry) => {
    const label = entry.self ? "今回のスコア" : "自己ベスト";
    appendRankRow(localRankListEl, entry.position, label, entry.score, entry.self === true);
  });
}

function renderGlobalRanking() {
  globalRankListEl.replaceChildren();

  if (state.rankingFailed) {
    myGlobalRankEl.textContent = CONFIG.fetchFailedText;
    appendEmptyRow(globalRankListEl);
    return;
  }

  myGlobalRankEl.textContent = "自分の順位 " + CONFIG.myGlobalPosition.toLocaleString() + "位";
  CONFIG.globalRanking.forEach((entry) => {
    appendRankRow(globalRankListEl, entry.position, entry.name, entry.score, false);
  });
}

// ==========================================================
// 遷移（メニューに戻る・もう一度遊ぶ）
// コインは遷移するときに、動画広告の視聴を終えてから加算する
// ==========================================================
function completeNavigation() {
  showSuccessToast("コインを " + CONFIG.earnedCoin + " 枚 獲得しました");
  showNavToast(state.pendingNav);
}

function playVideoAd() {
  videoAdModalEl.hidden = false;
  let remaining = CONFIG.videoAdSeconds;
  videoAdCountdownEl.textContent = "あと " + remaining + " 秒";

  const adTimerId = setInterval(() => {
    remaining -= 1;
    videoAdCountdownEl.textContent = "あと " + remaining + " 秒";

    if (remaining > 0) return;

    clearInterval(adTimerId);
    videoAdModalEl.hidden = true;
    completeNavigation();
  }, 1000);
}

function requestNavigation(label) {
  state.pendingNav = label;

  // 広告解除を購入している場合は広告を表示せずに加算して遷移する
  if (CONFIG.adRemoval) {
    completeNavigation();
    return;
  }

  playVideoAd();
}

backToMenuButtonEl.addEventListener("click", () => requestNavigation("スタートメニュー"));
replayButtonEl.addEventListener("click", () => requestNavigation("ゲーム"));

// ==========================================================
// エラーモーダル
// 押していたボタンに合わせて、遷移先のボタンを出し分ける
// ==========================================================
function showErrorModal(message) {
  videoAdModalEl.hidden = true;
  errorMessageEl.textContent = message;
  errorNoteEl.textContent = CONFIG.errorNote;

  const isReplay = state.pendingNav === "ゲーム";
  errorLeaveButtonEl.textContent = isReplay ? "もう一度遊ぶ" : "メニューに戻る";
  errorModalEl.hidden = false;
}

// コインを獲得できないまま遷移する
errorLeaveButtonEl.addEventListener("click", () => {
  errorModalEl.hidden = true;
  showNavToast(state.pendingNav);
});

reconnectButtonEl.addEventListener("click", () => {
  errorModalEl.hidden = true;
  requestNavigation(state.pendingNav);
});

// ==========================================================
// 例外系の表示を確認するためのボタン（実際の操作フローとは独立したデモ用）
// ==========================================================
previewRankErrorEl.addEventListener("click", () => {
  state.rankingFailed = !state.rankingFailed;
  renderLocalRanking();
  renderGlobalRanking();
});

previewCoinErrorEl.addEventListener("click", () => {
  if (!state.pendingNav) state.pendingNav = "スタートメニュー";
  showErrorModal(CONFIG.errorMessages.coin);
});

previewAdErrorEl.addEventListener("click", () => {
  if (!state.pendingNav) state.pendingNav = "ゲーム";
  showErrorModal(CONFIG.errorMessages.ad);
});

// ==========================================================
// 初期表示（画面に遷移したときにローカル / グローバルの両方を取得する）
// ==========================================================
renderResult();
renderLocalRanking();
renderGlobalRanking();
