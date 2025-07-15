// Enhanced Dashboard JavaScript v2 - Modern Tech Interface

// Global variables
let currentTradingMode = 'paper';
let dashboardData = {};
let charts = {};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    startRealTimeUpdates();
});

function initializeDashboard() {
    // Initialize date/time display
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Initialize trading mode toggle
    initializeTradingModeToggle();
    
    // Load initial dashboard data
    loadDashboardData();
    
    // Initialize charts
    initializeCharts();
    
    // Add loading animations
    addLoadingAnimations();
}

function updateDateTime() {
    const now = new Date();
    
    // Update date
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const currentDate = document.getElementById('currentDate');
    if (currentDate) {
        currentDate.textContent = now.toLocaleDateString('en-US', dateOptions);
    }
    
    // Update time
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
    };
    const currentTime = document.getElementById('currentTime');
    if (currentTime) {
        currentTime.textContent = now.toLocaleTimeString('en-US', timeOptions);
    }
}

function initializeTradingModeToggle() {
    const toggle = document.getElementById('tradingModeToggle');
    if (toggle) {
        // Set initial state (paper = unchecked, live = checked)
        toggle.checked = currentTradingMode === 'live';
        
        // Load current mode from backend
        loadTradingModeStatus();
    }
}

function toggleTradingMode() {
    const toggle = document.getElementById('tradingModeToggle');
    if (!toggle) return;
    
    const newMode = toggle.checked ? 'live' : 'paper';
    
    // Simple mode switching without API calls for now
    currentTradingMode = newMode;
    
    // Show notification
    showNotification(`Switched to ${newMode.toUpperCase()} trading mode`, 'success');
    
    // Update dashboard data for new mode
    loadDashboardData();
    
    // Add visual feedback
    const toggleContainer = toggle.closest('.trading-mode-toggle');
    if (toggleContainer) {
        toggleContainer.classList.add('mode-switching');
        setTimeout(() => {
            toggleContainer.classList.remove('mode-switching');
        }, 300);
    }
}

async function loadTradingModeStatus() {
    try {
        // For now, use mock data - will be replaced with real API
        const mockStatus = {
            current_mode: 'paper',
            account_balance: 100000.00,
            session_active: true
        };
        
        currentTradingMode = mockStatus.current_mode;
        
        const toggle = document.getElementById('tradingModeToggle');
        if (toggle) {
            toggle.checked = mockStatus.current_mode === 'live';
        }
        
    } catch (error) {
        console.error('Error loading trading mode status:', error);
    }
}

async function loadDashboardData() {
    try {
        // Show loading state
        showLoadingState(true);
        
        // Mock data for now - will be replaced with real API calls
        const mockData = {
            portfolio_value: 125847.32,
            daily_pnl: 1247.85,
            total_pnl: 25847.32,
            win_rate: 78.5,
            market_status: 'Open',
            system_status: 'Active',
            databento_status: 'Connected',
            ibkr_status: 'Connected',
            ai_engine_status: 'Active',
            last_update: new Date().toLocaleTimeString('en-US', { hour12: false })
        };
        
        dashboardData = mockData;
        
        // Update UI with new data
        updateDashboardUI(mockData);
        
        // Update charts
        updateCharts(mockData);
        
        // Hide loading state
        showLoadingState(false);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
        showLoadingState(false);
    }
}

function updateDashboardUI(data) {
    // Update portfolio metrics
    updateMetric('portfolio-value', `$${data.portfolio_value.toLocaleString()}`);
    updateMetric('daily-pnl', `+$${data.daily_pnl.toLocaleString()}`);
    updateMetric('total-pnl', `+$${data.total_pnl.toLocaleString()}`);
    updateMetric('win-rate', `${data.win_rate}%`);
    
    // Update status indicators
    updateStatus('market-hours', data.market_status);
    updateStatus('system-status', data.system_status);
    updateStatus('databento-status', data.databento_status);
    updateStatus('ibkr-status', data.ibkr_status);
    updateStatus('ai-engine-status', data.ai_engine_status);
    updateStatus('last-update', data.last_update);
    
    // Update recent activity
    updateRecentActivity();
}

function updateMetric(metricId, value) {
    const element = document.querySelector(`[data-metric="${metricId}"]`);
    if (element) {
        element.textContent = value;
        element.classList.add('slide-up');
        setTimeout(() => element.classList.remove('slide-up'), 300);
    }
}

