// Game variables
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameActive = false;
let gameDuration = 10000; // 10 seconds
let gameTimer;

// DOM elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const tapArea = document.getElementById('tap-area');
const instructions = document.getElementById('instructions');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Initialize high score display
highScoreElement.textContent = highScore;

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

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
    
    // Removed timer logic to allow game to end only when user leaves or restarts
}

function createTapSquare() {
    const tapSquare = document.createElement('img');
    tapSquare.src = 'chichi.png';
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
    
    // Create score animation
    createScoreAnimation(event.clientX, event.clientY);
    
    // Create confetti effect
    createConfetti(event.clientX, event.clientY);
    
    // Removed moveSquareRandomly call to keep square fixed
}

// Confetti effect function
function createConfetti(x, y) {
    const colors = ['#FFC700', '#FF0000', '#2E3192', '#41BBC7', '#732982', '#FF69B4', '#00FF7F'];
    const confettiCount = 30;
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'absolute';
    confettiContainer.style.left = x + 'px';
    confettiContainer.style.top = y + 'px';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '1000';
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = confetti.style.width;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = `${Math.random() > 0.5 ? '50%' : '0'}`;
        confetti.style.opacity = '1';
        confetti.style.transform = `translate(0, 0) rotate(0deg)`;
        confetti.style.filter = 'drop-shadow(0 0 2px rgba(0,0,0,0.2))';
        confettiContainer.appendChild(confetti);

        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 150 + 75;
        const xDest = Math.cos(angle) * distance;
        const yDest = Math.sin(angle) * distance;

        confetti.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${xDest}px, ${yDest}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: 1200 + Math.random() * 800,
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

function moveSquareRandomly() {
    const square = document.querySelector('.tap-square');
    if (!square) return;
    
    const maxX = tapArea.clientWidth - 80;
    const maxY = tapArea.clientHeight - 80;
    
    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);
    
    square.style.position = 'absolute';
    square.style.left = randomX + 'px';
    square.style.top = randomY + 'px';
}

function updateScore() {
    scoreElement.textContent = score;
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
});
