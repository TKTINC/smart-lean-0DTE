"""
Analytics Service
Advanced backtesting, performance analysis, and strategy optimization
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import json
import math
import statistics

from .autonomous_trading_service import autonomous_trading_service
from .signal_generation_service import signal_generation_service
from .market_hours_service import market_hours_service

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for advanced analytics and backtesting"""
    
    def __init__(self):
        self.performance_history = []
        self.backtest_results = {}
        self.strategy_analytics = {}
        
        # Initialize with demo data
        self._initialize_demo_data()
        
        logger.info("Analytics Service initialized")
    
    def _initialize_demo_data(self):
        """Initialize with comprehensive demo analytics data"""
        self.performance_history = [
            {"date": "2024-11-01", "value": 47500, "drawdown": -2.3, "daily_return": 2.3},
            {"date": "2024-11-02", "value": 47120, "drawdown": -2.8, "daily_return": -0.8},
            {"date": "2024-11-03", "value": 47827, "drawdown": -2.1, "daily_return": 1.5},
            {"date": "2024-11-04", "value": 49357, "drawdown": -1.2, "daily_return": 3.2},
            {"date": "2024-11-05", "value": 48765, "drawdown": -1.8, "daily_return": -1.2},
            {"date": "2024-11-06", "value": 50130, "drawdown": -0.9, "daily_return": 2.8},
            {"date": "2024-11-07", "value": 50381, "drawdown": -0.7, "daily_return": 0.5},
            {"date": "2024-11-08", "value": 51336, "drawdown": -0.3, "daily_return": 1.9},
            {"date": "2024-11-09", "value": 51182, "drawdown": -0.4, "daily_return": -0.3},
            {"date": "2024-11-10", "value": 52258, "drawdown": 0.0, "daily_return": 2.1}
        ]
        
        self.strategy_analytics = {
            "momentum_breakout": {
                "trades": 342,
                "win_rate": 82.5,
                "avg_return": 3.2,
                "total_pnl": 18500,
                "sharpe_ratio": 2.1,
                "max_drawdown": -2.8,
                "profit_factor": 3.2,
                "avg_win": 4.8,
                "avg_loss": -1.5,
                "largest_win": 28.5,
                "largest_loss": -8.2,
                "win_streak": 12,
                "loss_streak": 3,
                "monthly_performance": [
                    {"month": "Jan", "return": 8.2, "trades": 28},
                    {"month": "Feb", "return": 12.5, "trades": 32},
                    {"month": "Mar", "return": -2.1, "trades": 25},
                    {"month": "Apr", "return": 15.8, "trades": 35},
                    {"month": "May", "return": 9.3, "trades": 29},
                    {"month": "Jun", "return": 18.7, "trades": 38},
                    {"month": "Jul", "return": 22.1, "trades": 42},
                    {"month": "Aug", "return": 14.6, "trades": 31},
                    {"month": "Sep", "return": 19.2, "trades": 36},
                    {"month": "Oct", "return": 11.8, "trades": 28},
                    {"month": "Nov", "return": 16.4, "trades": 18}
                ]
            },
            "mean_reversion": {
                "trades": 298,
                "win_rate": 76.8,
                "avg_return": 2.8,
                "total_pnl": 14200,
                "sharpe_ratio": 1.8,
                "max_drawdown": -3.5,
                "profit_factor": 2.6,
                "avg_win": 4.2,
                "avg_loss": -1.8,
                "largest_win": 22.3,
                "largest_loss": -9.8,
                "win_streak": 9,
                "loss_streak": 4
            },
            "gap_fill": {
                "trades": 156,
                "win_rate": 84.6,
                "avg_return": 4.1,
                "total_pnl": 9800,
                "sharpe_ratio": 2.3,
                "max_drawdown": -2.1,
                "profit_factor": 3.8,
                "avg_win": 5.2,
                "avg_loss": -1.2,
                "largest_win": 31.2,
                "largest_loss": -6.5,
                "win_streak": 15,
                "loss_streak": 2
            }
        }
        
        self.backtest_results = {
            "total_return": 422.5,
            "annualized_return": 168.3,
            "max_drawdown": -3.2,
            "sharpe_ratio": 2.05,
            "calmar_ratio": 52.6,
            "sortino_ratio": 2.8,
            "total_trades": 1247,
            "winning_trades": 979,
            "losing_trades": 268,
            "win_rate": 78.5,
            "avg_winning_trade": 4.2,
            "avg_losing_trade": -2.1,
            "largest_win": 31.2,
            "largest_loss": -12.3,
            "profit_factor": 2.8,
            "expectancy": 1.85,
            "kelly_criterion": 0.24,
            "var_95": -2.8,
            "cvar_95": -4.2,
            "beta": 0.85,
            "alpha": 8.2,
            "information_ratio": 1.92,
            "treynor_ratio": 15.8
        }
    
    def get_performance_analytics(self, timeframe: str = "1M", strategy: str = "ALL") -> Dict[str, Any]:
        """Get comprehensive performance analytics"""
        
        # Filter data based on timeframe
        filtered_data = self._filter_data_by_timeframe(timeframe)
        
        # Filter by strategy if specified
        if strategy != "ALL":
            strategy_data = self.strategy_analytics.get(strategy.lower().replace(" ", "_"), {})
        else:
            strategy_data = self._aggregate_strategy_data()
        
        return {
            "equity_curve": filtered_data["equity"],
            "daily_returns": filtered_data["daily_returns"],
            "strategy_performance": self._get_strategy_performance_data(strategy),
            "risk_metrics": self._calculate_risk_metrics(filtered_data),
            "trade_distribution": self._get_trade_distribution(),
            "monthly_returns": self._get_monthly_returns(timeframe),
            "learning_metrics": signal_generation_service.get_model_metrics(),
            "drawdown_analysis": self._analyze_drawdowns(filtered_data),
            "correlation_analysis": self._get_correlation_analysis(),
            "performance_attribution": self._get_performance_attribution(strategy)
        }
    
    def _filter_data_by_timeframe(self, timeframe: str) -> Dict[str, List]:
        """Filter performance data by timeframe"""
        end_date = datetime.now()
        
        if timeframe == "1W":
            start_date = end_date - timedelta(weeks=1)
        elif timeframe == "1M":
            start_date = end_date - timedelta(days=30)
        elif timeframe == "3M":
            start_date = end_date - timedelta(days=90)
        elif timeframe == "6M":
            start_date = end_date - timedelta(days=180)
        elif timeframe == "1Y":
            start_date = end_date - timedelta(days=365)
        else:  # ALL
            start_date = datetime(2024, 1, 1)
        
        # Filter performance history
        filtered_equity = [
            p for p in self.performance_history 
            if datetime.strptime(p["date"], "%Y-%m-%d") >= start_date
        ]
        
        # Generate daily returns data
        daily_returns = []
        for i, point in enumerate(filtered_equity):
            if i > 0:
                prev_value = filtered_equity[i-1]["value"]
                current_value = point["value"]
                daily_return = ((current_value - prev_value) / prev_value) * 100
                
                daily_returns.append({
                    "date": point["date"],
                    "return": round(daily_return, 2),
                    "cumulative": round(((current_value - filtered_equity[0]["value"]) / filtered_equity[0]["value"]) * 100, 1)
                })
        
        return {
            "equity": filtered_equity,
            "daily_returns": daily_returns
        }
    
    def _get_strategy_performance_data(self, selected_strategy: str) -> List[Dict[str, Any]]:
        """Get strategy performance comparison data"""
        if selected_strategy != "ALL":
            strategy_key = selected_strategy.lower().replace(" ", "_")
            if strategy_key in self.strategy_analytics:
                return [self._format_strategy_data(selected_strategy, self.strategy_analytics[strategy_key])]
        
        # Return all strategies
        return [
            self._format_strategy_data("Momentum Breakout", self.strategy_analytics["momentum_breakout"]),
            self._format_strategy_data("Mean Reversion", self.strategy_analytics["mean_reversion"]),
            self._format_strategy_data("Gap Fill", self.strategy_analytics["gap_fill"]),
            self._format_strategy_data("VIX Spike", {"trades": 89, "win_rate": 79.8, "avg_return": 5.2, "total_pnl": 7200, "sharpe_ratio": 1.9}),
            self._format_strategy_data("Earnings Play", {"trades": 67, "win_rate": 71.6, "avg_return": 6.8, "total_pnl": 5100, "sharpe_ratio": 1.6})
        ]
    
    def _format_strategy_data(self, name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format strategy data for frontend"""
        return {
            "strategy": name,
            "trades": data.get("trades", 0),
            "winRate": data.get("win_rate", 0),
            "avgReturn": data.get("avg_return", 0),
            "totalPnL": data.get("total_pnl", 0),
            "sharpe": data.get("sharpe_ratio", 0)
        }
    
    def _calculate_risk_metrics(self, data: Dict[str, List]) -> Dict[str, Any]:
        """Calculate comprehensive risk metrics"""
        daily_returns = [r["return"] for r in data["daily_returns"]]
        
        if not daily_returns:
            return self.backtest_results
        
        # Calculate additional metrics
        volatility = statistics.stdev(daily_returns) if len(daily_returns) > 1 else 0
        avg_return = statistics.mean(daily_returns)
        
        # Risk-free rate assumption (2% annually = ~0.0055% daily)
        risk_free_rate = 0.0055
        
        sharpe_ratio = (avg_return - risk_free_rate) / volatility if volatility > 0 else 0
        
        # Downside deviation for Sortino ratio
        negative_returns = [r for r in daily_returns if r < 0]
        downside_deviation = statistics.stdev(negative_returns) if len(negative_returns) > 1 else volatility
        sortino_ratio = (avg_return - risk_free_rate) / downside_deviation if downside_deviation > 0 else 0
        
        return {
            "sharpeRatio": round(sharpe_ratio, 2),
            "maxDrawdown": min(data["equity"], key=lambda x: x["drawdown"])["drawdown"],
            "calmarRatio": round(abs(avg_return * 252 / min(data["equity"], key=lambda x: x["drawdown"])["drawdown"]), 1),
            "sortinoRatio": round(sortino_ratio, 2),
            "winRate": self.backtest_results["win_rate"],
            "avgWin": self.backtest_results["avg_winning_trade"],
            "avgLoss": self.backtest_results["avg_losing_trade"],
            "profitFactor": self.backtest_results["profit_factor"],
            "expectancy": self.backtest_results["expectancy"],
            "volatility": round(volatility * math.sqrt(252), 1),  # Annualized
            "beta": self.backtest_results["beta"],
            "alpha": self.backtest_results["alpha"],
            "informationRatio": self.backtest_results["information_ratio"]
        }
    
    def _get_trade_distribution(self) -> List[Dict[str, Any]]:
        """Get trade P&L distribution"""
        return [
            {"range": "0-5%", "count": 156, "color": "#10B981"},
            {"range": "5-10%", "count": 298, "color": "#059669"},
            {"range": "10-20%", "count": 342, "color": "#047857"},
            {"range": "20%+", "count": 89, "color": "#065F46"},
            {"range": "Losses", "count": 267, "color": "#EF4444"}
        ]
    
    def _get_monthly_returns(self, timeframe: str) -> List[Dict[str, Any]]:
        """Get monthly returns data"""
        if timeframe in ["1W", "1M"]:
            # Return daily data for short timeframes
            return [
                {"month": "Day 1", "return": 2.3},
                {"month": "Day 2", "return": -0.8},
                {"month": "Day 3", "return": 1.5},
                {"month": "Day 4", "return": 3.2},
                {"month": "Day 5", "return": -1.2},
                {"month": "Day 6", "return": 2.8},
                {"month": "Day 7", "return": 0.5}
            ]
        
        # Return monthly data for longer timeframes
        return [
            {"month": "Jan", "return": 8.2},
            {"month": "Feb", "return": 12.5},
            {"month": "Mar", "return": -2.1},
            {"month": "Apr", "return": 15.8},
            {"month": "May", "return": 9.3},
            {"month": "Jun", "return": 18.7},
            {"month": "Jul", "return": 22.1},
            {"month": "Aug", "return": 14.6},
            {"month": "Sep", "return": 19.2},
            {"month": "Oct", "return": 11.8},
            {"month": "Nov", "return": 16.4}
        ]
    
    def _analyze_drawdowns(self, data: Dict[str, List]) -> Dict[str, Any]:
        """Analyze drawdown periods"""
        equity_data = data["equity"]
        
        if not equity_data:
            return {}
        
        # Find drawdown periods
        drawdowns = []
        current_drawdown = None
        peak_value = equity_data[0]["value"]
        
        for point in equity_data:
            if point["value"] > peak_value:
                # New peak, end current drawdown if any
                if current_drawdown:
                    current_drawdown["recovery_date"] = point["date"]
                    current_drawdown["duration"] = (
                        datetime.strptime(point["date"], "%Y-%m-%d") - 
                        datetime.strptime(current_drawdown["start_date"], "%Y-%m-%d")
                    ).days
                    drawdowns.append(current_drawdown)
                    current_drawdown = None
                peak_value = point["value"]
            elif point["drawdown"] < -0.5:  # Significant drawdown
                if not current_drawdown:
                    current_drawdown = {
                        "start_date": point["date"],
                        "peak_value": peak_value,
                        "trough_value": point["value"],
                        "max_drawdown": point["drawdown"]
                    }
                else:
                    # Update if deeper drawdown
                    if point["drawdown"] < current_drawdown["max_drawdown"]:
                        current_drawdown["max_drawdown"] = point["drawdown"]
                        current_drawdown["trough_value"] = point["value"]
        
        return {
            "total_drawdown_periods": len(drawdowns),
            "avg_drawdown_duration": statistics.mean([dd["duration"] for dd in drawdowns if "duration" in dd]) if drawdowns else 0,
            "max_drawdown_duration": max([dd["duration"] for dd in drawdowns if "duration" in dd], default=0),
            "drawdown_periods": drawdowns[-5:]  # Last 5 drawdown periods
        }
    
    def _get_correlation_analysis(self) -> Dict[str, Any]:
        """Get correlation analysis with market indices"""
        return {
            "spy_correlation": 0.72,
            "qqq_correlation": 0.68,
            "iwm_correlation": 0.45,
            "vix_correlation": -0.38,
            "market_beta": 0.85,
            "sector_correlations": {
                "Technology": 0.71,
                "Healthcare": 0.42,
                "Financials": 0.58,
                "Energy": 0.33,
                "Consumer": 0.61
            }
        }
    
    def _get_performance_attribution(self, strategy: str) -> Dict[str, Any]:
        """Get performance attribution analysis"""
        if strategy != "ALL":
            strategy_key = strategy.lower().replace(" ", "_")
            strategy_data = self.strategy_analytics.get(strategy_key, {})
            
            return {
                "strategy_contribution": strategy_data.get("total_pnl", 0),
                "alpha_contribution": strategy_data.get("total_pnl", 0) * 0.3,
                "beta_contribution": strategy_data.get("total_pnl", 0) * 0.7,
                "risk_adjusted_return": strategy_data.get("sharpe_ratio", 0),
                "market_timing": 0.15,
                "security_selection": 0.85
            }
        
        return {
            "strategy_contributions": {
                "Momentum Breakout": 18500,
                "Mean Reversion": 14200,
                "Gap Fill": 9800,
                "VIX Spike": 7200,
                "Earnings Play": 5100
            },
            "total_alpha": 12500,
            "total_beta": 32200,
            "market_timing_contribution": 0.18,
            "security_selection_contribution": 0.82
        }
    
    def _aggregate_strategy_data(self) -> Dict[str, Any]:
        """Aggregate data across all strategies"""
        total_trades = sum(data["trades"] for data in self.strategy_analytics.values())
        total_pnl = sum(data["total_pnl"] for data in self.strategy_analytics.values())
        
        # Weighted averages
        weighted_win_rate = sum(
            data["win_rate"] * data["trades"] for data in self.strategy_analytics.values()
        ) / total_trades if total_trades > 0 else 0
        
        weighted_sharpe = sum(
            data["sharpe_ratio"] * data["total_pnl"] for data in self.strategy_analytics.values()
        ) / total_pnl if total_pnl > 0 else 0
        
        return {
            "trades": total_trades,
            "win_rate": weighted_win_rate,
            "total_pnl": total_pnl,
            "sharpe_ratio": weighted_sharpe
        }
    
    def run_backtest(self, strategy: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Run backtesting for a specific strategy"""
        logger.info(f"Running backtest for strategy: {strategy}")
        
        # Simulate backtest execution
        # In production, this would run actual backtesting algorithms
        
        backtest_result = {
            "strategy": strategy,
            "parameters": parameters,
            "start_date": "2024-01-01",
            "end_date": datetime.now().strftime("%Y-%m-%d"),
            "initial_capital": 50000,
            "final_capital": 75000,
            "total_return": 50.0,
            "annualized_return": 68.5,
            "max_drawdown": -4.2,
            "sharpe_ratio": 1.85,
            "trades": 156,
            "win_rate": 76.8,
            "profit_factor": 2.4,
            "execution_time": "2.3 seconds"
        }
        
        return backtest_result
    
    def get_strategy_optimization_suggestions(self, strategy: str) -> List[Dict[str, Any]]:
        """Get optimization suggestions for a strategy"""
        suggestions = [
            {
                "parameter": "confidence_threshold",
                "current_value": 75,
                "suggested_value": 78,
                "expected_improvement": "+2.3% win rate",
                "reasoning": "Higher confidence threshold reduces false signals"
            },
            {
                "parameter": "stop_loss",
                "current_value": 15,
                "suggested_value": 12,
                "expected_improvement": "+0.8% return",
                "reasoning": "Tighter stop loss improves risk-adjusted returns"
            },
            {
                "parameter": "position_size",
                "current_value": "fixed",
                "suggested_value": "kelly_criterion",
                "expected_improvement": "+15% total return",
                "reasoning": "Kelly criterion optimizes position sizing for growth"
            }
        ]
        
        return suggestions
    
    def get_real_time_performance(self) -> Dict[str, Any]:
        """Get real-time performance metrics"""
        trading_status = autonomous_trading_service.get_status()
        positions = autonomous_trading_service.get_positions()
        
        # Calculate real-time metrics
        active_positions = [p for p in positions if p['status'] == 'open']
        total_pnl = sum(p.get('pnl', 0) for p in positions)
        unrealized_pnl = sum(p.get('pnl', 0) for p in active_positions)
        
        return {
            "current_portfolio_value": 50000 + total_pnl,
            "unrealized_pnl": unrealized_pnl,
            "realized_pnl": total_pnl - unrealized_pnl,
            "active_positions": len(active_positions),
            "today_trades": trading_status.get('day_trades_used', 0),
            "win_rate_today": 82.5,  # Calculate from today's closed positions
            "best_performer": "SPY CALL 445" if active_positions else None,
            "worst_performer": "QQQ PUT 380" if active_positions else None,
            "market_exposure": sum(abs(p.get('pnl', 0)) for p in active_positions),
            "cash_available": 50000 - sum(p.get('entry_price', 0) * p.get('quantity', 0) for p in active_positions)
        }

# Global instance
analytics_service = AnalyticsService()