function updateStatus(statusId, value) {
    const element = document.getElementById(statusId);
    if (element) {
        element.textContent = value;
        
        // Update indicator
        const indicator = document.getElementById(statusId.replace('-status', '-indicator'));
        if (indicator) {
            indicator.classList.toggle('active', value === 'Active' || value === 'Connected' || value === 'Open');
        }
    }
}

function updateRecentActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Mock recent activity data
    const activities = [
        {
            time: '14:23:15',
            description: 'SPY CALL 445 executed',
            amount: '+$247.85',
            positive: true
        },
        {
            time: '14:18:42',
            description: 'QQQ PUT 380 closed',
            amount: '+$156.20',
            positive: true
        },
        {
            time: '14:12:30',
            description: 'IWM CALL 196 stopped out',
            amount: '-$89.50',
            positive: false
        }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item fade-in">
            <span class="activity-time">${activity.time}</span>
            <span class="activity-description">${activity.description}</span>
            <span class="activity-amount ${activity.positive ? 'positive' : 'negative'}">${activity.amount}</span>
        </div>
    `).join('');
}

function initializeCharts() {
    // Portfolio Performance Chart
    const portfolioCtx = document.getElementById('portfolioChart');
    if (portfolioCtx) {
        charts.portfolio = new Chart(portfolioCtx, {
            type: 'line',
            data: {
                labels: ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [123000, 123500, 124200, 124800, 125100, 125400, 125200, 125600, 125800, 125900, 125847],
                    borderColor: '#64ffda',
                    backgroundColor: 'rgba(100, 255, 218, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#b0b0b0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#b0b0b0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }
    
    // Daily P&L Chart
    const pnlCtx = document.getElementById('pnlChart');
    if (pnlCtx) {
        charts.pnl = new Chart(pnlCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                    label: 'Daily P&L',
                    data: [850, -320, 1200, 650, 1248],
                    backgroundColor: [
                        '#4CAF50',
                        '#f44336',
                        '#4CAF50',
                        '#4CAF50',
                        '#4CAF50'
                    ],
                    borderColor: [
                        '#45a049',
                        '#d32f2f',
                        '#45a049',
                        '#45a049',
                        '#45a049'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#b0b0b0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#b0b0b0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }
}

function updateCharts(data) {
    // Update portfolio chart with new data point
    if (charts.portfolio) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        charts.portfolio.data.labels.push(timeLabel);
        charts.portfolio.data.datasets[0].data.push(data.portfolio_value);
        
        // Keep only last 20 data points
        if (charts.portfolio.data.labels.length > 20) {
            charts.portfolio.data.labels.shift();
            charts.portfolio.data.datasets[0].data.shift();
        }
        
        charts.portfolio.update('none');
    }
}

function showLoadingState(show) {
    const elements = document.querySelectorAll('.portfolio-card, .status-item, .chart-container');
    elements.forEach(element => {
        element.classList.toggle('loading', show);
    });
}

function addLoadingAnimations() {
    // Add fade-in animation to all main sections
    const sections = document.querySelectorAll('.portfolio-section, .charts-section, .activity-section, .market-status-section');
    sections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
        section.classList.add('fade-in');
    });
}

function startRealTimeUpdates() {
    // Update dashboard data every 30 seconds
    setInterval(loadDashboardData, 30000);
    
    // Update time every second
    setInterval(updateDateTime, 1000);
    
    // Update status indicators every 10 seconds
    setInterval(updateStatusIndicators, 10000);
}

function updateStatusIndicators() {
    // Simulate real-time status updates
    const indicators = document.querySelectorAll('.status-indicator.active');
    indicators.forEach(indicator => {
        indicator.style.animation = 'none';
        setTimeout(() => {
            indicator.style.animation = 'pulse 2s infinite';
        }, 10);
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Notification styles
const notificationStyles = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 300px;
    animation: slideIn 0.3s ease;
    backdrop-filter: blur(10px);
}

.notification-success {
    background: rgba(76, 175, 80, 0.9);
    border: 1px solid rgba(76, 175, 80, 0.3);
}

.notification-error {
    background: rgba(244, 67, 54, 0.9);
    border: 1px solid rgba(244, 67, 54, 0.3);
}

.notification-info {
    background: rgba(33, 150, 243, 0.9);
    border: 1px solid rgba(33, 150, 243, 0.3);
}

.notification button {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.mode-switching {
    opacity: 0.7;
    transform: scale(0.98);
    transition: all 0.3s ease;
}
`;

// Add notification styles to page
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

