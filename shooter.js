// Galaxy Warriors RELEASE 2.7.2 — Constant Spawn Fix + Smooth Zigzag + Bullet Size 0.9x

let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// ========== ASSETS ========== //
const playerImg = new Image();
playerImg.src = "Images/player.png";

const bulletImg = new Image();
bulletImg.src = "Images/bullet1.png";

const enemyBulletImg = new Image();
enemyBulletImg.src = "Images/bullet2.png";

const enemyImages = {
    red1: "Images/red1.png",
    red2: "Images/red2.png",
    blue1: "Images/blue1.png",
    blue2: "Images/blue2.png",
    green1: "Images/green1.png",
    green2: "Images/green2.png"
};

const explosionFrames = [];
for (let i = 1; i <= 9; i++) {
    let img = new Image();
    img.src = `Images/explosion${i}.png`;
    explosionFrames.push(img);
}

const sounds = {
    bullet: new Audio("Sounds/bullet.wav"),
    explosion: new Audio("Sounds/explosion.wav"),
    gameover: new Audio("Sounds/gameover.wav"),
    respawn: new Audio("Sounds/respawn.wav"),
    startup: new Audio("Sounds/startup.wav")
};

function setVolume(vol) {
    Object.values(sounds).forEach(s => s.volume = vol);
}

// ========== GAME OBJECTS ========== //
let player = { 
  x: 400, 
  y: 500, 
  width: 60, 
  height: 60, 
  speed: 5, 
  lives: 3, 
  invincible: false, 
  flickerCounter: 0 
};

let bullets = [];
let enemies = [];
let enemyBullets = [];
let explosions = [];
let keys = {};
let score = 0;
let level = 1;
let gameOver = false;
let paused = false;
let maxBullets = 3;
let enemyCap = 10;

// ========== EVENT LISTENERS ========== //
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

document.addEventListener("keydown", e => {
    if (e.key === " ") shoot();
    if (e.key === "p") paused = !paused;
    if (e.key === "r" && gameOver) location.reload();
});

// ========== GAME FUNCTIONS ========== //
function shoot() {
    if (bullets.length < maxBullets) {
        bullets.push({ x: player.x + 20, y: player.y, width: 15 , height: 25 , speed: 7 });
        sounds.bullet.currentTime = 0; sounds.bullet.play();
    }
}

// Updated spawnEnemy logic inside the canvas code to ensure continuous spawning until enemyCap is met

function spawnEnemy() {
    // Spawn enemies as long as enemies.length < enemyCap
    while (enemies.length < enemyCap) {
        let choice;
        if (level === 1) {
            choice = Math.random() < 0.5 ? "green1" : "green2";
        } else if (level === 2) {
            choice = Math.random() < 0.5 ? "blue1" : "blue2";
        } else if (level === 3) {
            choice = Math.random() < 0.5 ? "red1" : "red2";
        } else if (level === 4) {
            const pool = ["green1", "blue1", "red1"];
            choice = pool[Math.floor(Math.random() * pool.length)];
        } else {
            const pool = ["green1", "green2", "blue1", "blue2", "red1", "red2"];
            choice = pool[Math.floor(Math.random() * pool.length)];
        }

        let x = Math.random() * (canvas.width - 50);
        // Ensure red enemies spawn at visible top (y=0), others slightly offscreen (y=-50)
        let y = choice.startsWith("red") ? 0 : -50;

        enemies.push({ type: choice, x, y, width: 60, height: 60, hp: choice.endsWith("2") ? 2 : 1, frame: 0, shootTimer: 0 });
    }
}


function updateLevel() {
    const thresholds = [50, 100, 200, 350, 500, 700, 900, 1150];
    for (let i = 0; i < thresholds.length; i++) {
        if (score >= thresholds[i]) level = i + 2;
    }
    level = Math.min(level, 99);
    maxBullets = 4 + Math.floor(level / 2);
    enemyCap = level <= 5 ? 8 : Math.min(8 + (level - 5) * 2, 30);
}

function moveEnemies() {
    enemies.forEach(e => {
        let baseSpeed = 0;
        if (e.type.startsWith("green")) baseSpeed = 4;
        else if (e.type.startsWith("blue")) baseSpeed = 3;
        if (e.type.endsWith("2")) baseSpeed *= 0.8;

        if (e.type.startsWith("green")) {
            e.y += baseSpeed;
        } else if (e.type.startsWith("blue")) {
            // Smoother zigzag with bigger amplitude
            e.y += baseSpeed;
            e.x += Math.sin(e.y / 20) * 12; // bigger, smoother zigzag
        }

        e.shootTimer++;
        if (e.type.startsWith("red")) {
          let cooldown = e.type === "red2" ? 84 : 120;
        if (e.shootTimer >= cooldown) {
          enemyBullets.push({ x: e.x + 20, y: e.y + 30, width: 15, height: 25, speed: 5 });
          e.shootTimer = 0;
    }
}

    });

    // Remove enemies that have moved off the screen (bottom)
    enemies = enemies.filter(e => e.y < canvas.height + e.height);
}

