"use strict";

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  // ボード（モード × 難易度 × プレイ形式）
  modes: ["お手軽モード", "通常モード", "長旅モード", "遺物なしモード", "エンドレスモード"],
  difficulties: ["簡単", "普通", "難しい", "鬼難"],
  formats: ["4択形式", "入力形式"],

  periods: ["全期間", "ウィークリー", "デイリー"],
  scopes: ["グローバル", "ローカル"],

  // 画面を開いたときに最初に選ばれているボードと集計期間（未定のため仮置き）
  defaultMode: "通常モード",
  defaultDifficulty: "普通",
  defaultFormat: "4択形式",
  defaultPeriod: "全期間",
  defaultScope: "グローバル",

  playerName: "しおのすけ",
  noNameText: "名無し冒険者", // 表示名が未設定のプレイヤー

  localCount: 5, // ローカルは自分のスコア上位5件

  fetchFailedText: "取得できません。",
  toastDuration: 1800,
};

// ==========================================================
// 画面の状態
// ==========================================================
const state = {
  mode: CONFIG.defaultMode,
  difficulty: CONFIG.defaultDifficulty,
  format: CONFIG.defaultFormat,
  period: CONFIG.defaultPeriod,
  scope: CONFIG.defaultScope,
  fetchFailed: false, // ランキングの取得に失敗したか
};

// ==========================================================
// 要素の取得
// ==========================================================
const modeSelectEl = document.getElementById("modeSelect");
const difficultySelectEl = document.getElementById("difficultySelect");
const formatSelectEl = document.getElementById("formatSelect");
const periodSelectEl = document.getElementById("periodSelect");
const scopeTabsEl = document.getElementById("scopeTabs");

const rankNoteEl = document.getElementById("rankNote");
const rankListEl = document.getElementById("rankList");
const rankSelfEl = document.getElementById("rankSelf");

const navToastEl = document.getElementById("navToast");
const previewRankErrorEl = document.getElementById("previewRankError");

// ==========================================================
// 画面遷移の代わりの通知
// ==========================================================
let navToastTimer = null;

document.querySelectorAll("[data-nav]").forEach((el) => {
  el.addEventListener("click", () => {
    navToastEl.textContent = "（本来は" + el.dataset.nav + "画面へ遷移）";
    navToastEl.classList.add("show");
    clearTimeout(navToastTimer);
    navToastTimer = setTimeout(() => navToastEl.classList.remove("show"), CONFIG.toastDuration);
  });
});

// ==========================================================
// ボード・集計期間の選択
// ==========================================================
function fillSelect(selectEl, values, selected) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === selected;
    selectEl.append(option);
  });
}

function renderScopeTabs() {
  scopeTabsEl.replaceChildren();

  CONFIG.scopes.forEach((value) => {
    const button = document.createElement("button");
    button.className = value === state.scope ? "rank-tab selected" : "rank-tab";
    button.textContent = value;
    button.addEventListener("click", () => {
      state.scope = value;
      renderScopeTabs();
      renderRanking();
    });
    scopeTabsEl.append(button);
  });
}

// ==========================================================
// ランキングの取得（ボードと集計期間の組み合わせごとに分かれる）
// ダミーのため、選ばれている組み合わせから決まった値を作って表示する
// ==========================================================
function seedFromBoard() {
  const key = state.mode + state.difficulty + state.format + state.period;
  let seed = 0;
  for (let i = 0; i < key.length; i += 1) {
    seed = (seed * 31 + key.charCodeAt(i)) % 100000;
  }
  return seed;
}

function fetchGlobalRanking() {
  const seed = seedFromBoard();
  const names = ["カルクくん", CONFIG.noNameText, "そろばん王", "まいど", "あかね推し", "ラビりん", CONFIG.noNameText, "みけねこ"];

  return names.map((name, index) => ({
    position: index + 1,
    name: name,
    score: 50000 - index * 2100 - (seed % 900),
  }));
}

function fetchLocalRanking() {
  const seed = seedFromBoard();
  const entries = [];

  for (let i = 0; i < CONFIG.localCount; i += 1) {
    entries.push({
      position: i + 1,
      name: "自己ベスト",
      score: 21000 - i * 2300 - (seed % 700),
      self: true,
    });
  }
  return entries;
}

function myGlobalEntry() {
  const seed = seedFromBoard();
  return {
    position: 800 + (seed % 2000),
    name: CONFIG.playerName,
    score: 18420 - (seed % 500),
  };
}

// ==========================================================
// 描画
// ==========================================================
function appendRow(containerEl, entry) {
  const row = document.createElement("li");
  row.className = entry.self ? "rank-row self" : "rank-row";

  const position = document.createElement("span");
  position.className = "rank-position";
  position.textContent = entry.position.toLocaleString() + "位";

  const name = document.createElement("span");
  name.className = "rank-name";
  name.textContent = entry.name;

  const score = document.createElement("span");
  score.className = "rank-score";
  score.textContent = entry.score.toLocaleString();

  row.append(position, name, score);
  containerEl.append(row);
}

function renderRanking() {
  rankListEl.replaceChildren();
  rankSelfEl.replaceChildren();
  rankSelfEl.hidden = true;
  rankNoteEl.textContent = "";

  // 取得できなかった場合はエラーを出さず、文言だけ差し替える
  if (state.fetchFailed) {
    const row = document.createElement("li");
    row.className = "rank-empty";
    row.textContent = CONFIG.fetchFailedText;
    rankListEl.append(row);
    rankNoteEl.textContent = CONFIG.fetchFailedText;
    return;
  }

  if (state.scope === "グローバル") {
    fetchGlobalRanking().forEach((entry) => appendRow(rankListEl, entry));

    // 自分の順位は上位に出てこないので、最下部に切り出して置く
    appendRow(rankSelfEl, Object.assign(myGlobalEntry(), { self: true }));
    rankSelfEl.hidden = false;
    return;
  }

  fetchLocalRanking().forEach((entry) => appendRow(rankListEl, entry));
}
// ==========================================================
// 操作
// ==========================================================
fillSelect(modeSelectEl, CONFIG.modes, state.mode);
fillSelect(difficultySelectEl, CONFIG.difficulties, state.difficulty);
fillSelect(formatSelectEl, CONFIG.formats, state.format);
fillSelect(periodSelectEl, CONFIG.periods, state.period);

modeSelectEl.addEventListener("change", () => {
  state.mode = modeSelectEl.value;
  renderRanking();
});
difficultySelectEl.addEventListener("change", () => {
  state.difficulty = difficultySelectEl.value;
  renderRanking();
});
formatSelectEl.addEventListener("change", () => {
  state.format = formatSelectEl.value;
  renderRanking();
});
periodSelectEl.addEventListener("change", () => {
  state.period = periodSelectEl.value;
  renderRanking();
});

// ==========================================================
// 例外系の表示を確認するためのボタン（実際の操作フローとは独立したデモ用）
// ==========================================================
previewRankErrorEl.addEventListener("click", () => {
  state.fetchFailed = !state.fetchFailed;
  renderRanking();
});

// ==========================================================
// 初期表示
// ==========================================================
renderScopeTabs();
renderRanking();
