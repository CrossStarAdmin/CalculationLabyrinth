# 05 ローカルランク ドメインモデル

ボード（モード×難易度×プレイ形式）ごとの、ユーザー自身のスコア上位5件（`06-leaderboard.md`のローカルランキング）を構成する記録を扱う領域です。
ランが終わるたびに1件追加される、追記型の履歴データとして扱っています。

```mermaid

classDiagram

class LocalRank {
    string id
    string mode_id
    string mode_difficulty_level_id
    string play_format
    number rank
    string user_profile_id
    string run_profile_id
    +register(score: number) void
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

UserProfile "1" -- "0..*" LocalRank
RunProfile "1" -- "0..*" LocalRank
Mode "1" -- "1..*" LocalRank
ModeDifficultyLevel "1" -- "1..*" LocalRank

```

## メモ

- `06-global-rank.md`の`GlobalRank`とは別領域として分けています。`LocalRank`はラン単位で追記され続ける履歴データ、`GlobalRank`はユーザー×ボードで1件だけを保持し上書きされる現在値データという、更新のされ方が異なるためです。
