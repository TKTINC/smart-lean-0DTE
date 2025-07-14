# Smart-Lean-0DTE Page Functionality Guide

## Overview

This document provides a comprehensive explanation of each page in the Smart-Lean-0DTE system, detailing what each page does, what each section signifies, and how they work together to provide autonomous 0DTE options trading capabilities.

## System Architecture Summary

The Smart-Lean-0DTE system operates as a fully autonomous trading platform with the following key components:

- **Frontend**: HTML/CSS/JavaScript interface (6 pages)
- **Backend**: FastAPI server with autonomous trading services
- **Data Sources**: Databento (market data) + IBKR (execution)
- **AI Engine**: Signal generation and self-learning algorithms
- **Risk Management**: Automated position sizing and stop-loss controls

---

## Page 1: Dashboard (index.html)

### Purpose
The Dashboard serves as the central command center, providing real-time overview of portfolio performance, system status, and key metrics.

### Sections Explained

#### **Portfolio Overview (Top Section)**
- **Total Portfolio Value**: Current account value including cash and positions
- **Today's P&L**: Profit/Loss for the current trading session
- **Total Return**: Cumulative performance since system inception
- **Win Rate**: Percentage of profitable trades
- **Active Positions**: Number of currently open option positions
- **Available Cash**: Buying power available for new trades

#### **Performance Charts (Middle Section)**
- **Portfolio Value Chart**: Time series showing account growth/decline
- **Daily P&L Chart**: Bar chart of daily profit/loss performance
- **Win Rate Trend**: Line chart showing win rate evolution over time

#### **Recent Trades Table (Lower Section)**
- **Real-time Trade Log**: Most recent executed trades with:
  - Symbol, option type (CALL/PUT), strike price
  - Entry/exit prices and timestamps
  - P&L for each trade
  - Trade outcome (SUCCESS/FAILURE)

#### **Market Status (Bottom Section)**
- **Market Hours**: Current market session status
- **System Status**: Autonomous trading engine status
- **Connection Status**: Data feed and broker connectivity
- **Last Update**: Timestamp of most recent data refresh

### Data Flow
All dashboard data is populated via REST API calls to the backend (`/api/dashboard`), which aggregates:
- Portfolio data from IBKR account
- Trade history from internal database
- Real-time market status from Databento
- System performance metrics

---

## Page 2: Trading (trading.html)

### Purpose
The Trading page provides manual oversight and control over the autonomous trading system, allowing users to monitor active positions and intervene when necessary.

### Sections Explained

#### **Trading Controls (Top Section)**
- **Emergency Stop**: Immediately halts all trading and closes positions
- **Pause/Resume**: Temporarily suspends autonomous trading
- **Auto Mode Toggle**: Enables/disables fully autonomous operation
- **Risk Level**: Adjusts position sizing and risk parameters

#### **Signal Queue (Upper Middle)**
- **Pending Signals**: AI-generated trading signals awaiting execution
- **Signal Details**: Strategy type, confidence level, entry/target prices
- **Manual Override**: Ability to approve/reject individual signals
- **Queue Status**: Number of signals in pipeline

#### **Active Positions Table (Middle Section)**
- **Current Holdings**: All open option positions with:
  - Symbol, type (CALL/PUT), strike, expiration
  - Quantity, entry price, current price
  - Unrealized P&L (color-coded: green=profit, red=loss)
  - Greeks (Delta, Gamma, Theta, Vega)
  - Close buttons for manual position management

#### **Call vs Put Performance (Lower Section)**
- **Doughnut Chart**: Visual breakdown of Call vs Put performance
- **Performance Metrics**: Win rates and average returns by option type
- **Volume Analysis**: Trading volume distribution

#### **Strategy Performance Charts (Bottom)**
- **Bar Charts**: Performance by strategy type (Momentum, Mean Reversion, etc.)
- **Win Rate Comparison**: Success rates across different strategies
- **P&L Attribution**: Profit contribution by strategy

### Data Flow
Trading page data comes from:
- `/api/positions` - Current positions from IBKR
- `/api/signals/queue` - Pending signals from AI engine
- `/api/trading/status` - System operational status
- Real-time updates every 10 seconds

---

## Page 3: Analytics (analytics.html)

### Purpose
The Analytics page provides deep performance analysis and historical insights to evaluate system effectiveness and identify optimization opportunities.

### Sections Explained

#### **Performance Metrics (Top Section)**
- **Total Return**: Cumulative percentage gain since inception
- **Sharpe Ratio**: Risk-adjusted return measure (>2.0 is excellent)
- **Max Drawdown**: Largest peak-to-trough decline
- **Win Rate**: Overall percentage of profitable trades
- **Profit Factor**: Ratio of gross profit to gross loss
- **Calmar Ratio**: Annual return divided by max drawdown

#### **Call vs Put Analysis (Upper Middle)**
- **Separate Statistics**: Independent performance tracking for calls and puts
- **Trade Counts**: Number of trades executed for each option type
- **Win Rates**: Success percentages for calls vs puts
- **Average Returns**: Mean profit per trade by option type
- **Total P&L**: Cumulative profit contribution

