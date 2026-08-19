// script.js - JavaScript functionality for Aqua Tracker

// Global variables
let waterEntries = [];
let dailyGoal = 0;
let chart = null;

// DOM elements
const usageForm = document.getElementById('usage-form');
const totalSpan = document.getElementById('total');
const weeklyAvgSpan = document.getElementById('weekly-avg');
const historyList = document.getElementById('history-list');
const goalInput = document.getElementById('goal');
const setGoalBtn = document.getElementById('set-goal-btn');
const goalStatus = document.getElementById('goal-status');

// News elements
const newsContainer = document.getElementById('news-container');
const refreshNewsBtn = document.getElementById('refresh-news-btn');
const setNewsKeyBtn = document.getElementById('set-newskey-btn');
const newsStatus = document.getElementById('news-status');

// Chat Assistant Variables
let chatModal, chatToggle, chatClose, chatMessages, chatInput, chatSend, quickButtons;

// Initialize the app
function init() {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }
    
    loadData();
    updateDisplay();
    renderChart();
    
    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        });
    }

    // Setup clear history button
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all usage history? This action cannot be undone.')) {
                waterEntries = [];
                saveData();
                updateDisplay();
                renderChart();
                alert('Usage history has been cleared.');
            }
        });
    }

    // Initialize Chat Assistant
    initChatAssistant();

    // Initialize Games
    initGames();

    // Initialize News
    initNews();
}

// Load data from localStorage
function loadData() {
    const entries = localStorage.getItem('waterEntries');
    if (entries) {
        waterEntries = JSON.parse(entries);
    } else {
        // Add sample data for demonstration
        addSampleData();
    }
    
    const goal = localStorage.getItem('dailyGoal');
    if (goal) {
        dailyGoal = parseFloat(goal);
        goalInput.value = dailyGoal;
    }
}

// Add sample data for demonstration
function addSampleData() {
    const today = new Date();
    const sampleEntries = [];

    // Add entries for the last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Generate realistic water usage data
        const manufacturing = Math.random() * 500 + 800; // 800-1300L
        const cooling = Math.random() * 300 + 400; // 400-700L
        const cleaning = Math.random() * 150 + 100; // 100-250L
        const processing = Math.random() * 400 + 600; // 600-1000L
        const total = manufacturing + cooling + cleaning + processing;

        sampleEntries.push({
            date: dateStr,
            manufacturing: parseFloat(manufacturing.toFixed(1)),
            cooling: parseFloat(cooling.toFixed(1)),
            cleaning: parseFloat(cleaning.toFixed(1)),
            processing: parseFloat(processing.toFixed(1)),
            total: parseFloat(total.toFixed(1))
        });
    }

    waterEntries = sampleEntries;
    saveData();
}

// ---------------
// News / Water Resources Feed
// ---------------
const sampleNews = [
    {
        title: 'Global Water Crisis: 2 Billion People Lack Safe Drinking Water',
        source: 'World Health Org',
        summary: 'Water scarcity affects billions. Efficient use and strong policies can protect communities and ecosystems.',
        url: 'https://www.who.int/news-room/fact-sheets/detail/drinking-water',
        date: '2026-03-19'
    },
    {
        title: 'Cities Turn to Rainwater Harvesting to Conserve Water',
        source: 'Environmental News',
        summary: 'Rainwater collection systems are becoming popular in urban areas to reduce demand on municipal supplies.',
        url: 'https://example.com/rainwater-harvesting',
        date: '2026-03-18'
    },
    {
        title: 'New Technologies Help Farmers Use Less Irrigation Water',
        source: 'AgTech Journal',
        summary: 'Smart sensors and AI-driven irrigation systems are saving water while increasing crop yields.',
        url: 'https://example.com/agriculture-water-tech',
        date: '2026-03-17'
    },
    {
        title: 'How to Save Water at Home: Simple Everyday Tips',
        source: 'Green Living',
        summary: 'Small changes like shorter showers and fixing leaks can have a big impact on your water usage.',
        url: 'https://example.com/save-water-home',
        date: '2026-03-16'
    },
    {
        title: 'Protecting Rivers and Wetlands for Future Generations',
        source: 'EcoWatch',
        summary: 'Conserving natural water habitats supports biodiversity and helps regulate local climate.',
        url: 'https://example.com/protect-rivers',
        date: '2026-03-15'
    }
];

function initNews() {
    if (!newsContainer) return;

    // Update status text
    updateNewsStatus();

    // Attach button handlers
    if (refreshNewsBtn) {
        refreshNewsBtn.addEventListener('click', () => loadNews(true));
    }

    if (setNewsKeyBtn) {
        setNewsKeyBtn.addEventListener('click', setNewsApiKey);
    }

    // Load initial news set
    loadNews();
}

function updateNewsStatus() {
    const key = getNewsApiKey();
    if (!newsStatus) return;
    if (key) {
        newsStatus.textContent = 'Fetching live news from NewsAPI.org...';
    } else {
        newsStatus.textContent = 'Using sample water news. (Set API key for live updates)';
    }
}

function getNewsApiKey() {
    return localStorage.getItem('newsApiKey') || '';
}

function setNewsApiKey() {
    const currentKey = getNewsApiKey();
    const newKey = prompt('Enter your NewsAPI.org API key (leave blank to use sample news):', currentKey);
    if (newKey === null) return; // cancelled

    if (newKey.trim() === '') {
        localStorage.removeItem('newsApiKey');
    } else {
        localStorage.setItem('newsApiKey', newKey.trim());
    }

    updateNewsStatus();
    loadNews(true);
}

async function loadNews(force = false) {
    if (!newsContainer) return;

    updateNewsStatus();
    const apiKey = getNewsApiKey();

    // Use sample news by default or when key is missing
    if (!apiKey) {
        renderNews(sampleNews);
        return;
    }

    // Try fetching live news
    const url = `https://newsapi.org/v2/everything?q=water%20resources&language=en&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'ok' && data.articles) {
            const articles = data.articles.map(article => ({
                title: article.title || 'Untitled',
                source: (article.source && article.source.name) || 'Unknown Source',
                summary: article.description || article.content || 'Read the full article for more details.',
                url: article.url,
                date: article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''
            }));

            renderNews(articles);
            newsStatus.textContent = `Showing latest water news (updated ${new Date().toLocaleTimeString()}).`;
            return;
        }

        // Fallback if API response isn't as expected
        console.warn('News API returned unexpected response:', data);
        renderNews(sampleNews);
    } catch (error) {
        console.warn('Failed to fetch news:', error);
        renderNews(sampleNews);
    }
}

function renderNews(newsItems) {
    if (!newsContainer) return;

    newsContainer.innerHTML = '';

    newsItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'news-card';

        card.innerHTML = `
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            <div class="news-meta">
                <span>${item.source}${item.date ? ` • ${item.date}` : ''}</span>
                <a href="${item.url}" target="_blank" rel="noopener">Read more</a>
            </div>
        `;

        newsContainer.appendChild(card);
    });
}


// Save data to localStorage
function saveData() {
    localStorage.setItem('waterEntries', JSON.stringify(waterEntries));
    localStorage.setItem('dailyGoal', dailyGoal.toString());
}

// Handle form submission
usageForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get values from form
    const manufacturing = parseFloat(document.getElementById('manufacturing').value) || 0;
    const cooling = parseFloat(document.getElementById('cooling').value) || 0;
    const cleaning = parseFloat(document.getElementById('cleaning').value) || 0;
    const processing = parseFloat(document.getElementById('processing').value) || 0;
    
    // Calculate total
    const total = manufacturing + cooling + cleaning + processing;
    
    // Create entry object
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const entry = {
        date: today,
        manufacturing: manufacturing,
        cooling: cooling,
        cleaning: cleaning,
        processing: processing,
        total: total
    };
    
    // Check if entry for today already exists, update it
    const existingIndex = waterEntries.findIndex(e => e.date === today);
    if (existingIndex !== -1) {
        waterEntries[existingIndex] = entry;
    } else {
        waterEntries.push(entry);
    }
    
    // Save and update display
    saveData();
    updateDisplay();
    renderChart();
    
    // Reset form
    usageForm.reset();
    alert('Daily water usage saved successfully!');
});

// Handle goal setting
setGoalBtn.addEventListener('click', function() {
    const goal = parseFloat(goalInput.value) || 0;
    dailyGoal = goal;
    saveData();
    updateDisplay();
});

// Update all display elements
function updateDisplay() {
    // Update today's total
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = waterEntries.find(e => e.date === today);
    const todayTotal = todayEntry ? todayEntry.total : 0;
    totalSpan.textContent = todayTotal.toFixed(1) + ' L';
    
    // Update today's individual categories
    const todayManufacturing = todayEntry ? todayEntry.manufacturing : 0;
    const todayCooling = todayEntry ? todayEntry.cooling : 0;
    const todayCleaning = todayEntry ? todayEntry.cleaning : 0;
    const todayProcessing = todayEntry ? todayEntry.processing : 0;
    
    document.getElementById('today-manufacturing').textContent = todayManufacturing.toFixed(1) + ' L';
    document.getElementById('today-cooling').textContent = todayCooling.toFixed(1) + ' L';
    document.getElementById('today-cleaning').textContent = todayCleaning.toFixed(1) + ' L';
    document.getElementById('today-processing').textContent = todayProcessing.toFixed(1) + ' L';
    
    // Update weekly totals
    const weeklyTotals = calculateWeeklyTotals();
    document.getElementById('weekly-manufacturing').textContent = weeklyTotals.manufacturing.toFixed(1) + ' L';
    document.getElementById('weekly-cooling').textContent = weeklyTotals.cooling.toFixed(1) + ' L';
    document.getElementById('weekly-cleaning').textContent = weeklyTotals.cleaning.toFixed(1) + ' L';
    document.getElementById('weekly-processing').textContent = weeklyTotals.processing.toFixed(1) + ' L';
    
    // Update weekly average
    const weeklyAvg = calculateWeeklyAverage();
    weeklyAvgSpan.textContent = weeklyAvg.toFixed(1) + ' L';
    
    // Update goal status
    updateGoalStatus(todayTotal);
    
    // Update history
    updateHistory();
}

// Calculate weekly totals (last 7 days)
function calculateWeeklyTotals() {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const recentEntries = waterEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= sevenDaysAgo && entryDate <= today;
    });
    
    let totals = {
        manufacturing: 0,
        cooling: 0,
        cleaning: 0,
        processing: 0
    };
    
    recentEntries.forEach(entry => {
        totals.manufacturing += entry.manufacturing || 0;
        totals.cooling += entry.cooling || 0;
        totals.cleaning += entry.cleaning || 0;
        totals.processing += entry.processing || 0;
    });
    
    return totals;
}

// Calculate weekly average (last 7 days)
function calculateWeeklyAverage() {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const recentEntries = waterEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= sevenDaysAgo && entryDate <= today;
    });
    
    if (recentEntries.length === 0) return 0;
    
    const total = recentEntries.reduce((sum, entry) => sum + entry.total, 0);
    return total / recentEntries.length;
}

// Update goal status with progress bar
function updateGoalStatus(todayTotal) {
    const goalStatus = document.getElementById('goal-status');
    const progressFill = document.getElementById('progress-fill');

    if (dailyGoal === 0) {
        goalStatus.textContent = 'Set your daily goal below';
        goalStatus.className = 'goal-status';
        progressFill.style.width = '0%';
        return;
    }

    const percentage = Math.min((todayTotal / dailyGoal) * 100, 100);
    progressFill.style.width = percentage + '%';

    if (todayTotal > dailyGoal) {
        goalStatus.textContent = `⚠️ Exceeded goal by ${(todayTotal - dailyGoal).toFixed(1)}L`;
        goalStatus.className = 'goal-status goal-alert';
        goalStatus.style.color = '#e74c3c';
    } else {
        goalStatus.textContent = `✅ ${(dailyGoal - todayTotal).toFixed(1)}L remaining to reach goal`;
        goalStatus.className = 'goal-status';
        goalStatus.style.color = '#27ae60';
    }
}

// Update history list
function updateHistory() {
    historyList.innerHTML = '';

    // Sort entries by date descending
    const sortedEntries = waterEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedEntries.length === 0) {
        const noDataMessage = document.createElement('div');
        noDataMessage.className = 'no-data-message';
        noDataMessage.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-calendar-alt" style="font-size: 3rem; margin-bottom: 1rem; color: #4a90e2;"></i>
                <h3>No Usage History Yet</h3>
                <p>Start tracking your water usage to see your history here!</p>
            </div>
        `;
        historyList.appendChild(noDataMessage);
        return;
    }

    sortedEntries.forEach(entry => {
        const historyCard = document.createElement('div');
        historyCard.className = 'history-card';

        const date = new Date(entry.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        historyCard.innerHTML = `
            <div class="history-date"><strong>${date}</strong></div>
            <div class="history-total">Total: ${entry.total.toFixed(1)}L</div>
            <div class="history-breakdown">
                <span>🏭 Manufacturing: ${entry.manufacturing.toFixed(1)}L</span>
                <span>❄️ Cooling Systems: ${entry.cooling.toFixed(1)}L</span>
                <span>🧹 Cleaning & Maintenance: ${entry.cleaning.toFixed(1)}L</span>
                <span>⚙️ Processing: ${entry.processing.toFixed(1)}L</span>
            </div>
        `;

        historyList.appendChild(historyCard);
    });
}

