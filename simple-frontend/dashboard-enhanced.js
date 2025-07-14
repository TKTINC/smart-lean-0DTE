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