#### **Performance Charts (Middle Section)**
- **Equity Curve**: Portfolio value progression over time
- **Daily Returns**: Distribution of daily P&L results
- **Call vs Put Performance**: Comparative analysis chart
- **Monthly Returns**: Heat map of monthly performance

#### **Strategy Breakdown (Lower Middle)**
- **Strategy Performance Table**: Detailed metrics by strategy type
- **Win Rate by Strategy**: Success rates for each approach
- **P&L Attribution**: Profit contribution by strategy
- **Trade Count Distribution**: Volume by strategy type

#### **AI Model Performance (Lower Section)**
- **Model Accuracy**: Percentage of correct predictions
- **Prediction Confidence**: Average confidence levels
- **Adaptation Rate**: How quickly the model learns
- **Signal Strength**: Quality of generated signals
- **Market Regime Detection**: Ability to identify market conditions
- **Data Quality**: Integrity of input data feeds

#### **Risk Analysis (Bottom Section)**
- **Value at Risk (VaR)**: Potential loss at 95% confidence level
- **Expected Shortfall**: Average loss beyond VaR threshold
- **Beta vs SPY**: Portfolio correlation to market
- **Alpha**: Excess return above market performance
- **Information Ratio**: Risk-adjusted active return
- **Volatility**: Standard deviation of returns

### Data Flow
Analytics data aggregated from:
- Historical trade database
- Real-time portfolio metrics
- AI model performance logs
- Risk calculation engine

---

## Page 4: Signals (signals.html)

### Purpose
The Signals page provides comprehensive visibility into the AI signal generation process, allowing users to monitor signal quality, execution decisions, and historical performance.

### Sections Explained

#### **Signal Generation Status (Top Section)**
- **Active Signals**: Number of currently pending signals
- **Signal Accuracy**: Historical percentage of successful signals
- **Average Confidence**: Mean confidence level of generated signals
- **Signals Today**: Count of signals generated in current session

#### **Signal Filters (Upper Section)**
- **Symbol Filter**: Filter signals by underlying (SPY, QQQ, IWM)
- **Strategy Filter**: Filter by signal generation strategy
- **Option Type Filter**: Show calls only, puts only, or both
- **Confidence Threshold**: Minimum confidence level slider
- **Time Range**: Historical period for signal display

#### **Real-time Signals (Middle Section)**
Each signal displays:
- **Symbol & Strike**: Underlying and option strike price
- **Option Type**: CALL or PUT with color coding
- **Confidence Level**: AI confidence percentage (70-95%)
- **Strategy**: Signal generation method (Momentum, Mean Reversion, etc.)
- **Entry/Target Prices**: Recommended entry and profit target
- **Technical Indicators**: Supporting data (RSI, Volume, Delta, etc.)
- **Action Buttons**: Execute or Ignore signal controls

#### **Signal Performance Charts (Lower Middle)**
- **Signal Generation Rate**: Frequency of signal creation over time
- **Signal Accuracy by Strategy**: Success rates for each strategy type
- **Confidence vs Outcome**: Correlation between confidence and success

#### **Historical Signals Table (Lower Section)**
Complete log of past signals showing:
- **Timestamp**: When signal was generated
- **Signal Details**: Symbol, type, strike, strategy
- **Confidence Level**: AI confidence at generation
- **Entry/Exit Prices**: Actual execution prices
- **P&L**: Profit/loss result
- **Outcome**: SUCCESS/FAILURE/PENDING status

#### **Signal Statistics (Bottom Section)**
- **Performance by Strategy**: Win rates for each strategy type
- **Performance by Option Type**: Call vs Put success rates
- **Performance by Confidence**: Success rates by confidence bands
- **Overall Metrics**: Average P&L, best/worst signals, Sharpe ratio

### Data Flow
Signals data sourced from:
- `/api/signals/realtime` - Live signal generation
- `/api/signals/history` - Historical signal database
- `/api/signals/statistics` - Performance analytics
- AI signal generation engine with real-time updates

---

## Page 5: Strikes (strikes.html)

### Purpose
The Strikes page provides detailed analysis of individual option strikes, showing price movements, Greeks, and performance for ATM and surrounding strikes with 2-minute interval precision.

### Sections Explained

#### **Strike Analysis Controls (Top Section)**
- **Symbol Selection**: Choose underlying (SPY, QQQ, IWM)
- **Expiration**: Select option expiration (0DTE, 1DTE, etc.)
- **Time Range**: Historical period for chart display
- **Chart Type**: Switch between Price, Volume, IV, Greeks
- **Refresh Button**: Manual data update trigger

#### **Current Market Info (Upper Section)**
- **Current Price**: Real-time underlying price with change
- **ATM Strike**: Closest strike to current price
- **IV Rank**: Implied volatility percentile ranking
- **Time to Expiry**: Countdown to option expiration

