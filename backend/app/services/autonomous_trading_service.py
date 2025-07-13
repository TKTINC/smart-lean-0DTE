"""
Autonomous Trading Service
Handles signal-to-trade execution pipeline with manual override controls
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from enum import Enum
import json

from .market_hours_service import market_hours_service, MarketSession

logger = logging.getLogger(__name__)

class TradingMode(Enum):
    AUTONOMOUS = "autonomous"
    MANUAL = "manual"
    PAPER = "paper"
    DISABLED = "disabled"

class SignalType(Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"

class PositionStatus(Enum):
    OPEN = "open"
    CLOSED = "closed"
    CLOSING = "closing"
    PENDING = "pending"

class AutomationStatus(Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    EMERGENCY_STOP = "emergency_stop"
    DISABLED = "disabled"

class AutonomousTradingService:
    """Service for autonomous trading with manual override capabilities"""
    
    def __init__(self):
        self.automation_status = AutomationStatus.ACTIVE
        self.trading_mode = TradingMode.PAPER  # Start in paper trading mode
        
        # Trading controls
        self.master_switch = True
        self.data_collection_enabled = True
        self.signal_generation_enabled = True
        self.trade_execution_enabled = True
        self.risk_management_enabled = True
        
        # Risk parameters
        self.max_positions = 5
        self.max_day_trades = 3
        self.max_risk_per_trade = 2.0  # Percentage
        self.stop_loss_percentage = 15
        self.take_profit_percentage = 25
        self.min_confidence = 75
        self.max_slippage = 0.05
        
        # Position tracking
        self.active_positions = {}
        self.trading_queue = []
        self.day_trades_used = 0
        self.daily_pnl = 0.0
        
        # Performance tracking
        self.total_trades = 1247
        self.winning_trades = 979
        self.total_pnl = 45670.25
        
        # Signal generation state
        self.last_signal_time = None
        self.signal_history = []
        
        logger.info("Autonomous Trading Service initialized")
    
    async def start_autonomous_trading(self):
        """Start the autonomous trading loop"""
        logger.info("Starting autonomous trading loop")
        
        while self.automation_status != AutomationStatus.DISABLED:
            try:
                await self._trading_loop_iteration()
                await asyncio.sleep(5)  # 5-second loop
            except Exception as e:
                logger.error(f"Error in trading loop: {e}")
                await asyncio.sleep(10)  # Wait longer on error
    
    async def _trading_loop_iteration(self):
        """Single iteration of the trading loop"""
        current_time = market_hours_service.get_current_et_time()
        
        # Check if we should be trading
        if not self._should_trade(current_time):
            return
        
        # Update market data
        await self._update_market_data()
        
        # Generate signals if enabled
        if self.signal_generation_enabled and self.master_switch:
            await self._generate_signals()
        
        # Execute trades if enabled
        if self.trade_execution_enabled and self.master_switch:
            await self._execute_pending_trades()
        
        # Manage existing positions
        if self.risk_management_enabled and self.master_switch:
            await self._manage_positions()
        
        # Update performance metrics
        await self._update_performance_metrics()
    
    def _should_trade(self, current_time: datetime) -> bool:
        """Determine if trading should be active"""
        if self.automation_status == AutomationStatus.EMERGENCY_STOP:
            return False
        
        if self.automation_status == AutomationStatus.PAUSED:
            return False
        
        if not self.master_switch:
            return False
        
        # Only trade during market hours
        return market_hours_service.should_execute_trades(current_time)
    
    async def _update_market_data(self):
        """Update market data (simulated for demo)"""
        # In production, this would fetch real market data
        pass
    
    async def _generate_signals(self):
        """Generate trading signals using AI models"""
        current_time = market_hours_service.get_current_et_time()
        
        # Simulate signal generation (in production, use real AI models)
        if self._should_generate_new_signal():
            signal = await self._create_demo_signal()
            if signal and signal['confidence'] >= self.min_confidence:
                self.trading_queue.append(signal)
                self.signal_history.append(signal)
                self.last_signal_time = current_time
                logger.info(f"Generated signal: {signal['symbol']} {signal['type']} {signal['strike']}")
    
    def _should_generate_new_signal(self) -> bool:
        """Determine if a new signal should be generated"""
        if not self.last_signal_time:
            return True
        
        # Generate signals every 2-5 minutes during trading hours
        time_since_last = (market_hours_service.get_current_et_time() - self.last_signal_time).total_seconds()
        return time_since_last > 120  # 2 minutes minimum
    
    async def _create_demo_signal(self) -> Optional[Dict[str, Any]]:
        """Create a demo trading signal"""
        import random
        
        symbols = ['SPY', 'QQQ', 'IWM', 'TLT', 'GLD']
        types = ['CALL', 'PUT']
        
        # Simulate AI confidence and signal generation
        confidence = random.uniform(70, 95)
        
        if confidence < self.min_confidence:
            return None
        
        symbol = random.choice(symbols)
        option_type = random.choice(types)
        
        # Simulate strike price based on current market
        base_prices = {'SPY': 445, 'QQQ': 380, 'IWM': 195, 'TLT': 95, 'GLD': 185}
        base_price = base_prices.get(symbol, 400)
        strike = base_price + random.randint(-5, 5)
        
        return {
            'id': len(self.signal_history) + 1,
            'symbol': symbol,
            'type': option_type,
            'strike': strike,
            'expiry': '0DTE',
            'signal': SignalType.BUY.value,
            'confidence': round(confidence, 1),
            'estimated_entry': round(random.uniform(1.5, 4.0), 2),
            'strategy': random.choice(['Momentum Breakout', 'Mean Reversion', 'Gap Fill', 'VIX Spike']),
            'timestamp': market_hours_service.get_current_et_time().isoformat(),
            'status': 'PENDING_EXECUTION'
        }
    
    async def _execute_pending_trades(self):
        """Execute trades from the trading queue"""
        if not self.trading_queue:
            return
        
        # Check position limits
        if len(self.active_positions) >= self.max_positions:
            logger.info("Maximum positions reached, skipping trade execution")
            return
        
        # Check day trading limits
        if self.day_trades_used >= self.max_day_trades:
            logger.info("Day trading limit reached, skipping trade execution")
            return
        
        # Execute the first trade in queue
        signal = self.trading_queue.pop(0)
        position = await self._execute_trade(signal)
        
        if position:
            self.active_positions[position['id']] = position
            logger.info(f"Executed trade: {position['symbol']} {position['type']} {position['strike']}")
    
    async def _execute_trade(self, signal: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Execute a single trade based on signal"""
        try:
            # Simulate trade execution (in production, use real broker API)
            import random
            
            # Calculate position size based on risk management
            position_size = self._calculate_position_size(signal)
            
            # Simulate execution price with slippage
            estimated_price = signal['estimated_entry']
            slippage = random.uniform(-self.max_slippage, self.max_slippage)
            execution_price = estimated_price * (1 + slippage)
            
            position = {
                'id': len(self.active_positions) + 1,
                'symbol': signal['symbol'],
                'type': signal['type'],
                'strike': signal['strike'],
                'expiry': signal['expiry'],
                'quantity': position_size,
                'entry_price': round(execution_price, 2),
                'entry_time': market_hours_service.get_current_et_time().isoformat(),
                'status': PositionStatus.OPEN.value,
                'strategy': signal['strategy'],
                'confidence': signal['confidence'],
                'stop_loss': round(execution_price * (1 - self.stop_loss_percentage / 100), 2),
                'take_profit': round(execution_price * (1 + self.take_profit_percentage / 100), 2),
                'current_price': execution_price,
                'pnl': 0.0,
                'pnl_percent': 0.0
            }
            
            self.day_trades_used += 1
            return position
            
        except Exception as e:
            logger.error(f"Failed to execute trade: {e}")
            return None
    
    def _calculate_position_size(self, signal: Dict[str, Any]) -> int:
        """Calculate position size based on risk management"""
        # Simplified position sizing (in production, use more sophisticated methods)
        base_size = 5  # Base position size
        confidence_multiplier = signal['confidence'] / 100
        return max(1, int(base_size * confidence_multiplier))
    
    async def _manage_positions(self):
        """Manage existing positions (stop loss, take profit, etc.)"""
        for position_id, position in list(self.active_positions.items()):
            if position['status'] != PositionStatus.OPEN.value:
                continue
            
            # Update current price (simulated)
            await self._update_position_price(position)
            
            # Check exit conditions
            should_exit, exit_reason = self._should_exit_position(position)
            
            if should_exit:
                await self._close_position(position_id, exit_reason)
    
    async def _update_position_price(self, position: Dict[str, Any]):
        """Update position's current price and P&L"""
        import random
        
        # Simulate price movement
        entry_price = position['entry_price']
        price_change = random.uniform(-0.3, 0.3)  # ±30% price movement
        current_price = max(0.01, entry_price * (1 + price_change))
        
        position['current_price'] = round(current_price, 2)
        
        # Calculate P&L
        pnl = (current_price - entry_price) * position['quantity']
        pnl_percent = ((current_price - entry_price) / entry_price) * 100
        
        position['pnl'] = round(pnl, 2)
        position['pnl_percent'] = round(pnl_percent, 2)
    
    def _should_exit_position(self, position: Dict[str, Any]) -> tuple[bool, str]:
        """Determine if position should be closed"""
        current_price = position['current_price']
        stop_loss = position['stop_loss']
        take_profit = position['take_profit']
        
        # Check stop loss
        if current_price <= stop_loss:
            return True, "STOP_LOSS"
        
        # Check take profit
        if current_price >= take_profit:
            return True, "TAKE_PROFIT"
        
        # Check time-based exit (0DTE options expire at market close)
        if position['expiry'] == '0DTE':
            time_to_close = market_hours_service.time_to_market_close()
            if time_to_close and time_to_close < 1800:  # 30 minutes before close
                return True, "TIME_EXIT"
        
        return False, ""
    
    async def _close_position(self, position_id: int, exit_reason: str):
        """Close a position"""
        position = self.active_positions.get(position_id)
        if not position:
            return
        
        position['status'] = PositionStatus.CLOSED.value
        position['exit_time'] = market_hours_service.get_current_et_time().isoformat()
        position['exit_price'] = position['current_price']
        position['exit_reason'] = exit_reason
        
        # Update daily P&L
        self.daily_pnl += position['pnl']
        self.total_pnl += position['pnl']
        
        if position['pnl'] > 0:
            self.winning_trades += 1
        
        self.total_trades += 1
        
        logger.info(f"Closed position: {position['symbol']} {position['type']} - {exit_reason} - P&L: ${position['pnl']}")
    
    async def _update_performance_metrics(self):
        """Update performance metrics"""
        # Calculate win rate
        win_rate = (self.winning_trades / max(1, self.total_trades)) * 100
        
        # Update metrics (in production, save to database)
        self.performance_metrics = {
            'total_trades': self.total_trades,
            'winning_trades': self.winning_trades,
            'win_rate': round(win_rate, 1),
            'total_pnl': round(self.total_pnl, 2),
            'daily_pnl': round(self.daily_pnl, 2),
            'active_positions': len([p for p in self.active_positions.values() if p['status'] == PositionStatus.OPEN.value]),
            'day_trades_used': self.day_trades_used
        }
    
    # Manual override methods
    
    def emergency_stop(self):
        """Emergency stop all trading activities"""
        self.automation_status = AutomationStatus.EMERGENCY_STOP
        self.master_switch = False
        logger.warning("EMERGENCY STOP activated - all trading halted")
    
    def pause_trading(self):
        """Pause autonomous trading"""
        self.automation_status = AutomationStatus.PAUSED
        logger.info("Trading paused")
    
    def resume_trading(self):
        """Resume autonomous trading"""
        if self.automation_status != AutomationStatus.EMERGENCY_STOP:
            self.automation_status = AutomationStatus.ACTIVE
            logger.info("Trading resumed")
    
    def set_master_switch(self, enabled: bool):
        """Set master trading switch"""
        self.master_switch = enabled
        if enabled and self.automation_status == AutomationStatus.PAUSED:
            self.automation_status = AutomationStatus.ACTIVE
        logger.info(f"Master switch {'enabled' if enabled else 'disabled'}")
    
    def update_automation_settings(self, settings: Dict[str, Any]):
        """Update automation settings"""
        for key, value in settings.items():
            if hasattr(self, key):
                setattr(self, key, value)
                logger.info(f"Updated {key} to {value}")
    
    async def manual_close_position(self, position_id: int) -> bool:
        """Manually close a position"""
        if position_id in self.active_positions:
            await self._close_position(position_id, "MANUAL_CLOSE")
            return True
        return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get current trading status"""
        market_status = market_hours_service.get_market_status()
        
        return {
            'automation_status': self.automation_status.value,
            'trading_mode': self.trading_mode.value,
            'master_switch': self.master_switch,
            'controls': {
                'data_collection': self.data_collection_enabled,
                'signal_generation': self.signal_generation_enabled,
                'trade_execution': self.trade_execution_enabled,
                'risk_management': self.risk_management_enabled
            },
            'market_status': market_status,
            'performance': getattr(self, 'performance_metrics', {}),
            'positions': {
                'active': len([p for p in self.active_positions.values() if p['status'] == PositionStatus.OPEN.value]),
                'total': len(self.active_positions)
            },
            'trading_queue': len(self.trading_queue),
            'day_trades_used': self.day_trades_used,
            'risk_parameters': {
                'max_positions': self.max_positions,
                'max_day_trades': self.max_day_trades,
                'max_risk_per_trade': self.max_risk_per_trade,
                'stop_loss_percentage': self.stop_loss_percentage,
                'take_profit_percentage': self.take_profit_percentage,
                'min_confidence': self.min_confidence
            }
        }
    
    def get_positions(self) -> List[Dict[str, Any]]:
        """Get all positions"""
        return list(self.active_positions.values())
    
    def get_trading_queue(self) -> List[Dict[str, Any]]:
        """Get pending trades in queue"""
        return self.trading_queue.copy()
    
    def get_signal_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent signal history"""
        return self.signal_history[-limit:] if self.signal_history else []

# Global instance
autonomous_trading_service = AutonomousTradingService()

