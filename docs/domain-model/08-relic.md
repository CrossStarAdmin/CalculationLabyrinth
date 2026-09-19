# 08 遺物 ドメインモデル

遺物・遺物パッケージのマスターデータを扱う領域です。

```mermaid

classDiagram

class RelicPackage {
    string id
    string name
    string description
    string image_url
    number gem_amount
    number coin_amount
    string[] relic_id
    +contains(relicId: string) boolean
}

class Relic {
    string id
    string name
    string description
    string image_url
    string rarity
}

%% 外部（02-unlock.md）
class RelicPackageUnlock {
    <<external>>
}

%% 外部（04-floor.md）
class FloorRelic {
    <<external>>
}

%% 外部（03-run.md）
class RunOwnedRelic {
    <<external>>
}

RelicPackageUnlock "1" -- "1" RelicPackage
RelicPackage "1" -- "1..*" Relic
FloorRelic "1" -- "1" Relic
RunOwnedRelic "1" -- "1" Relic

```

## メモ

- `Relic`の効果（`requirements-definition.md` 2.4.2 の効果種別）は現状のドメインモデルに実装用の属性が無く、仕様側も「未定」寄りの記載なので、ここではメソッドを追加していません。効果ロジックが固まったら別途検討が必要です。
- `RelicPackage.contains()`は`relic_id`配列に対する参照用の軽いメソッドとして追加しました。