#### **Strike Chain Overview (Upper Middle)**
Complete option chain table (ATM ± 10 strikes) showing:
- **Calls Section**: Bid, Ask, Last, Volume, IV for call options
- **Strike Column**: Strike prices with ATM highlighted
- **Puts Section**: IV, Volume, Last, Ask, Bid for put options
- **Color Coding**: Calls (green background), Puts (blue background)
- **ATM Highlighting**: Special formatting for at-the-money strike

#### **2-Minute Interval Price Charts (Main Section)**

**Featured ATM Chart**:
- **Combined Display**: Both call and put prices for ATM strike
- **Chart Controls**: Toggle between Both/Call Only/Put Only
- **2-Minute Intervals**: Precise price movement tracking
- **Time Series**: Full trading day progression

**Individual Strike Charts Grid**:
- **ITM Calls**: In-the-money call option charts (5 strikes)
- **OTM Calls**: Out-of-the-money call option charts (5 strikes)
- **ITM Puts**: In-the-money put option charts (5 strikes)
- **OTM Puts**: Out-of-the-money put option charts (5 strikes)
- **Price Movements**: 2-minute interval tracking for each strike
- **Color Coding**: Green for calls, blue for puts

#### **Strike Performance Summary (Lower Middle)**
- **Best Performing Call**: Highest percentage gainer with volume
- **Best Performing Put**: Highest percentage gainer with volume
- **Highest Volume Call**: Most actively traded call option
- **Highest Volume Put**: Most actively traded put option
- **Performance Metrics**: Price changes and trading volumes

#### **Greeks Analysis (Bottom Section)**
Four separate charts showing:
- **Delta by Strike**: Price sensitivity across strikes
- **Gamma by Strike**: Delta sensitivity (acceleration)
- **Theta by Strike**: Time decay impact
- **Vega by Strike**: Volatility sensitivity
- **Strike Range**: All strikes from ATM-10 to ATM+10

### Data Flow
Strikes page data from:
- `/api/strikes/chain` - Complete option chain data
- `/api/strikes/prices` - 2-minute interval price history
- `/api/strikes/greeks` - Greeks calculations
- Real-time market data feed with 30-second updates

---

## Page 6: Settings (settings.html)

### Purpose
The Settings page provides configuration controls for the autonomous trading system, risk parameters, data connections, and system preferences.

### Sections Explained

#### **Trading Configuration (Top Section)**
- **Auto Trading**: Enable/disable autonomous operation
- **Risk Level**: Conservative/Moderate/Aggressive position sizing
- **Max Positions**: Maximum number of concurrent positions
- **Position Size**: Dollar amount per trade
- **Stop Loss**: Automatic loss limit percentage
- **Take Profit**: Automatic profit target percentage

#### **Strategy Settings (Upper Middle)**
- **Strategy Weights**: Allocation percentages by strategy type
- **Confidence Thresholds**: Minimum confidence for signal execution
- **Strategy Enable/Disable**: Toggle individual strategies on/off
- **Learning Rate**: AI model adaptation speed

#### **Data Connections (Middle Section)**
- **Databento Configuration**: API key and connection settings
- **IBKR Configuration**: Gateway settings and credentials
- **Connection Status**: Real-time connectivity indicators
- **Data Quality Monitoring**: Feed reliability metrics

#### **Risk Management (Lower Middle)**
- **Portfolio Limits**: Maximum exposure and concentration
- **Drawdown Limits**: Automatic trading halt thresholds
- **Time-based Rules**: Trading hour restrictions
- **Emergency Controls**: Panic stop and position liquidation

#### **System Preferences (Lower Section)**
- **Notification Settings**: Alert preferences and channels
- **Display Options**: Chart preferences and refresh rates
- **Data Retention**: Historical data storage settings
- **Backup Configuration**: Data backup and recovery options

#### **Advanced Settings (Bottom Section)**
- **API Endpoints**: Backend service URLs
- **Logging Levels**: Debug and monitoring settings
- **Performance Tuning**: System optimization parameters
- **Development Mode**: Testing and debugging options

### Data Flow
Settings data managed through:
- `/api/settings/trading` - Trading configuration
- `/api/settings/connections` - Data feed settings
- `/api/settings/risk` - Risk management parameters
- Local storage for user preferences

---

## Data Integration Summary

### Mock Data vs Live Data
- **Current State**: All displayed data is simulated for demonstration
- **Live Data Transition**: Once Databento and IBKR are connected, all mock data will be replaced
- **Data Quality**: System will exclusively use live data to maintain integrity
- **No Fallback**: No reversion to mock data once live feeds are established

### Automation Level
- **Fully Autonomous**: No user intervention required for normal operation
- **Self-Learning**: AI models continuously adapt and improve
- **Signal Generation**: Automatic based on market conditions
- **Trade Execution**: Automated through IBKR integration
- **Risk Management**: Automatic position sizing and stop-loss execution

### User Interaction Points
- **Monitoring**: Users observe system performance through dashboards
- **Override Controls**: Manual intervention capabilities when needed
- **Configuration**: Risk parameters and strategy settings
- **Emergency Controls**: Stop trading and liquidate positions if required

This comprehensive system provides institutional-grade autonomous trading capabilities while maintaining full transparency and control for users.

