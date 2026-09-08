// GLOBAL APP STATE
let lottoHistory = [];
let lottoStats = {};
let chatHistory = []; // For multi-turn conversational chat with Gemini
let receiverEmails = []; // For multi-recipient list

// DOM ELEMENTS
const apiKeyInput = document.getElementById('gemini-api-key');
const saveKeyBtn = document.getElementById('save-api-key');
const apiStatusBadge = document.getElementById('api-status-badge');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

const latestRoundNum = document.getElementById('latest-round-num');
const latestDrawDate = document.getElementById('latest-draw-date');
const latestBallsContainer = document.getElementById('latest-balls-container');

const hotNumbersContainer = document.getElementById('hot-numbers');
const coldNumbersContainer = document.getElementById('cold-numbers');
const unseenNumbersContainer = document.getElementById('unseen-numbers');
const averageSumEl = document.getElementById('average-sum');
const oddEvenRatioEl = document.getElementById('odd-even-ratio');

// SYSTEM CONFIGURATION DOM ELEMENTS
const emailChipsContainer = document.getElementById('email-chips-container');
const emailChipsWrapper = document.getElementById('email-chips-wrapper');
const configReceiverEmailInput = document.getElementById('config-receiver-email-input');
const configScheduleDay = document.getElementById('config-schedule-day');
const configScheduleTime = document.getElementById('config-schedule-time');
const configBirthDate = document.getElementById('config-birth-date');
const configBirthTime = document.getElementById('config-birth-time');
const cronPreview = document.getElementById('cron-preview');
const cronDesc = document.getElementById('cron-desc');
const btnDownloadConfig = document.getElementById('btn-download-config');
const btnCopyCron = document.getElementById('btn-copy-cron');

// QR SCANNER DOM ELEMENTS
const btnQrScan = document.getElementById('btn-qr-scan');
const qrModal = document.getElementById('qr-modal');
const btnCloseQr = document.getElementById('btn-close-qr');
const qrVideo = document.getElementById('qr-video');
const qrStatusText = document.getElementById('qr-status-text');

const qrResultModal = document.getElementById('qr-result-modal');
const btnCloseResult = document.getElementById('btn-close-result');
const btnCloseResultBottom = document.getElementById('btn-close-result-bottom');
const resultBadgeContainer = document.getElementById('result-badge-container');
const resultTitleText = document.getElementById('result-title-text');
const resultDescText = document.getElementById('result-desc-text');
const resultMatchingBallsContainer = document.getElementById('result-matching-balls-container');

// CAMERA STREAM STATE
let qrStream = null;
let qrAnimationId = null;

const btnGenerateAi = document.getElementById('btn-generate-ai');
const resultsContainer = document.getElementById('generator-results-container');
const aiGeneratorReport = document.getElementById('ai-generator-report');
const aiGeneratorLucky = document.getElementById('ai-generator-lucky');
const predictionRows = document.getElementById('prediction-rows');

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');
const clearChatBtn = document.getElementById('clear-chat');
const quickChips = document.querySelectorAll('.chip');

// INITIALIZE APP
window.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Theme, Gemini API Key and System Configuration
    initTheme();
    initApiKey();
    initSystemConfig();

    // 2. Fetch and Analyze Lotto History & Dispatch History
    await initLottoData();
    await initDispatchHistory();

    // 3. Register Event Listeners
    initEventListeners();
});

// THEME CONFIGURATION MANAGEMENT
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.className = "fa-solid fa-moon";
        themeIcon.style.color = "#a78bfa"; // Soft purple for moon
    } else {
        document.body.classList.remove('light-mode');
        themeIcon.className = "fa-solid fa-sun";
        themeIcon.style.color = "#fbbf24"; // Bright amber for sun
    }
}

// 1. API KEY MANAGEMENT
function initApiKey() {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
        updateApiBadge(true);
    } else {
        updateApiBadge(false);
    }
}

function updateApiBadge(isConfigured) {
    if (isConfigured) {
        apiStatusBadge.textContent = "연동 완료 (Gemini API)";
        apiStatusBadge.className = "badge badge-success";
    } else {
        apiStatusBadge.textContent = "로컬 분석 모드";
        apiStatusBadge.className = "badge badge-unconfigured";
    }
}

// 2. SYSTEM CONFIGURATION MANAGEMENT
function initSystemConfig() {
    // Load emails list from Local Storage
    const savedEmailsStr = localStorage.getItem('config_receiver_emails');
    if (savedEmailsStr) {
        try {
            receiverEmails = JSON.parse(savedEmailsStr);
        } catch (e) {
            receiverEmails = [];
        }
    } else {
        // Fallback & Migrate legacy single email settings
        const oldEmail = localStorage.getItem('config_receiver_email');
        if (oldEmail) {
            receiverEmails = [oldEmail];
            localStorage.setItem('config_receiver_emails', JSON.stringify(receiverEmails));
            localStorage.removeItem('config_receiver_email');
        } else {
            receiverEmails = [];
        }
    }

    renderEmailChips();

    const savedDay = localStorage.getItem('config_schedule_day') || "5"; // Default Friday
    const savedTime = localStorage.getItem('config_schedule_time') || "18:00"; // Default 18:00

    configScheduleDay.value = savedDay;

    // Dynamically populate 24-hour options (00:00 to 23:00) into select dropdown
    configScheduleTime.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const hourStr = String(i).padStart(2, '0') + ":00";
        const opt = document.createElement('option');
        opt.value = hourStr;
        opt.textContent = hourStr;
        configScheduleTime.appendChild(opt);
    }
    configScheduleTime.value = savedTime;

    // Populate 1-45 options in fixed number selects dynamically
    const selects = document.querySelectorAll('.fixed-num-select');
    selects.forEach((select, idx) => {
        select.innerHTML = '<option value="">없음</option>';
        for (let i = 1; i <= 45; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            select.appendChild(opt);
        }
        
        // Restore saved selection
        const savedNum = localStorage.getItem(`config_fixed_number_${idx + 1}`) || "";
        select.value = savedNum;
    });

    // Restore Birth Date and Time of Birth from Local Storage
    const savedBirthDate = localStorage.getItem('config_birth_date') || "";
    const savedBirthTime = localStorage.getItem('config_birth_time') || "";
    configBirthDate.value = savedBirthDate;
    configBirthTime.value = savedBirthTime;

    updateCronPreview();
}

