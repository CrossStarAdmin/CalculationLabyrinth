# 08 遺物 データ定義

## 1. 概要

遺物・遺物パッケージはマスターデータとしてサーバーに保存する。アプリは起動時に取得する（01-title.md）。

| 保存場所 | 保存するデータ |
| --- | --- |
| サーバー | 遺物パッケージと遺物 |

## 2. サーバー側のデータ

- **コレクション名**: `relic_packages` / `relics`

### 2.1 データ構造

```
relic_packages/{relic_package_id} {
    id: string,
    name: string,
    description: string,
    image_url: string,
    gem_amount: number,
    coin_amount: number,
    relic_ids: string[],
}
```

```
relics/{relic_id} {
    id: string,
    name: string,
    description: string,
    image_url: string,
    rarity: normal | rare | super-rare,
}
```

### 2.2 初期値

管理用スクリプトで投入する。例:

```json
relic_packages/{relic_package_id} {
    "id": "relic_package_1",
    "name": "【パッケージ名】",
    "description": "【パッケージの説明】",
    "image_url": "assets/relic_packages/relic_package_1.png",
    "gem_amount": 0,
    "coin_amount": 0,
    "relic_ids": ["relic_1", "relic_2"]
}
```

```json
relics/{relic_id} {
    "id": "relic_1",
    "name": "【遺物名】",
    "description": "【遺物の説明】",
    "image_url": "assets/relics/relic_1.png",
    "rarity": "normal"
}
```

### 2.3 権限

| 操作 | 許可する対象 | 条件 |
| --- | --- | --- |
| 読み | アプリ | ログイン中であること |
| 書き | 管理用スクリプト | アプリ・Cloud Functions からは書かない |

2つのコレクションとも同じ権限とする。

### 2.4 各項目の説明

どの項目も管理用スクリプトで投入し、アプリの操作では変わらない。

#### id（2コレクション共通）

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 遺物パッケージ / 遺物を識別するID。ドキュメントIDと同じ値 |
| 制約 | `relic_package_【auto incrementな数字】` / `relic_【auto incrementな数字】` の形式 |
| 初期値 | 投入時に採番した値 |
| 値の変更 | 不変 |
| 書き権限 | 管理用スクリプト |

#### name（2コレクション共通）

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 遺物パッケージ / 遺物の名前 |
| 制約 | なし |
| 初期値 | 投入時の値 |
| 値の変更 | 管理用スクリプトで更新したとき |
| 書き権限 | 管理用スクリプト |

#### description（2コレクション共通）

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 遺物パッケージ / 遺物の説明 |
| 制約 | なし |
| 初期値 | 投入時の値 |
| 値の変更 | 管理用スクリプトで更新したとき |
| 書き権限 | 管理用スクリプト |

#### image_url（2コレクション共通）

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 表示する画像 |
| 制約 | アプリに同梱したアセットのパス |
| 初期値 | 投入時の値 |
| 値の変更 | 管理用スクリプトで更新したとき |
| 書き権限 | 管理用スクリプト |

#### relic_packages.gem_amount

| 項目 | 内容 |
| --- | --- |
| 型 | number |
| 説明 | 遺物パッケージの購入に必要なジェムの数 |
| 制約 | 0以上の整数 |
| 初期値 | 投入時の値 |
| 値の変更 | 管理用スクリプトで更新したとき |
| 書き権限 | 管理用スクリプト |

#### relic_packages.coin_amount

| 項目 | 内容 |
| --- | --- |
| 型 | number |
| 説明 | 遺物パッケージの購入に必要なコインの数 |
| 制約 | 0以上の整数 |
| 初期値 | 投入時の値 |
| 値の変更 | 管理用スクリプトで更新したとき |
| 書き権限 | 管理用スクリプト |

#### relic_packages.relic_ids

| 項目 | 内容 |
| --- | --- |
| 型 | string[] |
| 説明 | パッケージに入っている遺物のID |
| 制約 | `relics` に存在するID。重複しない |
| 初期値 | 投入時の値 |
| 値の変更 | 管理用スクリプトで更新したとき |
| 書き権限 | 管理用スクリプト |

#### relics.rarity

| 項目 | 内容 |
| --- | --- |
| 型 | string |
| 説明 | 遺物のレアリティ。出現のしやすさが変わる |
| 制約 | `normal`（ノーマル ★） / `rare`（レア ★★） / `super-rare`（スーパーレア ★★★） |
| 初期値 | 投入時の値 |
| 値の変更 | 管理用スクリプトで更新したとき |
| 書き権限 | 管理用スクリプト |
