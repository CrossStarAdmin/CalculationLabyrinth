"use strict";

// このファイルは 01-title の実例です。sleep() ヘルパーと
// 「設定値を CONFIG にまとめる」「エラー確認ボタン + 再接続で再実行」という
// 構成パターンはどの画面でも使い回せます。CONFIG の中身と playIntro() の
// 中身は画面固有なので、設計書のユースケース・取得要素に合わせて書き換えてください。

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  // 表示するPlayer ID（本来はサイレントログインで取得する値）
  playerId: "1234567890",

  // 各ステップの待ち時間（ミリ秒）。演出の速さを調整したいときはここ。
  timing: {
    beforeFirstBarMove: 400, // ローディング開始 → バーが少し進むまで
    beforeLoginDone: 500,    // → サイレントログイン完了（Player ID表示）まで
    beforeMasterDone: 700,   // → マスターデータ取得完了まで
    beforeStartShown: 300,   // → LOADINGからSTARTボタンへの切り替わりまで
  },

  // ローディングバーの進捗（%）。左から「開始直後・ログイン完了時・取得完了時」
  progress: {
    afterStart: 40,
    afterLogin: 70,
    afterMasterData: 100,
  },

  errorMessage: "通信に失敗しました",
};

// ==========================================================
// 要素の取得
// ==========================================================
const playerIdEl = document.getElementById("playerId");
const playerIdValueEl = document.getElementById("playerIdValue");
const loadingBlockEl = document.getElementById("loadingBlock");
const loadingBarFillEl = document.getElementById("loadingBarFill");
const startButtonEl = document.getElementById("startButton");
const errorModalEl = document.getElementById("errorModal");
const errorMessageEl = document.getElementById("errorMessage");
const reconnectButtonEl = document.getElementById("reconnectButton");
const errorToggleEl = document.getElementById("errorToggle");

errorMessageEl.textContent = CONFIG.errorMessage;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================================
// タイトル画面の自動演出
// サイレントログイン → マスターデータ取得 → STARTボタン表示
// ==========================================================
async function playIntro() {
  const { timing, progress } = CONFIG;

  loadingBlockEl.style.display = "";
  loadingBarFillEl.style.width = "0%";
  startButtonEl.hidden = true;
  playerIdEl.hidden = true;

  await sleep(timing.beforeFirstBarMove);
  loadingBarFillEl.style.width = `${progress.afterStart}%`;

  await sleep(timing.beforeLoginDone);
  playerIdValueEl.textContent = CONFIG.playerId;
  playerIdEl.hidden = false; // サイレントログイン完了
  loadingBarFillEl.style.width = `${progress.afterLogin}%`;

  await sleep(timing.beforeMasterDone);
  loadingBarFillEl.style.width = `${progress.afterMasterData}%`; // マスターデータ取得完了

  await sleep(timing.beforeStartShown);
  loadingBlockEl.style.display = "none";
  startButtonEl.hidden = false;
}

playIntro();

// ==========================================================
// 通信エラー表示の確認用ボタン
// ==========================================================
errorToggleEl.addEventListener("click", () => {
  errorModalEl.hidden = false;
});

reconnectButtonEl.addEventListener("click", () => {
  errorModalEl.hidden = true;
  playIntro();
});
