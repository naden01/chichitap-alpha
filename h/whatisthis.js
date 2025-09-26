// Touhou-like simple game implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let shake = 0;
const shakeIntensity = 10;

let isGameActive = false; // New game state flag

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Update positions for responsiveness
    player.x = width / 2;
    player.y = height - 100;
    enemy.x = width / 2;
    enemy.y = 50;
    enemy.baseX = width / 2;
    enemy.baseY = 50;
}
window.addEventListener('resize', resize);

const startGameBtn = document.getElementById('startGameBtn');
const winScreen = document.getElementById('winScreen');
const backToMainBtn = document.getElementById('backToMainBtn');

startGameBtn.disabled = true; // disable start button until images load

// Load images
const playerImg = new Image();
playerImg.src = '../splash/chichi.png';

const enemyImg = new Image();
enemyImg.src = '../splash/watercatlon.png';

const bgMusic = new Audio('../music/some-real-fun.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5; // adjust volume as needed

let imagesLoaded = 0;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === 2) {
        console.log('All images loaded, game ready to start.');
        startGameBtn.disabled = false;
    }
}

playerImg.onload = onImageLoad;
enemyImg.onload = onImageLoad;

// Play background music on game start
function playBackgroundMusic() {
    bgMusic.play().catch(e => {
        console.log('Background music play failed:', e);
    });
}

// Player object
const player = {
    x: width / 2,
    y: height - 100,
    width: 50,
    height: 50,
    speed: 5,
    bullets: [],
    cooldown: 0,
    health: 170,
    maxHealth: 170,
    shieldCooldown: 0,
    shieldActive: false,
    shieldDuration: 300, // 5 seconds at 60 FPS
    shieldMaxCooldown: 900, // 15 seconds at 60 FPS
    homingTimer: 0
};

// Enemy object with complex movement pattern
const enemy = {
    x: width / 2,
    y: 50,
    width: 64,
    height: 64,
    baseX: width / 2,
    baseY: 50,
    speedX: 0,
    direction: 1,
    bullets: [],
    cooldown: 0,
    moveAngle: 0,
    health: 400,
    maxHealth: 400,
    spellCardTimer: 0,
    spellCardType: 1,
    shieldActive: false,
    shieldDuration: 0,
    usedMoveSets: new Set(),
    usedSpellCards: new Set()
};

resize();

class Bullet {
    constructor(x, y, speedY, fromPlayer, color = null, curve = 0, homing = false) {
        this.x = x;
        this.y = y;
        this.radius = homing ? 8 : 5; // bigger for homing
        this.speedY = speedY;
        this.speedX = 0; // added horizontal speed for enemy bullets
        this.fromPlayer = fromPlayer;
        this.color = color; // custom color for enemy bullets
        this.curve = curve; // curving factor
        this.angle = 0; // for curving
        this.homing = homing; // homing missile
        this.homingSpeed = 3; // speed for homing
        this.lifetime = homing ? 500 : Infinity;
        this.isAlive = true;
    }

    update() {
        if (this.lifetime !== Infinity) {
            this.lifetime--;
            if (this.lifetime <= 0) {
                this.isAlive = false;
                return;
            }
        }
        if (!this.fromPlayer && this.curve !== 0) {
            this.angle += this.curve;
            this.speedX += Math.cos(this.angle) * 0.1;
            this.speedY += Math.sin(this.angle) * 0.1;
        }
        if (this.homing) {
            if (this.fromPlayer) {
                // Homing towards enemy
                const dx = enemy.x + enemy.width / 5 - this.x;
                const dy = enemy.y + enemy.height / 5 - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.speedX += (dx / dist) * 0.1;
                    this.speedY += (dy / dist) * 0.1;
                    // Limit speed
                    const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
                    if (speed > this.homingSpeed) {
                        this.speedX = (this.speedX / speed) * this.homingSpeed;
                        this.speedY = (this.speedY / speed) * this.homingSpeed;
                    }
                }
            } else {
                // Homing towards player
                const dx = player.x + player.width / 2 - this.x;
                const dy = player.y + player.height / 2 - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.speedX += (dx / dist) * 0.1;
                    this.speedY += (dy / dist) * 0.1;
                    // Limit speed
                    const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
                    if (speed > this.homingSpeed) {
                        this.speedX = (this.speedX / speed) * this.homingSpeed;
                        this.speedY = (this.speedY / speed) * this.homingSpeed;
                    }
                }
            }
        }
        this.x += this.speedX;
        this.y += this.speedY;
    }

    draw() {
        ctx.beginPath();
        if (this.fromPlayer) {
            ctx.fillStyle = 'cyan';
        } else {
            ctx.fillStyle = this.color || 'red';
        }
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    isOffScreen() {
        return this.y < 0 || this.y > height || this.x < 0 || this.x > width;
    }
}

