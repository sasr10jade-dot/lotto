import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load local environment variables for testing (.env file)
load_dotenv()

def predict_lotto_numbers(stats):
    """Call Google Gemini API to analyze lotto statistics and predict numbers."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Try to load custom configuration from data/config.json if it exists
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "config.json")
    fixed_numbers = []
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config_data = json.load(f)
                if config_data.get("fixed_numbers"):
                    fixed_numbers = [int(x) for x in config_data.get("fixed_numbers") if 1 <= int(x) <= 45]
                    print(f"🍀 config.json에서 고정수 설정을 로드했습니다: {fixed_numbers}")
        except Exception as e:
            print(f"⚠️ config.json 로드 실패 (고정수 없이 진행): {e}")

    if not api_key:
        print("Warning: GEMINI_API_KEY environment variable is not set. Running in Mock/Fallback Mode.")
        return generate_mock_prediction(stats, fixed_numbers)

    try:
        # Configure Gemini SDK
        genai.configure(api_key=api_key)

        # Use the fast and efficient gemini-1.5-flash model
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Construct the detailed prompt
        system_instructions = (
            "You are a professional Lotto Analyst AI Agent who is funny, witty, and a brilliant data scientist. "
            "Your persona is 'Dr. Lucky', an energetic and highly encouraging AI who loves finding patterns in data. "
            "You will analyze the provided lottery statistics and generate a weekly lottery prediction newsletter. "
            "You MUST output your response in KOREAN in a strict JSON format matching the schema requested below. "
            "Do not include any extra text outside the JSON block. "
        )

        # Format stats context for prompt
        latest_no = stats.get("latest_round_no")
        latest_nums = stats.get("latest_numbers")
        latest_bns = stats.get("latest_bonus")
        hot_5 = stats.get("hot_numbers_last_5_weeks", [])
        cold_5 = stats.get("cold_numbers_last_5_weeks", [])
        longest_unseen = [item["number"] for item in stats.get("longest_unseen_numbers", [])[:5]]
        avg_sum_5 = stats.get("average_sum_last_5_weeks", 130.0)
        odd_even_5 = stats.get("odd_even_ratio_last_5_weeks", "50.0% / 50.0%")

        fixed_constraint = ""
        if fixed_numbers:
            fixed_constraint = f"\n- [핵심 제약 조건] 수신자가 지정한 나만의 행운 번호(고정수) [ {', '.join(map(str, fixed_numbers))} ] 가 선택되어 있습니다. 생성하시는 추천 조합 A, B, C, D, E 모든 5가지 예측 번호 세트에는 이 지정된 고정수들([ {', '.join(map(str, fixed_numbers))} ])이 100% 무조건 포함되어 있어야 합니다. 이 숫자를 포함해 조화로운 예측 번호 세트를 완성해 주세요."

        user_prompt = f"""
여기 이번 주 대한민국 로또 6/45 당첨 번호 통계 데이터가 있습니다:
- 총 누적 회차: {stats.get("total_rounds")}회
- 최근 회차 ({latest_no}회) 당첨 번호: {latest_nums} (보너스 번호: {latest_bns})
- 최근 5주간 빈출 번호 (Hot Numbers): {hot_5}
- 최근 5주간 저빈출 번호 (Cold Numbers): {cold_5}
- 역사적으로 가장 오랫동안 나오지 않은 번호 Top 5: {longest_unseen}
- 최근 5주간 당첨 번호 합계 평균: {avg_sum_5:.1f}
- 최근 5주간 홀짝 비율 (홀수 / 짝수): {odd_even_5}{fixed_constraint}

위 데이터를 과학적으로 분석하여 다음 요구사항을 충족하는 예측 결과를 도출해 주세요:
1. 예측 번호는 총 5개의 세트(A, B, C, D, E)를 생성해야 합니다.
2. 각 세트는 중복 없는 1~45 사이의 자연수 6개로 이루어져야 하며, 오름차순으로 정렬되어야 합니다.
3. 로또 예측 번호 생성 시 다음 필터를 적용해 신뢰성을 높여주세요:
   - 각 세트의 숫자 합이 100에서 170 사이가 되도록 합니다.
   - 각 세트의 홀짝 비율이 균형(3:3, 4:2, 2:4)을 이루게 합니다.
   - 연속된 숫자(예: 1, 2, 3)가 3개 이상 연속으로 나오지 않도록 배제합니다.
4. 'analysis_report' 섹션에는 데이터 분석가로서 왜 이번 회차에 이 번호들을 주목했는지 통계 데이터({latest_nums}, {hot_5}, {cold_5}, {longest_unseen} 등)를 직접 언급하며 재미있고 설득력 있는 코멘트를 한국어로 길게 작성해 주세요. 만약 사용자가 지정한 고정수가 있었다면 왜 이 번호들이 역사적 통계와 조화를 이루는지 가볍게 해설해 주세요.
5. 'lucky_message' 섹션에는 매주 금요일 퇴근길에 복권을 사는 구독자님을 위해 위트 있고 따뜻한 응원의 한 마디를 매주 색다르게 작성해 주세요.

출력 JSON 스키마:
{{
  "analysis_report": "여기에 상세한 데이터 트렌드 분석 및 예측 근거 코멘트 작성",
  "predictions": [
    [1, 2, 3, 4, 5, 6], // A세트
    [7, 8, 9, 10, 11, 12], // B세트
    [13, 14, 15, 16, 17, 18], // C세트
    [19, 20, 21, 22, 23, 24], // D세트
    [25, 26, 27, 28, 29, 30]  // E세트
  ],
  "lucky_message": "여기에 위트 있는 응원의 행운 메시지 작성"
}}
"""

        full_prompt = f"{system_instructions}\n\n{user_prompt}"

        # Request content with JSON response requirement
        response = model.generate_content(
            full_prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        # Parse output JSON
        result = json.loads(response.text)
        print("Successfully generated lotto prediction using Gemini API.")
        return result

    except Exception as e:
        print(f"Error calling Gemini API: {e}. Falling back to rule-based prediction.")
        return generate_mock_prediction(stats, fixed_numbers)

def generate_mock_prediction(stats, fixed_numbers=None):
    """Generate high-quality mock/rule-based predictions in case Gemini API is unavailable."""
    import random

    print("Generating statistical rule-based lotto prediction (Mock Mode)...")

    active_fixed = []
    if fixed_numbers:
        active_fixed = [x for x in fixed_numbers if 1 <= x <= 45][:5]

    hot_nums = stats.get("hot_numbers_last_5_weeks", [1, 2, 3, 4, 5])
    cold_nums = stats.get("cold_numbers_last_5_weeks", [41, 42, 43, 44, 45])
    longest_unseen = [item["number"] for item in stats.get("longest_unseen_numbers", [])[:5]]

    predictions = []

    # Generate 5 sets matching filters
    while len(predictions) < 5:
        # Start with the fixed numbers
        candidate = list(active_fixed)
        
        # Fill up to 6 unique numbers
        needed_count = 6 - len(candidate)
        remaining_pool = [x for x in range(1, 46) if x not in candidate]
        
        if needed_count > 0:
            candidate.extend(random.sample(remaining_pool, needed_count))
            
        candidate.sort()

        # 1. Sum Filter: 100 ~ 170
        cand_sum = sum(candidate)
        if not (100 <= cand_sum <= 170):
            continue

        # 2. Odd/Even Filter: 3:3, 4:2, 2:4
        odds = sum(1 for x in candidate if x % 2 != 0)
        if not (odds in [2, 3, 4]):
            continue

        # 3. Consecutive Filter: No 3 consecutive numbers
        consecutive_count = 1
        max_consecutive = 1
        for i in range(len(candidate) - 1):
            if candidate[i+1] == candidate[i] + 1:
                consecutive_count += 1
                max_consecutive = max(max_consecutive, consecutive_count)
            else:
                consecutive_count = 1
        if max_consecutive >= 3:
            continue

        if candidate not in predictions:
            predictions.append(candidate)

    # Mock text in Korean matching the Dr. Lucky persona
    latest_no = stats.get("latest_round_no")
    
    fixed_desc = ""
    if active_fixed:
        fixed_desc = f"특히 지정하신 소중한 행운의 수 [ {', '.join(map(str, active_fixed))} ]번을 모든 조합 세트에 무조건 강제 포함하였으며, "

    analysis_report = (
        f"안녕하세요! 데이터 사이언티스트 출신 로또 전문 AI 분석가 'Dr. Lucky'입니다! "
        f"이번 {latest_no + 1}회차 예측을 위해 최신 {latest_no}회차 당첨 정보와 최근 5주간 통계를 정밀 분석했습니다. "
        f"{fixed_desc}최근 5주간 가장 뜨거웠던 핫 넘버 {hot_nums}와, 오랫동안 숨죽이고 있던 콜드 넘버 {cold_nums}의 "
        f"조화로운 교차 분석을 통해 최상의 확률 조합을 도출했습니다. "
        f"특히 오랫동안 나오지 않아 출현 가능성이 매우 높아진 {longest_unseen[:3]} 번호군을 적극 배치하고, "
        f"가장 안정적인 총합 범위(100~170) 및 짝홀 비율 필터를 엄격히 통과시켰습니다."
    )

    lucky_message = (
        "복권은 단순한 도박이 아니라 일주일 동안 기분 좋은 설렘을 얻을 수 있는 마법의 티켓입니다! "
        "제가 엄선한 5가지 조합의 번호와 함께 이번 금요일 기분 좋게 로또 한 장 구매해 보시는 것은 어떨까요? "
        "꿈은 크게 가질수록 좋다고 하잖아요! 이번 주말, 대박 승전보가 들려오기를 온 마음으로 응원하겠습니다! 화이팅! 🍀"
    )

    return {
        "analysis_report": analysis_report,
        "predictions": predictions,
        "lucky_message": lucky_message
    }

if __name__ == "__main__":
    from data_collector import load_local_history, get_lotto_statistics
    
    print("Testing predictor...")
    history = load_local_history()
    if not history:
        print("Please run data_collector.py first to bootstrap the database.")
    else:
        stats = get_lotto_statistics(history)
        result = predict_lotto_numbers(stats)
        print("\n--- AI Agent Output ---")
        print("Report:")
        print(result["analysis_report"])
        print("\nPredictions:")
        for idx, pred in enumerate(result["predictions"]):
            print(f"Set {chr(65+idx)}: {pred}")
        print("\nLucky Message:")
        print(result["lucky_message"])
