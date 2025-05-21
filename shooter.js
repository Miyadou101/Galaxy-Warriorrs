// Galaxy Warriors Release 2.1 "ENEMY APPROACHING HYBRID"

// -------------------- CANVAS SETUP --------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// -------------------- IMAGES --------------------
const playerImg = new Image();
playerImg.src = "Images/player.png";

const explosionFrames = [];
for (let i = 1; i <= 9; i++) {
    const img = new Image();
    img.src = `Images/explosion${i}.png`;
    explosionFrames.push(img);
}

const enemyImages = {
    red1: "Images/red1.png",
    red2: "Images/red2.png",
    blue1: "Images/blue1.png",
    blue2: "Images/blue2.png",
    green1: "Images/green1.png",
    green2: "Images/green2.png"
};

// -------------------- SOUNDS --------------------
const sounds = {
    bullet: new Audio("Sounds/bullet.wav"),
    explosion: new Audio("Sounds/explosion.wav"),
    gameover: new Audio("Sounds/gameover.wav"),
    respawn: new Audio("Sounds/respawn.wav"),
    startup: new Audio("Sounds/startup.wav")
};

let volume = 1.0;
function setVolume(vol) {
    volume = vol;
    for (let key in sounds) sounds[key].volume = volume;
}

// -------------------- VARIABLES --------------------
let keys = {};
let bullets = [];
let enemies = [];
let explosions = [];
let score = 0;
let level = 1;
let lives = 3;
let isGameOver = false;
let canShoot = true;
let gamePaused = false;
let invincible = false;
let invincibilityTimer = 0;

const maxLevel = 99;
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 5
};

// -------------------- EVENT LISTENERS --------------------
document.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (e.code === "Space") shoot();
    if (e.code === "KeyP") gamePaused = !gamePaused;
});

document.addEventListener("keyup", e => {
    keys[e.code] = false;
});

// -------------------- SHOOT --------------------
function shoot() {
    if (!canShoot || isGameOver) return;
    if (bullets.length >= getBulletLimit()) return;
    bullets.push({ x: player.x + 22, y: player.y, speed: 7 });
    sounds.bullet.currentTime = 0;
    sounds.bullet.play();
}

function getBulletLimit() {
    if (level >= 12) return 13;
    if (level >= 10) return 8;
    if (level >= 7) return 7;
    if (level >= 4) return 6;
    if (level >= 2) return 5;
    return 4;
}

// -------------------- ENEMY CLASS --------------------
class Enemy {
    constructor(type, color) {
        this.type = type; // 1 or 2
        this.color = color; // red, blue, green
        this.hp = type;
        this.width = 50;
        this.height = 50;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -60;
        this.speed = this.getBaseSpeed();
        this.image = new Image();
        this.image.src = enemyImages[`${color}${type}`];
        this.zigzagOffset = Math.random() * 100;
    }

    getBaseSpeed() {
        if (this.color === "red") return 0; // stationary
        if (this.color === "blue") return 1.5 * getSpeedScale(); // zigzag slow
        return 2.5 * getSpeedScale(); // green fast
    }

    update() {
        if (this.color === "blue") {
            this.y += this.speed;
            this.x += Math.sin((this.y + this.zigzagOffset) / 30) * 2;
        } else if (this.color === "green") {
            this.y += this.speed;
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

function getSpeedScale() {
    return Math.min(1 + Math.pow(level, 0.25), 6);
}

// -------------------- ENEMY LOGIC --------------------
function spawnEnemies() {
    const maxEnemies = 5 + Math.floor(level / 2);
    if (enemies.length >= maxEnemies) return;

    const spawnChance = 0.02 + level * 0.001; // progressive spawn rate
    if (Math.random() < spawnChance) {
        const colors = ["red", "blue", "green"];
        const color = colors[Math.floor(Math.random() * 3)];
        const type = Math.random() < 0.5 ? 1 : 2;
        enemies.push(new Enemy(type, color));
    }
}

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.update();
        if (enemy.color === "red" && Math.random() < 0.01) {
            // red enemies shoot
            bullets.push({ x: enemy.x + 22, y: enemy.y + 50, speed: -4 });
        }
        if (enemy.y > canvas.height) enemies.splice(index, 1);
    });
}

// -------------------- COLLISIONS --------------------
function checkCollisions() {
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + 6 > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + 12 > enemy.y
            ) {
                bullets.splice(bIndex, 1);
                enemy.hp--;
                if (enemy.hp <= 0) {
                    createExplosion(enemy.x, enemy.y);
                    sounds.explosion.currentTime = 0;
                    sounds.explosion.play();
                    enemies.splice(eIndex, 1);
                    score += 10;
                }
            }
        });
    });
}

function createExplosion(x, y) {
    explosions.push({ x, y, frame: 0 });
}

function updateExplosions() {
    explosions.forEach((exp, i) => {
        exp.frame++;
        if (exp.frame >= explosionFrames.length * 5) explosions.splice(i, 1);
    });
}

function drawExplosions() {
    explosions.forEach(exp => {
        const frameIndex = Math.floor(exp.frame / 5);
        ctx.drawImage(explosionFrames[frameIndex], exp.x, exp.y, 50, 50);
    });
}

// -------------------- PLAYER --------------------
function updatePlayer() {
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += player.speed;
}

function checkPlayerHit() {
    if (invincible) {
        invincibilityTimer--;
        if (invincibilityTimer <= 0) invincible = false;
        return;
    }

    enemies.forEach(enemy => {
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            loseLife();
        }
    });
}

function loseLife() {
    lives--;
    if (lives <= 0) {
        isGameOver = true;
        sounds.gameover.play();
    } else {
        sounds.respawn.play();
        invincible = true;
        invincibilityTimer = 120;
    }
}

// -------------------- LEVEL --------------------
function updateLevel() {
    if (level < maxLevel) {
        const thresholds = [50, 100, 200, 350, 500, 700, 900, 1150];
        if (score >= thresholds[level - 1]) level++;
    }
}

// -------------------- GAME LOOP --------------------
function gameLoop() {
    if (gamePaused || isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayer();
    spawnEnemies();
    updateEnemies();
    checkPlayerHit();
    checkCollisions();
    updateExplosions();
    updateLevel();

    bullets.forEach((bullet, i) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0 || bullet.y > canvas.height) bullets.splice(i, 1);
    });

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    enemies.forEach(e => e.draw());
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 6, 12));
    drawExplosions();

    drawHUD();

    if (!isGameOver) requestAnimationFrame(gameLoop);
}

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 25);
    ctx.fillText(`Level: ${level}`, 10, 50);
    ctx.fillText(`Lives: ${lives}`, 10, 75);
    if (gamePaused) ctx.fillText("PAUSED", canvas.width / 2 - 40, canvas.height / 2);
    if (isGameOver) ctx.fillText("GAME OVER - Press R to Restart", canvas.width / 2 - 120, canvas.height / 2);
}

document.addEventListener("keydown", (e) => {
    if (isGameOver && e.code === "KeyR") window.location.reload();
});

// -------------------- START GAME --------------------
sounds.startup.play();
setVolume(1.0);
requestAnimationFrame(gameLoop);
