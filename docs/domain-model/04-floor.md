# 04 フロア ドメインモデル

1フロアで提示される遺物候補・登場するガーディアン・出題される問題を扱う。

```mermaid

classDiagram

class Floor {
    string id
    number floor_number
    +isCleared() boolean
}

class FloorRelic {
    string relic_id
}

class FloorGuardian {
    string guardian_id
}

class FloorQuestion {
    number question_number
    string question_type_id
    string question
    number answer
    number timer
    number score
    +submitAnswer(value: number) boolean
    +isTimeUp() boolean
}

%% 外部（03-run.md）
class RunProfile {
    <<external>>
}

%% 外部（08-relic.md）
class Relic {
    <<external>>
}

%% 外部（09-guardian.md）
class Guardian {
    <<external>>
}

%% 外部（10-question.md）
class QuestionType {
    <<external>>
}

RunProfile "1" -- "1..*" Floor
Floor "1" -- "1..*" FloorRelic
Floor "1" -- "1..*" FloorGuardian
Floor "1" -- "1..*" FloorQuestion
FloorRelic "1" -- "1" Relic
FloorGuardian "1" -- "1" Guardian
FloorQuestion "1" -- "1" QuestionType

```
