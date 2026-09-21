"use strict";

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  userId: "1234567890", // タイトル画面で取得済みのユーザーID
  takeoverConfigured: false, // 引き継ぎを設定済みか

  // 引き継ぎの入力チェック用（デモ用の値。実際はサーバーで照合する）
  registeredUserId: "1234567890",
  registeredPassword: "labyrinth",

  contactAddress: "support@example.com",
  toastDuration: 1800,

  errorMessages: {
    setup: "設定できませんでした。",
    delete: "削除できませんでした。",
  },
};

// ==========================================================
// 画面の状態
// ==========================================================
const state = {
  formMode: null, // "setup"（引き継ぎ設定） / "takeover"（引き継ぎ）
  confirmMode: null, // "takeover" / "delete"
};

// ==========================================================
// 要素の取得
// ==========================================================
const userIdValueEl = document.getElementById("userIdValue");
const takeoverIconEl = document.getElementById("takeoverIcon");
const takeoverStatusEl = document.getElementById("takeoverStatus");

const setupTakeoverButtonEl = document.getElementById("setupTakeoverButton");
const takeoverButtonEl = document.getElementById("takeoverButton");
const contactButtonEl = document.getElementById("contactButton");
const deleteButtonEl = document.getElementById("deleteButton");

const navToastEl = document.getElementById("navToast");
const errorToastEl = document.getElementById("errorToast");
const errorToastMessageEl = document.getElementById("errorToastMessage");
const successToastEl = document.getElementById("successToast");
const successToastMessageEl = document.getElementById("successToastMessage");

const formModalEl = document.getElementById("formModal");
const formTitleEl = document.getElementById("formTitle");
const formMessageEl = document.getElementById("formMessage");
const formUserIdEl = document.getElementById("formUserId");
const formPasswordEl = document.getElementById("formPassword");
const formCancelEl = document.getElementById("formCancel");
const formConfirmEl = document.getElementById("formConfirm");

const confirmModalEl = document.getElementById("confirmModal");
const confirmTitleEl = document.getElementById("confirmTitle");
const confirmMessageEl = document.getElementById("confirmMessage");
const confirmNoteEl = document.getElementById("confirmNote");
const confirmCancelEl = document.getElementById("confirmCancel");
const confirmOkEl = document.getElementById("confirmOk");

const contactModalEl = document.getElementById("contactModal");
const contactAddressEl = document.getElementById("contactAddress");
const contactCloseEl = document.getElementById("contactClose");

const errorModalEl = document.getElementById("errorModal");
const errorMessageEl = document.getElementById("errorMessage");
const reconnectButtonEl = document.getElementById("reconnectButton");

const previewSetupErrorEl = document.getElementById("previewSetupError");
const previewDeleteErrorEl = document.getElementById("previewDeleteError");

// ==========================================================
// 通知
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

document.querySelectorAll("[data-nav]").forEach((el) => {
  el.addEventListener("click", () => showNavToast(el.dataset.nav));
});

// ==========================================================
// 描画
// ==========================================================
function render() {
  userIdValueEl.textContent = CONFIG.userId;

  if (CONFIG.takeoverConfigured) {
    takeoverIconEl.textContent = "✓";
    takeoverStatusEl.textContent = "引き継ぎ設定は完了しています";
    return;
  }

  takeoverIconEl.textContent = "！";
  takeoverStatusEl.textContent = "引き継ぎ未設定です。このままだと機種変更でデータを引き継げません";
}

// ==========================================================
// 引き継ぎ設定（いまのアカウントに認証手段を紐づける）
// 引き継ぎ（別のアカウントでログインし直す）
// ==========================================================
function openForm(mode) {
  state.formMode = mode;
  const isSetup = mode === "setup";

  formTitleEl.textContent = isSetup ? "引き継ぎ設定" : "引き継ぎ";
  formMessageEl.textContent = isSetup
    ? "いまのアカウントに紐づけるユーザーIDとパスワードを入力してください"
    : "引き継ぐアカウントのユーザーIDとパスワードを入力してください";

  formUserIdEl.value = isSetup ? CONFIG.userId : "";
  formPasswordEl.value = "";
  formModalEl.hidden = false;
}

