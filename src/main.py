import os
import sys
from dotenv import load_dotenv

# Ensure the parent directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_collector import update_lotto_history, get_lotto_statistics
from predictor import predict_lotto_numbers
from mailer import build_email_html, send_email

# Load local environment variables (.env file)
load_dotenv()

def log_dispatch(round_no, receiver_email, predictions):
    """Log a successful email dispatch to data/dispatch_history.json."""
    import json
    from datetime import datetime
    
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    dispatch_file = os.path.join(data_dir, "dispatch_history.json")
    
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    history = []
    if os.path.exists(dispatch_file):
        try:
            with open(dispatch_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception as e:
            print(f"⚠️ Error reading dispatch history file: {e}")
            
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    new_entry = {
        "round_no": round_no,
        "receiver_email": receiver_email or "Unknown",
        "dispatch_date": now_str,
        "predictions": predictions.get("predictions", []),
        "status": "success"
    }
    
    history.append(new_entry)
    
    try:
        with open(dispatch_file, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
        print(f"📝 이메일 발송 이력이 적재되었습니다: {dispatch_file}")
    except Exception as e:
        print(f"⚠️ Error saving dispatch history: {e}")

def main():
    print("=" * 60)
    print("🚀 Starting AI Lotto Analyst Agent Job...")
    print("=" * 60)
    
    # 1. Update/Bootstrap Lotto History
    try:
        print("\n[Step 1/5] Updating Lottery History...")
        history = update_lotto_history()
        if not history:
            print("❌ Failed to retrieve lotto history. Exiting.")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Exception in Step 1: {e}")
        sys.exit(1)
        
    # 2. Get Statistics
    try:
        print("\n[Step 2/5] Calculating Lottery Statistics...")
        stats = get_lotto_statistics(history)
        if not stats:
            print("❌ Failed to calculate lotto statistics. Exiting.")
            sys.exit(1)
        print(f"Latest Drawn Round: {stats.get('latest_round_no')} ({stats.get('latest_round_date')})")
    except Exception as e:
        print(f"❌ Exception in Step 2: {e}")
        sys.exit(1)
        
    # 3. AI Predict numbers
    try:
        print("\n[Step 3/5] Requesting AI Predictions and Analysis...")
        predictions = predict_lotto_numbers(stats)
        if not predictions:
            print("❌ Failed to generate predictions. Exiting.")
            sys.exit(1)
        print("Predictions successfully generated.")
    except Exception as e:
        print(f"❌ Exception in Step 3: {e}")
        sys.exit(1)
        
    # 4. Render HTML Report
    try:
        print("\n[Step 4/5] Rendering HTML Newsletter...")
        html_body = build_email_html(stats, predictions)
        if not html_body:
            print("❌ Failed to build HTML body. Exiting.")
            sys.exit(1)
        print("HTML report rendered successfully.")
    except Exception as e:
        print(f"❌ Exception in Step 4: {e}")
        sys.exit(1)
        
    # 5. Send Email via SMTP (Commented out / Disabled by user request)
    try:
        print("\n[Step 5/5] Email dispatching is currently disabled (Local Database Mode).")
        latest_round = stats.get("latest_round_no", 0)
        
        # Save local predictions to config/history if needed, or simply log completion
        print("Skipped SMTP email sending. Local database update and predictions rendered successfully.")
        print(f"\n🎉 AI Lotto Agent Database Sync Job Completed Successfully for Round {latest_round}!")
        print("=" * 60)
    except Exception as e:
        print(f"❌ Exception in Step 5: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
