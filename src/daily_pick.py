"""오늘의 행운번호 5세트를 만들어 data/daily_pick.json 으로 저장한다.

- 외부 서비스·API 키·pandas 없이 표준 라이브러리만 쓴다 (GitHub Actions에서 바로 실행).
- 한국 시간(KST) 날짜를 시드로 쓰므로 같은 날에는 언제 실행해도 같은 번호가 나온다.
- 규칙은 predictor.py의 규칙 기반 예측과 같다: 합계 100~170, 홀수 2~4개, 3연속 번호 금지.
- 다른 서비스(Aura 등)가 이 JSON을 읽어 간다. 필드를 바꿀 때는 읽는 쪽도 함께 확인할 것.
"""
import json
import os
import random
from datetime import datetime, timedelta, timezone

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
HISTORY_FILE = os.path.join(DATA_DIR, "lotto_history.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "daily_pick.json")
KST = timezone(timedelta(hours=9))
NUMBER_COLS = ["drwtNo1", "drwtNo2", "drwtNo3", "drwtNo4", "drwtNo5", "drwtNo6"]
SET_COUNT = 5


def load_history():
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return sorted(data, key=lambda x: x.get("drwNo", 0))


def recent_weights(history, weeks=20):
    """최근 N회차에 자주 나온 번호에 아주 약간 더 가중치를 준다 (1.0 ~ 약 2.0)."""
    counts = {n: 0 for n in range(1, 46)}
    for row in history[-weeks:]:
        for col in NUMBER_COLS:
            counts[int(row[col])] += 1
    top = max(counts.values()) or 1
    return [1.0 + counts[n] / top for n in range(1, 46)]


def passes_filters(nums):
    if not 100 <= sum(nums) <= 170:
        return False
    if sum(1 for x in nums if x % 2) not in (2, 3, 4):
        return False
    run = best = 1
    for a, b in zip(nums, nums[1:]):
        run = run + 1 if b == a + 1 else 1
        best = max(best, run)
    return best < 3


def pick_one(rng, weights):
    pool = list(range(1, 46))
    w = list(weights)
    chosen = []
    for _ in range(6):
        n = rng.choices(pool, weights=w, k=1)[0]
        i = pool.index(n)
        pool.pop(i)
        w.pop(i)
        chosen.append(n)
    return sorted(chosen)


def build_sets(date_key, weights):
    rng = random.Random(f"aura-lotto-{date_key}")
    sets = []
    guard = 0
    while len(sets) < SET_COUNT and guard < 5000:
        guard += 1
        cand = pick_one(rng, weights)
        if passes_filters(cand) and cand not in sets:
            sets.append(cand)
    return sets


def main():
    history = load_history()
    latest = history[-1]
    today = datetime.now(KST).date().isoformat()
    result = {
        "date": today,
        "round": int(latest["drwNo"]) + 1,
        "sets": build_sets(today, recent_weights(history)),
        "note": "통계 규칙으로 만든 참고용 번호이며 당첨을 보장하지 않습니다.",
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"daily pick saved: {today} round {result['round']} -> {result['sets']}")


if __name__ == "__main__":
    main()