// Keyboard input
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// Touch and mobile controls
let touchX = null;
let touchY = null;
let isTouching = false;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    touchX = e.touches[0].clientX - rect.left;
    touchY = e.touches[0].clientY - rect.top;
    isTouching = true;
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    touchX = e.touches[0].clientX - rect.left;
    touchY = e.touches[0].clientY - rect.top;
});
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isTouching = false;
    touchX = null;
    touchY = null;
});

const shieldBtn = document.getElementById('shieldBtn');
shieldBtn.addEventListener('touchstart', () => { keys['e'] = true; });
shieldBtn.addEventListener('touchend', () => { keys['e'] = false; });

// Game loop
function update() {
    if (!isGameActive) return; // Stop updating if game is not active

    // Move player
    if (keys['a'] || keys['arrowleft']) {
        player.x -= player.speed;
        if (player.x < 0) player.x = 0;
    }
    if (keys['d'] || keys['arrowright']) {
        player.x += player.speed;
        if (player.x + player.width > width) player.x = width - player.width;
    }
    if (keys['w'] || keys['arrowup']) {
        player.y -= player.speed;
        if (player.y < 0) player.y = 0;
    }
    if (keys['s'] || keys['arrowdown']) {
        player.y += player.speed;
        if (player.y + player.height > height) player.y = height - player.height;
    }

    // Touch movement
    if (isTouching && touchX !== null && touchY !== null) {
        const dx = touchX - (player.x + player.width / 2);
        const dy = touchY - (player.y + player.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) { // threshold to avoid jitter
            player.x += (dx / dist) * player.speed;
            player.y += (dy / dist) * player.speed;
            // clamp to screen
            if (player.x < 0) player.x = 0;
            if (player.x + player.width > width) player.x = width - player.width;
            if (player.y < 0) player.y = 0;
            if (player.y + player.height > height) player.y = height - player.height;
        }
    }

    // Player shooting (space or automatic on mobile)
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    if (keys[' '] || (isMobile && isGameActive)) {
        if (player.cooldown <= 0) {
            player.bullets.push(new Bullet(player.x + player.width / 2, player.y, -7, true));
            player.cooldown = 15; // cooldown frames
        }
    }
    if (player.cooldown > 0) player.cooldown--;

    // Shield activation (e)
    if (keys['e']) {
        if (player.shieldCooldown <= 0) {
            player.shieldActive = true;
            player.shieldDuration = 300;
            player.shieldCooldown = 900;
        }
    }
    if (player.shieldCooldown > 0) player.shieldCooldown--;
    if (player.shieldActive) {
        player.shieldDuration--;
        if (player.shieldDuration <= 0) {
            player.shieldActive = false;
        }
    }

    // Player homing missile every 10 seconds
    player.homingTimer++;
    if (player.homingTimer >= 600) {
        player.bullets.push(new Bullet(player.x + player.width / 2, player.y, -7, true, null, 0, true));
        player.homingTimer = 0;
    }

    // Enemy movement logic
    enemy.moveAngle += 0.04;
    if (!enemy.moveSet) enemy.moveSet = 1;
    if (!enemy.moveSetTimer) enemy.moveSetTimer = 0;
    enemy.moveSetTimer++;
    if (enemy.moveSetTimer > 300) {
        let available = [1,2,3,4,5,6,7].filter(m => !enemy.usedMoveSets.has(m));
        if (available.length === 0) {
            enemy.usedMoveSets.clear();
            available = [1,2,3,4,5,6,7];
        }
        enemy.moveSet = available[Math.floor(Math.random() * available.length)];
        enemy.usedMoveSets.add(enemy.moveSet);
        enemy.moveSetTimer = 0;
    }

    if (enemy.moveSet === 1) {
        // erratic zigzagging
        enemy.x = enemy.baseX + Math.sin(enemy.moveAngle) * 140 + Math.cos(enemy.moveAngle * 3) * 60;
        enemy.y = enemy.baseY + Math.sin(enemy.moveAngle * 2) * 100;
    } else if (enemy.moveSet === 2) {
        // Burst shooting moveset: simple circular movement
        enemy.x = enemy.baseX + Math.cos(enemy.moveAngle) * 120;
        enemy.y = enemy.baseY + Math.sin(enemy.moveAngle) * 60;
    } else if (enemy.moveSet === 3) {
        // Homing missile moveset: stationary
        enemy.x = enemy.baseX;
        enemy.y = enemy.baseY;
    } else if (enemy.moveSet === 4) {
        // New move set 4: fast horizontal zigzag
        enemy.x = enemy.baseX + Math.sin(enemy.moveAngle * 10) * 180;
        enemy.y = enemy.baseY + Math.cos(enemy.moveAngle * 5) * 40;
    } else if (enemy.moveSet === 5) {
        // New move set 5: slow circular with vertical bob
        enemy.x = enemy.baseX + Math.cos(enemy.moveAngle) * 100;
        enemy.y = enemy.baseY + Math.sin(enemy.moveAngle * 2) * 120;
    } else if (enemy.moveSet === 6) {
        // Figure-8 movement
        enemy.x = enemy.baseX + Math.sin(enemy.moveAngle) * 120;
        enemy.y = enemy.baseY + Math.sin(enemy.moveAngle * 2) * 60;
    } else if (enemy.moveSet === 7) {
        // Oscillating vertical movement
        enemy.x = enemy.baseX + Math.sin(enemy.moveAngle) * 180;
        enemy.y = enemy.baseY + Math.cos(enemy.moveAngle * 3) * 100;
    }

    // Enemy shooting bullet pattern
    if (enemy.moveSet === 1) {
        // alternating red and blue fan
        if (enemy.cooldown <= 0) {
            const bulletCount = 24;
            const angleStep = (Math.PI * 2) / bulletCount; // full circle
            for (let i = 0; i < bulletCount; i++) {
                const angle = i * angleStep; // 0 to 2*PI
                const speedX = 5 * Math.cos(angle);
                const speedY = 5 * Math.sin(angle);
                const color = i % 2 === 0 ? 'red' : 'blue'; // alternate red and blue
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX; // add horizontal speed
            }
            enemy.cooldown = 90; // cooldown frames
        }
    } else if (enemy.moveSet === 2) {
        // Burst shoot
        if (enemy.cooldown <= 0) {
            const bulletCount = 40;
            for (let i = 0; i < bulletCount; i++) {
                const angle = Math.random() * Math.PI * 2; // random direction
                const speedX = 4 * Math.cos(angle);
                const speedY = 4 * Math.sin(angle);
                const color = Math.random() > 0.5 ? 'red' : 'blue';
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
            enemy.cooldown = 45; // shorter cooldown for bursts
        }
    } else if (enemy.moveSet === 3) {
        // Homing missiles
        if (enemy.cooldown <= 0) {
            const bulletCount = 6;
            for (let i = 0; i < bulletCount; i++) {
                const angle = (Math.PI * 2 / bulletCount) * i; // spread out
                const speedX = 4 * Math.cos(angle);
                const speedY = 4 * Math.sin(angle);
                const color = 'lightblue'; // distinct color for homing
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color, 0, true));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
            enemy.cooldown = 150; // longer cooldown for homing
            enemy.shieldActive = true;
            enemy.shieldDuration = 300; // 5 seconds
        }
    } else if (enemy.moveSet === 4) {
        // ring of bullets
        if (enemy.cooldown <= 0) {
            const bulletCount = 32;
            const angleStep = (Math.PI * 2) / bulletCount;
            for (let i = 0; i < bulletCount; i++) {
                if (i % 4 !== 0) { // skip every 4th bullet to create gaps
                    const angle = i * angleStep;
                    const speedX = 4 * Math.cos(angle);
                    const speedY = 4 * Math.sin(angle);
                    const color = 'lime'; // distinct color
                    enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color));
                    enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
                }
            }
            enemy.cooldown = 80; // moderate cooldown
        }
    } else if (enemy.moveSet === 5) {
        // Curving wave
        if (enemy.cooldown <= 0) {
            const bulletCount = 28;
            const angleStep = (Math.PI * 2) / bulletCount;
            for (let i = 0; i < bulletCount; i++) {
                const angle = i * angleStep;
                const speedX = 5 * Math.cos(angle);
                const speedY = 5 * Math.sin(angle);
                const color = 'orange'; // distinct color
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color, 0.05, false)); // slight curve
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
            enemy.cooldown = 90; // cooldown frames
        }
    } else if (enemy.moveSet === 6) {
        // Fan of bullets
        if (enemy.cooldown <= 0) {
            const bulletCount = 16;
            const angleStep = (Math.PI * 2) / bulletCount;
            for (let i = 0; i < bulletCount; i++) {
                const angle = i * angleStep;
                const speedX = 5 * Math.cos(angle);
                const speedY = 5 * Math.sin(angle);
                const color = 'pink'; // distinct color
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
            enemy.cooldown = 85; // cooldown frames
        }
    } else if (enemy.moveSet === 7) {
        // Curving wave with different parameters
        if (enemy.cooldown <= 0) {
            const bulletCount = 30;
            const angleStep = (Math.PI * 2) / bulletCount;
            for (let i = 0; i < bulletCount; i++) {
                const angle = i * angleStep;
                const speedX = 5 * Math.cos(angle);
                const speedY = 5 * Math.sin(angle);
                const color = 'teal'; // distinct color
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color, 0.08, false)); // slight curve
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
            enemy.cooldown = 100; // cooldown frames
        }
    }
    if (enemy.cooldown > 0) enemy.cooldown--;

    // Spell card timer
    enemy.spellCardTimer++;
    if (enemy.spellCardTimer > 600 ) { // every 10 seconds 600
        // Cycle through multiple spell cards
        if (enemy.spellCardType === 1) {
            //barrage of knives
            const knifeCount = 68;
            const angleStep = (Math.PI * 2) / knifeCount;
            for (let i = 0; i < knifeCount; i++) {
                const angle = i * angleStep;
                const speedX = 7 * Math.cos(angle);
                const speedY = 7 * Math.sin(angle);
                const color = 'silver'; // knife color
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
        } else if (enemy.spellCardType === 2) {
            //crystal barrage
            const crystalCount = 32;
            for (let i = 0; i < crystalCount; i++) {
                const angle = (Math.PI * 2 / crystalCount) * i;
                const speedX = 6 * Math.cos(angle);
                const speedY = 6 * Math.sin(angle);
                const color = 'cyan'; // ice color
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
        } else if (enemy.spellCardType === 3) {
            //rotating spiral bullets
            const spiralCount = 70;
            const spiralRadius = 150;
            const centerX = enemy.x + enemy.width / 2;
            const centerY = enemy.y + enemy.height;
            for (let i = 0; i < spiralCount; i++) {
                const angle = i * 0.3 + enemy.spellCardTimer * 0.05;
                const x = centerX + spiralRadius * Math.cos(angle);
                const y = centerY + spiralRadius * Math.sin(angle);
                const speedX = -5 * Math.sin(angle);
                const speedY = 5 * Math.cos(angle);
                const color = 'magenta';
                enemy.bullets.push(new Bullet(x, y, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
        } else if (enemy.spellCardType === 4) {
            //curving moon bullets
            const moonCount = 45;
            for (let i = 0; i < moonCount; i++) {
                const angle = (Math.PI * 2 / moonCount) * i;
                const speedX = 5 * Math.cos(angle);
                const speedY = 5 * Math.sin(angle);
                const color = 'yellow'; // moon color
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color, 0.1, false));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
        } else if (enemy.spellCardType === 5) {
            //complex knife barrage
            const knifeCount = 46;
            for (let i = 0; i < knifeCount; i++) {
                const angle = (Math.PI * 2 / knifeCount) * i;
                const speedX = 6 * Math.cos(angle);
                const speedY = 6 * Math.sin(angle);
                const color = 'silver'; // knife color
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color, 0.05, false));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
        } else if (enemy.spellCardType === 6) {
            //star barrage
            const starCount = 36;
            for (let i = 0; i < starCount; i++) {
                const angle = (Math.PI * 2 / starCount) * i;
                const speedX = 5 * Math.cos(angle);
                const speedY = 5 * Math.sin(angle);
                const color = 'gold'; // star color
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
        } else if (enemy.spellCardType === 7) {
            //fire spiral
            const fireCount = 50;
            const spiralRadius = 120;
            const centerX = enemy.x + enemy.width / 2;
            const centerY = enemy.y + enemy.height;
            for (let i = 0; i < fireCount; i++) {
                const angle = i * 0.25 + enemy.spellCardTimer * 0.1;
                const x = centerX + spiralRadius * Math.cos(angle);
                const y = centerY + spiralRadius * Math.sin(angle);
                const speedX = -5 * Math.sin(angle);
                const speedY = 5 * Math.cos(angle);
                const color = 'orange';
                enemy.bullets.push(new Bullet(x, y, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
        } else if (enemy.spellCardType === 8) {
            //Master Spark (wide laser barrage)
            const laserCount = 30;
            for (let i = 0; i < laserCount; i++) {
                const angle = (Math.PI / laserCount) * i - Math.PI / 2;
                const speedX = 7 * Math.cos(angle);
                const speedY = 7 * Math.sin(angle);
                const color = 'yellow';
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
        } else if (enemy.spellCardType === 9) {
            //Fantasy Heaven (dense bullet hell)
            const heavenCount = 72;
            for (let i = 0; i < heavenCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speedX = (4 + Math.random() * 4) * Math.cos(angle);
                const speedY = (4 + Math.random() * 4) * Math.sin(angle);
                const color = Math.random() > 0.5 ? 'red' : 'blue';
                enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
        } else if (enemy.spellCardType === 10) {
            //Lunatic Red (spiraling red bullets)
            const redCount = 56;
            const redRadius = 100;
            const centerX = enemy.x + enemy.width / 2;
            const centerY = enemy.y + enemy.height;
            for (let i = 0; i < redCount; i++) {
                const angle = i * 0.22 + enemy.spellCardTimer * 0.08;
                const x = centerX + redRadius * Math.cos(angle);
                const y = centerY + redRadius * Math.sin(angle);
                const speedX = -6 * Math.sin(angle);
                const speedY = 6 * Math.cos(angle);
                const color = 'red';
                enemy.bullets.push(new Bullet(x, y, speedY, false, color));
                enemy.bullets[enemy.bullets.length - 1].speedX = speedX;
            }
        }
        enemy.spellCardTimer = 0;
        let availableSpells = [1,2,3,4,5,6,7,8,9,10].filter(s => !enemy.usedSpellCards.has(s));
        if (availableSpells.length === 0) {
            enemy.usedSpellCards.clear();
            availableSpells = [1,2,3,4,5,6,7,8,9,10];
        }
        enemy.spellCardType = availableSpells[Math.floor(Math.random() * availableSpells.length)];
        enemy.usedSpellCards.add(enemy.spellCardType);
    }
    if (enemy.cooldown > 0) enemy.cooldown--;

    // Update bullets
    player.bullets.forEach(b => b.update());
    player.bullets = player.bullets.filter(b => b.isAlive && !b.isOffScreen());

    enemy.bullets.forEach(b => b.update());
    enemy.bullets = enemy.bullets.filter(b => b.isAlive && !b.isOffScreen());

    // Collision detection
    // Player bullets hitting enemy
    player.bullets.forEach(b => {
        if (b.x > enemy.x && b.x < enemy.x + enemy.width && b.y > enemy.y && b.y < enemy.y + enemy.height) {
            enemy.health -= 10; // adjust damage as needed
            player.bullets.splice(player.bullets.indexOf(b), 1);
            shake = 10; // screen shake on hit
        }
    });

    // Enemy bullets hitting player
    enemy.bullets.forEach(b => {
        if (b.x > player.x && b.x < player.x + player.width && b.y > player.y && b.y < player.y + player.height) {
            if (player.shieldActive) {
                // Shield absorbs bullet
                enemy.bullets.splice(enemy.bullets.indexOf(b), 1);
            } else {
                player.health -= 10; // adjust damage as needed
                enemy.bullets.splice(enemy.bullets.indexOf(b), 1);
                shake = 10; // screen shake on hit
            }
        }
    });

    // Check win/lose conditions
    if (enemy.health <= 0) {
        gameWin();
    }
    if (player.health <= 0) {
        gameOver();
    }
}

function resetGame() {
    player.x = width / 2;
    player.y = height - 100;
    player.bullets = [];
    player.cooldown = 0;
    player.health = player.maxHealth; // reset player health
    player.shieldCooldown = 0;
    player.shieldActive = false;
    player.shieldDuration = 300;
    player.homingTimer = 0;

    enemy.x = width / 2;
    enemy.y = 50;
    enemy.bullets = [];
    enemy.cooldown = 0;
    enemy.health = enemy.maxHealth; // reset health properly
    enemy.spellCardTimer = 0; // reset spell card timer
    enemy.usedMoveSets.clear();
    enemy.usedSpellCards.clear();
    enemy.moveSet = 1; // reset to initial move set

    // Clear keys to prevent repeated alerts on holding keys
    for (let key in keys) {
        keys[key] = false;
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Apply shake effect
    const wasShaking = shake > 0;
    if (wasShaking) {
        const offsetX = (Math.random() - 0.5) * shakeIntensity;
        const offsetY = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(offsetX, offsetY);
        shake--;
    }

    // Draw player
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // Draw player health bar
    const pBarWidth = player.width;
    const pBarHeight = 8;
    const pHealthRatio = player.health / player.maxHealth;
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x, player.y - pBarHeight - 5, pBarWidth, pBarHeight);
    ctx.fillStyle = 'limegreen';
    ctx.fillRect(player.x, player.y - pBarHeight - 5, pBarWidth * pHealthRatio, pBarHeight);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(player.x, player.y - pBarHeight - 5, pBarWidth, pBarHeight);

    // Draw shield UI
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial'; // bigger font size
    const padding = 20;
    const xPos = padding;
    const yPos = height - padding;
    if (player.shieldCooldown > 0) {
        const seconds = Math.ceil(player.shieldCooldown / 60);
        ctx.fillText(`Shield: ${seconds}s`, xPos, yPos);
    } else {
        ctx.fillText('Shield: Ready (E)', xPos, yPos);
    }

    // Draw enemy
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);

    // Draw enemy health bar
    const barWidth = enemy.width;
    const barHeight = 8;
    const healthRatio = enemy.health / enemy.maxHealth;
    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x, enemy.y - barHeight - 5, barWidth, barHeight);
    ctx.fillStyle = 'limegreen';
    ctx.fillRect(enemy.x, enemy.y - barHeight - 5, barWidth * healthRatio, barHeight);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(enemy.x, enemy.y - barHeight - 5, barWidth, barHeight);

    // Draw bullets
    player.bullets.forEach(b => b.draw());
    enemy.bullets.forEach(b => b.draw());

    // Reset transform if shake was applied
    if (wasShaking) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}


function gameLoop() {
    if (isGameActive) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

startGameBtn.addEventListener('click', () => {
    console.log('Start button clicked');
    startGameBtn.style.display = 'none';
    canvas.style.display = 'block';
    playBackgroundMusic();
    isGameActive = true; // Start game
    gameLoop();
});

backToMainBtn.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Modify game over and win conditions to show winScreen instead of redirecting immediately
function gameOver() {
    canvas.style.display = 'none';
    winScreen.style.display = 'flex';
    document.querySelector('#winScreen h1').textContent = 'Game Over!';
    isGameActive = false; // Stop game
}

function gameWin() {
    canvas.style.display = 'none';
    winScreen.style.display = 'flex';
    document.querySelector('#winScreen h1').textContent = 'You win from watercatlon!';
    isGameActive = false; // Stop game
}
