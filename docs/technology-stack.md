# 技術スタック (Technology Stack)

## 1. 方針

個人開発のため、無風時に固定費が発生しない構成を優先する。判断に迷う場合は以下の基準で切る。

| 基準 | 方針 |
| --- | --- |
| データの権威。改竄されると成立しないもの | **Cloud Functions 経由でのみ書き込む** |
| クライアントから直接読み書きしてよいもの | Security Rules で許可した範囲に限る |

## 2. クライアント

| 領域 | 採用技術 | 備考 |
| --- | --- | --- |
| フレームワーク | Flutter (Dart) | |
| 状態管理 | Riverpod | `presentation/` でのみ使用 |
| ルーティング | go_router | 宣言的、ディープリンク対応 |
| 認証 | firebase_auth | 匿名認証 |
| データアクセス | cloud_firestore | |
| マスターデータ取得 | firebase_storage | §5.2 |
| ローカル保存 | shared_preferences / hive | 設定・キャッシュ |
| アニメーション | flutter_animate | |
| 効果音 | audioplayers | BGM / SE |
| 課金 | in_app_purchase | レシート検証はサーバ側 (§3) |
| 広告 | google_mobile_ads | バナー / 動画 / リワード |

### 2.1 動作環境

- iOS 13+ / Android 8.0 (API 26)+
- 縦持ち固定 (ポートレート)

## 3. サーバ (Firebase)

| 領域 | 採用技術 | 備考 |
| --- | --- | --- |
| 認証 | Firebase Auth | 匿名認証 → アカウント連携 (§6-1) |
| データストア | Cloud Firestore | プレイヤーデータ / ランデータ / スコア |
| サーバロジック | Cloud Functions (TypeScript) | リージョンは `asia-northeast1` |
| マスターデータ配信 | Cloud Storage | §5.2 |
| 課金レシート検証 | Cloud Functions | App Store Server API |
| 広告 | AdMob | |
| クラッシュレポート | Crashlytics | |
| 分析 | Firebase Analytics | GA4 連携 |
| 運用フラグ | Remote Config | 広告の ON/OFF・メンテナンス表示・強制アップデートなど。マスターデータには使わない (§5.2) |
| 監視 | Cloud Logging / Cloud Monitoring | ログ保持期間を必ず設定する |
| コスト管理 | Cloud Billing 予算アラート | 最初に設定する |

Cloud Functions で扱う責務:

- ランデータの登録とスコアの検証
- スコアエントリの登録とリーダーボード取得
- 通貨・解放状況・図鑑の更新
- 課金レシート検証
- 不正検知・警告回数の保持・サイレント BAN
- アカウント削除

## 4. 構成上の要点

### 4.1 認証フロー

```
Flutter ── Firebase Auth 匿名認証 ──> ログイン状態
   │
   ├── cloud_firestore で読み取り (Security Rules の範囲内)
   └── Cloud Functions 呼び出し (書き込み系はすべてこちら)
```

- `PlayerId` は Firebase Auth の uid と同一
- Cloud Functions は呼び出し元の uid を Firebase Auth から受け取るため、クライアントが PlayerId を詐称できない

### 4.2 マスターデータの配信

遺物の効果値・出題比率・基礎点などのマスターデータは、クライアントとサーバ側スコア検証の **両方** が同じ値を参照する必要がある。

**git を SoT とし、クライアントと Cloud Functions が同じ JSON を読む。**

- JSON は git で管理し、デプロイで Cloud Storage に配置する
- クライアントは起動時に取得する
- Cloud Functions はスコア検証時に同じ JSON を読む
- Remote Config はマスターデータに使わない。運用フラグの配信に限定する

対象:

- 遺物カタログ (効果・レアリティ・種別)
- ガーディアン
- 難易度ごとの出題定義
- スコアの各係数 (ベース / 速度ボーナス / 連続正解 / 難易度 / フロア / クリアボーナス)

### 4.3 Firestore の構成方針

| コレクション | 内容 |
| --- | --- |
| `players/{playerId}` | 通貨・解放状況・図鑑・ベストスコア・BAN 状態 |
| `runs/{runId}` | スコア・正答率など検証用の記録 |
| `scores/{scoreId}` | `boardId` (モード × 難易度 × プレイ形式)、`period`、`score`、`playerId`、`name` |

- 複合インデックス `(boardId, period, score desc)` を張る
- 現在順位は集計クエリで取得する

```
scores.where('boardId', '==', b)
      .where('period', '==', p)
      .where('score', '>', 自分のスコア)
      .count()
```

- 集計クエリはインデックス 1000 件につき 1 読み取りで課金されるため、上位件数が増えてもコストが伸びにくい
- デイリー / ウィークリーのスコアは TTL ポリシーで自動削除する
- **Security Rules で `scores` と、`players` の通貨・解放系フィールドはクライアントから書けないようにする。** 書き込みは Cloud Functions のみ

### 4.4 アカウント削除

- Firebase Extension の `delete-user-data` で、Auth のユーザー削除に連動して Firestore と Cloud Storage のデータを削除する
- ランキングに登録済みのスコアの削除はクエリが必要なため、Cloud Functions を別途用意する

## 5. 未決定事項

1. **ユーザー ID とパスワードでの引き継ぎをどう実現するか** — Firebase Auth の標準はメール / パスワード。ID を使うならカスタム認証を挟む必要がある
2. マスターデータを Cloud Functions に同梱するか、Cloud Storage から読むか
3. Android を対象にするか (要件定義 5.1 は「iOS予定」だが §2.1 は両対応と書いている)
