// Enhanced Dashboard JavaScript with Connection Monitoring and Data Reset

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    initializeCharts();
    setupConnectionMonitoring();
    setupDataResetControls();
    startRealTimeUpdates();
});

function initializeDashboard() {
    // Setup dashboard functionality
    updateConnectionStatus();
    loadDashboardData();
}

function setupConnectionMonitoring() {
    // Monitor connection status for all services
    setInterval(checkConnectionStatus, 10000); // Check every 10 seconds
}

function checkConnectionStatus() {
    // Check Databento connection
    fetch('/api/connections/databento')
        .then(response => response.json())
        .then(data => {
            updateConnectionIndicator('databento', data.status, data.message);
        })
        .catch(error => {
            updateConnectionIndicator('databento', 'error', 'Connection failed');
        });

    // Check IBKR connection
    fetch('/api/connections/ibkr')
        .then(response => response.json())
        .then(data => {
            updateConnectionIndicator('ibkr', data.status, data.message);
        })
        .catch(error => {
            updateConnectionIndicator('ibkr', 'error', 'Gateway unreachable');
        });

    // Check AI Engine status
    fetch('/api/ai/status')
        .then(response => response.json())
        .then(data => {
            updateConnectionIndicator('ai', data.status, data.mode);
        })
        .catch(error => {
            updateConnectionIndicator('ai', 'error', 'Engine offline');
        });

    // Update last update timestamp
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = new Date().toLocaleTimeString();
    }
}

function updateConnectionIndicator(service, status, message) {
    const statusElement = document.getElementById(`${service}-status`);
    const indicatorElement = document.getElementById(`${service}-indicator`);
    
    if (statusElement && indicatorElement) {
        statusElement.textContent = message;
        
        // Remove all status classes
        indicatorElement.classList.remove('active', 'warning', 'error', 'inactive', 'connecting');
        
        // Add appropriate status class
        switch(status) {
            case 'connected':
            case 'active':
                indicatorElement.classList.add('active');
                break;
            case 'connecting':
            case 'reconnecting':
                indicatorElement.classList.add('connecting');
                break;
            case 'warning':
            case 'degraded':
                indicatorElement.classList.add('warning');
                break;
            case 'error':
            case 'disconnected':
                indicatorElement.classList.add('error');
                break;
            default:
                indicatorElement.classList.add('inactive');
        }
    }
}

function setupDataResetControls() {
    // Setup data reset button handlers
    const resetPositionsBtn = document.getElementById('reset-positions');
    if (resetPositionsBtn) {
        resetPositionsBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to reset all position data? This action cannot be undone.')) {
                resetData('positions');
            }
        });
    }

    const resetSignalsBtn = document.getElementById('reset-signals');
    if (resetSignalsBtn) {
        resetSignalsBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to reset all signal data? This action cannot be undone.')) {
                resetData('signals');
            }
        });
    }

    const resetAnalyticsBtn = document.getElementById('reset-analytics');
    if (resetAnalyticsBtn) {
        resetAnalyticsBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to reset all analytics data? This action cannot be undone.')) {
                resetData('analytics');
            }
        });
    }

    const fullResetBtn = document.getElementById('full-reset');
    if (fullResetBtn) {
        fullResetBtn.addEventListener('click', function() {
            const confirmation = prompt('Type "RESET" to confirm full system reset (this will delete ALL data):');
            if (confirmation === 'RESET') {
                resetData('full');
            }
        });
    }
}

function resetData(type) {
    const button = document.getElementById(`${type === 'full' ? 'full-reset' : 'reset-' + type}`);
    if (!button) return;
    
    const originalText = button.textContent;
    
    button.textContent = 'Resetting...';
    button.disabled = true;

    fetch('/api/data/reset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: type })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} data reset successfully.`);
            // Refresh the page to show clean state
            if (type === 'full') {
                window.location.reload();
            } else {
                loadDashboardData();
            }
        } else {
            alert(`Reset failed: ${data.error}`);
        }
    })
    .catch(error => {
        alert(`Reset failed: ${error.message}`);
    })
    .finally(() => {
        button.textContent = originalText;
        button.disabled = false;
    });
}

function updateConnectionStatus() {
    // Initial connection status check
    checkConnectionStatus();
}

function loadDashboardData() {
    fetch('/api/dashboard')
        .then(response => response.json())
        .then(data => {
            updateDashboardMetrics(data);
        })
        .catch(error => {
            console.log('Dashboard data load failed:', error);
            // Use mock data when API is not available
            updateDashboardMetrics(getMockDashboardData());
        });
}

function getMockDashboardData() {
    return {
        portfolio: {
            value: 52450,
            daily_pnl: 890,
            total_return: 4.9,
            win_rate: 78.5,
            active_positions: 3,
            available_cash: 15750
        },
        market: {
            status: 'Open',
            hours: 'Regular Trading'
        },
        system: {
            status: 'Active',
            mode: 'Autonomous'
        }
    };
}

function updateDashboardMetrics(data) {
    // Update portfolio metrics
    if (data.portfolio) {
        const portfolioValue = document.getElementById('portfolio-value');
        if (portfolioValue) portfolioValue.textContent = `$${data.portfolio.value.toLocaleString()}`;
        
        const dailyPnl = document.getElementById('daily-pnl');
        if (dailyPnl) dailyPnl.textContent = `$${data.portfolio.daily_pnl.toLocaleString()}`;
        
        const totalReturn = document.getElementById('total-return');
        if (totalReturn) totalReturn.textContent = `${data.portfolio.total_return}%`;
        
        const winRate = document.getElementById('win-rate');
        if (winRate) winRate.textContent = `${data.portfolio.win_rate}%`;
        
        const activePositions = document.getElementById('active-positions');
        if (activePositions) activePositions.textContent = data.portfolio.active_positions;
        
        const availableCash = document.getElementById('available-cash');
        if (availableCash) availableCash.textContent = `$${data.portfolio.available_cash.toLocaleString()}`;
    }

    // Update market status
    if (data.market) {
        const marketHours = document.getElementById('market-hours');
        if (marketHours) marketHours.textContent = data.market.status;
        
        const systemStatus = document.getElementById('system-status');
        if (systemStatus) systemStatus.textContent = data.system.status;
    }
}

function initializeCharts() {
    // Portfolio Performance Chart
    const portfolioCtx = document.getElementById('portfolioChart');
    if (portfolioCtx) {
        new Chart(portfolioCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [50000, 50250, 50180, 50420, 50380, 50650, 50590, 50780, 50720, 50890, 50950],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { 
                        ticks: { color: '#E5E7EB' },
                        grid: { color: '#374151' }
                    },
                    x: { 
                        ticks: { color: '#E5E7EB' },
                        grid: { color: '#374151' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#E5E7EB' } }
                }
            }
        });
    }

    // Daily P&L Chart
    const pnlCtx = document.getElementById('pnlChart');
    if (pnlCtx) {
        new Chart(pnlCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                    label: 'Daily P&L',
                    data: [450, -120, 680, 320, 590],
                    backgroundColor: function(context) {
                        return context.parsed.y >= 0 ? '#10B981' : '#EF4444';
                    }
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { 
                        ticks: { color: '#E5E7EB' },
                        grid: { color: '#374151' }
                    },
                    x: { 
                        ticks: { color: '#E5E7EB' },
                        grid: { color: '#374151' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#E5E7EB' } }
                }
            }
        });
    }

    // Win Rate Chart
    const winRateCtx = document.getElementById('winRateChart');
    if (winRateCtx) {
        new Chart(winRateCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Win Rate %',
                    data: [72, 78, 75, 82],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { 
                        min: 60,
                        max: 90,
                        ticks: { color: '#E5E7EB' },
                        grid: { color: '#374151' }
                    },
                    x: { 
                        ticks: { color: '#E5E7EB' },
                        grid: { color: '#374151' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#E5E7EB' } }
                }
            }
        });
    }
}

function startRealTimeUpdates() {
    // Update dashboard data every 30 seconds
    setInterval(loadDashboardData, 30000);
    
    // Update connection status every 10 seconds
    setInterval(checkConnectionStatus, 10000);
}

// Export functions for use in other scripts
window.dashboardFunctions = {
    updateConnectionIndicator,
    resetData,
    loadDashboardData,
    checkConnectionStatus
};


// Trading Mode Management
let currentTradingMode = 'paper';

async function switchTradingMode(mode) {
    try {
        // Show loading state
        const modeCard = document.querySelector('.trading-mode-card');
        modeCard.classList.add('mode-switching');
        
        // Update UI immediately for responsiveness
        updateModeUI(mode);
        
        // Call API to switch mode
        const response = await fetch('/api/trading-mode/switch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mode: mode })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to switch mode: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            currentTradingMode = mode;
            
            // Update UI with server response
            updateModeUI(mode, result.new_status);
            
            // Show success animation
            modeCard.classList.add('mode-switch-success');
            setTimeout(() => {
                modeCard.classList.remove('mode-switch-success');
            }, 500);
            
            // Show notification
            showNotification(`Successfully switched to ${mode.toUpperCase()} trading`, 'success');
            
            // Refresh dashboard data for new mode
            await loadDashboardData();
            
        } else {
            throw new Error(result.message || 'Failed to switch trading mode');
        }
        
    } catch (error) {
        console.error('Error switching trading mode:', error);
        
        // Revert UI to previous mode
        updateModeUI(currentTradingMode);
        
        showNotification(`Failed to switch to ${mode} mode: ${error.message}`, 'error');
        
    } finally {
        // Remove loading state
        const modeCard = document.querySelector('.trading-mode-card');
        modeCard.classList.remove('mode-switching');
    }
}

