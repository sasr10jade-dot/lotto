# 🍀 AI 로또 예측 분석가 에이전트 & 자동 이메일 발송기 (AI Lotto Agent)

매주 금요일 퇴근길, 데이터 사이언티스트 출신의 유쾌하고 지적인 AI 로또 전문 분석가 **'Dr. Lucky'**가 역대 당첨 번호 데이터를 기반으로 직접 번호를 추론하고 작성한 분석 리포트를 이메일로 자동 전송하는 완전 자동화 서버리스 시스템입니다.

GitHub Actions, Google Gemini API(무료 등급), Gmail SMTP를 활용하여 **유지보수 및 운영비가 평생 0원(무료)**으로 구동됩니다.

---

## 🚀 주요 기능 (Core Features)

1. **완전 자동 스케줄링**: 매주 금요일 저녁 18:00 (KST)에 GitHub Actions가 자동으로 실행되어 번호를 분석 및 발송합니다.
2. **2026년 개편 최신 공식 JSON API 기반 초고속 수집**: 동행복권의 내장 벌크 API를 사용해 역대 모든 회차(1회~현재) 데이터를 1초 만에 최신화합니다.
3. **인격화된 AI 에이전트 (Google Gemini API)**: 단순 무작위 번호 생성이 아니라, 실제 데이터의 가중치를 분석하고 홀짝/총합/연속번호 필터를 가치 있게 통과시킨 예측 조합 5세트와 위트 있는 분석평, 따뜻한 주말 응원 글을 매주 다른 느낌으로 작성해 줍니다.
4. **반응형 로또 볼 스타일 HTML 이메일**: 모바일과 PC 모두에서 예쁘게 보이는 로또 공 색상(노랑, 파랑, 빨강, 회색, 초록)의 3D 입체 디자인이 반영된 리포트를 받아봅니다.

---

## 📂 폴더 및 파일 구조

```text
├── .github/workflows/
│   └── lotto_scheduler.yml  # 매주 금요일 18:00 자동 실행하는 GitHub Actions 워크플로우
├── data/
│   └── lotto_history.json   # 수집된 역대 로또 당첨 데이터 캐시 (자동 업데이트)
├── src/
│   ├── data_collector.py    # 동행복권 API 통신 및 최근 통계 가공
│   ├── predictor.py         # Gemini API 연동 및 AI 에이전트 추론 (Mock 모드 지원)
│   ├── mailer.py            # 반응형 HTML 이메일 템플릿 생성 및 SMTP 전송
│   └── main.py              # 전체 모듈을 순차적으로 조율하는 메인 스크립트
├── .env.template            # 로컬 개발/테스트용 환경 변수 템플릿
├── requirements.txt         # 파이썬 의존 라이브러리 목록
└── README.md                # 본 안내서
```

---

## 🛠️ 배포 및 가동 준비 가이드 (GitHub 설정 방법)

이 프로젝트를 자신의 GitHub 계정에 올려 평생 무료로 자동 발송 시스템을 가동하기 위해 아래 단계를 진행해 주세요.

### Step 1. Google Gemini API 키 발급 받기 (무료)
1. [Google AI Studio](https://aistudio.google.com/)에 구글 계정으로 로그인합니다.
2. **Get API Key** 버튼을 클릭하여 새로운 API 키를 생성하고 복사합니다.

### Step 2. 발송용 Gmail SMTP 앱 비밀번호 생성하기
일반 Gmail 비밀번호는 보안 정책상 프로그램에서 직접 사용할 수 없습니다. '앱 비밀번호'를 발급받아야 합니다.
1. 구글 계정의 [구글 계정 관리 > 보안](https://myaccount.google.com/security) 메뉴로 이동합니다.
2. **2단계 인증**을 설정합니다 (이미 설정되어 있다면 패스).
3. 2단계 인증 메뉴 최하단에 있는 **앱 비밀번호 (App Passwords)**를 클릭합니다.
4. 앱 이름을 `LottoAgent` 등으로 입력하고 **만들기**를 클릭하여 발급된 **16자리 비밀번호**를 따로 기록해 둡니다.

### Step 3. GitHub 리포지토리 생성 및 코드 올리기
1. 본인의 GitHub에 새로운 Private(또는 Public) Repository를 생성합니다.
2. 이 프로젝트의 모든 파일과 폴더를 해당 리포지토리에 푸시(Push)합니다.

### Step 4. GitHub Secrets 등록하기
로비 번호나 API 비밀키가 코드에 노출되면 유출 위험이 있으므로, GitHub Repository 설정에 등록해 주어야 합니다.
1. 생성한 GitHub Repository 페이지의 상단 메뉴에서 **Settings** ➔ 좌측 메뉴의 **Secrets and variables** ➔ **Actions**를 클릭합니다.
2. **New repository secret** 버튼을 눌러 아래 4개의 값을 등록해 줍니다:

| Secret 이름 | 설명 | 예시 값 |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Step 1에서 발급받은 구글 제미나이 API 키 | `AIzaSyB...` |
| `SENDER_EMAIL` | 발송에 사용할 구글 Gmail 주소 | `your-email@gmail.com` |
| `SENDER_PASSWORD` | Step 2에서 생성한 16자리 Gmail 앱 비밀번호 | `abcd efgh ijkl mnop` (띄어쓰기 없이 입력) |
| `RECEIVER_EMAIL` | 예측 번호 리포트를 수신받을 이메일 주소 | `customer@naver.com` |

---

## 💻 로컬(내 컴퓨터)에서 테스트하는 방법

### 1. 가상환경 구축 및 패키지 설치
```bash
# 가상환경 생성 (선택 사항)
python -m venv venv
source venv/Scripts/activate # Windows
# source venv/bin/activate # Mac/Linux

# 의존 패키지 설치
pip install -r requirements.txt
```

### 2. 환경 변수 파일 생성
1. 프로젝트 루트 폴더에 있는 `.env.template` 파일 이름을 `.env`로 변경합니다.
2. 변경한 `.env` 파일을 열어 본인의 실제 `GEMINI_API_KEY` 및 이메일 주소 등을 작성해 줍니다.

### 3. 로컬 테스트 실행
```bash
python src/main.py
```
- 모든 환경 변수가 정상적으로 기입되었다면 지정된 수신 이메일로 예측 메일이 즉시 발송됩니다.
- 환경 변수가 세팅되지 않은 경우, 자동으로 **Mock 모드(룰 기반 생성)**로 작동하며 이메일 전송 단계는 스킵하고 완료됩니다.

---

## 📅 자동화 주기 변경 정보
매주 금요일 18:00 KST에 자동 실행되도록 설정되어 있으나, 시간을 변경하고 싶으시다면 `.github/workflows/lotto_scheduler.yml` 파일 내 `cron` 설정을 수정하시면 됩니다:
```yaml
on:
  schedule:
    # 0 9 * * 5 는 금요일 UTC 09:00 (한국 시간 금요일 저녁 18:00)을 의미합니다.
    - cron: '0 9 * * 5'
```
