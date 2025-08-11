// Game variables
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameActive = false;
let gameDuration = 10000; // 10 seconds
let gameTimer;

// Audio variables
let backgroundMusic = null;
let musicVolume = localStorage.getItem('musicVolume') || 0.5;
let isMusicPlaying = false;

// Array of meow sound files
const meowSounds = [
    'sounds/meow1.mp3',
    'sounds/meow2.mp3',
    'sounds/meow3.mp3',
    'sounds/meow4.mp3'
];

// DOM elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const tapArea = document.getElementById('tap-area');
const instructions = document.getElementById('instructions');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const musicToggleBtn = document.getElementById('music-toggle');
const musicVolumeSlider = document.getElementById('music-volume');

// Initialize high score display
highScoreElement.textContent = highScore;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Initialize music
function initMusic() {
    backgroundMusic = new Audio('music/bg_music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = musicVolume;
    
    // Set initial UI state
    musicVolumeSlider.value = musicVolume;
    updateMusicButtonStates();

    // Update music time display as music plays
    const musicTime = document.getElementById('music-time');
    if (musicTime) {
        backgroundMusic.addEventListener('timeupdate', () => {
            const currentTimeFormatted = formatTime(backgroundMusic.currentTime);
            musicTime.textContent = `${currentTimeFormatted}`;
        });
    }
}

// Update music button states
function updateMusicButtonStates() {
    musicToggleBtn.textContent = isMusicPlaying ? 'Pause Music' : 'Play Music';
    
    if (backgroundMusic) {
        backgroundMusic.volume = musicVolume;
    }
}

// Toggle music play/pause
function toggleMusic() {
    if (!backgroundMusic) return;
    
    if (isMusicPlaying) {
        backgroundMusic.pause();
        isMusicPlaying = false;
    } else {
        backgroundMusic.play().catch(e => {
            console.log('Audio play failed:', e);
            isMusicPlaying = false;
        });
        isMusicPlaying = true;
    }
    
    updateMusicButtonStates();
}

// Update music volume
function updateMusicVolume(volume) {
    musicVolume = volume;
    localStorage.setItem('musicVolume', musicVolume);
    
    if (backgroundMusic) {
        backgroundMusic.volume = musicVolume;
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
musicToggleBtn.addEventListener('click', toggleMusic);
musicVolumeSlider.addEventListener('input', (e) => updateMusicVolume(e.target.value));

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleMusic();
    }
});

// Game functions
function startGame() {
    score = 0;
    gameActive = true;
    updateScore();
    
    // Hide start button and show instructions
    startBtn.classList.add('hidden');
    instructions.textContent = 'Tap the square! Tap as much as you want!';
    
    // Create tap square
    createTapSquare();
    
    // Start background music if not already playing
    if (!isMusicPlaying && backgroundMusic) {
        backgroundMusic.play().catch(e => {
            console.log('Background music autoplay failed:', e);
        });
        isMusicPlaying = true;
        updateMusicButtonStates();
    }
}

function createTapSquare() {
    const tapSquare = document.createElement('img');
    tapSquare.src = 'splash/chichi.png';
    tapSquare.alt = 'Tap Image';
    tapSquare.className = 'tap-square';
    tapSquare.addEventListener('click', handleTap);
    
    // Clear tap area and add image
    tapArea.innerHTML = '';
    tapArea.appendChild(tapSquare);
    
    // Add active styling
    tapArea.classList.add('game-active');
    tapArea.classList.remove('game-over');
}

function handleTap(event) {
    if (!gameActive) return;
    
    score++;
    updateScore();
    
    // Play random meow sound
    const randomIndex = Math.floor(Math.random() * meowSounds.length);
    const audio = new Audio(meowSounds[randomIndex]);
    audio.volume = 0.7; // Play at fixed volume
    audio.play();
    
    // Create score animation
    createScoreAnimation(event.clientX, event.clientY);
    
    // Create confetti effect
    createConfetti(event.clientX, event.clientY);
}

// Confetti effect function with random PNG images from splash folder
function createConfetti(x, y) {
    const confettiImages = [
        'splash/chichi.png',
        'splash/muehehe.png',
        'splash/thumbsup.png',
        'splash/yeah.png',
        'splash/uhh.png',
        'splash/abcd.png',
    ];
    const confettiCount = 10;
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'absolute';
    confettiContainer.style.left = x + 'px';
    confettiContainer.style.top = y + 'px';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '1000';
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('img');
        const randomImage = confettiImages[Math.floor(Math.random() * confettiImages.length)];
        confetti.src = randomImage;
        confetti.alt = 'confetti';
        confetti.style.position = 'absolute';
        confetti.style.width = `${Math.random() * 70 + 20}px`;
        confetti.style.height = `${Math.random() * 50 + 15}px`;
        confetti.style.objectFit = 'contain';
        confetti.style.opacity = '1';
        confetti.style.transform = `translate(0, 0) rotate(0deg) scale(${Math.random() * 0.5 + 0.5})`;
confetti.style.filter = 'drop-shadow(0 0 2px rgba(0,0,0,0.2))';
        confettiContainer.appendChild(confetti);

        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 150 + 75;
        const xDest = Math.cos(angle) * distance;
        const yDest = Math.sin(angle) * distance;
        const rotation = Math.random() * 720;
        const scale = Math.random() * 0.5 + 0.5;

        confetti.animate([
            { transform: `translate(0, 0) rotate(0deg) scale(${scale})`, opacity: 1 },
            { transform: `translate(${xDest}px, ${yDest}px) rotate(${rotation}deg) scale(${scale * 0.5})`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 800,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });

        setTimeout(() => {
            confetti.remove();
            if (confettiContainer.childElementCount === 0) {
                confettiContainer.remove();
            }
        }, 1800);
    }
}

function createScoreAnimation(x, y) {
    const animation = document.createElement('div');
    animation.className = 'score-animation';
    animation.textContent = '+1';
    
    // Position animation at tap location
    const rect = tapArea.getBoundingClientRect();
    animation.style.left = (x - rect.left) + 'px';
    animation.style.top = (y - rect.top) + 'px';
    
    tapArea.appendChild(animation);
    
    // Remove animation after it completes
    setTimeout(() => {
        if (animation.parentNode) {
            animation.parentNode.removeChild(animation);
        }
    }, 1000);
}

function updateScore() {
    scoreElement.textContent = score;
    // Add bounce animation on score increase
    scoreElement.classList.add('bounce-animation');
    // Remove the animation class after animation ends to allow re-trigger
    scoreElement.addEventListener('animationend', () => {
        scoreElement.classList.remove('bounce-animation');
    }, { once: true });
}

function endGame() {
    gameActive = false;
    
    // Update high score if current score is higher
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('highScore', highScore);
    }
    
    // Update UI
    tapArea.innerHTML = `
        <div>
            <h2>Game Over!</h2>
            <p>Your score: ${score}</p>
            ${score === highScore ? '<p style="color: #28a745; font-weight: bold;">New High Score!</p>' : ''}
        </div>
    `;
    
    tapArea.classList.remove('game-active');
    tapArea.classList.add('game-over');
    
    // Show restart button
    restartBtn.classList.remove('hidden');
}

function restartGame() {
    restartBtn.classList.add('hidden');
    startGame();
}

// Add some initial animation
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.game-container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    container.style.transition = 'all 0.5s ease';
    
    setTimeout(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 100);
    
    // Initialize music system
    initMusic();
});
