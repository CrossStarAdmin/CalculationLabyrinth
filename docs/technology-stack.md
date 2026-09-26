# 技術スタック (Technology Stack)

## 1. 方針
無風時に固定費が発生しない構成にする。改竄されると成立しないデータは Cloud Functions 経由でのみ書き込む。

| 基準 | 方針 |
| --- | --- |
| 改竄されると成立しないデータ | Cloud Functions 経由でのみ書き込む |
| クライアントから直接読み書きするデータ | Security Rules で許可した範囲に限る |
| クライアントの申告 | サーバが再計算・照合できる形で受け取る |
| 対象プラットフォーム | iOS のみ。Android を後から追加できる構成にする (§4.7) |

## 2. クライアント
Flutter (Dart)。iOS 13+、縦持ち固定。

| 領域 | 採用技術 | 備考 |
| --- | --- | --- |
| フレームワーク | Flutter (Dart) | |
| 状態管理 | Riverpod | `presentation/` でのみ使用 |
| ルーティング | go_router | |
| 認証 | firebase_auth | 匿名認証 → メール / パスワード連携 (§4.2) |
| 不正クライアント対策 | firebase_app_check | App Attest (§4.1) |
| データアクセス | cloud_firestore | |
| マスターデータ取得 | firebase_storage | §4.3 |
| ローカル保存 | shared_preferences / hive | 音量設定・マスターデータのキャッシュ |
| 乱数生成 | 自前実装 | サーバと同一アルゴリズム (§4.4) |
| アニメーション | flutter_animate | |
| 効果音 | audioplayers | BGM / SE |
| 課金 | in_app_purchase | レシート検証はサーバ側 (§4.7) |
| 広告 | google_mobile_ads | バナー / リワード。リワードは SSV で検証する (§4.5) |
| 外部ページ表示 | url_launcher | 利用規約・プライバシーポリシー・問い合わせ |

## 3. サーバ (Firebase)
Firebase で構成し、サーバロジックは Cloud Functions (TypeScript, `asia-northeast1`) に置く。

| 領域 | 採用技術 | 備考 |
| --- | --- | --- |
| 認証 | Firebase Auth | 匿名認証 → メール / パスワード連携 (§4.2) |
| 不正クライアント対策 | Firebase App Check | Firestore / Cloud Functions / Cloud Storage で強制する |
| データストア | Cloud Firestore | §4.6 |
| サーバロジック | Cloud Functions (TypeScript) | |
| マスターデータ配信 | Cloud Storage | §4.3 |
| 課金レシート検証 | Cloud Functions | App Store Server API (§4.7) |
| 広告 | AdMob | リワード広告は SSV を使う (§4.5) |
| クラッシュレポート | Crashlytics | |
| 分析 | Firebase Analytics | GA4 連携 |
| 運用フラグ | Remote Config | 広告の ON/OFF・メンテナンス表示・強制アップデート |
| 監視 | Cloud Logging / Cloud Monitoring | ログ保持期間を設定する |
| コスト管理 | Cloud Billing 予算アラート | 最初に設定する |

Cloud Functions の責務:

- ランの開始 (ランID・シードの発行)
- ランの結果の登録と検証 (シードからの再現・スコアの再計算・遭遇した遺物 / ガーディアンの図鑑への反映)
- スコアエントリの更新とランキング (ローカル / グローバル) の取得
- ラン報酬 (コイン) の付与
- リワード広告の SSV コールバックの受信
- モード / 難易度の解放、遺物パックの購入
- 表示名の変更と NG ワードの判定
- 課金レシート検証
- 不正検知・警告回数の保持・サイレント BAN
- アカウント削除

## 4. 構成上の要点

### 4.1 認証フロー
Firebase Auth の匿名認証 + App Check でログインし、読み取りは Firestore 直接、書き込みは Cloud Functions で行う。

```
Flutter ── Firebase Auth 匿名認証 ──> ログイン状態
   │         + App Check トークン
   ├── cloud_firestore で読み取り (Security Rules の範囲内)
   └── Cloud Functions 呼び出し (書き込み系はすべてこちら)
```

- `UserId` は Firebase Auth の uid と同一。画面に表示するユーザーIDも uid を使う
- Cloud Functions は呼び出し元の uid を Firebase Auth から取得する

### 4.2 引き継ぎ
Firebase Auth のメール / パスワード認証を使い、ユーザーには uid とパスワードだけを入力させる。

- メールアドレスは `{uid}@<ダミードメイン>` とする
- 引き継ぎ設定: 匿名アカウントに `linkWithCredential` でメール / パスワードを紐づける。uid は変わらない
- 引き継ぎ実行: 別の端末で `signInWithEmailAndPassword` する

### 4.3 マスターデータの配信
git を SoT とし、クライアントと Cloud Functions が同じバージョンの JSON を読む。

- JSON は git で管理し、デプロイで Cloud Storage に配置する。JSON にはバージョンを持たせる
- クライアントは起動時に取得し、ローカルにキャッシュする
- ラン開始時にマスターデータのバージョンを `runs` に記録し、検証時は同じバージョンで再現する
- 対象: モード / 難易度ごとの出題定義 / 問題形式 / 遺物カタログ (効果・レアリティ・種別) / 遺物パック / ガーディアン / スコアの各係数 / ストーリー

### 4.4 ランの再現と検証
サーバが発行したシードから、クライアントとサーバが同じランを再現し、サーバがスコアを再計算・照合する。

```
Client ── ラン開始 (モード・難易度・プレイ形式) ──> Functions
       <── ランID・シード ──                        (runs に開始時刻・シード・マスターデータのバージョンを保存)
Client: シードから問題・遺物候補・ガーディアンを生成してプレイ
Client ── ラン結果 (各問の正誤と残り時間・選んだ遺物・目覚めの回数・申告スコア) ──> Functions
Functions: 同じシードで再現 → スコア再計算・照合 → 図鑑反映・スコアエントリ更新
```

- 乱数生成器は Dart と TypeScript で同じアルゴリズムを自前実装する
- ラン生成とスコア計算は Dart と TypeScript で二重実装し、共通のテストデータ (シード・入力・期待結果の JSON) で両方が同じ結果になることをテストする
- 遭遇した遺物 / ガーディアンは再現結果と照合してから図鑑に反映する
- 不正とみなす条件: 申告スコアと再計算結果の不一致 / 残り時間が制限時間を超える / 問題数が合わない / 開始から終了までの実時間が短すぎる / 目覚めの回数が SSV の記録数を超える (§4.5)

### 4.5 リワード広告の検証 (SSV)
目覚めの鈴 (ゲーム画面) とラン報酬 (結果画面) は、SSV で検証したリワード広告の視聴を条件にする。

- 広告の表示時に `ServerSideVerificationOptions` のカスタムデータにランIDと用途を入れる
- AdMob は視聴完了時に Cloud Functions の HTTP エンドポイントを呼ぶ。署名を検証し、`adRewards/{transactionId}` に記録する
- クライアントは確認中の表示を出して記録を待つ
- ラン報酬のコインはサーバがランから計算して付与する。クライアントは付与の申請だけを送る。付与はランIDごとに1回だけ受け付ける
- 広告解除の購入者は、サーバが `users` の広告解除フラグを確認し、SSV なしで付与する

### 4.6 Firestore の構成
`runs` をランの SoT とし、`scores` はランの登録時に Functions が更新するベスト記録の索引とする。

| コレクション | 内容 |
| --- | --- |
| `users/{userId}` | ユーザー情報。詳細は `data-definition/01-user.md` |
| `runs/{runId}` | 全ランの記録。`userId`・`boardId`・シード・マスターデータのバージョン・開始 / 終了時刻・結果・スコア・期間キー・報酬付与済みフラグ |
| `scores/{boardId}_{period}_{periodKey}_{userId}` | プレイヤーごと・期間ごとのベスト記録。`boardId`・`period`・`periodKey`・`score`・`userId`・`name`・`runId` |
| `adRewards/{transactionId}` | SSV で受け取った視聴記録。`runId`・用途 |

- `boardId` はモード × 難易度 × プレイ形式
- 期間キーは `dailyKey` (例: `2026-09-23`)・`weeklyKey` (例: `2026-W39`)。全期間はキーなし
- **Security Rules で `runs`・`scores`・`adRewards` と、`users` の通貨フィールドは Cloud Functions のみが書き込めるようにする**
- デイリー / ウィークリーの `scores` は TTL ポリシーで自動削除する

ローカルランキング (自分の上位5件) は `runs` から取得する。

```
runs.where('userId', '==', me)
    .where('boardId', '==', b)
    .where('dailyKey', '==', 今日)   // 全期間はこの条件なし
    .orderBy('score', 'desc')
    .limit(5)
```

グローバルランキングは `scores` から取得し、現在順位は集計クエリで取得する。

```
scores.where('boardId', '==', b)
      .where('period', '==', p)
      .where('periodKey', '==', k)
      .orderBy('score', 'desc')
      .limit(100)

scores.where('boardId', '==', b)
      .where('period', '==', p)
      .where('periodKey', '==', k)
      .where('score', '>', 自分のスコア)
      .count()
```

複合インデックス:

- `runs`: `(userId, boardId, score desc)`、`(userId, boardId, dailyKey, score desc)`、`(userId, boardId, weeklyKey, score desc)`
- `scores`: `(boardId, period, periodKey, score desc)`

### 4.7 課金
課金対象はジェム (消耗型)・広告解除 (非消耗型)・モード / 難易度の解放。レシート検証はストアごとに差し替えられる形で実装し、現在は App Store Server API のみ。

- 広告解除は非消耗型のため、購入の復元を用意する
- Android 追加時の対応箇所: レシート検証に Google Play Developer API / App Check に Play Integrity / AdMob の Android 用広告ユニット

### 4.8 アカウント削除
Firebase Extension `delete-user-data` で、Auth のユーザー削除に連動して Firestore と Cloud Storage のデータを削除する。`runs`・`scores` は Cloud Functions で削除する。

## 5. 未確定事項

- マスターデータを Cloud Functions に同梱するか、Cloud Storage から読むか？（どちらでも §4.3 のバージョン指定で再現できること）
  - A:
- 遺物・ガーディアンの画像をアプリに同梱するか、Cloud Storage から配信するか？
  - A:
- 引き継ぎ実行後に残る匿名アカウントをどう扱うか？
  - A:
- Cloud Functions のコールドスタートを許容するか？（最小インスタンスは固定費になる）
  - A:
- 表示名の変更時に、登録済みの `scores.name` を更新するか？
  - A:
- NG ワードをどう判定するか？
  - A:
- 集計期間の区切り（タイムゾーン・週の始まり）は？
  - A:
