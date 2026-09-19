# 06 グローバルランク ドメインモデル

ボード（モード×難易度×プレイ形式）ごとの、世界の上位100件と自分の現在順位（`06-leaderboard.md`のグローバルランキング）を構成する記録を扱う領域です。
ユーザー×ボードにつき1件だけを保持し、より良いスコアが出るたびに上書きする、現在値のスナップショットとして扱っています。

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

## メモ

- `updateIfBetter()`は、新しいスコアが既存の`GlobalRank.rank`が参照するスコアを上回った場合だけ更新する、という運用ルールを表すメソッドです。
- 「ユーザー×モード×難易度×プレイ形式につき1件」という一意制約はER図上には表現していませんが、`GlobalRank`の中核となる不変条件です。
