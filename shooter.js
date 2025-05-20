const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Images
const bg = new Image();
bg.src = 'Images/background.png';

const playerImg = new Image();
playerImg.src = 'Images/spaceship.png';

const bulletImg = new Image();
bulletImg.src = 'Images/bullet.png';

const enemy1Img = new Image();
enemy1Img.src = 'Images/enemy1.png';

const enemy2Img = new Image();
enemy2Img.src = 'Images/enemy2.png';

// Sounds
const shootSound = new Audio('Sounds/shoot.wav');
const explosionSound = new Audio('Sounds/explosion.wav');
const respawnSound = new Audio('Sounds/respawn.wav');

// Volume support
function applyVolume() {
  let vol = localStorage.getItem('gw_soundVolume');
  if (vol === null) vol = '100'; // default 100%
  vol = parseInt(vol);
  if (isNaN(vol)) vol = 100;
  vol = Math.min(Math.max(vol, 0), 100);
  const v = vol / 100;

  shootSound.volume = v;
  explosionSound.volume = v;
  respawnSound.volume = v;
}
applyVolume();

window.addEventListener('storage', (e) => {
  if (e.key === 'gw_soundVolume') applyVolume();
});

// Game state
let player = {
  x: 370,
  y: 500,
  width: 60,
  height: 60,
  speed: 6,
  invincible: false,
  invincibilityTimer: 0,
};

let bullets = [];
let enemies = [];
let explosions = [];

let score = 0;
let lives = 3;
let level = 1;
let speedFactor = 1;
let gameRunning = true;
let keys = {};

// Shooting cooldown to prevent spam
let canShoot = true;
const shootCooldownFrames = 15; // about 250ms at 60fps
let shootCooldownCounter = 0;

// Explosion animation frames (1 to 9)
const explosionFrames = [];
for (let i = 1; i <= 9; i++) {
  const img = new Image();
  img.src = `Images/explosion${i}.png`;
  explosionFrames.push(img);
}

function spawnExplosion(x, y) {
  explosions.push({ x, y, frame: 0, frameDelay: 0 });
  explosionSound.currentTime = 0;
  explosionSound.play();
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ex.frameDelay++;
    if (ex.frameDelay > 4) {
      ex.frame++;
      ex.frameDelay = 0;
      if (ex.frame >= explosionFrames.length) {
        explosions.splice(i, 1);
      }
    }
  }
}

function spawnEnemy() {
  // Spawn probability scaled with speedFactor for pacing
  const type = Math.random() < 0.8 ? 1 : 2;
  const img = type === 1 ? enemy1Img : enemy2Img;
  const w = 50;
  const h = 50;
  const x = Math.random() * (canvas.width - w);
  const y = -h;
  const speed = type === 1 ? 3 * speedFactor : 2.1 * speedFactor;
  const health = type === 1 ? 1 : 2;
  enemies.push({ x, y, w, h, speed, img, type, health });
}

function shoot() {
  if (!gameRunning || !canShoot) return;

  bullets.push({ x: player.x + 23, y: player.y, w: 14, h: 30 });
  shootSound.currentTime = 0;
  shootSound.play();

  canShoot = false;
  shootCooldownCounter = 0;
}

function updateLevel() {
  // Adjust level and speedFactor based on score thresholds
  if (score >= 1000) level = 6;
  else if (score >= 750) level = 5;
  else if (score >= 500) level = 4;
  else if (score >= 300) level = 3;
  else if (score >= 150) level = 2;
  else level = 1;

  speedFactor = 1 + (level - 1) * 0.25;
}

function movePlayer() {
  // Handle invincibility timer & flicker effect
  if (player.invincible) {
    player.invincibilityTimer--;
    if (player.invincibilityTimer <= 0) {
      player.invincible = false;
    }
  }
  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
  if (keys['ArrowDown'] && player.y + player.height < canvas.height) player.y += player.speed;
}

function updateBullets() {
  bullets = bullets.filter(b => b.y > -b.h);
  bullets.forEach(b => b.y -= 8);
}

function updateEnemies() {
  enemies = enemies.filter(e => e.y < canvas.height + e.h);
  enemies.forEach(e => (e.y += e.speed));
}

function checkCollisions() {
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    // Bullets vs enemies
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (
        b.x < e.x + e.w &&
        b.x + b.w > e.x &&
        b.y < e.y + e.h &&
        b.y + b.h > e.y
      ) {
        bullets.splice(bi, 1);
        e.health--;
        if (e.health <= 0) {
          spawnExplosion(e.x, e.y);
          enemies.splice(ei, 1);
          score += 10;
          break;
        }
      }
    }
    // Player vs enemies
    if (
      !player.invincible &&
      player.x < e.x + e.w &&
      player.x + player.width > e.x &&
      player.y < e.y + e.h &&
      player.y + player.height > e.y
    ) {
      spawnExplosion(player.x, player.y);
      enemies.splice(ei, 1);
      lives--;
      player.invincible = true;
      player.invincibilityTimer = 120; // 2 seconds at 60fps
      respawnSound.currentTime = 0;
      respawnSound.play();
      if (lives <= 0) {
        gameRunning = false;
      }
    }
  }
}

