# 06 グローバルランク ドメインモデル

ボードごとの世界の上位100件と自分の現在順位（グローバルランキング）を扱う。
ユーザー × ボードにつき1件だけ保持し、より良いスコアが出たとき（`updateIfBetter`）だけ上書きする。

```mermaid

classDiagram

class GlobalRank {
    string id
    string mode_id
    string mode_difficulty_level_id
    string play_format
    number rank
    string user_profile_id
    string run_profile_id
    +register(score: number) void
    +updateIfBetter(score: number) boolean
}

%% 外部（01-user.md）
class UserProfile {
    <<external>>
}

%% 外部（03-run.md）
class RunProfile {
    <<external>>
}

%% 外部（07-mode.md）
class Mode {
    <<external>>
}
class ModeDifficultyLevel {
    <<external>>
}

UserProfile "1" -- "0..*" GlobalRank
RunProfile "1" -- "0..*" GlobalRank
Mode "1" -- "1..*" GlobalRank
ModeDifficultyLevel "1" -- "1..*" GlobalRank

```

## 未確定事項

- 順位付けに使うスコアを `GlobalRank` の属性として持たせるか？（現状 `rank` のみで `score` が無い）
  - A:
