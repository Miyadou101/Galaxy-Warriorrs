# Galaxy Warrior - A Space Shooter Adventure

# Made by :
    - Kasmi Mohamed Iyad
    - Zaidi Amin 
    - 

### How to Play

- move using the arrow keys .
- shooting using the space bar .
- hit the enemies to destroy them .
- try to get the highiest score .
- Have Fun .


# Galaxy Warriors — PRE-RELEASE a-2

---

## 1. Base Concept

Galaxy Warriors is an arcade-style space shooter game where the player pilots a spacecraft to defend against waves of increasingly difficult enemies. The core gameplay revolves around fast reflexes, strategic shooting, and survival as the enemy ships grow in number, speed, and complexity. Players accumulate points by destroying enemies, level up based on their score, and aim to achieve the highest score possible while managing limited lives.

The game features simple, responsive controls, distinct enemy behaviors, and an engaging progression system that gradually increases difficulty and keeps gameplay exciting and challenging.

---

## 2. Feature List (Dev Log Style with Function Descriptions)

### Initial Setup & UI (PRE-RELEASE a-1)

- **File Structure Setup**  
  Organizes project files for easy deployment and maintenance:
  - `index.html` (homepage with menus and settings)  
  - `game.html` (gameplay interface)  
  - Asset folders: `Images/` for graphics, `Sounds/` for audio effects.  
  - Separate CSS files for homepage (`style.css`) and game (`style_shooter.css`).

- **Homepage Interface**  
  Implements modals for:
  - **Settings Modal** — lets players adjust volume, toggle sound effects and music, and configure controls.
  - **Tutorial Modal** — explains gameplay controls, objectives, and mechanics in an accessible format.

---

### Core Gameplay Mechanics

- **Player Controls (`handleInput`)**  
  Captures keyboard inputs for moving the ship left, right, up, down, and firing bullets. Ensures responsive and smooth control experience.

- **Shooting System (`shootBullet`)**  
  Allows the player to shoot bullets with a cooldown to prevent spamming. Limits the number of bullets on screen to avoid performance issues and balance gameplay.

- **Enemy Types (Enemy 1 & 2)**  
  Implements two enemy classes:
  - Enemy 1: a Quick and nimble but fragile enemy , dies after one shot
  - Enemy 2: a More sturdy yet slower version  , dies after two shots
  
- **Score Tracking (`updateScore`)**  
  Increments player score when enemies are destroyed, updates HUD to show current points.

- **HUD Display (`drawHUD`)**  
  Shows live score, player lives, and current level on the screen during gameplay, helping players keep track of progress.

- **Game Over Screen (`triggerGameOver`)**  
  Detects when player lives reach zero and displays a game-over screen with options to restart or return to the menu.

- **Static Background (`drawBackground`)**  
  Renders a starfield image as a static background to give the game an immersive space environment.

---

### Enemy Behavior & Leveling System (PRE-RELEASE a-2)

- **Level System (`calculateLevel`)**  
  Calculates player level based on score thresholds. Each new level increases game difficulty by boosting enemy speed and bullet speed.

- **Enemy Spawn Limit (`limitEnemyCount`)**  
  Controls the maximum number of enemies allowed on screen based on the current player level to maintain balanced difficulty.

- **Enemy Type 3 Introduction (`spawnEnemy3`)**  
  Adds a new enemy class:
  - Moves diagonally across the screen, increasing unpredictability.
  - Only spawns after the player reaches level 5.
  - Spawns with low probability to keep gameplay fresh and challenging.

- **Explosion Animations (`playExplosionAnimation`)**  
  Plays distinct explosion sprite sequences for each enemy type, enhancing visual feedback when enemies are destroyed.

- **Sound Effects (`playSoundEffect`)**  
  Plays shooting, explosion, and game event sounds to enrich the player experience and provide audio cues.

- **Collision Detection (`checkCollisions`)**  
  Accurately detects when bullets hit enemies or when enemies collide with the player ship, triggering appropriate responses such as damage or scoring.

- **Pause/Resume Functionality (`togglePause`)**  
  Allows players to pause and resume the game using the "P" key, freezing gameplay and animations for breaks.

- **Lives & Invincibility (`handlePlayerHit`)**  
  Reduces player lives on collision and activates temporary invincibility frames to prevent immediate consecutive hits.

- **Enemy Cleanup (`cleanupOffscreenEnemies`)**  
  Removes enemies that move off-screen to prevent memory leaks and maintain optimal performance.

---

## 3. Possible Future Versions / Roadmap

### PRE-RELEASE a-3

- Finalize **leveling and difficulty curve** for balanced progression and player retention.  
- Add a **detailed HUD** showing combo multipliers, accuracy, and achievements.  
- Implement **online leaderboards** for high score competition.  
- Polish **sound design** with background music and refined effects.  
- Add a **pause menu** featuring save and resume options.


### BETA 1.0

- Add **power-ups** dropped randomly by enemies (e.g., rapid fire, shields, extra lives).  
- Implement **boss enemies** every 10 levels with unique attack patterns and larger health pools.  
- Add **multiplayer co-op** mode allowing two players to play simultaneously.  
- Introduce **dynamic backgrounds** with moving starfields and nebula effects.  
- Allow players to **customize controls** via the settings modal.


### BETA 1.1 and Beyond

- Introduce multiple **weapon types** (spread shots, lasers, missiles) with upgrades.  
- Add **environmental hazards** like asteroids and black holes affecting movement.  
- Include **customizable ship skins** and visual effects unlocked through gameplay.  
- Develop a **story mode** with missions, cutscenes, and narrative progression.  
- Optimize for **mobile and tablet compatibility**, including touch controls.

---