formCancelEl.addEventListener("click", () => {
  formModalEl.hidden = true;
});

formConfirmEl.addEventListener("click", () => {
  const inputId = formUserIdEl.value.trim();
  const inputPassword = formPasswordEl.value;

  if (state.formMode === "setup") {
    if (inputId.length === 0 || inputPassword.length === 0) {
      showErrorToast("ユーザーIDとパスワードを入力してください");
      return;
    }

    // 設定しても新しいアカウントは作られず、データはそのまま残る
    CONFIG.takeoverConfigured = true;
    formModalEl.hidden = true;
    render();
    showSuccessToast("引き継ぎを設定しました");
    return;
  }

  // 引き継ぎの実行。ユーザーIDまたはパスワードが違う場合は引き継がない
  const idMatched = inputId === CONFIG.registeredUserId;
  const passwordMatched = inputPassword === CONFIG.registeredPassword;
  if (!idMatched || !passwordMatched) {
    showErrorToast("ユーザーIDまたはパスワードが違います");
    return;
  }

  formModalEl.hidden = true;
  showNavToast("タイトル");
});

// ==========================================================
// 確認（引き継ぎの実行前・削除の実行前）
// ==========================================================
function openConfirm(mode) {
  state.confirmMode = mode;
  const isTakeover = mode === "takeover";

  confirmTitleEl.textContent = isTakeover ? "引き継ぎを実行しますか？" : "アカウントを削除しますか？";
  confirmMessageEl.textContent = isTakeover
    ? "この端末で遊んでいたアカウントは切り離されます"
    : "コイン・ジェム・解放状況・図鑑・ベストスコアが消えます。ランキングに登録済みのスコアも削除されます";
  confirmNoteEl.textContent = isTakeover
    ? "引き継ぎを設定していない場合、いまのデータは二度と戻せません"
    : "削除したデータは元に戻せません";

  confirmModalEl.hidden = false;
}

confirmCancelEl.addEventListener("click", () => {
  confirmModalEl.hidden = true;
});

confirmOkEl.addEventListener("click", () => {
  confirmModalEl.hidden = true;

  if (state.confirmMode === "takeover") {
    openForm("takeover");
    return;
  }

  // 削除後はタイトル画面に戻り、新しい匿名アカウントが作られる
  showNavToast("タイトル");
});

// ==========================================================
// メニューの操作
// ==========================================================
setupTakeoverButtonEl.addEventListener("click", () => openForm("setup"));
takeoverButtonEl.addEventListener("click", () => openConfirm("takeover"));
deleteButtonEl.addEventListener("click", () => openConfirm("delete"));

contactButtonEl.addEventListener("click", () => {
  contactAddressEl.textContent = CONFIG.contactAddress;
  contactModalEl.hidden = false;
});

contactCloseEl.addEventListener("click", () => {
  contactModalEl.hidden = true;
});

// ==========================================================
// エラーモーダル
// ==========================================================
function showErrorModal(kind) {
  formModalEl.hidden = true;
  confirmModalEl.hidden = true;
  errorMessageEl.textContent = CONFIG.errorMessages[kind];
  errorModalEl.hidden = false;
}

reconnectButtonEl.addEventListener("click", () => {
  errorModalEl.hidden = true;
});

// ==========================================================
// 例外系の表示を確認するためのボタン（実際の操作フローとは独立したデモ用）
// ==========================================================
previewSetupErrorEl.addEventListener("click", () => showErrorModal("setup"));
previewDeleteErrorEl.addEventListener("click", () => showErrorModal("delete"));

// ==========================================================
// 初期表示
// ==========================================================
render();
