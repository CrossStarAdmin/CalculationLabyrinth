# 01 ユーザー ドメインモデル

プレイヤーの永続データ（プロフィール・設定・所持通貨・ストーリー進行）を扱う領域です。
`Unlock` / `RunProfile` / `LocalRank` / `GlobalRank` はこの領域の外側（それぞれ `02-unlock.md` / `03-run.md` / `05-local-rank.md` / `06-global-rank.md`）で詳細を定義するため、ここでは空で参照しています。

```mermaid

classDiagram

class UserProfile {
    string id
    string name
    boolean is_ad_removed
    +changeName(name: string) void
    +removeAds() void
    +delete() void
}

class UserSetting {
    string play_format
    number bgm_volume
    number se_volume
    +updatePlayFormat(format: string) void
    +updateBgmVolume(volume: number) void
    +updateSeVolume(volume: number) void
}

class UserStoryFlag {
    number flag
    +advance() void
}

class Coin {
    number amount
    +add(amount: number) void
    +spend(amount: number) void
}

class Gem {
    number amount
    +add(amount: number) void
    +spend(amount: number) void
}

%% 外部（02-unlock.md）
class Unlock {
    <<external>>
}

%% 外部（03-run.md）
class RunProfile {
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

UserProfile "1" -- "1" UserSetting
UserProfile "1" -- "1" UserStoryFlag
UserProfile "1" -- "1" Coin
UserProfile "1" -- "1" Gem
UserProfile "1" -- "1" Unlock
UserProfile "1" -- "1..*" RunProfile
UserProfile "1" -- "0..*" LocalRank
UserProfile "1" -- "0..*" GlobalRank

```
