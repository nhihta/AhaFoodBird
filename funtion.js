
(() => {
    const cvs = document.getElementById('game');
    const ctx = cvs.getContext('2d');
    const scoreEl = document.getElementById('score');
    const centerUI = document.getElementById('centerUI');
    const startBtn = document.getElementById('startBtn');
    const statsEl = document.getElementById('stats');
    const logoImg = new Image();
    logoImg.src = "logo.png"; // thay bằng tên file logo của bạn

    const birdImg = new Image();
    birdImg.src = "AhaBird.png"; // tên file ảnh của bạn

    // Logical game size (we will scale with DPR)
    let W = 360, H = 640;
    function fitCanvas() {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        cvs.width = W * dpr;
        cvs.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fitCanvas();
    addEventListener('resize', fitCanvas);

    // Game state
    const STATE = { READY: 0, PLAYING: 1, OVER: 2 };
    let state = STATE.READY;

    // Bird physics
    const bird = {
        x: W * 0.28,
        y: H * 0.5,
        r: 14,
        vy: 0,
        gravity: 0.45,
        flap: -7.0,
        rot: 0
    };

    // Pipes
    let pipes = [];
    const pipeGapMin = 120, pipeGapMax = 150;
    const pipeW = 56;
    let pipeSpeed = 2.3;
    let pipeEvery = 90; // frames
    let frame = 0;

    // Score
    let score = 0;
    let best = Number(localStorage.getItem('flappy_best') || 0);

    // Simple SFX (beeps) using WebAudio (tiny & offline)
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let ac;
    function beep(freq = 600, dur = 0.1, type = 'square', vol = 0.1) {
        try {
            if (!ac) ac = new AudioCtx();
            const o = ac.createOscillator();
            const g = ac.createGain();
            o.type = type; o.frequency.value = freq;
            g.gain.value = vol;
            o.connect(g); g.connect(ac.destination);
            o.start();
            o.stop(ac.currentTime + dur);
        } catch (e) { }
    }

// logo
    function drawHUD() {
  if (logoImg.complete) {
    const logoW = 120;
    const logoH = 40;
    ctx.drawImage(logoImg, W - logoW - 10, 10, logoW, logoH);
  }
}

// Vẽ điểm trực tiếp lên canvas
function drawScore() {
    ctx.fillStyle = "#ffffffff";        // màu chữ (có thể đổi sang trắng, vàng, đỏ...)
    ctx.font = "bold 28px Arial";  // font chữ
    ctx.textAlign = "center";      // canh giữa
    ctx.fillText(score, W / 2, 50); // vẽ điểm ở giữa màn hình, cách trên 50px
}


    function resetGame() {
        bird.y = H * 0.45;
        bird.vy = 0;
        bird.rot = 0;
        pipes = [];
        score = 0;
        frame = 0;
        pipeSpeed = 2.3;
        scoreEl.textContent = '0';
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function addPipe() {
        const gap = rand(pipeGapMin, pipeGapMax);
        const topH = rand(60, H - 200);
        const bottomY = topH + gap;
        pipes.push({
            x: W + pipeW,
            top: topH,
            bottomY: bottomY,
            passed: false
        });
    }

    function flap() {
        if (state === STATE.PLAYING) {
            bird.vy = bird.flap;
            beep(700, .07, 'square', .07);
        } else if (state === STATE.READY) {
            startGame();
        } else if (state === STATE.OVER) {
            // ignore
        }
    }

    function startGame() {
        document.getElementById('cta-message').style.display = 'none';
        document.getElementById('storeBtn').style.display = 'none';
        state = STATE.PLAYING;
        centerUI.style.display = 'none';
        resetGame();
    }

function gameOver(){
    document.getElementById('cta-message').style.display = 'block'; // Hiện CTA
    document.getElementById('tips').style.display = 'none'; // Ẩn tips

  document.getElementById('storeBtn').style.display = 'inline-block';
  state = STATE.OVER;
  best = Math.max(best, score);
  localStorage.setItem('flappy_best', best);


  startBtn.textContent = 'Chơi lại';
  centerUI.style.display = 'block';
  beep(180, .15, 'sawtooth', .06);
  beep(120, .20, 'sawtooth', .06);
}


    // Controls
    addEventListener('touchstart', e => {
        if (centerUI.style.display !== 'none' && centerUI.contains(e.target)) return; // để UI nhận click
        e.preventDefault();
        flap();
    }, { passive: false });

    addEventListener('mousedown', flap);
    addEventListener('keydown', e => {
        if (e.code === 'Space') { e.preventDefault(); flap(); }
        if (e.code === 'Enter' && state !== STATE.PLAYING) startGame();
    });
    startBtn.addEventListener('click', () => {
        if (state !== STATE.PLAYING) startGame();
    });

    // GẮN 1 LẦN DUY NHẤT, đặt ngay sau đoạn trên:
    const storeBtn = document.getElementById('storeBtn');
    storeBtn.addEventListener('click', () => {
        window.open('https://bit.ly/game_ahabird', '_blank'); // xem mục 2 bên dưới
    });


    function drawBackground() {


        // sky
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#88d7ff');
        g.addColorStop(1, '#e6f7ff');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        // ground line
        ctx.fillStyle = '#77c26b';
        ctx.fillRect(0, H - 40, W, 40);
        ctx.fillStyle = '#5aa64f';
        ctx.fillRect(0, H - 36, W, 4);
    }

    function drawBird() {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.rot);

        // Kích thước vẽ ảnh (có thể chỉnh scale nếu to/nhỏ quá)
        const size = bird.r * 4.5; // 4.5 = scale, chỉnh số này để phóng to/thu nhỏ
        ctx.drawImage(birdImg, -size / 2, -size / 2, size, size);

        ctx.restore();
    }

    function drawPipes() {
        ctx.fillStyle = '#4ec04e';
        ctx.strokeStyle = '#2d8f2d';
        ctx.lineWidth = 4;
        pipes.forEach(p => {
            // top pipe
            ctx.fillRect(p.x, 0, pipeW, p.top);
            ctx.strokeRect(p.x, 0, pipeW, p.top);
            // bottom pipe
            const bh = H - p.bottomY - 40;
            ctx.fillRect(p.x, p.bottomY, pipeW, bh);
            ctx.strokeRect(p.x, p.bottomY, pipeW, bh);

            // caps
            ctx.fillRect(p.x - 3, p.top - 12, pipeW + 6, 12);
            ctx.fillRect(p.x - 3, p.bottomY, pipeW + 6, 12);
        });
    }

    function collide() {
        // ground
        if (bird.y + bird.r >= H - 40) return true;
        if (bird.y - bird.r <= 0) return true;

        // with pipes (AABB vs circle simple check)
        for (const p of pipes) {
            const inX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + pipeW;
            if (inX) {
                if (bird.y - bird.r < p.top || bird.y + bird.r > p.bottomY) {
                    return true;
                }
            }
        }
        return false;
    }

    function update() {
        frame++;

        if (state === STATE.PLAYING) {
            // physics
            bird.vy += bird.gravity;
            bird.y += bird.vy;
            bird.rot = Math.max(-0.6, Math.min(0.9, (bird.vy / 10)));

            // pipes
            if (frame % pipeEvery === 0) addPipe();
            pipes.forEach(p => p.x -= pipeSpeed);
            // remove offscreen
            pipes = pipes.filter(p => p.x + pipeW > -10);

            // scoring
            pipes.forEach(p => {
                if (!p.passed && p.x + pipeW < bird.x) {
                    p.passed = true;
                    score++;
                    // scoreEl.textContent = score;
                    beep(900, .06, 'square', .05);
                    // slight difficulty ramp
                    if (score % 5 === 0) {
                        pipeSpeed += 0.15;
                        if (pipeEvery > 70) pipeEvery -= 2;
                    }
                }
            });

            if (collide()) {
                gameOver();
            }
        }
    }

    function render() {
        drawBackground();
        drawPipes();
        drawBird();
        drawHUD(); 
        drawScore();
    }

    // Main loop
    function loop() {
        update();
        render();
        requestAnimationFrame(loop);
    }
    loop();


    // Pause audio context when tab hidden (battery friendly)
    document.addEventListener('visibilitychange', () => {
        if (!ac) return;
        if (document.hidden) ac.suspend(); else ac.resume();
    });
})();


