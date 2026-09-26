"use strict";

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  coin: 2400,
  gem: 10,

  toastDuration: 1800,
  billingWaitMs: 1200, // ストアの課金処理にかかる時間（デモ用）

  // 遺物パッケージはコインかジェムで購入する。値段は仮（別資料で作成予定）
  packages: [
    { id: "pack-time", name: "刻の遺物パック", desc: "制限時間に関わる遺物が5種ふえる", coinPrice: 2000, gemPrice: 20, purchased: false },
    { id: "pack-score", name: "煌めきの遺物パック", desc: "スコアに関わる遺物が5種ふえる", coinPrice: 2000, gemPrice: 20, purchased: false },
    { id: "pack-guard", name: "守りの遺物パック", desc: "意識に関わる遺物が4種ふえる", coinPrice: 3000, gemPrice: 30, purchased: true },
  ],

  // ジェムはストアの課金で購入する
  gemProducts: [
    { id: "gem-10", name: "ジェム 10個", desc: "はじめての方に", price: "¥160", amount: 10 },
    { id: "gem-60", name: "ジェム 60個", desc: "いちばん人気", price: "¥800", amount: 60 },
    { id: "gem-150", name: "ジェム 150個", desc: "たっぷり", price: "¥1,800", amount: 150 },
  ],

  adRemoval: {
    id: "ad-removal",
    name: "広告解除",
    desc: "すべての広告が非表示になる。視聴で得られるはずの効果は受け取れる",
    price: "¥600",
    purchased: false,
  },

  errorMessages: {
    catalog: "商品を表示できませんでした。",
    purchase: "購入に失敗しました。",
    billing: "購入を完了できませんでした。",
    receipt: "購入を確認できませんでした。",
  },
};

// ==========================================================
// 画面の状態
// ==========================================================
const state = {
  buyTarget: null, // 購入確認中の遺物パッケージ
  payCurrency: "coin",
  billingTarget: null, // 課金処理中の商品
};

// ==========================================================
// 要素の取得
// ==========================================================
const coinValueEl = document.getElementById("coinValue");
const gemValueEl = document.getElementById("gemValue");
const packageListEl = document.getElementById("packageList");
const gemListEl = document.getElementById("gemList");
const adRemovalListEl = document.getElementById("adRemovalList");
const bannerAdEl = document.getElementById("bannerAd");

const navToastEl = document.getElementById("navToast");
const errorToastEl = document.getElementById("errorToast");
const errorToastMessageEl = document.getElementById("errorToastMessage");
const successToastEl = document.getElementById("successToast");
const successToastMessageEl = document.getElementById("successToastMessage");

const buyModalEl = document.getElementById("buyModal");
const buyTitleEl = document.getElementById("buyTitle");
const buyCoinPriceEl = document.getElementById("buyCoinPrice");
const buyGemPriceEl = document.getElementById("buyGemPrice");
const buyCancelEl = document.getElementById("buyCancel");
const buyConfirmEl = document.getElementById("buyConfirm");

const billingModalEl = document.getElementById("billingModal");
const billingTitleEl = document.getElementById("billingTitle");
const billingMessageEl = document.getElementById("billingMessage");
const billingActionsEl = document.getElementById("billingActions");
const billingCancelEl = document.getElementById("billingCancel");
const billingConfirmEl = document.getElementById("billingConfirm");

const errorModalEl = document.getElementById("errorModal");
const errorMessageEl = document.getElementById("errorMessage");
const errorNoteEl = document.getElementById("errorNote");
const reconnectButtonEl = document.getElementById("reconnectButton");

const previewErrorSelectEl = document.getElementById("previewErrorSelect");
const previewErrorButtonEl = document.getElementById("previewErrorButton");

// ==========================================================
// 通知
// ==========================================================
const toastTimers = new Map();

function showToast(el) {
  el.classList.add("show");
  clearTimeout(toastTimers.get(el));
  toastTimers.set(el, setTimeout(() => el.classList.remove("show"), CONFIG.toastDuration));
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
  el.addEventListener("click", () => {
    navToastEl.textContent = "（本来は" + el.dataset.nav + "画面へ遷移）";
    showToast(navToastEl);
    errorModalEl.hidden = true;
  });
});

// ==========================================================
// 商品一覧の描画
// ==========================================================
function createShopItem(icon, name, desc, buttonLabel, disabled, onBuy) {
  const item = document.createElement("div");
  item.className = "shop-item";

  const iconEl = document.createElement("span");
  iconEl.className = "shop-item-icon";
  iconEl.textContent = icon;

  const body = document.createElement("div");
  body.className = "shop-item-body";

  const nameEl = document.createElement("span");
  nameEl.className = "shop-item-name";
  nameEl.textContent = name;

  const descEl = document.createElement("span");
  descEl.className = "shop-item-desc";
  descEl.textContent = desc;

  body.append(nameEl, descEl);

  const button = document.createElement("button");
  button.className = "shop-buy-button";
  button.textContent = buttonLabel;
  button.disabled = disabled;
  button.addEventListener("click", onBuy);

  item.append(iconEl, body, button);
  return item;
}

