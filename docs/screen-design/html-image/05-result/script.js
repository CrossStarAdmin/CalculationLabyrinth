"use strict";

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  clear: true, // クリアして終わったか（false なら眠り）
  // そのランの条件。札の中で3つに区切って並べる
  // TODO: 難易度・出題形式のアイコン素材待ち（icon が null の間は枠だけ置く）
  board: [
    { icon: "icon-swords.png", text: "通常モード" },
    { icon: null, text: "普通" },
    { icon: null, text: "4択形式" },
  ],
  score: 18420,
  accuracy: 54, // 正答率（%）
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
    { position: 4, name: "そろばん王", score: 41800 },
    { position: 5, name: "そろばん王", score: 41800 },
    { position: 6, name: "そろばん王", score: 41800 },
    { position: 7, name: "そろばん王", score: 41800 },
    { position: 8, name: "そろばん王", score: 41800 },
    { position: 9, name: "そろばん王", score: 41800 },
    { position: 10, name: "そろばん王", score: 41800 },
    { position: 11, name: "そろばん王", score: 41800 },
    { position: 12, name: "そろばん王", score: 41800 },
    { position: 13, name: "そろばん王", score: 41800 },
    { position: 14, name: "そろばん王", score: 41800 },
    { position: 15, name: "そろばん王", score: 41800 },
    { position: 16, name: "そろばん王", score: 41800 },
    { position: 17, name: "そろばん王", score: 41800 },
    { position: 18, name: "そろばん王", score: 41800 },
    { position: 19, name: "そろばん王", score: 41800 },
    { position: 20, name: "そろばん王", score: 41800 },
  ],
  myGlobalPosition: 1284,
  playerName: "しおのすけ",

  // そのランのモードの段階数。遺物は各段階の開始時に1つ得るので、これが枠の数になる
  // （要件定義 2.3.1）。段階数が決まっていないエンドレスモードでは、実際に進んだ段階数が入る
  totalFloors: 5,

  // そのランで得た遺物（獲得したものだけを入れる。足りない枠は点線で表す）。
  // 名前とレアリティは仮。data-definition/relic.md の作成後に差し替える
  // art は assets/rerics/ の絵柄。無い遺物は枠だけ置く
  relics: [
    { name: "炎の符", rarity: 2, art: "../assets/rerics/item1.png", text: "正解するたびにスコアが5%上がる。" },
    { name: "氷の瓶", rarity: 1, art: "../assets/rerics/item2.png", text: "制限時間が1秒のびる。" },
    { name: "風の羽", rarity: 3, art: "../assets/rerics/item3.webp", text: "連続正解の倍率が2倍になる。" },
  ],

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
  rankTab: "local", // 表示中のランキング（local / global）
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

const relicListEl = document.getElementById("relicList");

const relicModalEl = document.getElementById("relicModal");
const relicDetailArtEl = document.getElementById("relicDetailArt");
const relicDetailNameEl = document.getElementById("relicDetailName");
const relicDetailRarityEl = document.getElementById("relicDetailRarity");
const relicDetailTextEl = document.getElementById("relicDetailText");
const relicDetailCloseEl = document.getElementById("relicDetailClose");

const rankNoteEl = document.getElementById("rankNote");
const rankListEl = document.getElementById("rankList");
const rankSelfEl = document.getElementById("rankSelf");

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
// 条件の札。アイコン素材が無い項目は枠だけ置く
function createBoardItem(entry) {
  const item = document.createElement("span");
  item.className = "board-item";

  if (entry.icon === null) {
    const art = document.createElement("span");
    art.className = "board-art";
    item.append(art);
  } else {
    const icon = document.createElement("img");
    icon.className = "icon board-icon";
    icon.src = "../assets/icon/" + entry.icon;
    icon.alt = "";
    item.append(icon);
  }

  const text = document.createElement("span");
  text.textContent = entry.text;
  item.append(text);

  return item;
}

function renderResult() {
  resultTitleEl.textContent = CONFIG.clear ? "CLEAR" : "SLEEP";
  resultBoardEl.replaceChildren(...CONFIG.board.map(createBoardItem));
  resultScoreEl.textContent = CONFIG.score.toLocaleString();
  accuracyValueEl.textContent = CONFIG.accuracy + "問";
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
  nameEl.textContent = name ?? "";

  const scoreEl = document.createElement("span");
  scoreEl.className = "rank-score";
  scoreEl.textContent = score.toLocaleString();

  row.append(positionEl, nameEl, scoreEl);
  listEl.append(row);
}

function renderRanking() {
  rankListEl.replaceChildren();
  rankSelfEl.replaceChildren();
  rankSelfEl.hidden = true;
  rankNoteEl.textContent = "";

  const isLocal = state.rankTab === "local";

  document.querySelectorAll(".rank-tab").forEach((tab) => {
    tab.classList.toggle("selected", tab.dataset.rank === state.rankTab);
  });

  if (state.rankingFailed) {
    rankNoteEl.textContent = CONFIG.fetchFailedText;
    appendEmptyRow(rankListEl);
    return;
  }

  if (isLocal) {
    CONFIG.localRanking.forEach((entry) => {
      const label = entry.self ? "今回の結果" : "";
      appendRankRow(rankListEl, entry.position, label, entry.score, entry.self === true);
    });
    return;
  }

  CONFIG.globalRanking.forEach((entry) => {
    appendRankRow(rankListEl, entry.position, entry.name, entry.score, false);
  });

  // 自分の順位は一覧の中に出てこないことが多いので、最下部に切り出して置く
  appendRankRow(rankSelfEl, CONFIG.myGlobalPosition, CONFIG.playerName, CONFIG.score, true);
  rankSelfEl.hidden = false;
}

document.querySelectorAll(".rank-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    state.rankTab = tab.dataset.rank;
    renderRanking();
  });
});

// 遺物はフロアごとに1つ選ぶので、得た順に並べる
function renderRelics() {
  relicListEl.replaceChildren();

  // 枠の数は段階数がそのまま決める
  const slotCount = CONFIG.totalFloors;

  for (let index = 0; index < slotCount; index += 1) {
    const relic = CONFIG.relics[index];

    // 未獲得の枠は点線だけ置く
    if (relic === undefined) {
      const empty = document.createElement("div");
      empty.className = "relic-plate empty";
      relicListEl.append(empty);
      continue;
    }

    // 獲得済みはタップで詳細を開くのでボタンにする
    const plate = document.createElement("button");
    plate.className = "relic-plate";

    // 絵柄がある遺物は画像、無い遺物は枠だけ置く
    let art;
    if (relic.art === undefined) {
      art = document.createElement("span");
    } else {
      art = document.createElement("img");
      art.src = relic.art;
      art.alt = "";
    }
    art.className = "relic-art";

    const rarity = document.createElement("span");
    rarity.className = "relic-rarity";

    plate.append(art, name, rarity);
    plate.addEventListener("click", () => openRelicDetail(relic));
    relicListEl.append(plate);
  }
}

// 遺物の詳細
function openRelicDetail(relic) {
  relicDetailArtEl.src = relic.art === undefined ? "" : relic.art;
  relicDetailArtEl.hidden = relic.art === undefined;
  relicDetailNameEl.textContent = relic.name;
  relicDetailRarityEl.textContent = "★".repeat(relic.rarity);
  relicDetailTextEl.textContent = relic.text;
  relicModalEl.hidden = false;
}

relicDetailCloseEl.addEventListener("click", () => {
  relicModalEl.hidden = true;
});

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
  renderRanking();
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
renderRanking();
renderRelics();