// Render chart using Chart.js
function renderChart() {
    const ctx = document.getElementById('usage-chart').getContext('2d');
    
    // Prepare data for chart (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const chartData = {
        manufacturing: [],
        cooling: [],
        cleaning: [],
        processing: [],
        total: []
    };
    const labels = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        labels.push(dateStr);
        
        const entry = waterEntries.find(e => e.date === dateStr);
        if (entry) {
            chartData.manufacturing.push(entry.manufacturing);
            chartData.cooling.push(entry.cooling);
            chartData.cleaning.push(entry.cleaning);
            chartData.processing.push(entry.processing);
            chartData.total.push(entry.total);
        } else {
            chartData.manufacturing.push(0);
            chartData.cooling.push(0);
            chartData.cleaning.push(0);
            chartData.processing.push(0);
            chartData.total.push(0);
        }
    }
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    // Create new chart
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Manufacturing (L)',
                    data: chartData.manufacturing,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.1,
                    borderWidth: 2
                },
                {
                    label: 'Cooling Systems (L)',
                    data: chartData.cooling,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.1,
                    borderWidth: 2
                },
                {
                    label: 'Cleaning & Maintenance (L)',
                    data: chartData.cleaning,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    tension: 0.1,
                    borderWidth: 2
                },
                {
                    label: 'Processing (L)',
                    data: chartData.processing,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.1,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: false,
                    title: {
                        display: true,
                        text: 'Litres'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Chat Assistant Functions
function initChatAssistant() {
    chatModal = document.getElementById('chat-modal');
    chatToggle = document.getElementById('chat-toggle');
    chatClose = document.getElementById('chat-close');
    chatMessages = document.getElementById('chat-messages');
    chatInput = document.getElementById('chat-input');
    chatSend = document.getElementById('chat-send');
    quickButtons = document.querySelectorAll('.quick-btn');

    // Event listeners
    chatToggle.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', closeChat);
    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Quick question buttons
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            chatInput.value = question;
            sendMessage();
        });
    });

    // Close chat when clicking outside
    document.addEventListener('click', function(e) {
        if (!chatModal.contains(e.target) && !chatToggle.contains(e.target) && chatModal.style.display === 'flex') {
            closeChat();
        }
    });
}

function toggleChat() {
    if (chatModal.style.display === 'flex') {
        closeChat();
    } else {
        openChat();
    }
}

function openChat() {
    chatModal.style.display = 'flex';
    chatInput.focus();
}

function closeChat() {
    chatModal.style.display = 'none';
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;

    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';

    // Generate bot response
    setTimeout(() => {
        const response = generateResponse(message);
        addMessage(response, 'bot');
    }, 500 + Math.random() * 1000); // Simulate typing delay
}

function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    if (type === 'bot') {
        messageDiv.innerHTML = `<strong>Aqua Assistant:</strong> ${text}`;
    } else {
        messageDiv.innerHTML = `<strong>You:</strong> ${text}`;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Water tracking questions
    if (message.includes('track') || message.includes('usage') || message.includes('enter') || message.includes('input')) {
        return "To track your industrial water usage, fill out the form at the top with your daily consumption for: Manufacturing, Cooling Systems, Cleaning & Maintenance, and Processing. Click 'Save Usage' and your data will be stored and displayed in your dashboard and history!";
    }
    
    // Goal setting questions
    if (message.includes('goal') || message.includes('limit') || message.includes('target')) {
        return "You can set a daily water limit by entering a number in the 'Daily Water Limit' field and clicking 'Set Goal'. The app will then show your progress with a visual progress bar and notify you if you exceed your goal.";
    }
    
    // Tips questions
    if (message.includes('tip') || message.includes('save') || message.includes('saving') || message.includes('conservation')) {
        const tips = [
            "Optimize cooling systems with efficient heat exchangers to reduce water consumption.",
            "Implement water recycling systems in manufacturing processes to minimize waste.",
            "Schedule equipment cleaning during cooler times to reduce water loss through evaporation.",
            "Use closed-loop cooling systems instead of open systems to conserve water.",
            "Regular maintenance prevents leaks and water loss - check pipes and equipment daily.",
            "Install low-flow nozzles and aerators on cleaning equipment.",
            "Monitor water quality to reduce reprocessing and thus water consumption.",
            "Use dry cleaning methods where possible to minimize liquid waste."
        ];
        return tips[Math.floor(Math.random() * tips.length)];
    }
    
    // App functionality questions
    if (message.includes('app') || message.includes('work') || message.includes('how') || message.includes('guide')) {
        return "Aqua Tracker helps you monitor your industrial water usage across four categories: Manufacturing, Cooling Systems, Cleaning & Maintenance, and Processing. Set goals, view trends on the chart, check your history, and track your water conservation efforts. Your data is stored locally in your browser.";
    }
    
    // Chart/Dashboard questions
    if (message.includes('chart') || message.includes('graph') || message.includes('trend') || message.includes('dashboard')) {
        return "The chart shows your water usage trends over the last 30 days with separate lines for each category. The dashboard displays today's usage by category, weekly totals, and your goal progress. All data updates automatically when you add new entries!";
    }
    
    // History questions
    if (message.includes('history') || message.includes('past') || message.includes('previous')) {
        return "Your usage history shows all your past entries with detailed breakdowns for each category. You can view entries by date and see the distribution across Manufacturing, Cooling Systems, Cleaning & Maintenance, and Processing. The history helps you track your conservation progress over time.";
    }
    
    // General greetings
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return "Hello! I'm your Aqua Assistant, here to help you manage your industrial water usage efficiently. Ask me anything about tracking usage, setting goals, or conservation strategies!";
    }
    
    // Thanks
    if (message.includes('thank') || message.includes('thanks')) {
        return "You're welcome! Every liter saved makes a difference. Keep up the great work conserving water! 💧";
    }
    
    // Default responses
    const defaultResponses = [
        "That's a great question about industrial water management! I'm here to help you track your usage and improve efficiency. What specific aspect would you like to know more about?",
        "I appreciate your focus on water conservation! Whether it's tracking usage, setting goals, or learning new strategies, I'm here to help. What can I assist you with?",
        "Water conservation is critical for industrial sustainability! I can help you with usage tracking, goal setting, optimization tips, and understanding how the app works. How can I help you today?",
        "Thanks for caring about water efficiency! I can provide guidance on tracking your industrial usage, setting achievable goals, and sharing practical conservation strategies. What would you like to know?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// -----------------------------------
// Water Awareness Games
// -----------------------------------
let gameArea;
let dropGame = {
    canvas: null,
    ctx: null,
    drops: [],
    bucketX: 0,
    bucketWidth: 100,
    bucketHeight: 20,
    score: 0,
    missed: 0,
    running: false,
    animationId: null,
    spawnInterval: null
};

const quizData = [
    {
        question: 'Which of the following is the best way to save water when brushing your teeth?',
        options: ['Leave the tap running', 'Turn off the tap while brushing', 'Brush with a cup of water', 'Use hot water'],
        answer: 1
    },
    {
        question: 'How much water can a leaky faucet waste in a year?',
        options: ['About 10 gallons', 'About 100 gallons', 'About 1,000 gallons', 'About 3,000 gallons'],
        answer: 3
    },
    {
        question: 'What is a good practice to reduce water use when showering?',
        options: ['Take longer showers', 'Use high-flow showerheads', 'Turn off the shower while soaping', 'Shower twice a day'],
        answer: 2
    },
    {
        question: 'What can you do with rainwater?',
        options: ['Dump it down the drain', 'Use it for outdoor plants', 'Mix it with swimming pool water', 'Throw it away'],
        answer: 1
    }
];

let quizState = {
    current: 0,
    score: 0
};

function initGames() {
    gameArea = document.getElementById('game-area');

    const startDropBtn = document.getElementById('start-drop-game');
    const startQuizBtn = document.getElementById('start-quiz');

    if (startDropBtn) startDropBtn.addEventListener('click', startDropGame);
    if (startQuizBtn) startQuizBtn.addEventListener('click', startQuiz);
}

function showGameArea(html) {
    if (!gameArea) return;
    gameArea.innerHTML = html;
    gameArea.classList.add('active');
}

// ----------------------
// Drop Catch Game
// ----------------------
function startDropGame() {
    stopDropGame();

    showGameArea(`
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div><strong>Drop Catch</strong> - Move the bucket to catch drops</div>
            <button id="stop-drop-game" style="background: rgba(231,76,60,0.85); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 12px; cursor: pointer;">Stop</button>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.75rem;">
            <div><strong>Score:</strong> <span id="drop-score">0</span></div>
            <div><strong>Missed:</strong> <span id="drop-missed">0</span>/5</div>
        </div>
        <canvas id="drop-canvas" class="game-canvas"></canvas>
    `);

    dropGame.canvas = document.getElementById('drop-canvas');
    dropGame.ctx = dropGame.canvas.getContext('2d');
    dropGame.score = 0;
    dropGame.missed = 0;
    dropGame.drops = [];
    dropGame.running = true;

    // Resize canvas for sharp display
    function resizeCanvas() {
        const rect = dropGame.canvas.getBoundingClientRect();
        dropGame.canvas.width = rect.width * window.devicePixelRatio;
        dropGame.canvas.height = rect.height * window.devicePixelRatio;
        dropGame.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    dropGame.bucketX = 50;

    dropGame.canvas.addEventListener('mousemove', (e) => {
        const rect = dropGame.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        dropGame.bucketX = Math.max(0, Math.min(rect.width - dropGame.bucketWidth, mouseX - dropGame.bucketWidth / 2));
    });

    document.getElementById('stop-drop-game').addEventListener('click', () => {
        stopDropGame();
        showGameArea('<div style="text-align:center; padding: 2rem;">Game stopped. Pick another game or start again.</div>');
    });

    dropGame.spawnInterval = setInterval(() => {
        if (!dropGame.running) return;
        const rect = dropGame.canvas.getBoundingClientRect();
        const x = Math.random() * (rect.width - 20) + 10;
        dropGame.drops.push({ x, y: -10, radius: 8 + Math.random() * 6, speed: 1 + Math.random() * 1.5 });
    }, 700);

    function gameLoop() {
        if (!dropGame.running) return;

        const rect = dropGame.canvas.getBoundingClientRect();
        dropGame.ctx.clearRect(0, 0, rect.width, rect.height);

        // Draw bucket
        dropGame.ctx.fillStyle = 'rgba(74, 144, 226, 0.85)';
        dropGame.ctx.fillRect(dropGame.bucketX, rect.height - dropGame.bucketHeight - 10, dropGame.bucketWidth, dropGame.bucketHeight);

        // Draw drops
        dropGame.drops.forEach((drop, index) => {
            drop.y += drop.speed;
            dropGame.ctx.beginPath();
            const gradient = dropGame.ctx.createRadialGradient(drop.x, drop.y, 2, drop.x, drop.y, drop.radius);
            gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
            gradient.addColorStop(1, 'rgba(74,144,226,0.7)');
            dropGame.ctx.fillStyle = gradient;
            dropGame.ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
            dropGame.ctx.fill();

            // Check bucket collision
            if (drop.y + drop.radius >= rect.height - dropGame.bucketHeight - 10) {
                if (drop.x > dropGame.bucketX && drop.x < dropGame.bucketX + dropGame.bucketWidth) {
                    dropGame.score += 1;
                    document.getElementById('drop-score').textContent = dropGame.score;
                    dropGame.drops.splice(index, 1);
                } else if (drop.y - drop.radius > rect.height) {
                    dropGame.missed += 1;
                    document.getElementById('drop-missed').textContent = dropGame.missed;
                    dropGame.drops.splice(index, 1);
                }
            }
        });

        if (dropGame.missed >= 5) {
            dropGame.running = false;
            stopDropGame();
            showGameArea(`
                <div style="text-align:center; padding: 2rem;">
                    <h3>Game Over!</h3>
                    <p>You scored <strong>${dropGame.score}</strong> drops.</p>
                    <button id="restart-drop" style="background: rgba(74, 144, 226, 0.9); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 15px; cursor: pointer;">Play Again</button>
                </div>
            `);
            document.getElementById('restart-drop').addEventListener('click', startDropGame);
            return;
        }

        dropGame.animationId = requestAnimationFrame(gameLoop);
    }

    gameLoop();
}

function stopDropGame() {
    dropGame.running = false;
    if (dropGame.animationId) {
        cancelAnimationFrame(dropGame.animationId);
    }
    if (dropGame.spawnInterval) {
        clearInterval(dropGame.spawnInterval);
    }
}

// ----------------------
// Quiz Game
// ----------------------
function startQuiz() {
    stopDropGame();
    quizState.current = 0;
    quizState.score = 0;
    renderQuizQuestion();
}

function renderQuizQuestion() {
    const questionData = quizData[quizState.current];

    showGameArea(`
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div><strong>Water Quiz</strong> - Question ${quizState.current + 1} of ${quizData.length}</div>
            <button id="quit-quiz" style="background: rgba(231,76,60,0.85); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 12px; cursor: pointer;">Quit</button>
        </div>
        <div>
            <p style="font-weight: 600;">${questionData.question}</p>
            <div class="quiz-options" id="quiz-options"></div>
        </div>
    `);

    document.getElementById('quit-quiz').addEventListener('click', () => {
        showGameArea('<div style="text-align:center; padding: 2rem;">Quiz ended. Pick another game when you are ready!</div>');
    });

    const optionsContainer = document.getElementById('quiz-options');
    questionData.options.forEach((option, index) => {
        const optionBtn = document.createElement('div');
        optionBtn.className = 'quiz-option';
        optionBtn.textContent = option;
        optionBtn.addEventListener('click', () => handleQuizAnswer(index));
        optionsContainer.appendChild(optionBtn);
    });
}

function handleQuizAnswer(selectedIndex) {
    const questionData = quizData[quizState.current];
    const options = document.querySelectorAll('.quiz-option');

    options.forEach((opt, idx) => {
        opt.classList.add(idx === questionData.answer ? 'correct' : 'wrong');
        opt.style.pointerEvents = 'none';
    });

    if (selectedIndex === questionData.answer) {
        quizState.score += 1;
    }

    setTimeout(() => {
        quizState.current += 1;
        if (quizState.current < quizData.length) {
            renderQuizQuestion();
        } else {
            showGameArea(`
                <div style="text-align:center; padding: 2rem;">
                    <h3>Quiz Complete!</h3>
                    <p>You scored <strong>${quizState.score}</strong> out of <strong>${quizData.length}</strong>.</p>
                    <button id="restart-quiz" style="background: rgba(74, 144, 226, 0.9); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 15px; cursor: pointer;">Try Again</button>
                </div>
            `);
            document.getElementById('restart-quiz').addEventListener('click', startQuiz);
        }
    }, 1000);
}
