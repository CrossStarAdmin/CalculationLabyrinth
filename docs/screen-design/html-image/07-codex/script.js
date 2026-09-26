"use strict";

// ==========================================================
// 設定値（ここを書き換えれば挙動・表示内容を調整できます）
// ==========================================================
const CONFIG = {
  unknownName: "???", // まだ出会っていないものの表示（表示方法は未定）
  unknownText: "まだ出会っていません。",
  toastDuration: 1800,

  // TODO: 遺物・ガーディアンの絵柄待ち。届くまでは仮にキャラクター画像を使う
  artPath: "../assets/character.png",

  // 一覧はマスターデータ、found はユーザーデータ（どちらもタイトル画面で取得済み）
  relics: [
    { name: "砂時計の欠片", rarity: "★★", text: "制限時間が1秒のびる。", found: true },
    { name: "静寂の羽根", rarity: "★", text: "意識が1回復する。", found: true },
    { name: "連なりの護符", rarity: "★★★", text: "連続正解の倍率が2倍になる。", found: true },
    { name: "石英のペンダント", rarity: "★", text: "ベースのスコアが20%上がる。", found: true },
    { name: "反響の水晶", rarity: "★★", text: "速度ボーナスが1.5倍になる。", found: true },
    { name: "古びた羅針盤", rarity: "★★", text: "問題がやさしい範囲に寄る。", found: false },
    { name: "守り火のランプ", rarity: "★★", text: "意識の上限が1増える。", found: true },
    { name: "静寂の鈴", rarity: "★★★", text: "目覚めの鈴が1つ増える。", found: false },
    { name: "迷宮の地図", rarity: "★", text: "フロアの問題数が2問減る。", found: true },
    { name: "深層の宝珠", rarity: "★★★", text: "クリアボーナスが2倍になる。", found: false },
    { name: "欠けた分銅", rarity: "★", text: "不正解でも連続正解が途切れにくくなる。", found: false },
    { name: "月光の砂", rarity: "★★", text: "残り時間が少ないほどスコアが上がる。", found: false },
    { name: "月光の砂", rarity: "★★", text: "残り時間が少ないほどスコアが上がる。", found: false },
  ],

  guardians: [
    { name: "石守りのゴーレム", rarity: "★", text: "最初のフロアに現れる。能力を持たない。", found: true },
    { name: "刻を継ぐ番人", rarity: "★★", text: "制限時間を1秒短くする。", found: true },
    { name: "深層の守護者", rarity: "★★★", text: "不正解のとき意識を2減らす。", found: true },
    { name: "囁きの影", rarity: "★★", text: "選択肢の並びが毎問入れ替わる。", found: false },
    { name: "砂嵐のヌシ", rarity: "★★★", text: "問題の桁が1つ増える。", found: false },
    { name: "夢見の門番", rarity: "★★★", text: "連続正解の倍率が上がらなくなる。", found: false },
  ],
};

// ==========================================================
// 画面の状態
// ==========================================================
const state = {
  category: "遺物",
};

// ==========================================================
// 要素の取得
// ==========================================================
const categoryTabsEl = document.getElementById("categoryTabs");
const codexCountEl = document.getElementById("codexCount");
const collectValueEl = document.getElementById("collectValue");
const collectFillEl = document.getElementById("collectFill");
const codexGridEl = document.getElementById("codexGrid");

const detailModalEl = document.getElementById("detailModal");
const detailArtEl = document.getElementById("detailArt");
const detailNameEl = document.getElementById("detailName");
const detailRarityEl = document.getElementById("detailRarity");
const detailTextEl = document.getElementById("detailText");
const detailCloseEl = document.getElementById("detailClose");

const navToastEl = document.getElementById("navToast");

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
// 描画
// ==========================================================
function currentItems() {
  return state.category === "遺物" ? CONFIG.relics : CONFIG.guardians;
}

function renderGrid() {
  const items = currentItems();
  const foundCount = items.filter((item) => item.found).length;
  const percent = Math.round((foundCount / items.length) * 100);

  codexCountEl.textContent = foundCount + " / " + items.length + " 種";
  collectValueEl.textContent = percent + "%";
  collectFillEl.style.width = percent + "%";

  codexGridEl.replaceChildren();

  items.forEach((item) => {
    const cell = document.createElement("button");
    cell.className = item.found ? "codex-cell parchment" : "codex-cell parchment unknown";

    const art = document.createElement("img");
    art.className = "codex-art";
    art.src = CONFIG.artPath;
    art.alt = "";

    const rarity = document.createElement("span");
    rarity.className = "codex-cell-rarity";
    rarity.textContent = item.found ? item.rarity : "-";

    cell.append(art, rarity);
    cell.addEventListener("click", () => openDetail(item));
    codexGridEl.append(cell);
  });
}

function renderTabs() {
  categoryTabsEl.replaceChildren();

  ["遺物", "ガーディアン"].forEach((label) => {
    const button = document.createElement("button");
    button.className = label === state.category ? "rank-tab selected" : "rank-tab";
    button.textContent = label;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.category = label;
      renderTabs();
      renderGrid();
    });
    categoryTabsEl.append(button);
  });
}

// ==========================================================
// 詳細
// ==========================================================
function openDetail(item) {
  detailArtEl.src = CONFIG.artPath;
  detailArtEl.classList.toggle("unknown", item.found === false);
  detailNameEl.textContent = item.found ? item.name : CONFIG.unknownName;
  detailRarityEl.textContent = item.found ? item.rarity : "-";
  detailTextEl.textContent = item.found ? item.text : CONFIG.unknownText;
  detailModalEl.hidden = false;
}

detailCloseEl.addEventListener("click", () => {
  detailModalEl.hidden = true;
});

// ==========================================================
// 初期表示（ローカルに持っているマスターデータとユーザーデータから表示する）
// ==========================================================
renderTabs();
renderGrid();
