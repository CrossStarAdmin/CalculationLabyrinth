"use strict";

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  chapter: "第1章 めざめの遺跡", // 該当する段階のストーリー
  typeSpeedMs: 40, // 1文字ずつ表示する速さ
  toastDuration: 1800,

  // 画面起動時に取得するストーリー
  lines: [
    { speaker: "あかね", text: "ここが…計算迷宮。地図にも載っていない遺跡。" },
    { speaker: "あかね", text: "おじいちゃんが最後に調べていた場所が、まさかこんなところだったなんて。" },
    { speaker: "？？？", text: "……誰だ。久しく客人など来なかったというのに。" },
    { speaker: "あかね", text: "だ、誰！？ 石像がしゃべってる！" },
    { speaker: "ガーディアン", text: "我は第一層の番人。先へ進みたくば、我が問いに答えよ。" },
    { speaker: "あかね", text: "…望むところ。計算なら、負けないよ。" },
  ],
};

// ==========================================================
// 画面の状態
// ==========================================================
const state = {
  index: 0, // いま表示している行
  typing: false, // 1文字ずつ表示している途中か
  typerId: null,
};

// ==========================================================
// 要素の取得
// ==========================================================
const chapterLabelEl = document.getElementById("chapterLabel");
const speakerNameEl = document.getElementById("speakerName");
const storyTextEl = document.getElementById("storyText");
const nextMarkEl = document.getElementById("nextMark");
const textWindowEl = document.getElementById("textWindow");
const goGameButtonEl = document.getElementById("goGameButton");

const navToastEl = document.getElementById("navToast");
const errorModalEl = document.getElementById("errorModal");
const reconnectButtonEl = document.getElementById("reconnectButton");
const previewStoryErrorEl = document.getElementById("previewStoryError");

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

document.querySelectorAll("[data-nav]").forEach((el) => {
  el.addEventListener("click", () => {
    showNavToast(el.dataset.nav);
    errorModalEl.hidden = true;
  });
});

// ==========================================================
// テキスト送り（1文字ずつ表示し、途中でタップすると全部出す）
// ==========================================================
function typeLine(line) {
  speakerNameEl.textContent = line.speaker;
  storyTextEl.textContent = "";
  nextMarkEl.hidden = true;
  state.typing = true;

  let position = 0;
  clearInterval(state.typerId);
  state.typerId = setInterval(() => {
    position += 1;
    storyTextEl.textContent = line.text.slice(0, position);

    if (position < line.text.length) return;

    clearInterval(state.typerId);
    state.typing = false;
    nextMarkEl.hidden = false;
  }, CONFIG.typeSpeedMs);
}

function showLine(index) {
  goGameButtonEl.hidden = true;
  typeLine(CONFIG.lines[index]);
}

function advance() {
  // 表示の途中なら、まず残りを全部出す
  if (state.typing) {
    clearInterval(state.typerId);
    storyTextEl.textContent = CONFIG.lines[state.index].text;
    state.typing = false;
    nextMarkEl.hidden = false;
    return;
  }

  // 最後まで読み終えたら、ゲームに進むボタンを出す
  if (state.index >= CONFIG.lines.length - 1) {
    nextMarkEl.hidden = true;
    goGameButtonEl.hidden = false;
    return;
  }

  state.index += 1;
  showLine(state.index);
}

textWindowEl.addEventListener("click", advance);

// ストーリーフラグを更新してからストーリー用ゲーム画面へ進む
goGameButtonEl.addEventListener("click", () => showNavToast("ストーリー用ゲーム"));

// ==========================================================
// ストーリーの取得
// ==========================================================
function loadStory() {
  chapterLabelEl.textContent = CONFIG.chapter;
  state.index = 0;
  showLine(state.index);
}

reconnectButtonEl.addEventListener("click", () => {
  errorModalEl.hidden = true;
  loadStory();
});

// ==========================================================
// 例外系の表示を確認するためのボタン（実際の操作フローとは独立したデモ用）
// ==========================================================
previewStoryErrorEl.addEventListener("click", () => {
  clearInterval(state.typerId);
  errorModalEl.hidden = false;
});

// ==========================================================
// 初期表示（ストーリー画面の起動時に取得する）
// ==========================================================
loadStory();