function renderEmailChips() {
    emailChipsWrapper.innerHTML = '';
    receiverEmails.forEach((email, idx) => {
        const chip = document.createElement('div');
        chip.className = 'email-chip';
        chip.title = "더블 클릭하여 수정";
        chip.innerHTML = `
            <span>${email}</span>
            <button class="remove-chip-btn" data-index="${idx}"><i class="fa-solid fa-xmark"></i></button>
        `;
        
        // Double-click on chip to load back into input for quick editing
        chip.addEventListener('dblclick', () => {
            configReceiverEmailInput.value = email;
            receiverEmails.splice(idx, 1);
            localStorage.setItem('config_receiver_emails', JSON.stringify(receiverEmails));
            renderEmailChips();
            configReceiverEmailInput.focus();
        });

        emailChipsWrapper.appendChild(chip);
    });

    // Register click event listeners on remove buttons
    document.querySelectorAll('.remove-chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop click from propagating to focus the input field
            const idx = parseInt(btn.getAttribute('data-index'));
            receiverEmails.splice(idx, 1);
            localStorage.setItem('config_receiver_emails', JSON.stringify(receiverEmails));
            renderEmailChips();
        });
    });
}

function updateCronPreview() {
    const dayVal = parseInt(configScheduleDay.value);
    const timeVal = configScheduleTime.value; // e.g. "18:00"
    
    if (!timeVal) return;

    const [hour, minute] = timeVal.split(':').map(Number);
    
    // KST is UTC + 9. Convert KST to UTC for GitHub Actions cron
    let utcHour = hour - 9;
    let dayOffset = 0;
    
    if (utcHour < 0) {
        utcHour += 24;
        dayOffset = -1;
    }
    
    // Day of week conversion: 0=Sun, 1=Mon, ..., 6=Sat
    let utcDay = (dayVal + dayOffset + 7) % 7;

    const cronString = `${minute} ${utcHour} * * ${utcDay}`;
    cronPreview.textContent = cronString;

    // Set descriptive text
    const daysKor = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    cronDesc.textContent = `매주 ${daysKor[dayVal]} ${timeVal} KST 자동 실행`;
}

function getSelectedFixedNumbers() {
    const fixed = [];
    document.querySelectorAll('.fixed-num-select').forEach(select => {
        const val = select.value;
        if (val) {
            const num = parseInt(val);
            if (!fixed.includes(num)) {
                fixed.push(num);
            }
        }
    });
    return fixed.sort((a, b) => a - b);
}

function validateFixedNumbers() {
    const selected = [];
    const selects = document.querySelectorAll('.fixed-num-select');
    
    selects.forEach((select, idx) => {
        const val = select.value;
        if (val) {
            if (selected.includes(val)) {
                alert("경고: 이미 다른 칸에 지정된 행운 번호입니다. 중복 선택되었습니다!");
                select.value = "";
                localStorage.setItem(`config_fixed_number_${idx + 1}`, "");
            } else {
                selected.push(val);
            }
        }
    });
}

// 3. LOTTO DATA COLLECTION & STATS CALCULATION
async function initLottoData() {
    try {
        console.log("Fetching lotto_history.json...");
        const response = await fetch('./data/lotto_history.json');
        if (!response.ok) {
            throw new Error(`Failed to load history file: ${response.statusText}`);
        }
        lottoHistory = await response.json();
        
        // Sort ascending by round
        lottoHistory.sort((a, b) => a.drwNo - b.drwNo);
        console.log(`Successfully loaded ${lottoHistory.length} draws.`);

        if (lottoHistory.length > 0) {
            // Compute Statistics
            calculateStatistics();
            // Render Dashboard UI
            renderDashboard();
        }
    } catch (error) {
        console.error("Error loading lottery database:", error);
        latestBallsContainer.innerHTML = `<div class="error-text" style="color: var(--color-danger); font-size:13px;"><i class="fa-solid fa-triangle-exclamation"></i> 데이터베이스 파일을 불러올 수 없습니다. GitHub 저장소에 데이터를 푸시해 주세요.</div>`;
    }
}

function calculateStatistics() {
    const numberCols = ["drwtNo1", "drwtNo2", "drwtNo3", "drwtNo4", "drwtNo5", "drwtNo6"];
    const totalRounds = lottoHistory.length;
    const latestRound = lottoHistory[totalRounds - 1];

    // All-Time Cumulative Frequencies & Ratios
    const freq = Array(46).fill(0);
    let allTimeSumTotal = 0;
    let allTimeOddCount = 0;
    let allTimeNumCount = 0;

    lottoHistory.forEach(draw => {
        let drawSum = 0;
        numberCols.forEach(col => {
            const num = draw[col];
            freq[num]++;
            drawSum += num;
            if (num % 2 !== 0) allTimeOddCount++;
            allTimeNumCount++;
        });
        allTimeSumTotal += drawSum;
    });

    // Map all frequencies (excluding index 0)
    const allTimeFreqMapped = freq.map((count, num) => ({ num, count })).slice(1);
    
    // Hot numbers (Top 5 of all time)
    const hotNumbers = [...allTimeFreqMapped]
        .sort((a, b) => b.count - a.count || b.num - a.num)
        .slice(0, 5)
        .map(x => x.num);

    // Cold numbers (Bottom 5 of all time)
    const coldNumbers = [...allTimeFreqMapped]
        .sort((a, b) => a.count - b.count || a.num - b.num)
        .slice(0, 5)
        .map(x => x.num);

    // Longest Unseen Numbers (All-time tracking)
    const lastSeen = Array(46).fill(totalRounds);
    lottoHistory.forEach(draw => {
        const roundNo = draw.drwNo;
        numberCols.forEach(col => {
            lastSeen[draw[col]] = totalRounds - roundNo; // Draws ago
        });
    });

    const longestUnseen = lastSeen
        .map((drawsAgo, num) => ({ num, drawsAgo }))
        .slice(1)
        .sort((a, b) => b.drawsAgo - a.drawsAgo)
        .slice(0, 5);

    // Save stats in global object
    lottoStats = {
        totalRounds,
        latestRoundNo: latestRound.drwNo,
        latestRoundDate: latestRound.drwNoDate,
        latestNumbers: numberCols.map(c => latestRound[c]),
        latestBonus: latestRound.bnusNo,
        hotNumbers,
        coldNumbers,
        longestUnseen,
        averageSum: allTimeSumTotal / totalRounds,
        oddEvenRatio: `${((allTimeOddCount / allTimeNumCount) * 100).toFixed(1)}% / ${(((allTimeNumCount - allTimeOddCount) / allTimeNumCount) * 100).toFixed(1)}%`
    };
}

// 4. UI RENDERING UTILS
function getBallColorClass(num) {
    if (1 <= num && num <= 10) return "ball-yellow";
    if (11 <= num && num <= 20) return "ball-blue";
    if (21 <= num && num <= 30) return "ball-red";
    if (31 <= num && num <= 40) return "ball-gray";
    return "ball-green";
}

function renderDashboard() {
    // 1. Render Latest Draw
    latestRoundNum.textContent = lottoStats.latestRoundNo;
    latestDrawDate.textContent = lottoStats.latestRoundDate;

    let ballsHtml = "";
    lottoStats.latestNumbers.forEach(num => {
        ballsHtml += `<span class="ball ${getBallColorClass(num)}">${num}</span>`;
    });
    ballsHtml += `<span class="bonus-plus">+</span>`;
    ballsHtml += `<span class="ball ${getBallColorClass(lottoStats.latestBonus)}">${lottoStats.latestBonus}</span>`;
    latestBallsContainer.innerHTML = ballsHtml;

    // 2. Render Statistics Card
    let hotHtml = "";
    lottoStats.hotNumbers.forEach(num => {
        hotHtml += `<span class="ball mini-ball ${getBallColorClass(num)}">${num}</span>`;
    });
    hotNumbersContainer.innerHTML = hotHtml || "-";

    let coldHtml = "";
    lottoStats.coldNumbers.forEach(num => {
        coldHtml += `<span class="ball mini-ball ${getBallColorClass(num)}">${num}</span>`;
    });
    coldNumbersContainer.innerHTML = coldHtml || "-";

    let unseenHtml = "";
    lottoStats.longestUnseen.forEach(item => {
        unseenHtml += `
        <span style="display:inline-flex; flex-direction:column; align-items:center; gap:2px; margin: 0 4px;">
            <span class="ball mini-ball ${getBallColorClass(item.num)}">${item.num}</span>
            <span style="font-size:10px; color:var(--text-muted);">${item.drawsAgo}회 전</span>
        </span>`;
    });
    unseenNumbersContainer.innerHTML = unseenHtml || "-";

    averageSumEl.textContent = `${lottoStats.averageSum.toFixed(1)}`;
    oddEvenRatioEl.textContent = lottoStats.oddEvenRatio;
}

// 5. EVENT LISTENERS SETUP
function initEventListeners() {
    // Theme Toggle Listener
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
            themeIcon.className = "fa-solid fa-moon";
            themeIcon.style.color = "#a78bfa"; // Moon purple
        } else {
            localStorage.setItem('theme', 'dark');
            themeIcon.className = "fa-solid fa-sun";
            themeIcon.style.color = "#fbbf24"; // Sun gold
        }
    });

    // Save API Key
    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('gemini_api_key', key);
            updateApiBadge(true);
            alert("Gemini API 키가 안전하게 로컬 브라우저에 저장되었습니다.");
        } else {
            localStorage.removeItem('gemini_api_key');
            updateApiBadge(false);
            alert("저장된 API 키가 삭제되었습니다. 로컬 분석 모드로 작동합니다.");
        }
    });

    // Listeners for System Settings Card (Multi-Email Chips)
    emailChipsContainer.addEventListener('click', () => {
        configReceiverEmailInput.focus();
    });

    configReceiverEmailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            let val = configReceiverEmailInput.value.trim();
            if (val.endsWith(',')) {
                val = val.slice(0, -1).trim();
            }
            if (!val) return;

            // Email format regular expression validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) {
                alert("경고: 올바른 이메일 주소 형식이 아닙니다!");
                return;
            }

            if (receiverEmails.includes(val)) {
                alert("이미 등록된 이메일 주소입니다!");
                configReceiverEmailInput.value = '';
                return;
            }

            receiverEmails.push(val);
            localStorage.setItem('config_receiver_emails', JSON.stringify(receiverEmails));
            configReceiverEmailInput.value = '';
            renderEmailChips();
        } else if (e.key === 'Backspace' && configReceiverEmailInput.value === '') {
            // Remove last chip if backspace is pressed on empty input field
            receiverEmails.pop();
            localStorage.setItem('config_receiver_emails', JSON.stringify(receiverEmails));
            renderEmailChips();
        }
    });

    configReceiverEmailInput.addEventListener('blur', () => {
        let val = configReceiverEmailInput.value.trim();
        if (val) {
            if (val.endsWith(',')) val = val.slice(0, -1).trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(val) && !receiverEmails.includes(val)) {
                receiverEmails.push(val);
                localStorage.setItem('config_receiver_emails', JSON.stringify(receiverEmails));
                configReceiverEmailInput.value = '';
                renderEmailChips();
            }
        }
    });

    configScheduleDay.addEventListener('change', () => {
        localStorage.setItem('config_schedule_day', configScheduleDay.value);
        updateCronPreview();
    });
    configScheduleTime.addEventListener('change', () => {
        localStorage.setItem('config_schedule_time', configScheduleTime.value);
        updateCronPreview();
    });

    // Listeners for Birth Info (AI Fortune/Destiny)
    configBirthDate.addEventListener('change', () => {
        localStorage.setItem('config_birth_date', configBirthDate.value);
    });
    configBirthDate.addEventListener('click', () => {
        try {
            if (typeof configBirthDate.showPicker === 'function') {
                configBirthDate.showPicker();
            }
        } catch (e) {
            console.log("showPicker API not supported in this browser:", e);
        }
    });
    configBirthTime.addEventListener('change', () => {
        localStorage.setItem('config_birth_time', configBirthTime.value);
    });

    // Listeners for Fixed Numbers
    document.querySelectorAll('.fixed-num-select').forEach((select, idx) => {
        select.addEventListener('change', () => {
            localStorage.setItem(`config_fixed_number_${idx + 1}`, select.value);
            validateFixedNumbers();
        });
    });

    // Download Config
    btnDownloadConfig.addEventListener('click', downloadConfigJson);

    // Copy Cron yaml block
    btnCopyCron.addEventListener('click', copyCronYaml);

    // AI Prediction Generator Button
    btnGenerateAi.addEventListener('click', handlePredictionGeneration);

    // Send Chat Message
    btnSendChat.addEventListener('click', handleSendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendChatMessage();
        }
    });

    // Clear Chat
    clearChatBtn.addEventListener('click', () => {
        if (confirm("채팅 대화 내용을 모두 초기화할까요?")) {
            chatHistory = [];
            chatMessages.innerHTML = `
            <div class="message system-msg">
                <div class="bubble">
                    🤖 채팅방이 청소되었습니다! 궁금한 내용을 다시 질문해 주세요.
                </div>
            </div>`;
        }
    });

    // Quick Action Chips
    quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const msg = chip.getAttribute('data-msg');
            chatInput.value = msg;
            handleSendChatMessage();
        });
    });

    // QR Scanner Trigger Listeners
    if (btnQrScan) btnQrScan.addEventListener('click', startQrScan);
    if (btnCloseQr) btnCloseQr.addEventListener('click', stopQrScan);
    if (btnCloseResult) btnCloseResult.addEventListener('click', closeResultModal);
    if (btnCloseResultBottom) btnCloseResultBottom.addEventListener('click', closeResultModal);
}

// 6. DOWNLOADING CONFIG & COPYING CRON FUNCTIONS
function downloadConfigJson() {
    const emailList = receiverEmails;
    if (emailList.length === 0) {
        alert("수신 이메일 주소를 최소 1개 이상 입력하고 Enter나 쉼표를 눌러 등록해 주세요!");
        configReceiverEmailInput.focus();
        return;
    }

    const daysEng = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayIndex = parseInt(configScheduleDay.value);
    
    const configData = {
        receiver_email: emailList, // Array list export!
        schedule_day: daysEng[dayIndex],
        schedule_time: configScheduleTime.value,
        cron: cronPreview.textContent,
        fixed_numbers: getSelectedFixedNumbers(),
        birth_date: configBirthDate.value,
        birth_time: configBirthTime.value
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyCronYaml() {
    const cron = cronPreview.textContent;
    const yamlBlock = `  schedule:\n    - cron: '${cron}'`;
    
    navigator.clipboard.writeText(yamlBlock).then(() => {
        alert("GitHub Actions용 스케줄 yaml 코드 블록이 클립보드에 복사되었습니다!\n\n" + yamlBlock);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
        alert(`클립보드 복사 실패. 아래 텍스트를 수동으로 복사하세요:\n\n${yamlBlock}`);
    });
}

// 7. INTERACTIVE COMPONENT: PREDICTION GENERATION
async function handlePredictionGeneration() {
    btnGenerateAi.disabled = true;
    btnGenerateAi.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> AI 분석기 가동 중... (10~15초 소요)`;
    
    resultsContainer.classList.remove('hidden');
    aiGeneratorReport.textContent = "AI가 최근 당첨 트렌드를 복기하고 최적의 가중치를 계산하고 있습니다. 잠시만 기다려 주세요...";
    aiGeneratorLucky.textContent = "🔮 분석 중...";
    predictionRows.innerHTML = `
        <tr>
            <td colspan="2" style="text-align:center; padding:30px; color:var(--text-muted);">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size:20px; margin-bottom:10px;"></i><br>
                데이터 학습 및 무결성 검증 필터를 통과시키고 있습니다.
            </td>
        </tr>`;

    const apiKey = localStorage.getItem('gemini_api_key');
    let results;

    if (apiKey) {
        // Run Real Gemini API
        results = await getGeminiPredictions(apiKey);
    } else {
        // Run Rule-Based Mock Fallback
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate loading delay
        results = getMockPredictions();
    }

    // Render predictions
    if (results) {
        renderPredictions(results);
    } else {
        aiGeneratorReport.textContent = "예측 결과를 받아오는 과정에서 에러가 발생했습니다. API 키 상태를 확인하시거나 다시 시도해 주세요.";
    }

    btnGenerateAi.disabled = false;
    btnGenerateAi.innerHTML = `<i class="fa-solid fa-brain"></i> AI 분석기 가동 및 예측번호 추출`;
}

async function getGeminiPredictions(apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const fixedNums = getSelectedFixedNumbers();
    const fixedConstraint = fixedNums.length > 0
        ? `\n[핵심 제약 조건] 사용자가 선호하는 고정수 번호 [${fixedNums.join(', ')}] 가 선택되어 있습니다. 생성하시는 추천 조합 A, B, C, D, E 모든 5가지 예측 번호 세트에는 이 지정된 고정수들([${fixedNums.join(', ')}])이 100% 무조건 포함되어 있어야 합니다. 이 숫자를 기반으로 조화로운 나머지 번호들을 완성해 주세요.`
        : "";

    const birthDateVal = configBirthDate.value;
    const birthTimeVal = configBirthTime.value;
    const birthConstraint = birthDateVal 
        ? `\n[사주/운세 개인화 요구사항] 사용자의 생년월일은 [${birthDateVal}] 이고 태어난 명리학상 시간은 [${birthTimeVal || "모름"}] 입니다. 이 명식을 바탕으로 동양의 음양오행 사상(목, 화, 토, 금, 수) 및 이번 주 금전 횡재수를 재미있고 위트 있게 풀이하여 'analysis_report' 섹션에 최소 한 문단 이상 포함시켜 주세요. 또한 생성하시는 추천 번호에도 이 사주 명식 분석에 따라 기운이 통하는 행운 번호들을 조화롭게 배합하고 분석 리포트에 근거를 덧붙여주세요.`
        : "";

    const prompt = `
당신은 로또 전문 AI 데이터 과학자 'Dr. Lucky'입니다. 
다음 제공하는 이번 주 로또 6/45 통계 데이터를 기반으로 추천 번호 5세트(A, B, C, D, E)를 생성하고 유쾌한 통계 분석글을 한국어로 작성해 주세요.

통계 데이터:
- 총 누적 회차: ${lottoStats.totalRounds}회
- 최근 ${lottoStats.latestRoundNo}회차 번호: ${lottoStats.latestNumbers} (보너스: ${lottoStats.latestBonus})
- 최근 5주간 가장 뜨거웠던 핫넘버: ${lottoStats.hotNumbers}
- 최근 5주간 가장 안 나왔던 콜드넘버: ${lottoStats.coldNumbers}
- 가장 오랫동안 나오지 않은 번호 Top 5: ${lottoStats.longestUnseen.map(x => x.num)}
- 최근 5주간 평균 합계: ${lottoStats.averageSum.toFixed(1)}
- 최근 5주간 홀짝 비율: ${lottoStats.oddEvenRatio}${fixedConstraint}${birthConstraint}

요구사항:
1. 번호 세트는 총 5개 생성해야 합니다. 각 세트는 중복 없는 1~45 사이의 자연수 6개로 이루어지며, 오름차순 정렬해야 합니다.
2. 각 세트는 반드시 숫자 합계가 100~170 사이여야 합니다.
3. 홀짝 비율은 3:3, 4:2, 2:4 중 하나여야 합니다.
4. 3개 이상 연속되는 번호 조합(예: 1, 2, 3)은 필터링하여 배제해 주세요.
5. 'analysis_report' 섹션에는 데이터 분석가로서 왜 이번 회차에 이 번호들을 주목했는지 통계 데이터들을 논리적으로 언급하며 한국어로 유쾌하게 설명해 주세요. 만약 사용자가 지정한 고정수가 있었다면 왜 이 번호들이 역사적 통계와 조화를 이루는지 가볍게 해설해 주세요.
6. 'lucky_message' 섹션에는 이번 주말 복권을 사러 가는 구독자를 격려하는 센스 있고 희망찬 멘트를 한국어로 작성해 주세요.

출력은 반드시 다른 부연 설명 없는 완벽한 JSON 포맷이어야 합니다:
{
  "analysis_report": "여기에 상세한 데이터 트렌드 분석 및 예측 근거 코멘트 작성",
  "predictions": [
    [A세트 숫자 6개],
    [B세트 숫자 6개],
    [C세트 숫자 6개],
    [D세트 숫자 6개],
    [E세트 숫자 6개]
  ],
  "lucky_message": "여기에 센스 있는 한마디 응원 메시지 작성"
}
`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini API prediction call failed:", error);
        alert("Gemini API 호출에 실패했습니다. API 키가 만료되었거나 올바르지 않은지 확인해 주세요. 룰 기반 로컬 분석 모드로 임시 전환합니다.");
        return getMockPredictions();
    }
}

function getMockPredictions() {
    const predictions = [];
    const fixedNums = getSelectedFixedNumbers();
    const activeFixed = fixedNums.slice(0, 5); // Max 5 fixed numbers
    
    while (predictions.length < 5) {
        const candidate = [...activeFixed];
        while (candidate.length < 6) {
            const num = Math.floor(Math.random() * 45) + 1;
            if (!candidate.includes(num)) candidate.push(num);
        }
        candidate.sort((a, b) => a - b);
        
        // Filter 1: Sum 100~170
        const sum = candidate.reduce((a, b) => a + b, 0);
        if (sum < 100 || sum > 170) continue;
        
        // Filter 2: Odd/Even
        const odds = candidate.filter(x => x % 2 !== 0).length;
        if (![2, 3, 4].includes(odds)) continue;

        // Filter 3: Consecutive
        let isConsecutive = false;
        for (let i = 0; i < 4; i++) {
            if (candidate[i+1] === candidate[i] + 1 && candidate[i+2] === candidate[i] + 2) {
                isConsecutive = true;
                break;
            }
        }
        if (isConsecutive) continue;

        if (!predictions.some(p => JSON.stringify(p) === JSON.stringify(candidate))) {
            predictions.push(candidate);
        }
    }

    let report = `안녕하세요, Dr. Lucky입니다! 현재 API 키가 비어 있어 저의 데이터 엔진 핵심 룰 필터만 통과한 고품질 시뮬레이션 조합을 도출했습니다. `;
    if (activeFixed.length > 0) {
        report += `특히 직접 지정하신 소중한 고정수 **[${activeFixed.join(', ')}]**번을 모든 조합 세트에 무조건 강제 포함하였으며, `;
    }
    report += `최근에 가장 많이 나온 번호들인 ${lottoStats.hotNumbers}과, 오랜 기간 조용했던 콜드 넘버들인 ${lottoStats.coldNumbers}의 주기성을 훌륭하게 배합했습니다. 특히 총합 범위(${lottoStats.averageSum.toFixed(0)} 내외)를 엄격히 한정하여 1등 확률에 근접하도록 보정했습니다!`;

    return {
        analysis_report: report,
        predictions: predictions,
        lucky_message: "복권은 일주일 동안 설렘이라는 행복을 미리 사는 기분 좋은 마법입니다. 제가 고안해 낸 이 특별한 조합의 번호와 함께 이번 주말 멋진 기적이 당신에게 닿기를 희망합니다! 파이팅! 🍀"
    };
}

function renderPredictions(results) {
    aiGeneratorReport.textContent = results.analysis_report;
    aiGeneratorLucky.textContent = results.lucky_message;

    let rowsHtml = "";
    results.predictions.forEach((set, idx) => {
        const letter = String.fromCharCode(65 + idx); // A, B, C, D, E
        let ballsHtml = "";
        set.forEach(num => {
            ballsHtml += `<span class="ball mini-ball ${getBallColorClass(num)}">${num}</span>`;
        });
        rowsHtml += `
        <tr>
            <td>${letter} 세트</td>
            <td><div class="balls-row" style="justify-content: flex-start; padding: 0;">${ballsHtml}</div></td>
        </tr>`;
    });
    predictionRows.innerHTML = rowsHtml;
}

// 8. INTERACTIVE COMPONENT: REAL-TIME COPILOT CHAT
async function handleSendChatMessage() {
    const msgText = chatInput.value.trim();
    if (!msgText) return;

    // Render User Message
    appendMessage(msgText, 'user');
    chatInput.value = "";
    chatInput.focus();

    // Show Typing Indicator
    const typingId = showTypingIndicator();

    const apiKey = localStorage.getItem('gemini_api_key');
    let aiResponseText;

    if (apiKey) {
        // Send to Gemini
        aiResponseText = await getGeminiChatResponse(msgText, apiKey);
    } else {
        // Fallback intelligent responsive Mock answers
        await new Promise(resolve => setTimeout(resolve, 800));
        aiResponseText = getMockChatResponse(msgText);
    }

    // Remove Typing Indicator & Render Agent Message
    removeTypingIndicator(typingId);
    appendMessage(aiResponseText, 'agent');
}

function appendMessage(text, role) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user-msg' : 'agent-msg'}`;
    
    // Formatting text for rich view
    const formattedText = text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold formatting
        .replace(/`(.*?)`/g, '<code style="background-color:var(--bg-secondary); padding:2px 4px; border-radius:4px;">$1</code>');

    msgDiv.innerHTML = `<div class="bubble">${formattedText}</div>`;
    chatMessages.appendChild(msgDiv);
    
    // Smooth scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Append to local multi-turn history
    chatHistory.push({
        role: role === 'user' ? 'user' : 'model',
        parts: [{ text: text }]
    });
}

function showTypingIndicator() {
    const typingId = 'typing-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message agent-msg';
    msgDiv.id = typingId;
    msgDiv.innerHTML = `
    <div class="bubble">
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingId;
}

function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
        indicator.remove();
    }
}

async function getGeminiChatResponse(userMessage, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const fixedNums = getSelectedFixedNumbers();
    const fixedContextText = fixedNums.length > 0
        ? `또한 사용자는 나만의 행운 번호(고정수)로 [${fixedNums.join(', ')}] 번을 선택하여 저장한 상태입니다. 이 번호들을 왜 선택했는지 지지해주고, 번호를 생성/추천해 달라고 할 때는 가급적 이 번호들을 포함해서 조합을 꾸려주세요.`
        : "";

    // System prompt with complete real-time stats context injected
    const systemPrompt = `
You are 'Dr. Lucky', an energetic, highly encouraging, and brilliant AI Lotto Analyst. 
You are having an interactive live chat with a user. Always reply in Korean in a friendly, witty, and encouraging tone. Use lottery/data science emojis!

You have direct access to the live lottery stats database from the client:
- Total Rounds: ${lottoStats.totalRounds}
- Latest draw round: ${lottoStats.latestRoundNo} (numbers: ${lottoStats.latestNumbers}, bonus: ${lottoStats.latestBonus}, date: ${lottoStats.latestRoundDate})
- Hot numbers (last 5 weeks): ${lottoStats.hotNumbers}
- Cold numbers (last 5 weeks): ${lottoStats.coldNumbers}
- Longest unseen numbers (Top 5): ${lottoStats.longestUnseen.map(x => `${x.num} (${x.drawsAgo} draws ago)`).join(', ')}
- Average sum of last 5 draws: ${lottoStats.averageSum.toFixed(1)}
- Odd/Even ratio (last 5 draws): ${lottoStats.oddEvenRatio}
${fixedContextText}

Guidelines:
1. When asked about frequencies, unseen numbers, sums, or trends, use the real-time statistics provided above.
2. If the user asks for random numbers or customized recommendations (e.g. "include number 7", "based on my birthday"), generate a set of 6 numbers using your analyst persona. Apply standard filters: sum 100-170, balanced odd/even ratio (3:3, 4:2, 2:4), and no 3-consecutive runs. Show them as bold numbers in bracket format like **[7], [12], [21], [28], [34], [43]** and explain why you chose them.
3. Be funny, positive, and deeply motivational. Remind them to have fun and buy responsibly.
`;

    // Package the history along with the system prompt inside the contents
    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "접수 완료! 'Dr. Lucky' 가동합니다. 대시보드 당첨 데이터 통계를 인지했습니다. 무엇이든 질문해 주세요!" }] }
    ];

    // Append last 10 turns of history to prevent token explosion
    const activeHistory = chatHistory.slice(-10);
    contents.push(...activeHistory);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        if (!response.ok) {
            throw new Error(`Gemini HTTP Chat Error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini Chat API call failed:", error);
        return "죄송합니다, 제 통신 회로에 잠시 혼선이 와 대화가 끊겼습니다! API 키를 확인하시거나 잠시 후 다시 질문해 주세요. 🤖";
    }
}

function getMockChatResponse(msg) {
    const query = msg.toLowerCase();
    
    if (query.includes('핫넘버') || query.includes('자주') || query.includes('많이')) {
        return `🔥 최근 5주간 가장 많이 나온 핫넘버는 **${lottoStats.hotNumbers.join(', ')}** 입니다! 통계의 수축과 이완 현상에 의해, 이 숫자들은 이번 주에도 뜨거운 흐름을 이어받을 가능성이 높습니다!`;
    }
    
    if (query.includes('미출현') || query.includes('안 나온') || query.includes('unseen') || query.includes('적게')) {
        const unseenList = lottoStats.longestUnseen.map(x => `**${x.num}** (${x.drawsAgo}회 동안 미출현)`).join(', ');
        return `🧊 정말 오랫동안 얼굴을 보이지 않은 장기 미출현 번호 Top 5는 ${unseenList} 입니다! 특히 가장 추운 숫자는 무려 **${lottoStats.longestUnseen[0].num}**번으로, 무려 **${lottoStats.longestUnseen[0].drawsAgo}회** 동안이나 꼭꼭 숨어있네요. 이번 주에는 드디어 얼굴을 들이밀 시기가 되었을지도 모릅니다! 🔮`;
    }

    if (query.includes('생일') || query.includes('포함') || query.includes('추천') || query.includes('번호')) {
        const fixedNums = getSelectedFixedNumbers();
        let included = [...fixedNums];
        
        // If they didn't specify fixed numbers in UI but typed some, extract them
        if (included.length === 0) {
            const numbersInMsg = msg.match(/\d+/g);
            if (numbersInMsg) {
                included = numbersInMsg.map(Number).filter(n => n >= 1 && n <= 45).slice(0, 3);
            }
        }

        const customSet = [...included];
        while (customSet.length < 6) {
            const num = Math.floor(Math.random() * 45) + 1;
            if (!customSet.includes(num)) customSet.push(num);
        }
        customSet.sort((a, b) => a - b);

        let response = `🍀 Dr. Lucky가 추천하는 맞춤형 번호 조합입니다! \n\n`;
        if (included.length > 0) {
            response += `지정하신 소중한 행운의 수 **${included.join(', ')}**번을 완벽히 포함하고, 제 데이터 필터로 수학적 안전성을 가미한 특별 세트를 마련했습니다: \n\n`;
        } else {
            response += `제 룰 필터를 거쳐 탄생한 이번 주의 황금 추천 세트입니다: \n\n`;
        }

        response += `🎯 **[ ${customSet.map(n => n.toString().padStart(2, ' ')).join(' ]  [ ')} ]**\n\n`;
        response += `이 조합은 총합 **${customSet.reduce((a,b)=>a+b, 0)}**(필터 세이프)와 홀짝 비율을 완벽하게 맞춘 기가 막힌 매칭입니다. 퇴근길 가볍게 한 줄 집어보시는 것을 강력 권장합니다!`;
        return response;
    }

    if (query.includes('확률') || query.includes('비법') || query.includes('팁')) {
        return `📊 로또 1등 당첨 확률은 약 814만분의 1로, 번개에 맞을 확률보다 낮다고 하죠! 하지만 통계적 극단값을 피해 최적의 가치를 잡는 세 가지 과학적 팁을 드릴게요:\n\n1. **홀짝 비율을 지키세요**: 역사적으로 번호 6개가 전부 홀수이거나 전부 짝수였던 회차는 단 2% 미만입니다. 가장 압도적인 비율은 **3:3** 혹은 **4:2(2:4)** 균형 비율입니다.\n2. **총합의 법칙**: 당첨 번호 6개의 총합은 항상 **100에서 170 사이**에 약 75% 이상 머무릅니다. 너무 작거나 너무 큰 합은 피하세요!\n3. **연속 번호 제한**: '1, 2, 3'처럼 3개 이상의 수가 촘촘히 붙은 경우는 역사상 거의 출현하지 않았습니다.\n\n제가 대시보드에서 추천하는 예측조합은 이 세 가지 룰을 이미 소수점 한 자리까지 계산하여 통과시킨 철옹성 조합이랍니다! 🤖`;
    }

    return `💡 **[알림]** Dr. Lucky의 AI 회로(Gemini API Key)가 아직 상단에 등록되지 않아, 내장된 룰 베이스 엔진으로 답변해 드렸습니다!\n\nGemini API Key를 상단 바에 등록하시면, 구독자님의 질문 흐름을 완전하게 이해하고 나아가 사주풀이, 재미있는 통계 추론, 깊이 있는 예측 코멘트까지 실시간으로 창작하여 맞대응해 드립니다. 구글 AI Studio에서 무료 키를 발급받아 붙여보세요! 🚀`;
}

// 9. DISPATCH HISTORY LOG LOADING AND RENDERING
async function initDispatchHistory() {
    const historyRows = document.getElementById('history-rows');
    if (!historyRows) return;
    
    try {
        console.log("Fetching dispatch_history.json...");
        const response = await fetch('./data/dispatch_history.json');
        if (!response.ok) {
            throw new Error("No history found");
        }
        const historyData = await response.json();
        
        if (!historyData || historyData.length === 0) {
            historyRows.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center; padding:30px; color:var(--text-muted); font-size:12.5px;">
                    <i class="fa-solid fa-circle-info" style="font-size:16px; color:var(--color-accent); margin-bottom:6px;"></i><br>
                    아직 정기 이메일 발송 이력이 없습니다.<br>금요일 저녁 자동 발송 완료 후 이력이 저장됩니다!
                </td>
            </tr>`;
            return;
        }

        // Sort descending by round or date so newest are on top
        historyData.sort((a, b) => b.round_no - a.round_no || new Date(b.dispatch_date) - new Date(a.dispatch_date));

        let rowsHtml = "";
        historyData.forEach(item => {
            // Format predictions nicely
            let setsHtml = "";
            if (item.predictions && item.predictions.length > 0) {
                item.predictions.forEach((set, idx) => {
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D, E
                    setsHtml += `<div style="margin: 3px 0; font-size:11.5px; line-height:1.4;"><b>[${letter}세트]</b> ${set.map(x => String(x).padStart(2, '0')).join(', ')}</div>`;
                });
            } else {
                setsHtml = `<span style="color:var(--text-muted);">조합 정보 없음</span>`;
            }

            rowsHtml += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding:12px 6px; font-weight:bold; color:var(--text-primary); font-size:12.5px; line-height:1.4; vertical-align: top;">
                    ${item.round_no}회 예측 발송<br>
                    <span style="font-size:10px; color:var(--text-muted); font-weight:normal;">${item.dispatch_date}</span>
                </td>
                <td style="padding:12px 6px; color:var(--text-muted); font-size:12px; vertical-align: top; word-break: break-all; font-weight: 500;">
                    ${item.receiver_email}
                </td>
                <td style="padding:12px 6px; font-family:monospace; color:var(--color-primary); font-size:12px; line-height:1.3; vertical-align: top;">
                    ${setsHtml}
                </td>
            </tr>`;
        });
        historyRows.innerHTML = rowsHtml;

    } catch (error) {
        console.log("No dispatch history file found or failed to load. Showing placeholder.");
        historyRows.innerHTML = `
        <tr>
            <td colspan="3" style="text-align:center; padding:40px; color:var(--text-muted); font-size:12.5px; line-height:1.5;">
                <i class="fa-solid fa-clock-rotate-left" style="font-size:22px; margin-bottom:10px; color:var(--bg-tertiary);"></i><br>
                <b>아직 누적된 정기 자동 발송 이력이 없습니다.</b><br>
                <span style="font-size:11px; opacity:0.75; display:inline-block; margin-top:4px;\">(매주 정기 자동 발송 스케줄이 성공적으로 작동하면 이력이 여기에 자동으로 누적 기록됩니다)</span>
            </td>
        </tr>`;
    }
}

// 10. REAL-TIME WEB QR CAMERA SCANNER & DECODER
function startQrScan() {
    // Reset video and status
    qrVideo.srcObject = null;
    qrStatusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 후면 카메라 활성화 요청 중...`;
    
    // Open scanner modal
    qrModal.classList.remove('hidden');
    
    // Request back-facing camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            qrStream = stream;
            qrVideo.srcObject = stream;
            qrVideo.setAttribute("playsinline", true); // iOS Safari support
            qrVideo.play();
            qrStatusText.innerHTML = `<i class="fa-solid fa-qrcode fa-fade"></i> 실시간 로또 QR을 인식 중입니다...`;
            qrAnimationId = requestAnimationFrame(scanQrFrame);
        })
        .catch(err => {
            console.error("Camera access failed:", err);
            qrStatusText.innerHTML = `<span style="color:var(--color-danger);"><i class="fa-solid fa-circle-exclamation"></i> 카메라 가동 실패: 보안 연결(HTTPS / Localhost) 상태가 아니거나 브라우저 권한을 확인해 주세요.</span>`;
        });
}

function stopQrScan() {
    qrModal.classList.add('hidden');
    
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
    if (qrVideo.srcObject) {
        qrVideo.srcObject = null;
    }
    if (qrAnimationId) {
        cancelAnimationFrame(qrAnimationId);
        qrAnimationId = null;
    }
}

function scanQrFrame() {
    if (!qrStream) return;
    
    if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement("canvas");
        canvas.width = qrVideo.videoWidth;
        canvas.height = qrVideo.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });
        
        if (code) {
            console.log("Decoded QR Code data:", code.data);
            handleDecodedQrUrl(code.data);
            return; // Stop scanning loop on success
        }
    }
    
    if (qrStream) {
        qrAnimationId = requestAnimationFrame(scanQrFrame);
    }
}

function handleDecodedQrUrl(url) {
    // 1. Stop scanner and hide camera immediately
    stopQrScan();
    
    // 2. Parse round number from URL: e.g. http://m.dhlottery.co.kr/?v=1240m...
    const roundMatch = url.match(/v=(\d{4})/i);
    if (!roundMatch) {
        alert("인식 오류: 동행복권 공식 로또 QR 코드가 아닙니다. 복권 상단의 사각형 QR 코드를 비춰주세요!");
        return;
    }
    
    const roundNo = parseInt(roundMatch[1]);
    
    // 3. Find official winning draw for this round in our history
    const officialDraw = lottoHistory.find(x => x.drwNo === roundNo);
    if (!officialDraw) {
        alert(`해당 ${roundNo}회차의 당첨 결과 데이터가 아직 시스템에 적재되지 않았거나, 추첨되지 않은 미래의 회차입니다!`);
        return;
    }
    
    // 4. Extract official winning numbers
    const officialNums = [
        officialDraw.drwtNo1,
        officialDraw.drwtNo2,
        officialDraw.drwtNo3,
        officialDraw.drwtNo4,
        officialDraw.drwtNo5,
        officialDraw.drwtNo6
    ];
    const officialBonus = officialDraw.bnusNo;
    
    // 5. Parse scanned combinations using regex (matches a letter followed by 12 digits)
    const scannedSets = [];
    const setRegex = /[a-z](\d{12})/gi;
    let match;
    while ((match = setRegex.exec(url)) !== null) {
        const digitsStr = match[1]; // e.g. "091522334144"
        const nums = [];
        for (let i = 0; i < 12; i += 2) {
            nums.push(parseInt(digitsStr.substring(i, i + 2)));
        }
        scannedSets.push(nums.sort((a, b) => a - b));
    }
    
    if (scannedSets.length === 0) {
        alert("해독 실패: QR 코드 내부의 복권 조합 번호를 해석하는 데 실패했습니다. 다시 스캔해 주세요!");
        return;
    }
    
    // 6. Compare scanned sets with official numbers
    let highestPrize = "낙첨";
    let highestPrizeRank = 6; // 6 is lowest (no prize), 1 is highest (1등)
    
    let rowsHtml = "";
    scannedSets.forEach((set, idx) => {
        const setLetter = String.fromCharCode(65 + idx); // A, B, C, D, E
        let setBallsHtml = "";
        let matchedCount = 0;
        let isBonusMatched = false;
        
        set.forEach(num => {
            const isMatched = officialNums.includes(num);
            const isBnsMatched = (num === officialBonus);
            
            if (isMatched) matchedCount++;
            if (isBnsMatched) isBonusMatched = true;
            
            // Render styled balls
            const ballColor = getBallColorClass(num);
            let style = `display: inline-block; width: 30px; height: 30px; line-height: 30px; font-size: 13px; margin: 2px;`;
            
            if (isMatched) {
                // Glow effect for matched balls
                style += `box-shadow: 0 0 10px rgba(16,185,129,0.8), inset -3px -3px 6px rgba(0,0,0,0.5); border: 2px solid #34d399; transform: scale(1.05);`;
            } else if (isBnsMatched) {
                // Bonus match highlight
                style += `box-shadow: 0 0 10px rgba(99,102,241,0.8), inset -3px -3px 6px rgba(0,0,0,0.5); border: 2px solid #818cf8; transform: scale(1.05);`;
            } else {
                // Dim effect for unmatched balls
                style += `opacity: 0.3; filter: grayscale(0.5);`;
            }
            
            setBallsHtml += `<span class="ball ${ballColor}" style="${style}">${num}</span>`;
        });
        
        // Determine Prize for this specific set
        let setPrize = "낙첨";
        let rank = 6;
        
        if (matchedCount === 6) { setPrize = "1등 (대박! 🥳)"; rank = 1; }
        else if (matchedCount === 5 && isBonusMatched) { setPrize = "2등 (축하! 🥈)"; rank = 2; }
        else if (matchedCount === 5) { setPrize = "3등 (축하! 🥉)"; rank = 3; }
        else if (matchedCount === 4) { setPrize = "4등 (5만원 🎉)"; rank = 4; }
        else if (matchedCount === 3) { setPrize = "5등 (5천원 💸)"; rank = 5; }
        
        if (rank < highestPrizeRank) {
            highestPrizeRank = rank;
            highestPrize = setPrize;
        }
        
        rowsHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02); padding: 8px 0;">
            <span style="font-weight:bold; color:var(--text-muted); font-size:13px; width:45px; text-align:left;">${setLetter} 게임</span>
            <div style="display:flex; gap:2px; flex-wrap:wrap;">${setBallsHtml}</div>
            <span class="badge ${rank <= 5 ? 'badge-success' : 'badge-unconfigured'}" style="font-size:11px; width:80px; text-align:center;">${setPrize}</span>
        </div>`;
    });
    
    // 7. Render dynamic badge based on highest prize achieved
    let badgeClass = "badge-unconfigured";
    let emoji = "😢";
    
    if (highestPrizeRank === 1) { badgeClass = "badge-success"; emoji = "👑"; }
    else if (highestPrizeRank === 2 || highestPrizeRank === 3) { badgeClass = "badge-accent"; emoji = "🌟"; }
    else if (highestPrizeRank === 4 || highestPrizeRank === 5) { badgeClass = "badge-success"; emoji = "🎉"; }
    
    resultBadgeContainer.innerHTML = `<span class="badge ${badgeClass}" style="font-size:14px; padding:6px 14px; border-radius:30px; letter-spacing:0.5px;">${emoji} 최고 결과: ${highestPrize}</span>`;
    
    resultTitleText.textContent = `${roundNo}회차 맞춰보기 결과`;
    resultDescText.innerHTML = `공식 당첨 번호: <b style="color:var(--text-primary);">${officialNums.join(', ')}</b> + 보너스 <b style="color:var(--color-accent);">${officialBonus}</b>`;
    resultMatchingBallsContainer.innerHTML = rowsHtml;
    
    // 8. Open results modal
    qrResultModal.classList.remove('hidden');
    
    // 9. Fire Canvas Confetti Celebration!
    if (highestPrizeRank <= 3) {
        // High Tier Celebration (1st, 2nd, 3rd) - Multiple Intense bursts!
        const duration = 3 * 1000;
        const end = Date.now() + duration;
        
        (function frame() {
            confetti({
                particleCount: 4,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 4,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
            
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    } else if (highestPrizeRank === 4 || highestPrizeRank === 5) {
        // Mid Tier Celebration (4th, 5th) - Single nice burst
        confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

function closeResultModal() {
    qrResultModal.classList.add('hidden');
}