function moveBullets() {
    bullets.forEach(b => b.y -= b.speed);
    bullets = bullets.filter(b => b.y > 0);

    enemyBullets.forEach(b => b.y += b.speed);
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height);
}

function detectCollisions() {
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                bullets.splice(bi, 1);
                e.hp--;
                if (e.hp <= 0) {
                    enemies.splice(ei, 1);
                    explosions.push({ x: e.x, y: e.y, frame: 0 });
                    score += 10;
                    sounds.explosion.currentTime = 0; sounds.explosion.play();
                }
            }
        });
    });
}

function checkPlayerCollision() {
    if (player.invincible) return;
    for (let e of [...enemies, ...enemyBullets]) {
        if (player.x < e.x + e.width && player.x + player.width > e.x && player.y < e.y + e.height && player.y + player.height > e.y) {
            player.lives--;
            player.invincible = true;
            player.flickerCounter = 0;
            sounds.respawn.currentTime = 0; sounds.respawn.play();
            if (player.lives <= 0) {
                gameOver = true;
                sounds.gameover.play();
            }
            break;
        }
    }
}

function drawPlayer() {
    if (player.invincible) {
        player.flickerCounter++;
        if (Math.floor(player.flickerCounter / 5) % 2 === 0) return;
        if (player.flickerCounter > 100) player.invincible = false;
    }
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

function drawEnemies() {
    enemies.forEach(e => {
        let img = new Image();
        img.src = enemyImages[e.type];
        ctx.drawImage(img, e.x, e.y, e.width, e.height);
    });
}

function drawBullets() {
    bullets.forEach(b => ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height));
    enemyBullets.forEach(b => ctx.drawImage(enemyBulletImg, b.x, b.y, b.width, b.height));
}

function drawExplosions() {
    explosions.forEach((ex, i) => {
        ctx.drawImage(explosionFrames[ex.frame], ex.x, ex.y);
        ex.frame++;
        if (ex.frame >= explosionFrames.length) explosions.splice(i, 1);
    });
}

function resetGame() {
  // Reset all game variables to initial state
  player.x = 400;
  player.y = 500;
  player.lives = 3;
  player.invincible = false;
  player.flickerCounter = 0;
  
  bullets = [];
  enemies = [];
  enemyBullets = [];
  explosions = [];
  
  score = 0;
  level = 1;
  gameOver = false;
  paused = false;
  
  maxBullets = 3;
  enemyCap = 10;
  
  sounds.startup.play();
}


function drawGameOverPopup() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '48px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 80);

  ctx.font = '24px "Orbitron", sans-serif';

  // Draw buttons
  const btnWidth = 180;
  const btnHeight = 50;
  const btnY = canvas.height / 2;
  const btnSpacing = 30;
  const btnX1 = canvas.width / 2 - btnWidth - btnSpacing / 2;
  const btnX2 = canvas.width / 2 + btnSpacing / 2;

  // Button backgrounds
  ctx.fillStyle = '#222';
  ctx.fillRect(btnX1, btnY, btnWidth, btnHeight);
  ctx.fillRect(btnX2, btnY, btnWidth, btnHeight);

  // Button text
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'middle';
  ctx.fillText('Restart', btnX1 + btnWidth / 2, btnY + btnHeight / 2);
  ctx.fillText('Quit to Menu', btnX2 + btnWidth / 2, btnY + btnHeight / 2);

  // Store button areas for click detection
  gameOverButtons = [
    { x: btnX1, y: btnY, w: btnWidth, h: btnHeight, action: 'restart' },
    { x: btnX2, y: btnY, w: btnWidth, h: btnHeight, action: 'quit' },
  ];
}

let gameOverButtons = [];

canvas.addEventListener('click', function (e) {
  if (!gameRunning) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    gameOverButtons.forEach(btn => {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        if (btn.action === 'restart') {
          resetGame();
        } else if (btn.action === 'quit') {
          window.location.href = 'index.html';
        }
      }
    });
  }
});

canvas.addEventListener('click', function (e) {
  if (gameOver) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    gameOverButtons.forEach(btn => {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        if (btn.action === 'restart') {
          resetGame();
        } else if (btn.action === 'quit') {
          window.location.href = 'index.html';
        }
      }
    });
  }
});


function drawHUD() {
    ctx.fillStyle = 'cyan';
    ctx.font = '20px "Orbitron", sans-serif';

    ctx.textAlign = 'left';
    ctx.fillText("SCORE: " + score, 20, 20);

    ctx.textAlign = 'center';
    ctx.fillText("LIVES: " + player.lives, canvas.width / 2, 20);
    
      ctx.textAlign = 'right';
    ctx.fillText("LEVEL: " + level, canvas.width - 20, 20);
    if (paused) {
        ctx.fillStyle = "yellow";
        ctx.fillText("PAUSED", 350, 300);
    }
    if (gameOver) {
    drawGameOverPopup();
    }
}

    


function update() {
    if (paused || gameOver) return;
    updateLevel();
    spawnEnemy();
    moveEnemies();
    moveBullets();
    detectCollisions();
    checkPlayerCollision();

    // Player movement
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawExplosions();
    drawHUD();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

setVolume(0.3);
sounds.startup.play();
gameLoop();
