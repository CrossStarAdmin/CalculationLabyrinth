# 03 ラン ドメインモデル

1回のプレイ（ラン）の進行状態・スコア・所持遺物を扱う領域です。
`04-game.md`の「シードからランを再現してスコアを検証する」仕組みに合わせて、`RunProfile`に検証用のメソッドを置いています。

```mermaid

classDiagram

class RunProfile {
    string id
    string user_profile_id
    string play_format
    datetime started_at
    number challenge_count
    string mode_id
    string mode_difficulty_level_id
    string seed
    +selectRelic(relicId: string) void
    +finish() void
    +verifyScore(reportedScore: number) boolean
}

class RunStatus {
    string status
    number life
    boolean is_used_bell
    +decreaseLife() void
    +wake() void
    +isSleeping() boolean
}

class RunScore {
    number score
    string run_profile_id
    +addScore(score: number) void
    +applyClearBonus() void
    +finalize() void
}

class RunOwnedRelic {
    string relic_id
    number order
    string run_profile_id
}

%% 外部（01-user.md）
class UserProfile {
    <<external>>
}

%% 外部（07-mode.md）
class Mode {
    <<external>>
}
class ModeDifficultyLevel {
    <<external>>
}

%% 外部（04-floor.md）
class Floor {
    <<external>>
}

%% 外部（05-local-rank.md）
class LocalRank {
    <<external>>
}

%% 外部（06-global-rank.md）
class GlobalRank {
    <<external>>
}

%% 外部（08-relic.md）
class Relic {
    <<external>>
}

UserProfile "1" -- "1..*" RunProfile
RunProfile "1" -- "1" RunStatus
RunProfile "1" -- "1" RunScore
RunProfile "1" -- "1..*" RunOwnedRelic
RunProfile "1" -- "1..*" Floor
RunProfile "1" -- "0..*" LocalRank
RunProfile "1" -- "0..*" GlobalRank
RunProfile "1" -- "1" Mode
RunProfile "1" -- "1" ModeDifficultyLevel
RunOwnedRelic "1" -- "1" Relic

```

## メモ

- `RunProfile → Mode` / `RunProfile → ModeDifficultyLevel`の関係線は、overview.mdの相関図には無かったものをここで補っています（`mode_id` / `mode_difficulty_level_id`がFKとして存在するため）。意図的に省略されていたのであれば戻してください。
- `RunProfile.mode_id` / `mode_difficulty_level_id`は`Mode.id` / `ModeDifficultyLevel.id`と同じ`string`型に揃えました（以前指摘した型不一致は解消済みです）。
- `RunOwnedRelic`は取得順序を記録するだけの記録用エンティティと判断し、固有のメソッドは置いていません。