function renderCurrency() {
  coinValueEl.textContent = CONFIG.coin.toLocaleString();
  gemValueEl.textContent = CONFIG.gem.toLocaleString();
}

function renderPackages() {
  packageListEl.replaceChildren();

  CONFIG.packages.forEach((pack) => {
    const label = pack.purchased ? "購入済み" : "● " + pack.coinPrice.toLocaleString();
    const item = createShopItem("◈", pack.name, pack.desc, label, pack.purchased, () => openBuyModal(pack));
    packageListEl.append(item);
  });
}

function renderGemProducts() {
  gemListEl.replaceChildren();

  CONFIG.gemProducts.forEach((product) => {
    const item = createShopItem("◆", product.name, product.desc, product.price, false, () => openBillingModal(product));
    gemListEl.append(item);
  });
}

function renderAdRemoval() {
  adRemovalListEl.replaceChildren();

  const product = CONFIG.adRemoval;
  const label = product.purchased ? "購入済み" : product.price;
  const item = createShopItem("🚫", product.name, product.desc, label, product.purchased, () => openBillingModal(product));
  adRemovalListEl.append(item);
}

function renderShop() {
  renderCurrency();
  renderPackages();
  renderGemProducts();
  renderAdRemoval();
}

// ==========================================================
// 遺物パッケージの購入（コインかジェムで支払う）
// ==========================================================
function renderPayChoice() {
  document.querySelectorAll(".pay-button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.currency === state.payCurrency);
  });
}

function openBuyModal(pack) {
  state.buyTarget = pack;
  state.payCurrency = "coin";

  buyTitleEl.textContent = pack.name + "を購入しますか？";
  buyCoinPriceEl.textContent = pack.coinPrice.toLocaleString();
  buyGemPriceEl.textContent = pack.gemPrice.toLocaleString();

  renderPayChoice();
  buyModalEl.hidden = false;
}

document.querySelectorAll(".pay-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.payCurrency = button.dataset.currency;
    renderPayChoice();
  });
});

buyCancelEl.addEventListener("click", () => {
  buyModalEl.hidden = true;
});

buyConfirmEl.addEventListener("click", () => {
  const pack = state.buyTarget;
  const useCoin = state.payCurrency === "coin";
  const price = useCoin ? pack.coinPrice : pack.gemPrice;

  // 所持している通貨が足りないときは購入しない
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

  pack.purchased = true;
  buyModalEl.hidden = true;
  renderCurrency();
  renderPackages();
  showSuccessToast(pack.name + "を購入しました");
});

// ==========================================================
// ストアの課金（ジェム・広告解除）
// ==========================================================
function openBillingModal(product) {
  state.billingTarget = product;
  billingTitleEl.textContent = product.name;
  billingMessageEl.textContent = product.price + " で購入します";
  billingActionsEl.hidden = false;
  billingModalEl.hidden = false;
}

billingCancelEl.addEventListener("click", () => {
  billingModalEl.hidden = true;
});

billingConfirmEl.addEventListener("click", () => {
  const product = state.billingTarget;
  billingMessageEl.textContent = "ストアで処理中…";
  billingActionsEl.hidden = true;

  // 課金が完了するとレシートが発行され、検証後に商品が反映される
  setTimeout(() => {
    billingModalEl.hidden = true;

    if (product.amount) {
      CONFIG.gem += product.amount;
      renderCurrency();
      renderGemProducts();
      showSuccessToast("ジェムを " + product.amount + " 個 追加しました");
      return;
    }

    CONFIG.adRemoval.purchased = true;
    bannerAdEl.hidden = true; // 広告解除の購入後は広告を表示しない
    renderAdRemoval();
    showSuccessToast("広告解除を購入しました");
  }, CONFIG.billingWaitMs);
});

// ==========================================================
// エラーモーダル
// ==========================================================
function showErrorModal(kind) {
  buyModalEl.hidden = true;
  billingModalEl.hidden = true;
  errorMessageEl.textContent = CONFIG.errorMessages[kind];
  errorNoteEl.hidden = kind !== "receipt"; // レシートの検証失敗のみ問い合わせを案内する
  errorModalEl.hidden = false;
}

reconnectButtonEl.addEventListener("click", () => {
  errorModalEl.hidden = true;
  renderShop();
});

// ==========================================================
// 例外系の表示を確認するためのもの（実際の操作フローとは独立したデモ用）
// ==========================================================
previewErrorButtonEl.addEventListener("click", () => {
  showErrorModal(previewErrorSelectEl.value);
});

// ==========================================================
// 初期表示（画面に遷移したときにストアの商品情報を取得する）
// ==========================================================
renderShop();