function drawPlayer() {
  if (player.invincible) {
    // Flicker effect synced with CSS glow style: 5 frames visible, 5 invisible cycle
    if (Math.floor(player.invincibilityTimer / 5) % 2 === 0) {
      ctx.globalAlpha = 0.3;
      ctx.shadowColor = '#61dafb';
      ctx.shadowBlur = 15;
      ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      return;
    }
  }
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

function drawBullets() {
  bullets.forEach(b => ctx.drawImage(bulletImg, b.x, b.y, b.w, b.h));
}

function drawEnemies() {
  enemies.forEach(e => ctx.drawImage(e.img, e.x, e.y, e.w, e.h));
}

function drawHUD() {
  ctx.fillStyle = '#61dafb';
  ctx.font = '20px "Orbitron", sans-serif';
  ctx.textBaseline = 'top';

  ctx.shadowColor = '#61dafb';
  ctx.shadowBlur = 10;

  ctx.textAlign = 'left';
  ctx.fillText(`Lives: ${lives}`, 20, 20);

  ctx.textAlign = 'center';
  ctx.fillText(`Level: ${level}`, canvas.width / 2, 20);

  ctx.textAlign = 'right';
  ctx.fillText(`Score: ${score}`, canvas.width - 20, 20);

  ctx.shadowBlur = 0;
}

function drawBackground() {
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
}

let gameOverButtons = [];

let hoveredButtonIndex = -1; // Track which button is hovered

function drawGameOverPopup() {
  // Draw translucent popup background box (not full screen overlay)
  const popupWidth = 500;
  const popupHeight = 200;
  const popupX = (canvas.width - popupWidth) / 2;
  const popupY = (canvas.height - popupHeight) / 2;

  // Neon red background with some transparency
  ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
  ctx.shadowColor = 'red';
  ctx.shadowBlur = 20;
  ctx.fillRect(popupX, popupY, popupWidth, popupHeight);

  // Draw popup border neon glow
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'red';
  ctx.shadowColor = 'red';
  ctx.shadowBlur = 25;
  ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);
  ctx.shadowBlur = 0; // Reset shadowBlur for text

  // Title text
  ctx.fillStyle = 'red';
  ctx.font = '48px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Game Over', canvas.width / 2, popupY + 20);

  // Buttons
  const btnWidth = 180;
  const btnHeight = 50;
  const btnY = popupY + popupHeight - btnHeight - 30;
  const btnSpacing = 30;
  const btnX1 = canvas.width / 2 - btnWidth - btnSpacing / 2;
  const btnX2 = canvas.width / 2 + btnSpacing / 2;

  // Store button positions for click & hover detection
  gameOverButtons = [
    { x: btnX1, y: btnY, w: btnWidth, h: btnHeight, action: 'restart' },
    { x: btnX2, y: btnY, w: btnWidth, h: btnHeight, action: 'quit' },
  ];

  gameOverButtons.forEach((btn, i) => {
    // Draw button background - neon glow if hovered, else solid dark
    if (i === hoveredButtonIndex) {
      ctx.shadowColor = 'red';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#440000';
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

      // Neon border
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'red';
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

      ctx.shadowBlur = 0;
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#222';
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      ctx.strokeStyle = 'darkred';
      ctx.lineWidth = 2;
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    }

    // Draw button text centered vertically and horizontally
    ctx.fillStyle = 'red';
    ctx.font = '24px "Orbitron", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    let text = btn.action === 'restart' ? 'Restart' : 'Quit to Menu';
    ctx.fillText(text, btn.x + btn.w / 2, btn.y + btn.h / 2);
  });
}

// Add mousemove listener to detect hover
canvas.addEventListener('mousemove', function (e) {
  if (!gameRunning) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let foundHover = false;
    gameOverButtons.forEach((btn, i) => {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        hoveredButtonIndex = i;
        foundHover = true;
      }
    });
    if (!foundHover) hoveredButtonIndex = -1;
  } else {
    hoveredButtonIndex = -1;
  }
});


// Mouse interaction on game over popup buttons
canvas.addEventListener('mousemove', (e) => {
  if (!gameRunning) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    hoveredButtonIndex = gameOverButtons.findIndex(btn =>
      mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h
    );
  }
});

canvas.addEventListener('click', (e) => {
  if (!gameRunning && hoveredButtonIndex !== -1) {
    if (hoveredButtonIndex === 0) restartGame();
    else if (hoveredButtonIndex === 1) quitGame();
  }
});

function restartGame() {
  score = 0;
  lives = 3;
  level = 1;
  speedFactor = 1;
  player.x = 370;
  player.y = 500;
  player.invincible = false;
  bullets = [];
  enemies = [];
  explosions = [];
  gameRunning = true;
}

function quitGame() {
  alert('Thanks for playing! See you next time.');
  window.location.href = 'index.html'; // Or wherever the user should go
}

// Main game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  if (gameRunning) {
    movePlayer();
    updateBullets();
    updateEnemies();
    checkCollisions();
    updateExplosions();
    updateLevel();

    // Enemy spawn logic — limit count by level
    if (enemies.length < 5 + level) {
      if (Math.random() < 0.02 * speedFactor) spawnEnemy();
    }

    if (!canShoot) {
      shootCooldownCounter++;
      if (shootCooldownCounter >= shootCooldownFrames) {
        canShoot = true;
      }
    }

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawExplosions();
    drawHUD();
  } else {
    drawGameOverPopup();
  }

  requestAnimationFrame(gameLoop);
}

function drawExplosions() {
  explosions.forEach(ex => {
    const img = explosionFrames[ex.frame];
    if (img) ctx.drawImage(img, ex.x, ex.y, 64, 64);
  });
}

// Controls
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === ' ') shoot();
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

gameLoop();