function updateModeUI(mode, statusData = null) {
    // Update mode indicator
    const modeIndicator = document.getElementById('tradingModeIndicator');
    const currentModeSpan = document.getElementById('currentMode');
    
    if (modeIndicator && currentModeSpan) {
        modeIndicator.setAttribute('data-mode', mode);
        currentModeSpan.textContent = mode.toUpperCase();
    }
    
    // Update buttons
    const paperBtn = document.getElementById('paperModeBtn');
    const liveBtn = document.getElementById('liveModeBtn');
    
    if (paperBtn && liveBtn) {
        paperBtn.classList.toggle('active', mode === 'paper');
        liveBtn.classList.toggle('active', mode === 'live');
    }
    
    // Update account balance and session info if provided
    if (statusData) {
        const accountBalance = document.getElementById('accountBalance');
        const sessionInfo = document.getElementById('sessionInfo');
        
        if (accountBalance) {
            accountBalance.textContent = `$${statusData.account_balance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
        
        if (sessionInfo) {
            sessionInfo.textContent = statusData.current_session_id ? 'Active' : 'Inactive';
        }
    }
}

async function loadTradingModeStatus() {
    try {
        const response = await fetch('/api/trading-mode/status');
        
        if (!response.ok) {
            throw new Error(`Failed to load trading mode status: ${response.statusText}`);
        }
        
        const status = await response.json();
        
        currentTradingMode = status.current_mode;
        updateModeUI(status.current_mode, status);
        
        return status;
        
    } catch (error) {
        console.error('Error loading trading mode status:', error);
        return null;
    }
}

async function loadModeSpecificAnalytics(mode = null) {
    try {
        const targetMode = mode || currentTradingMode;
        const response = await fetch(`/api/trading-mode/analytics?mode=${targetMode}&days=30`);
        
        if (!response.ok) {
            throw new Error(`Failed to load analytics: ${response.statusText}`);
        }
        
        const analytics = await response.json();
        return analytics;
        
    } catch (error) {
        console.error('Error loading mode-specific analytics:', error);
        return null;
    }
}

async function loadModeComparison() {
    try {
        const response = await fetch('/api/trading-mode/analytics/comparison?days=30');
        
        if (!response.ok) {
            throw new Error(`Failed to load mode comparison: ${response.statusText}`);
        }
        
        const comparison = await response.json();
        return comparison;
        
    } catch (error) {
        console.error('Error loading mode comparison:', error);
        return null;
    }
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

// Enhanced dashboard data loading with mode awareness
async function loadDashboardData() {
    try {
        // Load trading mode status first
        await loadTradingModeStatus();
        
        // Load mode-specific analytics
        const analytics = await loadModeSpecificAnalytics();
        
        if (analytics) {
            // Update dashboard with mode-specific data
            updateDashboardMetrics(analytics);
        }
        
        // Load other dashboard data...
        await Promise.all([
            updateConnectionStatus(),
            loadPortfolioData(),
            loadRecentSignals(),
            loadMarketStatus()
        ]);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardMetrics(analytics) {
    // Update portfolio value
    const portfolioValue = document.querySelector('[data-metric="portfolio-value"]');
    if (portfolioValue) {
        portfolioValue.textContent = `$${analytics.current_portfolio_value.toLocaleString()}`;
    }
    
    // Update total P&L
    const totalPnL = document.querySelector('[data-metric="total-pnl"]');
    if (totalPnL) {
        totalPnL.textContent = `$${analytics.total_pnl.toLocaleString()}`;
        totalPnL.className = analytics.total_pnl >= 0 ? 'positive' : 'negative';
    }
    
    // Update win rate
    const winRate = document.querySelector('[data-metric="win-rate"]');
    if (winRate) {
        winRate.textContent = `${analytics.win_rate.toFixed(1)}%`;
    }
    
    // Update trade count
    const tradeCount = document.querySelector('[data-metric="trade-count"]');
    if (tradeCount) {
        tradeCount.textContent = analytics.total_trades.toString();
    }
}

// Initialize trading mode functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load initial trading mode status
    loadTradingModeStatus();
    
    // Set up periodic updates
    setInterval(loadTradingModeStatus, 30000); // Update every 30 seconds
});

// Add CSS for notifications
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
}

.notification-success {
    background: linear-gradient(135deg, #4CAF50, #45a049);
}

.notification-error {
    background: linear-gradient(135deg, #f44336, #d32f2f);
}

.notification-info {
    background: linear-gradient(135deg, #2196F3, #1976D2);
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
`;

// Add notification styles to page
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

