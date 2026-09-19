---
name: building-screen-mockups
description: Build a static HTML/CSS/JS mockup of one screen from docs/screen-design/*.md, viewable in a browser with no real navigation wired up. Use this whenever the user wants to visualize, prototype, or check the feel/behavior of a screen defined in docs/screen-design (title, start menu, game, result, ranking, encyclopedia, shop, account, etc.) — including phrases like "この画面のイメージをHTML/CSSで表現したい", "画面のイメージが分かるようにして", "動きが分かるようにしたい", or when a screen file name is mentioned (01-title, 02-start-menu, ...). Prefer this over freehanding a one-off mockup: it encodes the established conventions (iPhone 16 frame, ad banner placed inside the screen bounds, CONFIG-based editable values, the hidden/display CSS pitfall).
---

# building-screen-mockups

`docs/screen-design/*.md` の画面設計を、実際にブラウザで見て動きが分かる簡易HTML/CSS/JSモックアップにする。画面遷移は作らない（1画面だけを表現する）。

## ルール

1. **控えめに作る**: ページを開いたら自動で一連の動き（ローディング→完了など）が再生される程度に留める。操作パネルや処理ログのような作り込んだUIは、明示的に求められない限り作らない。例外系（エラーモーダルなど）を見せたい場合だけ、小さい確認用ボタンを1つ置く。
2. **デモページの中央に配置する**: `body` を `display:flex; align-items:center; justify-content:center` にして、画面（`.phone`）をページ中央に置く。
3. **iPhone 16 基準で作る**: 論理解像度 393×852pt、アスペクト比 393/852。
4. **広告表示エリア（バナー広告）は「画面」の内側に置く**: 外に別枠で足さない。要件定義書「バナー広告: 常時一番下に出す」に従い、ゲーム画面の下に帯として重ねる。
5. **「画面」の境界線をはっきり見せる**: `.phone-screen` に border を付ける。外側の黒いスマホ筐体とゲーム内背景は同系色で紛れやすい。
6. **Dynamic Islandと重ねない**: Dynamic Island（`.phone-screen::before`, top 1.6%〜4.8%）の下に十分な余白（top 6.5%目安）を空けてから、Player IDなど画面上部の要素を配置する。px指定だと画面幅を変えたときにズレるので、位置は`%`で指定する。
7. **調整値を一箇所に集約する**: JSの調整値は `CONFIG` オブジェクトに、CSSのサイズ・色は `:root` のカスタムプロパティにまとめ、ユーザー自身が編集できるようにする。プレーンなHTML/CSS/JSのみで、ビルド不要・`index.html` をダブルクリックで開けば動く状態にする。
8. **素材は共通置き場を使う**: 背景・キャラクター・ロゴなどは画面をまたいで使い回すため `docs/screen-design/html-image/assets/` に置いてもらい、各画面からは相対パス `../assets/xxx.png` で参照する。

## 手順

進捗はこのチェックリストをコピーして追いながら進める。

```
- [ ] Step 1: 設計書・要件定義を読む
- [ ] Step 2: 必要な素材を確認する
- [ ] Step 3: テンプレートをコピーする
- [ ] Step 4: 画面固有の中身を実装する
- [ ] Step 5: [hidden]の罠を踏んでいないか確認する
- [ ] Step 6: 動作確認する
```

**Step 1: 対象画面の設計書を読む**

`docs/screen-design/<NN-name>.md` のユースケース・画面遷移・取得/送信要素・例外処理・細かな仕様を確認する。画面遷移そのものは作らないが、「タップしたら何が起きるか」は状態変化で表現する材料になる。

- 参考モックアップ画像があれば `docs/screen-design/screen-image-design/<NN-name>/` も見る（合成イメージなので、そのまま背景として使えるとは限らない）。
- 広告の扱いは `docs/requirements-definition.md` の「3.4 広告」と `docs/ubiquitous-language.md` の「9. 課金・広告」で確認する（バナー/動画/リワードのどれが関係するか、常時表示かタイミング表示か）。

**Step 2: 必要な素材を確認する**

`docs/screen-design/html-image/assets/` を見て、その画面に必要な透過PNG（背景・キャラクター・ロゴ等）が既にあるか確認する。無ければユーザーに、ファイル名・置き場所（`docs/screen-design/html-image/assets/`）・透過が必要かを具体的に伝えて用意してもらう。装飾フレーム（ボタン枠やバー枠など）はCSSで表現できるので、画像を追加で頼む必要は基本ない。

**Step 3: テンプレートをコピーする**

このスキルの `assets/template/{index.html,style.css,script.js}` を `docs/screen-design/html-image/<NN-name>/` にコピーする。テンプレートは01-titleの実例で、共通クロム（`.phone` 〜 `.banner-ad` とその周辺CSS、`[hidden]` 対策のCSSパターン、`CONFIG`/`sleep()` のJS構成）はそのまま使う想定。ファイル内のコメントで「画面固有・書き換える」範囲を示してある。

**Step 4: 画面固有の中身を実装する**

設計書のユースケース・取得要素に沿って、ロゴやキャラクターの代わりにその画面の要素を配置し、`script.js` の `CONFIG` と演出ロジックをその画面の流れに書き換える。

- 通信失敗など例外系がある画面では、モーダルパターン（`.modal-overlay` / `[hidden]` トグル）を流用し、確認用の小さいボタンを1つ置く。ボタンを増やしすぎない。
- 画面遷移が必要な操作（例: STARTボタン）は、実際には遷移させず「本来は◯◯画面へ遷移する」という旨をどこかに一言添えるだけでよい。

**Step 5: `[hidden]` の罠を踏んでいないか確認する**

要素を `hidden` 属性で出し分けている場合、そのCSSクラスに `display: flex` / `display: block` 等を**直接**書くと `[hidden]{display:none}` より詳細度・カスケードで勝ってしまい、常に表示され続けるバグになる(01-titleのSTARTボタン・エラーモーダルで実際に発生した)。`.foo { /* display は書かない */ }` + `.foo:not([hidden]) { display: flex; }` の形にする。

**Step 6: 動作確認する**

`node -c script.js` で構文エラーがないか確認し、HTML内の開閉タグ数をざっと突き合わせる。ブラウザ操作ツールが使えるならページを開いて目視確認する。使えない場合は、その旨をユーザーに伝えた上で、`index.html` を直接（サーバー不要・`file://`のダブルクリックで）開いて確認してもらうよう案内する。

## 配置場所

```text
docs/screen-design/html-image/
  assets/                共通素材（背景・キャラクター・ロゴなど。透過PNG）
  <NN-name>/
    index.html
    style.css
    script.js
```

`<NN-name>` は対応する設計書と同じ名前にする（例: `01-title`, `02-start-menu`）。
