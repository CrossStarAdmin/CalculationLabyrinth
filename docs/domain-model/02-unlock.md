# 02 解放 ドメインモデル

遺物パッケージ / ガーディアン / モード / モード難易度の解放状況を扱う。
`Unlock` はユーザーごとに1つ存在するアグリゲートルートとし、各 `*Unlock` の生成・整合性を担う。
`is_collected` は各 `*Unlock` 共通で「購入・解放が完了したか」を表す。

```mermaid

classDiagram

class Unlock {
    string id
    string user_profile_id
    +unlockRelicPackage(relicPackageId: string) void
    +unlockGuardian(guardianId: string) void
    +unlockMode(modeId: string) void
}

class RelicPackageUnlock {
    string relic_package_id
    string unlock_id
    boolean is_collected
    +collect() void
}

class GuardianUnlock {
    string guardian_id
    string unlock_id
    boolean is_collected
    +collect() void
}

class ModeUnlock {
    string mode_id
    string unlock_id
    boolean is_collected
    +unlockDifficultyLevel(modeDifficultyLevelId: string) void
}

class ModeDifficultyLevelUnlock {
    string mode_difficulty_level_id
    boolean is_collected
    +collect() void
}

%% 外部（01-user.md）
class UserProfile {
    <<external>>
}

%% 外部（08-relic.md）
class RelicPackage {
    <<external>>
}

%% 外部（09-guardian.md）
class Guardian {
    <<external>>
}

%% 外部（07-mode.md）
class Mode {
    <<external>>
}
class ModeDifficultyLevel {
    <<external>>
}

UserProfile "1" -- "1" Unlock
Unlock "1" -- "1..*" RelicPackageUnlock
Unlock "1" -- "1..*" GuardianUnlock
Unlock "1" -- "1..*" ModeUnlock
ModeUnlock "1" -- "1..*" ModeDifficultyLevelUnlock

RelicPackageUnlock "1" -- "1" RelicPackage
GuardianUnlock "1" -- "1" Guardian
ModeUnlock "1" -- "1" Mode
ModeDifficultyLevelUnlock "1" -- "1" ModeDifficultyLevel

```

## 未確定事項

- `ModeUnlock.is_collected` を持たせるか？（本ファイルにはあり、overview.md には無い）
  - A:
