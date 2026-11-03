git add .
git commit -m "feat: add PWA desktop install, bidirectional EN/KO translation, auto language detection, default normal mode, and smoother translation pipeline"

$token = (gh auth token).Trim()
git remote set-url origin "https://sasr10jade-dot:$token@github.com/sasr10jade-dot/lotto.git"
git push origin main
git remote set-url origin "https://github.com/sasr10jade-dot/lotto.git"
Write-Host "GitHub 동기화 완료!"
