import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Load local environment variables for testing (.env file)
load_dotenv()

def get_ball_color(num):
    """Return the correct hex color for a lotto ball based on its number range."""
    if 1 <= num <= 10:
        return "#fbc400" # Yellow
    elif 11 <= num <= 20:
        return "#69acd5" # Blue
    elif 21 <= num <= 30:
        return "#ff7272" # Red
    elif 31 <= num <= 40:
        return "#aaaaaa" # Gray
    else:
        return "#b0d840" # Green

def generate_html_balls(numbers):
    """Generate inline-styled HTML span tags for lotto balls."""
    html = ""
    for num in numbers:
        color = get_ball_color(num)
        html += f"""
        <span style="
            display: inline-block;
            width: 38px;
            height: 38px;
            line-height: 38px;
            text-align: center;
            border-radius: 50%;
            color: #ffffff;
            background-color: {color};
            font-weight: bold;
            font-size: 16px;
            font-family: Arial, sans-serif;
            margin: 4px;
            text-shadow: 1px 1px 1px rgba(0,0,0,0.4);
            box-shadow: inset -3px -3px 6px rgba(0,0,0,0.5), 2px 2px 4px rgba(0,0,0,0.3);
        ">{num}</span>
        """
    return html

def build_email_html(stats, prediction):
    """Construct the complete, responsive HTML body for the email report."""
    latest_no = stats.get("latest_round_no")
    latest_nums = stats.get("latest_numbers", [])
    latest_bns = stats.get("latest_bonus")
    latest_date = stats.get("latest_round_date")
    
    analysis_report = prediction.get("analysis_report", "").replace("\n", "<br>")
    lucky_message = prediction.get("lucky_message", "").replace("\n", "<br>")
    predictions = prediction.get("predictions", [])
    
    # Format the latest draw balls HTML
    latest_balls_html = generate_html_balls(latest_nums)
    bonus_ball_html = generate_html_balls([latest_bns])
    
    # Format predicted rows HTML
    pred_rows_html = ""
    for idx, pred in enumerate(predictions):
        balls_html = generate_html_balls(pred)
        set_letter = chr(65 + idx) # A, B, C, D, E
        pred_rows_html += f"""
        <tr style="border-bottom: 1px solid #eeeeee;">
            <td style="padding: 12px 10px; font-weight: bold; color: #444444; font-size: 16px; width: 50px; text-align: center;">{set_letter} 세트</td>
            <td style="padding: 12px 10px; text-align: left;">{balls_html}</td>
        </tr>
        """
        
    # Full HTML template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI 로또 예측 분석가 에이전트 리포트</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e1e4e8;">
            
            <!-- HEADER -->
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px 20px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">🍀 AI 로또 예측 분석 리포트 🍀</h1>
                <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9; font-weight: 400;">매주 금요일, AI 에이전트 Dr. Lucky가 전해드리는 특별한 행운</p>
            </div>
            
            <div style="padding: 24px 20px;">
                <!-- AI REPORT SECTION -->
                <div style="background-color: #f0fdf4; border-left: 4px solid #11998e; padding: 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 10px 0; color: #11998e; font-size: 16px; display: flex; align-items: center;">
                        <span style="font-size: 20px; margin-right: 6px;">🤖</span> <b>Dr. Lucky의 이번 주 데이터 분석 레포트</b>
                    </h3>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333333; word-break: keep-all;">
                        {analysis_report}
                    </p>
                </div>
                
                <!-- PREDICTION SECTION -->
                <div style="margin-bottom: 24px;">
                    <h3 style="margin: 0 0 14px 0; color: #2c3e50; font-size: 17px; font-weight: bold; border-bottom: 2px solid #e1e4e8; padding-bottom: 6px;">
                        ✨ AI 에이전트 추천 예측 조합 (5세트)
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tbody>
                            {pred_rows_html}
                        </tbody>
                    </table>
                </div>

                <!-- LATEST DRAW SECTION -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h4 style="margin: 0 0 10px 0; color: #475569; font-size: 14px; font-weight: bold;">
                        📊 직전 {latest_no}회차 당첨 정보 ({latest_date})
                    </h4>
                    <div style="text-align: center; margin: 10px 0;">
                        {latest_balls_html}
                        <span style="display: inline-block; font-size: 20px; font-weight: bold; color: #64748b; vertical-align: middle; margin: 0 8px;">+</span>
                        {bonus_ball_html}
                    </div>
                </div>

                <!-- LUCKY MESSAGE SECTION -->
                <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 10px;">
                    <p style="margin: 0; font-size: 22px;">🔮</p>
                    <h4 style="margin: 4px 0 8px 0; color: #b45309; font-size: 15px; font-weight: bold;">Dr. Lucky가 보내는 금주의 응원 메시지</h4>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350f; font-style: italic; word-break: keep-all;">
                        "{lucky_message}"
                    </p>
                </div>
            </div>
            
            <!-- FOOTER -->
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                    본 이메일은 GitHub Actions를 활용해 구축된 서버리스 파이썬 프로그램에 의해 매주 금요일 자동 발송됩니다.<br>
                    보안을 위해 발송인의 소중한 자격 증명은 암호화된 비밀 값으로 관리됩니다.
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #94a3b8;">
                    🤖 AI Lotto Analyst Agent &copy; 2026. Powered by Google Gemini API.
                </p>
            </div>
            
        </div>
    </body>
    </html>
    """
    return html_content

def send_email(html_body, latest_round):
    """Send the HTML email using SMTP."""
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")
    receiver_email = os.getenv("RECEIVER_EMAIL")

    # Try to load custom configuration from data/config.json if it exists
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "config.json")
    if os.path.exists(config_path):
        try:
            import json
            with open(config_path, "r", encoding="utf-8") as f:
                config_data = json.load(f)
                if config_data.get("receiver_email"):
                    receiver_email = config_data.get("receiver_email")
                    print(f"📧 config.json에서 수신자 설정을 로드했습니다: {receiver_email}")
        except Exception as e:
            print(f"⚠️ config.json 로드 실패 (기본 환경 변수 적용): {e}")

    # Resolve multi-recipient list
    recipients = []
    if isinstance(receiver_email, list):
        recipients = list(receiver_email)
    elif isinstance(receiver_email, str):
        if "," in receiver_email:
            recipients = [x.strip() for x in receiver_email.split(",") if x.strip()]
        else:
            recipients = [receiver_email.strip()]
    else:
        recipients = []

    # SMTP server configuration
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))

    if not sender_email or not sender_password or not recipients:
        print("Error: SMTP settings (SENDER_EMAIL, SENDER_PASSWORD) or recipients are not fully set.")
        print("Skipping email dispatch.")
        return False

    print(f"Preparing to send email to {len(recipients)} recipients from {sender_email} via {smtp_server}:{smtp_port}...")
    
    try:
        # Establish connection with SMTP server once
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls() # Enable security/TLS
        
        server.login(sender_email, sender_password)
        
        success_count = 0
        for r_email in recipients:
            try:
                print(f"Sending email to {r_email}...")
                # Create a fresh message for each recipient (protecting CC/BCC leakages)
                msg = MIMEMultipart("alternative")
                msg["Subject"] = f"🍀 [AI 로또 분석 에이전트] 이번 주 {latest_round + 1}회차 예측 리포트가 도착했습니다!"
                msg["From"] = f"AI Lotto Agent <{sender_email}>"
                msg["To"] = r_email
                
                # Attach HTML body
                msg.attach(MIMEText(html_body, "html"))
                
                # Send Email
                server.sendmail(sender_email, r_email, msg.as_string())
                success_count += 1
            except Exception as se:
                print(f"⚠️ Failed to send to {r_email}: {se}")
                
        server.quit()
        
        print(f"🎉 Successfully sent to {success_count}/{len(recipients)} recipients!")
        return success_count > 0
    except Exception as e:
        print(f"❌ Failed to send emails through SMTP: {e}")
        return False

if __name__ == "__main__":
    # Quick visual mockup test
    from data_collector import load_local_history, get_lotto_statistics
    from predictor import generate_mock_prediction
    
    print("Testing mailer markup builder...")
    history = load_local_history()
    if history:
        stats = get_lotto_statistics(history)
        pred = generate_mock_prediction(stats)
        html = build_email_html(stats, pred)
        
        # Save HTML locally to check the design
        test_html_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_output.html")
        with open(test_html_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Local preview HTML saved to: {test_html_path}")
