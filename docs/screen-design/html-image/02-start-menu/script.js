"use strict";

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  playerName: "しおのすけ",
  coin: 100,
  gem: 100,
  bgmVolume: 70,
  seVolume: 70,

  nameMaxLength: 10, // 「名前は11文字以上にしない」仕様（10文字までOK）
  // 実際のNGワード判定は別途実装する想定。ここではデモ用に一部だけ弾く。
  ngWords: ["ばか", "あほ"],

  toastDuration: 1600, // 通知が自動で消えるまでの時間（ミリ秒）

  // キャラクターをタップするたびに順番に表示するセリフ
  speechLines: [
    "今日も冒険を楽しむわ！",
    "計算迷宮の奥には、まだ見ぬ遺物が眠っているらしいよ。",
    "コインを貯めてショップも覗いてみてね。",
  ],
};

// ==========================================================
// 要素の取得
// ==========================================================
const playerNameLabelEl = document.getElementById("playerNameLabel");
const coinValueEl = document.getElementById("coinValue");
const gemValueEl = document.getElementById("gemValue");

const nameBadgeEl = document.getElementById("nameBadge");
const navToastEl = document.getElementById("navToast");

const optionOverlayEl = document.getElementById("optionOverlay");
const optionCloseEl = document.getElementById("optionClose");
const bgmVolumeEl = document.getElementById("bgmVolume");
const seVolumeEl = document.getElementById("seVolume");

const nameInputEl = document.getElementById("nameInput");
const changeNameButtonEl = document.getElementById("changeNameButton");

const successToastEl = document.getElementById("successToast");

const errorToastEl = document.getElementById("errorToast");
const errorToastMessageEl = document.getElementById("errorToastMessage");

const errorModalOverlayEl = document.getElementById("errorModalOverlay");
const errorModalCloseEl = document.getElementById("errorModalClose");

const previewAlertEl = document.getElementById("previewAlert");
const previewErrorModalEl = document.getElementById("previewErrorModal");

const characterImageEl = document.getElementById("characterImage");
const speechTextEl = document.getElementById("speechText");

// ==========================================================
// 初期表示
// ==========================================================
function renderPlayerInfo() {
  playerNameLabelEl.textContent = CONFIG.playerName;
  coinValueEl.textContent = CONFIG.coin;
  gemValueEl.textContent = CONFIG.gem;
}

renderPlayerInfo();
bgmVolumeEl.value = CONFIG.bgmVolume;
seVolumeEl.value = CONFIG.seVolume;

// ==========================================================
// キャラクターの一言（タップするたびにセリフが変わる）
// ==========================================================
let speechIndex = 0;
function showNextSpeech() {
  speechTextEl.textContent = CONFIG.speechLines[speechIndex];
  speechIndex = (speechIndex + 1) % CONFIG.speechLines.length;
}

showNextSpeech();
characterImageEl.addEventListener("click", showNextSpeech);

// ==========================================================
// 一時的な通知（画面遷移の代わりに「本来は◯◯へ遷移する」と知らせる）
// ==========================================================
let navToastTimer = null;
function showNavToast(label) {
  navToastEl.textContent = `（本来は${label}画面へ遷移）`;
  navToastEl.classList.add("show");
  clearTimeout(navToastTimer);
  navToastTimer = setTimeout(() => navToastEl.classList.remove("show"), CONFIG.toastDuration);
}

document.querySelectorAll("[data-nav]").forEach((el) => {
  el.addEventListener("click", () => {
    showNavToast(el.dataset.nav);
    // オプションモーダル内の項目は、実際には遷移してモーダルごと閉じる操作のため合わせて閉じる
    if (el.closest("#optionOverlay")) closeOption();
  });
});

// ==========================================================
// オプションモーダル
// ==========================================================
function openOption() {
  nameInputEl.value = CONFIG.playerName; // 未確定の編集内容が残らないよう開くたびにリセット
  optionOverlayEl.hidden = false;
}

function closeOption() {
  optionOverlayEl.hidden = true;
}

nameBadgeEl.addEventListener("click", openOption);
optionCloseEl.addEventListener("click", closeOption);

bgmVolumeEl.addEventListener("input", () => {
  CONFIG.bgmVolume = Number(bgmVolumeEl.value); // 本来は端末側に保存する
});
seVolumeEl.addEventListener("input", () => {
  CONFIG.seVolume = Number(seVolumeEl.value); // 本来は端末側に保存する
});

// ==========================================================
// 入力エラー用の通知（成功トーストと同じ仕組みの赤色版）
// ==========================================================
let errorToastTimer = null;
function showErrorToast(message) {
  errorToastMessageEl.textContent = message;
  errorToastEl.classList.add("show");
  clearTimeout(errorToastTimer);
  errorToastTimer = setTimeout(() => errorToastEl.classList.remove("show"), CONFIG.toastDuration);
}

// ==========================================================
// 表示名の更新に失敗した場合のエラーモーダル
// ==========================================================
function showErrorModal() {
  errorModalOverlayEl.hidden = false;
}

errorModalCloseEl.addEventListener("click", () => {
  errorModalOverlayEl.hidden = true;
});

// ==========================================================
// プレイヤー名の変更（オプション画面内で直接編集する）
// 例外処理（02-start-menu.md の「6. 例外処理」に対応。いずれもアラートで表示する）
// ==========================================================
function applyNameChange() {
  const value = nameInputEl.value.trim();

  if (value.length === 0) {
    showErrorToast("名前は１文字以上にしてください");
    nameInputEl.value = CONFIG.playerName; // 変更前の名前に戻す
    return;
  }
  if (value.length > CONFIG.nameMaxLength) {
    showErrorToast("名前は10文字以下にしてください");
    nameInputEl.value = CONFIG.playerName;
    return;
  }
  if (CONFIG.ngWords.some((word) => value.includes(word))) {
    showErrorToast("この名前は利用できません");
    nameInputEl.value = CONFIG.playerName;
    return;
  }

  CONFIG.playerName = value;
  renderPlayerInfo();

  successToastEl.classList.add("show");
  setTimeout(() => successToastEl.classList.remove("show"), CONFIG.toastDuration);
}

changeNameButtonEl.addEventListener("click", applyNameChange);
nameInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") applyNameChange();
});

// ==========================================================
// 例外系の表示を確認するためのボタン（実際の操作フローとは独立したデモ用）
// ==========================================================
previewAlertEl.addEventListener("click", () => showErrorToast("名前は１文字以上にしてください"));
previewErrorModalEl.addEventListener("click", showErrorModal);
