# 技術スタック (Technology Stack)

## 1. 方針
無風時に固定費が発生しない構成にする。改竄されると成立しないデータは Cloud Functions 経由でのみ書き込む。

| データ | 書き込み経路 |
| --- | --- |
| 改竄されると成立しないもの | Cloud Functions |
| それ以外 | クライアントから直接。Security Rules で許可した範囲に限る |

## 2. クライアント
Flutter (Dart)。縦持ち固定。

| 領域 | 採用技術 | 備考 |
| --- | --- | --- |
| フレームワーク | Flutter (Dart) | |
| 状態管理 | Riverpod | `presentation/` でのみ使用 |
| ルーティング | go_router | |
| 認証 | firebase_auth | 匿名認証 |
| データアクセス | cloud_firestore | |
| マスターデータ取得 | firebase_storage | §4.2 |
| ローカル保存 | shared_preferences / hive | 設定・キャッシュ |
| アニメーション | flutter_animate | |
| 効果音 | audioplayers | BGM / SE |
| 課金 | in_app_purchase | レシート検証はサーバ側 |
| 広告 | google_mobile_ads | バナー / 動画 / リワード |

動作環境: iOS 13+ / Android 8.0 (API 26)+

## 3. サーバ (Firebase)
Firebase で構成し、サーバロジックは Cloud Functions (TypeScript, `asia-northeast1`) に置く。

| 領域 | 採用技術 | 備考 |
| --- | --- | --- |
| 認証 | Firebase Auth | 匿名認証 → アカウント連携 |
| データストア | Cloud Firestore | プレイヤーデータ / ランデータ / スコア |
| サーバロジック | Cloud Functions (TypeScript) | |
| マスターデータ配信 | Cloud Storage | §4.2 |
| 課金レシート検証 | Cloud Functions | App Store Server API |
| 広告 | AdMob | |
| クラッシュレポート | Crashlytics | |
| 分析 | Firebase Analytics | GA4 連携 |
| 運用フラグ | Remote Config | 広告の ON/OFF・メンテナンス表示・強制アップデート |
| 監視 | Cloud Logging / Cloud Monitoring | ログ保持期間を設定する |
| コスト管理 | Cloud Billing 予算アラート | 最初に設定する |

Cloud Functions の責務:

- ランデータの登録とスコア検証
- スコアエントリの登録とリーダーボード取得
- 通貨・解放状況・図鑑の更新
- 課金レシート検証
- 不正検知・警告回数の保持・サイレント BAN
- アカウント削除

## 4. 構成上の要点

### 4.1 認証フロー
Firebase Auth の匿名認証でログインし、読み取りは Firestore 直接、書き込みは Cloud Functions で行う。

```
Flutter ── Firebase Auth 匿名認証 ──> ログイン状態
   │
   ├── cloud_firestore で読み取り (Security Rules の範囲内)
   └── Cloud Functions 呼び出し (書き込み系はすべてこちら)
```

- `PlayerId` は Firebase Auth の uid と同一にする
- Cloud Functions は呼び出し元の uid を Firebase Auth から取得する

### 4.2 マスターデータの配信
git を SoT とし、クライアントと Cloud Functions が同じ JSON を読む。

- JSON は git で管理し、デプロイで Cloud Storage に配置する
- クライアントは起動時に取得し、Cloud Functions はスコア検証時に読む
- 対象: 遺物カタログ（効果・レアリティ・種別）/ ガーディアン / 難易度ごとの出題定義 / スコアの各係数

### 4.3 Firestore の構成
3コレクションで構成し、`scores` と `players` の通貨・解放系フィールドは Cloud Functions のみが書き込む。

| コレクション | 内容 |
| --- | --- |
| `players/{playerId}` | 通貨・解放状況・図鑑・ベストスコア・BAN 状態 |
| `runs/{runId}` | スコア・正答率など検証用の記録 |
| `scores/{scoreId}` | `boardId`（モード × 難易度 × プレイ形式）、`period`、`score`、`playerId`、`name` |

- 複合インデックス `(boardId, period, score desc)` を張る
- 現在順位は集計クエリで取得する

```
scores.where('boardId', '==', b)
      .where('period', '==', p)
      .where('score', '>', 自分のスコア)
      .count()
```

- デイリー / ウィークリーのスコアは TTL ポリシーで自動削除する

### 4.4 アカウント削除
Firebase Extension `delete-user-data` で、Auth のユーザー削除に連動して Firestore と Cloud Storage のデータを削除する。ランキング登録済みスコアは Cloud Functions で削除する。

## 5. 未確定事項

- ユーザー ID とパスワードでの引き継ぎをどう実現するか？（Firebase Auth 標準はメール / パスワード。ID を使う場合はカスタム認証が必要）
  - A:
- マスターデータを Cloud Functions に同梱するか、Cloud Storage から読むか？（§4.2 は Cloud Storage の記載）
  - A:
- Android を対象にするか？（要件定義 5.1 は iOS のみ）
  - A:
