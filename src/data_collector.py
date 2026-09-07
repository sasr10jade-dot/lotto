import os
import json
import time
import requests
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
HISTORY_FILE = os.path.join(DATA_DIR, "lotto_history.json")

def ensure_data_dir():
    """Ensure the data directory exists."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def load_local_history():
    """Load local lotto history file if it exists."""
    ensure_data_dir()
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                data = sorted(data, key=lambda x: x.get("drwNo", 0))
                return data
        except Exception as e:
            print(f"Error reading local history file: {e}. Starting fresh.")
    return []

def save_local_history(data):
    """Save lotto history to local file."""
    ensure_data_dir()
    try:
        data = sorted(data, key=lambda x: x.get("drwNo", 0))
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Lotto history successfully updated. Total rounds: {len(data)}")
    except Exception as e:
        print(f"Error saving history file: {e}")

def format_date_str(date_str):
    """Format 'YYYYMMDD' string into 'YYYY-MM-DD'."""
    if not date_str or len(date_str) != 8:
        return date_str
    return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"

def bootstrap_all_history():
    """Fetch the complete lottery history using the official internal bulk JSON API."""
    url = "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do"
    params = {
        "srchLtEpsd": "all",
        "_": int(time.time() * 1000)
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://dhlottery.co.kr/lt645/result"
    }
    
    try:
        print("Requesting the internal ALL-history API to bootstrap...")
        response = requests.get(url, params=params, headers=headers, timeout=15)
        if response.status_code == 200:
            res_json = response.json()
            raw_list = res_json.get("data", {}).get("list", [])
            if not raw_list:
                print("API call succeeded but returned an empty list.")
                return []
                
            formatted_history = []
            for item in raw_list:
                formatted_history.append({
                    "drwNo": int(item.get("ltEpsd")),
                    "drwNoDate": format_date_str(item.get("ltRflYmd")),
                    "drwtNo1": int(item.get("tm1WnNo")),
                    "drwtNo2": int(item.get("tm2WnNo")),
                    "drwtNo3": int(item.get("tm3WnNo")),
                    "drwtNo4": int(item.get("tm4WnNo")),
                    "drwtNo5": int(item.get("tm5WnNo")),
                    "drwtNo6": int(item.get("tm6WnNo")),
                    "bnusNo": int(item.get("bnsWnNo")),
                    "firstWinamnt": int(item.get("rnk1WnAmt", 0)),
                    "firstPrzwnerCo": int(item.get("rnk1WnNope", 0))
                })
            
            # Sort ascending
            formatted_history = sorted(formatted_history, key=lambda x: x["drwNo"])
            return formatted_history
        else:
            print(f"Bulk API failed with status code {response.status_code}")
    except Exception as e:
        print(f"Exception occurred during bulk API bootstrap: {e}")
    return []

def fetch_single_draw_data(draw_no):
    """Fetch winning numbers for a specific single round (fallback/update)."""
    url = f"https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={draw_no}"
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if result.get("returnValue") == "success":
                    return {
                        "drwNo": result.get("drwNo"),
                        "drwNoDate": result.get("drwNoDate"),
                        "drwtNo1": result.get("drwtNo1"),
                        "drwtNo2": result.get("drwtNo2"),
                        "drwtNo3": result.get("drwtNo3"),
                        "drwtNo4": result.get("drwtNo4"),
                        "drwtNo5": result.get("drwtNo5"),
                        "drwtNo6": result.get("drwtNo6"),
                        "bnusNo": result.get("bnusNo"),
                        "firstWinamnt": result.get("firstWinamnt", 0),
                        "firstPrzwnerCo": result.get("firstPrzwnerCo", 0)
                    }
                elif result.get("returnValue") == "fail":
                    return None
            time.sleep(1)
        except Exception as e:
            print(f"Attempt {attempt+1} failed for round {draw_no}: {e}")
            time.sleep(2)
    return None

def update_lotto_history():
    """Fetch all missing rounds and update local lotto_history.json using bulk API or single API fallback."""
    history = load_local_history()
    
    # If history is empty, try to bootstrap using the bulk API
    if not history:
        print("Local history file not found or empty. Bootstrapping entire database using bulk API...")
        history = bootstrap_all_history()
        if history:
            save_local_history(history)
            return history
        else:
            print("Failed to bootstrap using bulk API. Falling back to single-round downloads...")
    
    # Check if there are new draws
    last_round = history[-1]["drwNo"] if history else 0
    print(f"Current local database has up to round {last_round}.")
    
    current_round = last_round + 1
    new_rounds_added = 0
    
    while True:
        print(f"Fetching round {current_round}...")
        data = fetch_single_draw_data(current_round)
        if data is None:
            print(f"Round {current_round} fetch returned None (or fail). Stopping update.")
            break
        
        history.append(data)
        new_rounds_added += 1
        current_round += 1
        time.sleep(0.1)
        
    if new_rounds_added > 0:
        save_local_history(history)
    else:
        print("No new rounds found. Database is up to date.")
        
    return history

def get_lotto_statistics(history, recent_weeks_list=[5, 10, 20]):
    """Calculate and return useful statistics from lotto history."""
    if not history:
        return {}
    
    df = pd.DataFrame(history)
    
    number_cols = ["drwtNo1", "drwtNo2", "drwtNo3", "drwtNo4", "drwtNo5", "drwtNo6"]
    
    total_rounds = len(df)
    latest_round = df.iloc[-1].to_dict()
    
    all_numbers = df[number_cols].values.flatten()
    overall_freq = pd.Series(all_numbers).value_counts().reindex(range(1, 46), fill_value=0)
    
    stats = {
        "total_rounds": total_rounds,
        "latest_round_no": latest_round["drwNo"],
        "latest_round_date": latest_round["drwNoDate"],
        "latest_numbers": [int(latest_round[c]) for c in number_cols],
        "latest_bonus": int(latest_round["bnusNo"]),
        "overall_frequency": overall_freq.to_dict()
    }
    
    for weeks in recent_weeks_list:
        if total_rounds >= weeks:
            recent_df = df.iloc[-weeks:]
            recent_numbers = recent_df[number_cols].values.flatten()
            recent_freq = pd.Series(recent_numbers).value_counts().reindex(range(1, 46), fill_value=0)
            stats[f"frequency_last_{weeks}_weeks"] = recent_freq.to_dict()
            
            sorted_freq = recent_freq.sort_values(ascending=False)
            stats[f"hot_numbers_last_{weeks}_weeks"] = sorted_freq.head(5).index.tolist()
            stats[f"cold_numbers_last_{weeks}_weeks"] = sorted_freq.tail(5).index.tolist()
            
            odds = sum(1 for x in recent_numbers if x % 2 != 0)
            evens = len(recent_numbers) - odds
            stats[f"odd_even_ratio_last_{weeks}_weeks"] = f"{odds / len(recent_numbers) * 100:.1f}% / {evens / len(recent_numbers) * 100:.1f}%"
            
            sums = recent_df[number_cols].sum(axis=1)
            stats[f"average_sum_last_{weeks}_weeks"] = float(sums.mean())
            stats[f"min_sum_last_{weeks}_weeks"] = int(sums.min())
            stats[f"max_sum_last_{weeks}_weeks"] = int(sums.max())

    last_seen = {}
    for num in range(1, 46):
        last_seen[num] = total_rounds
        
    for idx, row in df.iterrows():
        draw_no = int(row["drwNo"])
        for col in number_cols:
            num = int(row[col])
            last_seen[num] = total_rounds - draw_no
            
    sorted_last_seen = sorted(last_seen.items(), key=lambda x: x[1], reverse=True)
    stats["longest_unseen_numbers"] = [{"number": k, "draws_ago": v} for k, v in sorted_last_seen[:10]]

    return stats

if __name__ == "__main__":
    print("Testing lotto data collector...")
    history = update_lotto_history()
    if history:
        stats = get_lotto_statistics(history)
        print(f"Successfully collected data. Latest round: {stats['latest_round_no']} ({stats['latest_round_date']})")
        print(f"Latest numbers: {stats['latest_numbers']} + {stats['latest_bonus']}")
        print(f"Top 5 hot numbers in last 5 weeks: {stats.get('hot_numbers_last_5_weeks')}")
        print(f"Longest unseen numbers: {stats['longest_unseen_numbers'][:5]}")
