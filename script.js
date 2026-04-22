const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const fireworksCanvas = document.getElementById("fireworksCanvas");
const fctx = fireworksCanvas.getContext("2d");

const startOverlay = document.getElementById("startOverlay");
const loseOverlay = document.getElementById("loseOverlay");
const winOverlay = document.getElementById("winOverlay");

const girlHead = new Image();
girlHead.src = "assets/girl-head.png";

const boyHead = new Image();
boyHead.src = "assets/boy-head.png";

const GROUND_Y = 340;
const GRAVITY = 0.75;
const JUMP_POWER = -13.5;
const WORLD_WIDTH = 2600;

let gameState = "start";
let cameraX = 0;
let stars = [];
let obstacles = [];
let moon = { x: 770, y: 80, r: 36 };
let hearts = [];
let fireworksRunning = false;

const player = {
  x: 120,
  y: GROUND_Y - 110,
  w: 62,
  h: 110,
  vx: 0,
  vy: 0,
  speed: 4.2,
  onGround: true,
  legPhase: 0
};

const boy = {
  x: WORLD_WIDTH - 180,
  y: GROUND_Y - 110,
  w: 62,
  h: 110
};

function resizeFireworksCanvas() {
  fireworksCanvas.width = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeFireworksCanvas);
resizeFireworksCanvas();

function makeStars() {
  stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * 180,
      r: Math.random() * 2 + 0.5
    });
  }
}

function makeObstacles() {
  obstacles = [
    { x: 620,  y: GROUND_Y - 28, w: 24, h: 28 },
    { x: 940,  y: GROUND_Y - 36, w: 28, h: 36 },
    { x: 1320, y: GROUND_Y - 24, w: 22, h: 24 },
    { x: 1710, y: GROUND_Y - 34, w: 26, h: 34 },
    { x: 2060, y: GROUND_Y - 30, w: 25, h: 30 }
  ];
}

function resetGame() {
  player.x = 120;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.legPhase = 0;
  cameraX = 0;
  hearts = [];
  stopFireworks();
  gameState = "start";
  showOnly(startOverlay);
}

function restartFromLose() {
  player.x = 120;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.legPhase = 0;
  cameraX = 0;
  hearts = [];
  stopFireworks();
  gameState = "running";
  hideAllOverlays();
}

function restartFromWin() {
  player.x = 120;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.legPhase = 0;
  cameraX = 0;
  hearts = [];
  stopFireworks();
  gameState = "running";
  hideAllOverlays();
}

function startGame() {
  gameState = "running";
  hideAllOverlays();
}

function showOnly(el) {
  startOverlay.classList.add("hidden");
  loseOverlay.classList.add("hidden");
  el.classList.remove("hidden");
}

function hideAllOverlays() {
  startOverlay.classList.add("hidden");
  loseOverlay.classList.add("hidden");
  winOverlay.classList.add("hidden");
}

