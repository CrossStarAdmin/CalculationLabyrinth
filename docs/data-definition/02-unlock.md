# 02 解放 データ定義

## 1. 概要

解放データはサーバーに保存する。

| 保存場所 | 保存するデータ |
| --- | --- |
| サーバー | 全解放データ |

## 2. サーバー側のデータ

- **コレクション名**: `guardian_unlocks` / `relic_unlocks` / `mode_unlocks`

### 2.1 データ構造

```
guardian_unlocks/{user_profile_id} {
    id: string,
    guardians: {
        guardian_id: string,
    } []
}
```

```
relic_unlocks/{user_profile_id} {
    id: string,
    relic_packages: {
        relic_package_id: string,
        relics: {
            relic_id: string,
        }[]
    } []
}
```

```
mode_unlocks/{user_profile_id} {
    id: string,
    modes: {
        mode_id: string,
        mode_difficulty_levels: {
            mode_difficulty_level_id: string,
        } []
    } []
}
```

### 2.2 初期値


``` json
guardian_unlocks/{user_profile_id} {
    "id": "guardian_unlock_【auto incrementな数字】",
    "guardians": []
}
```

``` json
relic_unlocks/{user_profile_id} {
    "id": "relic_unlock_【auto incrementな数字】",
    "relic_packages": [
        {
            "relic_package_id": "【デフォルトのレリックパッケージのID】",
            "relics": []
        }
    ]
}
```

``` json
mode_unlocks/{user_profile_id} {
    "id": "mode_unlock_【auto incrementな数字】",
    "modes": [
        {
            "mode_id": "【お手軽モードのID】",
            "mode_difficulty_levels": [
                { "mode_difficulty_level_id": "【簡単のID】" },
                { "mode_difficulty_level_id": "【普通のID】" }
            ]
        },
        {
            "mode_id": "【通常モードのID】",
            "mode_difficulty_levels": [
                { "mode_difficulty_level_id": "【簡単のID】" },
                { "mode_difficulty_level_id": "【普通のID】" }
            ]
        }
    ]
}
```

### 2.3 権限

| 操作 | 許可する対象 | 条件 |
| --- | --- | --- |
| 読み | アプリ | ログイン中の uid がドキュメントID（`user_profile_id`）と一致する |
| 書き | サーバー（Cloud Functions） | なし |

3つのコレクションとも同じ権限とする。

### 2.4 各項目の説明

#### id（3コレクション共通）

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 解放データを識別するID |
| 制約 | `{コレクションの単数形}_【auto incrementな数字】` の形式 |
| 初期値 | 作成時に採番した値 |
| 値の変更 | 不変 |
| 書き権限 | サーバー（作成時のみ） |

#### guardians[].guardian_id

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 出会ったガーディアンのID |
| 制約 | マスターデータのガーディアンに存在するID。重複しない |
| 初期値 | なし（空配列） |
| 値の変更 | ゲーム画面でランが終了したとき、初めて出会ったガーディアンを追加する |
| 書き権限 | サーバー |

#### relic_packages[].relic_package_id

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 所持している遺物パッケージのID |
| 制約 | マスターデータの遺物パッケージに存在するID。重複しない |
| 初期値 | デフォルトの遺物パッケージのID |
| 値の変更 | ショップ画面で遺物パッケージを購入したときに追加する |
| 書き権限 | サーバー |

#### relic_packages[].relics[].relic_id

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 出会った遺物のID |
| 制約 | 親の遺物パッケージに含まれる遺物のID。重複しない |
| 初期値 | なし（空配列） |
| 値の変更 | ゲーム画面でランが終了したとき、初めて出会った遺物を追加する |
| 書き権限 | サーバー |

#### modes[].mode_id

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 解放済みのモードのID |
| 制約 | マスターデータのモードに存在するID。重複しない |
| 初期値 | お手軽モード、通常モードのID |
| 値の変更 | モード / 難易度選択画面でモードを解放したときに追加する |
| 書き権限 | サーバー |

#### modes[].mode_difficulty_levels[].mode_difficulty_level_id

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 解放済みの難易度のID |
| 制約 | 親のモードに属する難易度のID。重複しない |
| 初期値 | 簡単、普通のID |
| 値の変更 | モードの解放時に簡単・普通を追加する。モード / 難易度選択画面で難易度を解放したときに追加する |
| 書き権限 | サーバー |