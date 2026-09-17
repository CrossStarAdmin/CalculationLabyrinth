```mermaid

erDiagram

%% User
UserProfile {
    string id
    string name
}

Coin {
    number amount
}

Gem {
    number amount
}

RelicPackageUnlock {
    string relic_package_id
    string user_profile_id
    boolean is_collected
}

EnemyUnlock {
    string enemy_id
    string user_profile_id
    boolean is_collected
}

ModeUnlock {
    string mode_id
    string user_profile_id
}

ModeDifficultyLevelUnlock {
    string mode_difficulty_level_id
    boolean is_collected
}

%% Run
RunProfile {
    string id
    string user_profile_id
    number challenge_count
    number mode_id
    number mode_difficulty_level_id
}

RunStatus {
    string status
    number life
}

RunTimer {
    number timer
}

RunScore {
    number score
    string run_profile_id
}

RunOwnedRelic {
    string relic_id
    number order
    string run_profile_id
}

%% Floor
Floor {
    string id
    number floor_number
}

FloorRelic {
    string relic_id
}

FloorEnemy {
    string enemy_id
}

FloorQuestion {
    number question_number
    string question_type_id
    string question
    number answer
    number score
}

%% RunRank
RunRank {
    string id
    string mode_id
    string mode_difficult_level_id
    number rank
    string user_profile_id
    string run_profile_id
}

%% Mode
Mode {
    string id
    string name
    string description
}

ModeDifficultyLevel {
    string id
    string name
    string description
    string mode_id
    number difficulty_level
}

%% Relic
RelicPackage {
    string id
    string name
    string description
    string image_url
    number gem_amount
    string[] relic_id
}

Relic {
    string id
    string name
    string description
    string image_url
    string rarity
}

%% Enemy
Enemy {
    string id
    string name
    string description
    string image_url
    string rarity
}

%% Question
QuestionType {
    string id
    string name
}

%% 相関図
UserProfile ||--|| Coin: ""
UserProfile ||--|| Gem: ""
UserProfile ||--|{ RelicPackageUnlock: ""
UserProfile ||--|{ EnemyUnlock: ""
UserProfile ||--|{ ModeUnlock: ""
ModeUnlock ||--|{ ModeDifficultyLevelUnlock: ""

RelicPackageUnlock ||--|| RelicPackage: ""
RelicPackage ||--|{ Relic: ""

EnemyUnlock ||--|| Enemy: ""

ModeUnlock ||--|| Mode: ""
ModeDifficultyLevelUnlock ||--|| ModeDifficultyLevel: ""
Mode ||--|{ ModeDifficultyLevel: ""

UserProfile ||--|{ RunProfile: ""
RunProfile ||--|| RunStatus: ""
RunProfile ||--|| RunScore: ""
RunProfile ||--|{ RunOwnedRelic: ""

RunProfile ||--|{ Floor: ""
Floor ||--|{ FloorRelic: ""
Floor ||--|{ FloorEnemy: ""
Floor ||--|{ FloorQuestion: ""

FloorEnemy ||--|| Enemy: ""
FloorRelic ||--|| Relic: ""
FloorQuestion ||--|| QuestionType: ""

UserProfile ||--o{ RunRank: ""
RunProfile ||--o{ RunRank: ""
Mode ||--|{ RunRank: ""
ModeDifficultyLevel ||--|{ RunRank: ""