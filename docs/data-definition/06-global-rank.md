# 06 グローバルランク データ定義

## 1. 概要

グローバルランキングの記録はサーバーに保存する。ユーザー × ボードにつき1件を持ち、全期間・ウィークリー・デイリーのベストをまとめて持つ。

| 保存場所 | 保存するデータ |
| --- | --- |
| サーバー | ユーザー × ボードごとのベスト記録 |

順位は保存せず、取得時にスコアの高い順で決める。

## 2. サーバー側のデータ

- **コレクション名**: `global_ranks`

### 2.1 データ構造

```
global_ranks/{user_profile_id}_{mode_id}_{mode_difficulty_level_id}_{play_format} {
    id: string,
    user_profile_id: string,
    name: string,
    mode_id: string,
    mode_difficulty_level_id: string,
    play_format: four-choice | input,
    all_time_score: number,
    all_time_run_id: string,
    weekly_key: string,
    weekly_score: number,
    weekly_run_id: string,
    daily_key: string,
    daily_score: number,
    daily_run_id: string,
}
```

### 2.2 初期値

そのボードで初めてランを登録したときに作成する。全期間・ウィークリー・デイリーのすべてにそのランを入れる。

```json
{
    "id": "【user_profile_id】_【mode_id】_【mode_difficulty_level_id】_【play_format】",
    "user_profile_id": "【ランを遊んだユーザーのuid】",
    "name": "【登録時の users.name】",
    "mode_id": "【ランのモードのID】",
    "mode_difficulty_level_id": "【ランの難易度のID】",
    "play_format": "【ランのプレイ形式】",
    "all_time_score": "【ランのスコア】",
    "all_time_run_id": "【ランのID】",
    "weekly_key": "2026-W39",
    "weekly_score": "【ランのスコア】",
    "weekly_run_id": "【ランのID】",
    "daily_key": "2026-09-23",
    "daily_score": "【ランのスコア】",
    "daily_run_id": "【ランのID】"
}
```

### 2.3 権限

| 操作 | 許可する対象 | 条件 |
| --- | --- | --- |
| 読み | アプリ | ログイン中であること |
| 書き | サーバー（Cloud Functions） | なし |

### 2.4 各項目の説明

ここでいう「ランの登録」は、ランの結果を受け取り、`runs` の `status` を `cleared` / `failed` にしたときを指す。`invalid` のランは登録しない。

#### id

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 記録を識別するID。ドキュメントIDと同じ値 |
| 制約 | `{user_profile_id}_{mode_id}_{mode_difficulty_level_id}_{play_format}` の形式 |
| 初期値 | 作成時に組み立てた値 |
| 値の変更 | 不変 |
| 書き権限 | サーバー（作成時のみ） |

#### user_profile_id

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 記録を持つユーザーのID |
| 制約 | `users` に存在するID |
| 初期値 | ランを遊んだユーザーのuid |
| 値の変更 | 不変 |
| 書き権限 | サーバー（作成時のみ） |

#### name

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | ランキングに表示する名前 |
| 制約 | `users.name` と同じ |
| 初期値 | 作成時の `users.name` |
| 値の変更 | ランの登録のたびに、そのときの `users.name` を入れる。名前を変えただけでは書き換えない |
| 書き権限 | サーバー |

#### mode_id

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | ボードのモードのID |
| 制約 | マスターデータのモードに存在するID |
| 初期値 | ランのモードのID |
| 値の変更 | 不変 |
| 書き権限 | サーバー（作成時のみ） |

#### mode_difficulty_level_id

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | ボードの難易度のID |
| 制約 | `mode_id` のモードに属する難易度のID |
| 初期値 | ランの難易度のID |
| 値の変更 | 不変 |
| 書き権限 | サーバー（作成時のみ） |

#### play_format

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | ボードのプレイ形式 |
| 制約 | `four-choice`（4択形式） / `input`（入力形式） |
| 初期値 | ランのプレイ形式 |
| 値の変更 | 不変 |
| 書き権限 | サーバー（作成時のみ） |

#### all_time_score / all_time_run_id

| 項目 | 内容 |
| --- | --- |
| 型 | number / string |
| 説明 | 全期間のベストスコアと、そのランのID |
| 制約 | スコアは0以上の整数。ランIDは `runs` に存在するID |
| 初期値 | 作成時のランのスコアとID |
| 値の変更 | ランの登録時、スコアが `all_time_score` を上回れば書き換える |
| 書き権限 | サーバー |

#### weekly_key / weekly_score / weekly_run_id

| 項目 | 内容 |
| --- | --- |
| 型 | string / number / string |
| 説明 | どの週のベストか、その週のベストスコア、そのランのID |
| 制約 | `weekly_key` は `YYYY-Www` 形式（例: `2026-W39`）。日本時間・月曜始まり |
| 初期値 | 作成時の週と、そのランのスコアとID |
| 値の変更 | ランの登録時、`weekly_key` が今週と違えば3つとも今のランで書き換える。同じ週なら、スコアが `weekly_score` を上回ったときだけ書き換える |
| 書き権限 | サーバー |

#### daily_key / daily_score / daily_run_id

| 項目 | 内容 |
| --- | --- |
| 型 | string / number / string |
| 説明 | どの日のベストか、その日のベストスコア、そのランのID |
| 制約 | `daily_key` は `YYYY-MM-DD` 形式（例: `2026-09-23`）。日本時間 |
| 初期値 | 作成時の日と、そのランのスコアとID |
| 値の変更 | ランの登録時、`daily_key` が今日と違えば3つとも今のランで書き換える。同じ日なら、スコアが `daily_score` を上回ったときだけ書き換える |
| 書き権限 | サーバー |

### 2.5 取得方法

| 取得するもの | 取り方 |
| --- | --- |
| 上位100件 | ボードで絞り、`{期間}_score` の高い順に100件取得する。ウィークリー / デイリーは `weekly_key` / `daily_key` が今の週 / 日のものに絞る |
| 自分の現在順位 | 同じ条件で、`{期間}_score` が自分より高い記録の件数を数えて + 1 する |

`weekly_key` / `daily_key` が古い記録は、今の週 / 日の絞り込みで除かれる。

サイレントBANしたユーザーの記録の扱いは未定。