function rectsCollide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function drawNightSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#081227");
  grad.addColorStop(0.6, "#162447");
  grad.addColorStop(1, "#31456b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const moonScreenX = moon.x - cameraX * 0.25;
  ctx.beginPath();
  ctx.arc(moonScreenX, moon.y, moon.r, 0, Math.PI * 2);
  ctx.fillStyle = "#fff3b0";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(moonScreenX + 10, moon.y - 7, moon.r * 0.85, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(8,18,39,0.35)";
  ctx.fill();

  ctx.fillStyle = "white";
  for (const s of stars) {
    const x = s.x - cameraX * 0.18;
    if (x < -5 || x > canvas.width + 5) continue;
    ctx.beginPath();
    ctx.arc(x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround() {
  ctx.fillStyle = "#2e6b3d";
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

  ctx.fillStyle = "#3f8b52";
  ctx.fillRect(0, GROUND_Y - 12, canvas.width, 12);

  for (let i = -50; i < canvas.width + 50; i += 36) {
    ctx.fillStyle = "#2d7d46";
    ctx.fillRect(i, GROUND_Y + 22, 18, 6);
  }
}

function drawObstacle(ob) {
  const x = ob.x - cameraX;

  ctx.fillStyle = "#ff5c8a";
  ctx.beginPath();
  ctx.moveTo(x + ob.w / 2, ob.y);
  ctx.bezierCurveTo(x + ob.w + 10, ob.y - 10, x + ob.w + 6, ob.y + ob.h / 2, x + ob.w / 2, ob.y + ob.h);
  ctx.bezierCurveTo(x - 6, ob.y + ob.h / 2, x - 10, ob.y - 10, x + ob.w / 2, ob.y);
  ctx.fill();
}

function drawLegs(x, y, phase, isGirl) {
  const swing = Math.sin(phase) * 9;
  const swing2 = Math.sin(phase + Math.PI) * 9;

  ctx.strokeStyle = isGirl ? "#f7d6d0" : "#d9d9d9";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x + 22, y + 74);
  ctx.lineTo(x + 18 + swing, y + 104);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 40, y + 74);
  ctx.lineTo(x + 44 + swing2, y + 104);
  ctx.stroke();
}

function drawCharacter(ch, headImg, isGirl = true, phase = 0) {
  const x = ch.x - cameraX;
  const y = ch.y;

  if (x < -120 || x > canvas.width + 120) return;

  drawLegs(x, y, phase, isGirl);

  if (isGirl) {
    ctx.fillStyle = "#ff6fae";
    ctx.beginPath();
    ctx.moveTo(x + 31, y + 28);
    ctx.lineTo(x + 10, y + 76);
    ctx.lineTo(x + 52, y + 76);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#f7d6d0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 45);
    ctx.lineTo(x - 2, y + 60);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 48, y + 45);
    ctx.lineTo(x + 64, y + 60);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#4da6ff";
    ctx.fillRect(x + 14, y + 28, 34, 46);

    ctx.strokeStyle = "#d9d9d9";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 42);
    ctx.lineTo(x - 2, y + 56);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 48, y + 42);
    ctx.lineTo(x + 64, y + 56);
    ctx.stroke();
  }

  if (headImg.complete && headImg.naturalWidth > 0) {
    ctx.drawImage(headImg, x - 14, y - 34, 90, 90);
  } else {
    ctx.fillStyle = "#f5d1b8";
    ctx.beginPath();
    ctx.arc(x + 31, y + 18, 19, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawProgress() {
  const progress = Math.min(1, player.x / (boy.x - 120));
  const barX = 24;
  const barY = 24;
  const barW = 240;
  const barH = 18;

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(barX, barY, barW, barH);

  ctx.fillStyle = "#ff7aa8";
  ctx.fillRect(barX, barY, barW * progress, barH);

  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.strokeRect(barX, barY, barW, barH);
}

function handleInput(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();

    if (gameState === "running" && player.onGround) {
      player.vy = JUMP_POWER;
      player.onGround = false;
    }
  }
}
window.addEventListener("keydown", handleInput);

startOverlay.addEventListener("click", () => {
  if (gameState === "start") startGame();
});

loseOverlay.addEventListener("click", () => {
  if (gameState === "lose") restartFromLose();
});

winOverlay.addEventListener("click", () => {
  if (gameState === "win") restartFromWin();
});

function createHeartExplosion() {
  const centerX = Math.random() * fireworksCanvas.width;
  const centerY = 80 + Math.random() * (fireworksCanvas.height * 0.55);

  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
    const speed = 1.5 + Math.random() * 2.8;

    hearts.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.3,
      size: 10 + Math.random() * 8,
      life: 80 + Math.random() * 25,
      maxLife: 100
    });
  }
}

function drawHeart(ctx, x, y, size, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ff4f88";
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(0, 0, -10, 0, -10, 8);
  ctx.bezierCurveTo(-10, 14, -4, 18, 0, 22);
  ctx.bezierCurveTo(4, 18, 10, 14, 10, 8);
  ctx.bezierCurveTo(10, 0, 0, 0, 0, 6);
  ctx.fill();
  ctx.restore();
}

function startFireworks() {
  fireworksRunning = true;
  fireworksCanvas.classList.remove("hidden");
}

function stopFireworks() {
  fireworksRunning = false;
  fireworksCanvas.classList.add("hidden");
  fctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
}

function updateFireworks() {
  if (!fireworksRunning) return;

  if (Math.random() < 0.09) {
    createHeartExplosion();
  }

  fctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.x += h.vx;
    h.y += h.vy;
    h.vy += 0.015;
    h.life -= 1;

    const alpha = Math.max(0, h.life / h.maxLife);
    drawHeart(fctx, h.x, h.y, h.size, alpha);

    if (h.life <= 0) {
      hearts.splice(i, 1);
    }
  }
}

function update() {
  if (gameState !== "running") return;

  player.x += player.speed;
  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y >= GROUND_Y - player.h) {
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  player.legPhase += 0.22;

  cameraX = player.x - 160;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > WORLD_WIDTH - canvas.width) {
    cameraX = WORLD_WIDTH - canvas.width;
  }

  const hitbox = {
    x: player.x + 12,
    y: player.y + 10,
    w: player.w - 24,
    h: player.h - 6
  };

  for (const ob of obstacles) {
    if (rectsCollide(hitbox, ob)) {
      gameState = "lose";
      showOnly(loseOverlay);
      return;
    }
  }

  if (player.x + player.w >= boy.x + 10) {
    gameState = "win";
    winOverlay.classList.remove("hidden");
    startFireworks();
  }
}

function draw() {
  drawNightSky();
  drawGround();

  for (const ob of obstacles) {
    drawObstacle(ob);
  }

  drawCharacter(boy, boyHead, false, 0);
  drawCharacter(player, girlHead, true, player.legPhase);
  drawProgress();
}

function loop() {
  update();
  draw();
  updateFireworks();
  requestAnimationFrame(loop);
}

makeStars();
makeObstacles();
resetGame();
loop();