// Game state
let gameState = {
    randomNumber: null,
    attempts: 0,
    maxAttempts: 10,
    minRange: 1,
    maxRange: 100,
    gameActive: true,
    hintsRemaining: 3,
    darkTheme: false,
    bestScore: localStorage.getItem('bestScore') || 0,
    difficulty: 'medium',
    guessHistory: []
};

// DOM Elements
const elements = {
    guessInput: document.getElementById('guessInput'),
    guessButton: document.getElementById('guessButton'),
    resetButton: document.getElementById('resetButton'),
    themeButton: document.getElementById('themeButton'),
    instructionsButton: document.getElementById('instructionsButton'),
    hintButton: document.getElementById('hintButton'),
    difficultySelect: document.getElementById('difficulty'),
    message: document.getElementById('message'),
    rangeMin: document.getElementById('rangeMin'),
    rangeMax: document.getElementById('rangeMax'),
    attemptsCount: document.getElementById('attemptsCount'),
    remainingAttempts: document.getElementById('remainingAttempts'),
    bestScore: document.getElementById('bestScore'),
    progressFill: document.getElementById('progressFill'),
    historyList: document.getElementById('historyList'),
    hintContent: document.getElementById('hintContent'),
    notification: document.getElementById('notification'),
    instructionsModal: document.getElementById('instructionsModal'),
    closeModalBtn: document.querySelector('.close-btn')
};

// Initialize the game
function initGame() {
    setupEventListeners();
    updateDifficulty();
    updateUI();
    updateBestScore();
    
    // Focus on input field
    elements.guessInput.focus();
    
    // Log the answer for debugging (remove in production)
    console.log('Answer:', gameState.randomNumber);
}

// Set up event listeners
function setupEventListeners() {
    // Guess button click
    elements.guessButton.addEventListener('click', checkGuess);
    
    // Enter key press in input field
    elements.guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkGuess();
        }
    });
    
    // Reset button
    elements.resetButton.addEventListener('click', resetGame);
    
    // Theme toggle button
    elements.themeButton.addEventListener('click', toggleTheme);
    
    // Instructions button
    elements.instructionsButton.addEventListener('click', showInstructions);
    
    // Hint button
    elements.hintButton.addEventListener('click', giveHint);
    
    // Difficulty change
    elements.difficultySelect.addEventListener('change', updateDifficulty);
    
    // Quick buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.guessInput.value = e.target.dataset.value;
            elements.guessInput.focus();
        });
    });
    
    // Close modal button
    elements.closeModalBtn.addEventListener('click', closeInstructions);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === elements.instructionsModal) {
            closeInstructions();
        }
    });
}

// Update difficulty settings
function updateDifficulty() {
    gameState.difficulty = elements.difficultySelect.value;
    
    switch (gameState.difficulty) {
        case 'easy':
            gameState.maxAttempts = 15;
            break;
        case 'medium':
            gameState.maxAttempts = 10;
            break;
        case 'hard':
            gameState.maxAttempts = 7;
            break;
        case 'expert':
            gameState.maxAttempts = 5;
            break;
    }
    
    resetGame();
}

// Generate a random number
function generateRandomNumber() {
    return Math.floor(Math.random() * (gameState.maxRange - gameState.minRange + 1)) + gameState.minRange;
}

// Check the user's guess
function checkGuess() {
    if (!gameState.gameActive) return;
    
    const userGuess = parseInt(elements.guessInput.value);
    
    // Validate input
    if (isNaN(userGuess) || userGuess < gameState.minRange || userGuess > gameState.maxRange) {
        showMessage(`Please enter a number between ${gameState.minRange} and ${gameState.maxRange}`, 'warning');
        shakeElement(elements.guessInput);
        return;
    }
    
    // Update game state
    gameState.attempts++;
    gameState.guessHistory.push({
        guess: userGuess,
        timestamp: new Date()
    });
    
    // Add to history
    addToHistory(userGuess);
    
    // Check if guess is correct
    if (userGuess === gameState.randomNumber) {
        handleCorrectGuess();
        return;
    }
    
    // Update range based on guess
    if (userGuess > gameState.randomNumber) {
        gameState.maxRange = userGuess - 1;
        showMessage(`Too high! Try a lower number.`, 'danger');
    } else {
        gameState.minRange = userGuess + 1;
        showMessage(`Too low! Try a higher number.`, 'warning');
    }
    
    // Check if game over
    if (gameState.attempts >= gameState.maxAttempts) {
        handleGameOver();
        return;
    }
    
    // Update UI
    updateUI();
    elements.guessInput.value = '';
    elements.guessInput.focus();
}

// Handle correct guess
function handleCorrectGuess() {
    gameState.gameActive = false;
    showMessage(`🎉 Congratulations! You found the number ${gameState.randomNumber} in ${gameState.attempts} attempts!`, 'success');
    
    // Update best score
    if (gameState.bestScore === 0 || gameState.attempts < gameState.bestScore) {
        gameState.bestScore = gameState.attempts;
        localStorage.setItem('bestScore', gameState.bestScore);
        updateBestScore();
        showNotification('🏆 New Best Score!');
    }
    
    // Disable input and change button text
    elements.guessInput.disabled = true;
    elements.guessButton.innerHTML = '<i class="fas fa-trophy"></i> You Won!';
    elements.guessButton.style.background = 'linear-gradient(90deg, var(--success), #2ECC71)';
    
    // Add celebration animation
    elements.guessButton.classList.add('correct-guess');
    
    updateUI();
}

// Handle game over
function handleGameOver() {
    gameState.gameActive = false;
    showMessage(`😔 Game Over! The number was ${gameState.randomNumber}. Better luck next time!`, 'danger');
    
    // Disable input and change button text
    elements.guessInput.disabled = true;
    elements.guessButton.innerHTML = '<i class="fas fa-redo"></i> Try Again';
    elements.guessButton.onclick = resetGame;
    
    updateUI();
}

// Update the UI
function updateUI() {
    // Update range display
    elements.rangeMin.textContent = gameState.minRange;
    elements.rangeMax.textContent = gameState.maxRange;
    
    // Update attempts
    elements.attemptsCount.textContent = gameState.attempts;
    elements.remainingAttempts.textContent = gameState.maxAttempts - gameState.attempts;
    
    // Update progress bar
    const progressPercentage = (gameState.attempts / gameState.maxAttempts) * 100;
    elements.progressFill.style.width = `${progressPercentage}%`;
    
    // Update progress bar color based on remaining attempts
    if (progressPercentage > 80) {
        elements.progressFill.style.background = 'linear-gradient(90deg, var(--danger), #FF4757)';
    } else if (progressPercentage > 60) {
        elements.progressFill.style.background = 'linear-gradient(90deg, var(--warning), #FF9800)';
    } else {
        elements.progressFill.style.background = 'linear-gradient(90deg, var(--primary), var(--secondary))';
    }
    
    // Update hint button
    elements.hintButton.innerHTML = `<i class="fas fa-lightbulb"></i> Get Hint (${gameState.hintsRemaining} left)`;
    elements.hintButton.disabled = gameState.hintsRemaining <= 0 || !gameState.gameActive;
}

// Update best score display
function updateBestScore() {
    elements.bestScore.textContent = gameState.bestScore || '0';
}

// Show message with color coding
function showMessage(text, type = 'info') {
    const colors = {
        success: '#36D399',
        danger: '#FF4757',
        warning: '#FFC107',
        info: '#6C63FF'
    };
    
    elements.message.textContent = text;
    elements.message.style.color = colors[type];
    
    // Update icon based on message type
    const icon = elements.message.previousElementSibling;
    switch(type) {
        case 'success':
            icon.className = 'fas fa-check-circle';
            icon.style.color = colors[type];
            break;
        case 'danger':
            icon.className = 'fas fa-times-circle';
            icon.style.color = colors[type];
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle';
            icon.style.color = colors[type];
            break;
        default:
            icon.className = 'fas fa-info-circle';
            icon.style.color = colors[type];
    }
}

// Add guess to history
function addToHistory(guess) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    // Determine if guess was high, low, or correct
    let guessType = '';
    let guessText = '';
    
    if (guess === gameState.randomNumber) {
        guessType = 'correct';
        guessText = `🎯 Correct! ${guess}`;
    } else if (guess > gameState.randomNumber) {
        guessType = 'too-high';
        guessText = `📉 ${guess} (Too High)`;
    } else {
        guessType = 'too-low';
        guessText = `📈 ${guess} (Too Low)`;
    }
    
    historyItem.classList.add(guessType);
    historyItem.innerHTML = `
        <span>${guessText}</span>
        <span>Attempt ${gameState.attempts}</span>
    `;
    
    // Remove empty message if it exists
    const emptyHistory = elements.historyList.querySelector('.empty-history');
    if (emptyHistory) {
        emptyHistory.remove();
    }
    
    // Add to top of history
    elements.historyList.insertBefore(historyItem, elements.historyList.firstChild);
    
    // Limit history to 5 items
    if (elements.historyList.children.length > 5) {
        elements.historyList.removeChild(elements.historyList.lastChild);
    }
}

// Give a hint to the player
function giveHint() {
    if (gameState.hintsRemaining <= 0 || !gameState.gameActive) return;
    
    gameState.hintsRemaining--;
    
    // Generate a hint based on the number
    let hint = '';
    const num = gameState.randomNumber;
    
    if (num % 2 === 0) {
        hint = 'The number is even.';
    } else {
        hint = 'The number is odd.';
    }
    
    if (num > 50) {
        hint += ' It\'s greater than 50.';
    } else {
        hint += ' It\'s 50 or less.';
    }
    
    // Add more hints based on range
    const range = gameState.maxRange - gameState.minRange;
    if (range > 20) {
        if (num % 5 === 0) {
            hint += ' It\'s divisible by 5.';
        }
        
        if (num % 10 === 0) {
            hint += ' It ends with 0.';
        } else if (num % 10 === 5) {
            hint += ' It ends with 5.';
        }
    }
    
    // Show the hint
    elements.hintContent.textContent = hint;
    elements.hintContent.classList.add('show');
    
    // Auto-hide hint after 5 seconds
    setTimeout(() => {
        elements.hintContent.classList.remove('show');
    }, 5000);
    
    updateUI();
    showNotification('💡 Hint used!');
}

// Reset the game
function resetGame() {
    // Reset game state
    gameState.randomNumber = generateRandomNumber();
    gameState.attempts = 0;
    gameState.minRange = 1;
    gameState.maxRange = 100;
    gameState.gameActive = true;
    gameState.hintsRemaining = 3;
    gameState.guessHistory = [];
    
    // Reset UI
    elements.guessInput.value = '';
    elements.guessInput.disabled = false;
    elements.guessInput.focus();
    elements.guessButton.innerHTML = '<i class="fas fa-bullseye"></i> Guess';
    elements.guessButton.style.background = 'linear-gradient(90deg, var(--primary), var(--secondary))';
    elements.guessButton.onclick = checkGuess;
    elements.guessButton.classList.remove('correct-guess');
    
    // Clear history
    elements.historyList.innerHTML = '<div class="empty-history">No guesses yet</div>';
    
    // Hide hint
    elements.hintContent.classList.remove('show');
    
    // Show initial message
    showMessage(`I'm thinking of a number between 1-100. You have ${gameState.maxAttempts} attempts. Good luck!`, 'info');
    
    updateUI();
    
    // Log the answer for debugging (remove in production)
    console.log('Answer:', gameState.randomNumber);
}

// Toggle dark/light theme
function toggleTheme() {
    gameState.darkTheme = !gameState.darkTheme;
    
    if (gameState.darkTheme) {
        document.body.classList.add('dark-theme');
        elements.themeButton.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        showNotification('🌙 Dark mode enabled');
    } else {
        document.body.classList.remove('dark-theme');
        elements.themeButton.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        showNotification('☀️ Light mode enabled');
    }
}

// Show instructions modal
function showInstructions() {
    elements.instructionsModal.style.display = 'block';
}

// Close instructions modal
function closeInstructions() {
    elements.instructionsModal.style.display = 'none';
}

// Show notification
function showNotification(text) {
    elements.notification.textContent = text;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// Shake element animation
function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame);