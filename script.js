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
    
    // Removed moveSquareRandomly call to keep square fixed
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
