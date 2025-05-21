// Galaxy Warriors Release 2.5.2 — PLAYER MOVEMENT & BULLET SIZE FIX + ENEMY BULLETS WITH IMAGE

let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// ========== ASSETS ========== //
const playerImg = new Image();
playerImg.src = "Images/player.png";

const bulletImg = new Image();
bulletImg.src = "Images/bullet1.png";  // player bullet

const enemyBulletImg = new Image();
enemyBulletImg.src = "Images/bullet2.png";  // enemy bullet

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
    enemyBullet: new Audio("Sounds/enemy_bullet.wav"),
    explosion: new Audio("Sounds/explosion.wav"),
    gameover: new Audio("Sounds/gameover.wav"),
    respawn: new Audio("Sounds/respawn.wav"),
    startup: new Audio("Sounds/startup.wav")
};

function setVolume(vol) {
    Object.values(sounds).forEach(s => s.volume = vol);
}

// ========== GAME OBJECTS ========== //
let player = { x: 400, y: 500, width: 50, height: 50, speed: 5, lives: 3, invincible: false, flickerCounter: 0 };
let bullets = [];
let enemies = [];
let enemyBullets = [];
let explosions = [];
let keys = {};
let score = 0;
let level = 1;
let gameOver = false;
let paused = false;
let maxBullets = 4;
let enemyCap = 8;

// ========== EVENT LISTENERS ========== //
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

document.addEventListener("keydown", e => {
    if (e.key === " ") shoot();
    if (e.key.toLowerCase() === "p") paused = !paused;
    if (e.key.toLowerCase() === "r" && gameOver) location.reload();
});

// ========== GAME FUNCTIONS ========== //

// Player shoot function (bigger bullet with image and bigger hitbox)
function shoot() {
    if (bullets.length < maxBullets) {
        bullets.push({ x: player.x + 19, y: player.y - 28, width: 12, height: 28, speed: 7 });
        sounds.bullet.currentTime = 0;
        sounds.bullet.play();
    }
}

// Enemy bullet shoot function (bigger bullet with image and hitbox)
function enemyShoot(enemy) {
    enemyBullets.push({ x: enemy.x + 19, y: enemy.y + 50, width: 12, height: 28, speed: 5 });
    sounds.enemyBullet.currentTime = 0;
    sounds.enemyBullet.play();
}

// Weighted random enemy type selection: 50% green, 30% blue, 20% red; type1 or type2 equally
function chooseEnemyType() {
    let colorRoll = Math.random();
    let typeRoll = Math.random() < 0.5 ? "1" : "2";
    let color = "";

    if (colorRoll < 0.5) color = "green";
    else if (colorRoll < 0.8) color = "blue";
    else color = "red";

    return color + typeRoll;
}

function spawnEnemy() {
    if (enemies.length >= enemyCap) return;

    let choice = chooseEnemyType();

    // X position within screen bounds
    let x = Math.random() * (canvas.width - 50);

    // Red enemies spawn fully visible at top
    let y = 0;
    if (choice.startsWith("red")) {
        y = 0;
        x = Math.min(Math.max(x, 0), canvas.width - 50);
    } else {
        // Blue and green spawn slightly above screen to enter smoothly
        y = -100 + Math.random() * 50;
    }

    let enemy = {
        type: choice,
        x,
        y,
        width: 50,
        height: 50,
        hp: choice.endsWith("2") ? 2 : 1,
        frame: 0,
        shootCooldown: Math.floor(Math.random() * 120) + 60 // random cooldown for red shooting
    };

    enemies.push(enemy);
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
        // Red stationary
        if (e.type.startsWith("green")) {
            e.y += 2.5;
        } else if (e.type.startsWith("blue")) {
            e.y += 2;
            e.x += Math.sin(e.y / 15) * 4;
        }
        // Red enemies stay at top but shoot
        if (e.type.startsWith("red")) {
            if (e.shootCooldown > 0) {
                e.shootCooldown--;
            } else {
                enemyShoot(e);
                e.shootCooldown = Math.floor(Math.random() * 120) + 60;
            }
        }
    });

    // Remove enemies off bottom screen
    enemies = enemies.filter(e => e.y < canvas.height + 50);
}

function moveBullets() {
    bullets.forEach(b => b.y -= b.speed);
    bullets = bullets.filter(b => b.y + b.height > 0);
}

function moveEnemyBullets() {
    enemyBullets.forEach(b => b.y += b.speed);
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height + 50);
}

function detectCollisions() {
    // Player bullets hit enemies
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                bullets.splice(bi, 1);
                e.hp--;
                if (e.hp <= 0) {
                    enemies.splice(ei, 1);
                    explosions.push({ x: e.x, y: e.y, frame: 0 });
                    score += 10;
                    sounds.explosion.currentTime = 0;
                    sounds.explosion.play();
                }
            }
        });
    });

    // Enemy bullets hit player
    if (!player.invincible) {
        enemyBullets.forEach((b, bi) => {
            if (b.x < player.x + player.width && b.x + b.width > player.x &&
                b.y < player.y + player.height && b.y + b.height > player.y) {
                enemyBullets.splice(bi, 1);
                player.lives--;
                player.invincible = true;
                player.flickerCounter = 0;
                sounds.respawn.currentTime = 0;
                sounds.respawn.play();
                if (player.lives <= 0) {
                    gameOver = true;
                    sounds.gameover.play();
                }
            }
        });
    }
}

function checkPlayerCollision() {
    if (player.invincible) return;
    for (let e of enemies) {
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

function drawBullets() {
    bullets.forEach(b => ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height));
}

function drawEnemyBullets() {
    enemyBullets.forEach(b => ctx.drawImage(enemyBulletImg, b.x, b.y, b.width, b.height));
}

function drawEnemies() {
    enemies.forEach(e => {
        let img = new Image();
        img.src = enemyImages[e.type];
        ctx.drawImage(img, e.x, e.y, e.width, e.height);
    });
}

function drawExplosions() {
    explosions.forEach((exp, i) => {
        ctx.drawImage(explosionFrames[exp.frame], exp.x, exp.y, 50, 50);
        exp.frame++;
        if (exp.frame >= explosionFrames.length) explosions.splice(i, 1);
    });
}

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 25);
    ctx.fillText("Lives: " + player.lives, 10, 50);
    ctx.fillText("Level: " + level, 10, 75);
}

function updatePlayerPosition() {
    if (keys["arrowleft"] || keys["a"]) player.x -= player.speed;
    if (keys["arrowright"] || keys["d"]) player.x += player.speed;
    if (keys["arrowup"] || keys["w"]) player.y -= player.speed;
    if (keys["arrowdown"] || keys["s"]) player.y += player.speed;

    // Keep player inside canvas
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
}

function gameLoop() {
    if (paused || gameOver) {
        if (gameOver) {
            ctx.fillStyle = "red";
            ctx.font = "50px Arial";
            ctx.fillText("GAME OVER", canvas.width / 2 - 150, canvas.height / 2);
            ctx.font = "20px Arial";
            ctx.fillText("Press R to Restart", canvas.width / 2 - 90, canvas.height / 2 + 40);
        }
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayerPosition();
    moveEnemies();
    moveBullets();
    moveEnemyBullets();

    detectCollisions();
    checkPlayerCollision();
    updateLevel();

    drawPlayer();
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawExplosions();
    drawHUD();

    spawnEnemy();

    requestAnimationFrame(gameLoop);
}

window.onload = () => {
    sounds.startup.play();
    gameLoop();
};
