"""
Trading Mode Service - Paper/Live Trading Separation

This service manages the separation between paper trading and live trading,
ensuring that P&L, analytics, and reporting are handled separately for each mode.
"""

import os
import logging
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Date, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

class TradingMode(Enum):
    PAPER = "paper"
    LIVE = "live"

@dataclass
class TradingModeConfig:
    """Configuration for trading mode"""
    mode: TradingMode
    account_suffix: str
    database_prefix: str
    port_offset: int
    description: str

# Trading mode configurations
TRADING_MODES = {
    TradingMode.PAPER: TradingModeConfig(
        mode=TradingMode.PAPER,
        account_suffix="_PAPER",
        database_prefix="paper_",
        port_offset=0,  # Paper trading uses base port (4001)
        description="Paper Trading Mode"
    ),
    TradingMode.LIVE: TradingModeConfig(
        mode=TradingMode.LIVE,
        account_suffix="_LIVE",
        database_prefix="live_",
        port_offset=1,  # Live trading uses base port + 1 (4002)
        description="Live Trading Mode"
    )
}

# Database Models for Trading Mode Separation

class TradingSession(Base):
    """Track trading sessions by mode"""
    __tablename__ = 'trading_sessions'
    
    id = Column(Integer, primary_key=True)
    mode = Column(String(10), nullable=False)  # 'paper' or 'live'
    session_date = Column(Date, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    is_active = Column(Boolean, default=True)
    initial_balance = Column(Float)
    final_balance = Column(Float)
    total_pnl = Column(Float)
    trade_count = Column(Integer, default=0)
    win_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class ModeSpecificPosition(Base):
    """Positions separated by trading mode"""
    __tablename__ = 'mode_positions'
    
    id = Column(Integer, primary_key=True)
    mode = Column(String(10), nullable=False)
    session_id = Column(Integer, nullable=False)
    symbol = Column(String(10), nullable=False)
    option_type = Column(String(4), nullable=False)  # CALL or PUT
    strike = Column(Float, nullable=False)
    expiration = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float)
    exit_price = Column(Float)
    pnl = Column(Float)
    status = Column(String(20), default='OPEN')  # OPEN, CLOSED, EXPIRED
    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class ModeSpecificAnalytics(Base):
    """Analytics separated by trading mode"""
    __tablename__ = 'mode_analytics'
    
    id = Column(Integer, primary_key=True)
    mode = Column(String(10), nullable=False)
    date = Column(Date, nullable=False)
    total_pnl = Column(Float)
    daily_pnl = Column(Float)
    win_rate = Column(Float)
    total_trades = Column(Integer)
    successful_trades = Column(Integer)
    portfolio_value = Column(Float)
    max_drawdown = Column(Float)
    sharpe_ratio = Column(Float)
    profit_factor = Column(Float)
    avg_win = Column(Float)
    avg_loss = Column(Float)
    largest_win = Column(Float)
    largest_loss = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class TradingModeService:
    """Service for managing paper/live trading separation"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.current_mode = TradingMode.PAPER  # Default to paper trading
        self.current_session_id = None
        
        # Create tables
        Base.metadata.create_all(bind=self.engine)
        
        logger.info("Trading Mode Service initialized")
    
    def get_session(self) -> Session:
        """Get database session"""
        return self.SessionLocal()
    
    def set_trading_mode(self, mode: TradingMode) -> bool:
        """Set the current trading mode"""
        try:
            if mode not in TRADING_MODES:
                raise ValueError(f"Invalid trading mode: {mode}")
            
            old_mode = self.current_mode
            self.current_mode = mode
            
            # End current session if switching modes
            if old_mode != mode and self.current_session_id:
                self.end_trading_session()
            
            # Start new session for the new mode
            self.start_trading_session()
            
            logger.info(f"Trading mode switched from {old_mode.value} to {mode.value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to set trading mode: {str(e)}")
            return False
    
    def get_current_mode(self) -> TradingMode:
        """Get the current trading mode"""
        return self.current_mode
    
    def get_mode_config(self, mode: Optional[TradingMode] = None) -> TradingModeConfig:
        """Get configuration for specified mode (or current mode)"""
        mode = mode or self.current_mode
        return TRADING_MODES[mode]
    
    def start_trading_session(self) -> int:
        """Start a new trading session for current mode"""
        try:
            session = self.get_session()
            
            # End any existing active session for this mode
            existing_session = session.query(TradingSession).filter(
                TradingSession.mode == self.current_mode.value,
                TradingSession.is_active == True
            ).first()
            
            if existing_session:
                existing_session.is_active = False
                existing_session.end_time = datetime.utcnow()
            
            # Create new session
            new_session = TradingSession(
                mode=self.current_mode.value,
                session_date=date.today(),
                start_time=datetime.utcnow(),
                is_active=True,
                initial_balance=self.get_account_balance()
            )
            
            session.add(new_session)
            session.commit()
            
            self.current_session_id = new_session.id
            
            logger.info(f"Started new {self.current_mode.value} trading session: {new_session.id}")
            return new_session.id
            
        except Exception as e:
            logger.error(f"Failed to start trading session: {str(e)}")
            session.rollback()
            return None
        finally:
            session.close()
    
    def end_trading_session(self) -> bool:
        """End the current trading session"""
        try:
            if not self.current_session_id:
                return True
            
            session = self.get_session()
            
            trading_session = session.query(TradingSession).filter(
                TradingSession.id == self.current_session_id
            ).first()
            
            if trading_session:
                trading_session.is_active = False
                trading_session.end_time = datetime.utcnow()
                trading_session.final_balance = self.get_account_balance()
                trading_session.total_pnl = (trading_session.final_balance or 0) - (trading_session.initial_balance or 0)
                
                # Update trade statistics
                stats = self.calculate_session_stats(self.current_session_id)
                trading_session.trade_count = stats.get('total_trades', 0)
                trading_session.win_count = stats.get('successful_trades', 0)
                
                session.commit()
                
            self.current_session_id = None
            logger.info(f"Ended {self.current_mode.value} trading session")
            return True
            
        except Exception as e:
            logger.error(f"Failed to end trading session: {str(e)}")
            session.rollback()
            return False
        finally:
            session.close()
    
    def add_position(self, position_data: Dict[str, Any]) -> int:
        """Add a position for the current trading mode"""
        try:
            session = self.get_session()
            
            # Ensure we have an active session
            if not self.current_session_id:
                self.start_trading_session()
            
            position = ModeSpecificPosition(
                mode=self.current_mode.value,
                session_id=self.current_session_id,
                symbol=position_data['symbol'],
                option_type=position_data['option_type'],
                strike=position_data['strike'],
                expiration=position_data['expiration'],
                quantity=position_data['quantity'],
                entry_price=position_data['entry_price'],
                entry_time=position_data.get('entry_time', datetime.utcnow())
            )
            
            session.add(position)
            session.commit()
            
            logger.info(f"Added {self.current_mode.value} position: {position.id}")
            return position.id
            
        except Exception as e:
            logger.error(f"Failed to add position: {str(e)}")
            session.rollback()
            return None
        finally:
            session.close()
    
    def update_position(self, position_id: int, updates: Dict[str, Any]) -> bool:
        """Update a position"""
        try:
            session = self.get_session()
            
            position = session.query(ModeSpecificPosition).filter(
                ModeSpecificPosition.id == position_id,
                ModeSpecificPosition.mode == self.current_mode.value
            ).first()
            
            if not position:
                logger.warning(f"Position {position_id} not found for mode {self.current_mode.value}")
                return False
            
            for key, value in updates.items():
                if hasattr(position, key):
                    setattr(position, key, value)
            
            position.updated_at = datetime.utcnow()
            session.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update position: {str(e)}")
            session.rollback()
            return False
        finally:
            session.close()
    
    def close_position(self, position_id: int, exit_price: float) -> bool:
        """Close a position"""
        try:
            session = self.get_session()
            
            position = session.query(ModeSpecificPosition).filter(
                ModeSpecificPosition.id == position_id,
                ModeSpecificPosition.mode == self.current_mode.value
            ).first()
            
            if not position:
                return False
            
            position.exit_price = exit_price
            position.exit_time = datetime.utcnow()
            position.status = 'CLOSED'
            
            # Calculate P&L
            if position.option_type == 'CALL':
                position.pnl = (exit_price - position.entry_price) * position.quantity * 100
            else:  # PUT
                position.pnl = (position.entry_price - exit_price) * position.quantity * 100
            
            position.updated_at = datetime.utcnow()
            session.commit()
            
            logger.info(f"Closed {self.current_mode.value} position {position_id} with P&L: ${position.pnl:.2f}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to close position: {str(e)}")
            session.rollback()
            return False
        finally:
            session.close()
    
    def get_positions(self, mode: Optional[TradingMode] = None, status: str = 'OPEN') -> List[Dict]:
        """Get positions for specified mode"""
        try:
            mode = mode or self.current_mode
            session = self.get_session()
            
            query = session.query(ModeSpecificPosition).filter(
                ModeSpecificPosition.mode == mode.value
            )
            
            if status:
                query = query.filter(ModeSpecificPosition.status == status)
            
            positions = query.all()
            
            return [
                {
                    'id': pos.id,
                    'symbol': pos.symbol,
                    'option_type': pos.option_type,
                    'strike': pos.strike,
                    'expiration': pos.expiration,
                    'quantity': pos.quantity,
                    'entry_price': pos.entry_price,
                    'current_price': pos.current_price,
                    'exit_price': pos.exit_price,
                    'pnl': pos.pnl,
                    'status': pos.status,
                    'entry_time': pos.entry_time,
                    'exit_time': pos.exit_time
                }
                for pos in positions
            ]
            
        except Exception as e:
            logger.error(f"Failed to get positions: {str(e)}")
            return []
        finally:
            session.close()
    
    def calculate_session_stats(self, session_id: int) -> Dict[str, Any]:
        """Calculate statistics for a trading session"""
        try:
            session = self.get_session()
            
            positions = session.query(ModeSpecificPosition).filter(
                ModeSpecificPosition.session_id == session_id
            ).all()
            
            total_trades = len([p for p in positions if p.status == 'CLOSED'])
            successful_trades = len([p for p in positions if p.status == 'CLOSED' and (p.pnl or 0) > 0])
            total_pnl = sum([p.pnl or 0 for p in positions if p.status == 'CLOSED'])
            
            win_rate = (successful_trades / total_trades * 100) if total_trades > 0 else 0
            
            return {
                'total_trades': total_trades,
                'successful_trades': successful_trades,
                'total_pnl': total_pnl,
                'win_rate': win_rate
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate session stats: {str(e)}")
            return {}
        finally:
            session.close()
    
    def update_daily_analytics(self, mode: Optional[TradingMode] = None) -> bool:
        """Update daily analytics for specified mode"""
        try:
            mode = mode or self.current_mode
            session = self.get_session()
            today = date.today()
            
            # Get today's positions
            positions = session.query(ModeSpecificPosition).filter(
                ModeSpecificPosition.mode == mode.value,
                ModeSpecificPosition.entry_time >= datetime.combine(today, datetime.min.time())
            ).all()
            
            # Calculate metrics
            closed_positions = [p for p in positions if p.status == 'CLOSED']
            total_trades = len(closed_positions)
            successful_trades = len([p for p in closed_positions if (p.pnl or 0) > 0])
            daily_pnl = sum([p.pnl or 0 for p in closed_positions])
            win_rate = (successful_trades / total_trades * 100) if total_trades > 0 else 0
            
            # Check if analytics record exists for today
            existing_analytics = session.query(ModeSpecificAnalytics).filter(
                ModeSpecificAnalytics.mode == mode.value,
                ModeSpecificAnalytics.date == today
            ).first()
            
            if existing_analytics:
                # Update existing record
                existing_analytics.daily_pnl = daily_pnl
                existing_analytics.total_trades = total_trades
                existing_analytics.successful_trades = successful_trades
                existing_analytics.win_rate = win_rate
                existing_analytics.portfolio_value = self.get_account_balance()
            else:
                # Create new record
                analytics = ModeSpecificAnalytics(
                    mode=mode.value,
                    date=today,
                    daily_pnl=daily_pnl,
                    total_trades=total_trades,
                    successful_trades=successful_trades,
                    win_rate=win_rate,
                    portfolio_value=self.get_account_balance()
                )
                session.add(analytics)
            
            session.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to update daily analytics: {str(e)}")
            session.rollback()
            return False
        finally:
            session.close()
    
    def get_analytics(self, mode: Optional[TradingMode] = None, days: int = 30) -> Dict[str, Any]:
        """Get analytics for specified mode"""
        try:
            mode = mode or self.current_mode
            session = self.get_session()
            
            # Get recent analytics
            analytics = session.query(ModeSpecificAnalytics).filter(
                ModeSpecificAnalytics.mode == mode.value
            ).order_by(ModeSpecificAnalytics.date.desc()).limit(days).all()
            
            if not analytics:
                return {}
            
            # Calculate summary metrics
            total_pnl = sum([a.daily_pnl or 0 for a in analytics])
            total_trades = sum([a.total_trades or 0 for a in analytics])
            total_successful = sum([a.successful_trades or 0 for a in analytics])
            avg_win_rate = sum([a.win_rate or 0 for a in analytics]) / len(analytics)
            
            return {
                'mode': mode.value,
                'period_days': len(analytics),
                'total_pnl': total_pnl,
                'total_trades': total_trades,
                'successful_trades': total_successful,
                'win_rate': avg_win_rate,
                'current_portfolio_value': analytics[0].portfolio_value if analytics else 0,
                'daily_analytics': [
                    {
                        'date': a.date.isoformat(),
                        'daily_pnl': a.daily_pnl,
                        'trades': a.total_trades,
                        'win_rate': a.win_rate,
                        'portfolio_value': a.portfolio_value
                    }
                    for a in analytics
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to get analytics: {str(e)}")
            return {}
        finally:
            session.close()
    
    def get_mode_comparison(self, days: int = 30) -> Dict[str, Any]:
        """Compare performance between paper and live trading"""
        try:
            paper_analytics = self.get_analytics(TradingMode.PAPER, days)
            live_analytics = self.get_analytics(TradingMode.LIVE, days)
            
            return {
                'comparison_period_days': days,
                'paper_trading': paper_analytics,
                'live_trading': live_analytics,
                'performance_difference': {
                    'pnl_difference': (live_analytics.get('total_pnl', 0) - paper_analytics.get('total_pnl', 0)),
                    'win_rate_difference': (live_analytics.get('win_rate', 0) - paper_analytics.get('win_rate', 0)),
                    'trade_count_difference': (live_analytics.get('total_trades', 0) - paper_analytics.get('total_trades', 0))
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get mode comparison: {str(e)}")
            return {}
    
    def get_account_balance(self) -> float:
        """Get account balance for current mode (placeholder)"""
        # This would integrate with IBKR API to get actual balance
        # For now, return a mock value based on mode
        if self.current_mode == TradingMode.PAPER:
            return 100000.0  # Paper trading starts with $100k
        else:
            return 50000.0   # Live trading actual balance (would be from IBKR)
    
    def get_ibkr_port(self) -> int:
        """Get IBKR port for current trading mode"""
        base_port = int(os.getenv('IBKR_GATEWAY_PORT', '4001'))
        config = self.get_mode_config()
        return base_port + config.port_offset
    
    def get_status(self) -> Dict[str, Any]:
        """Get current trading mode status"""
        return {
            'current_mode': self.current_mode.value,
            'mode_description': self.get_mode_config().description,
            'current_session_id': self.current_session_id,
            'ibkr_port': self.get_ibkr_port(),
            'account_balance': self.get_account_balance(),
            'is_paper_trading': self.current_mode == TradingMode.PAPER
        }

# Global instance
trading_mode_service = None

def get_trading_mode_service() -> TradingModeService:
    """Get global trading mode service instance"""
    global trading_mode_service
    if trading_mode_service is None:
        database_url = os.getenv('DATABASE_URL', 'postgresql://smart_lean:password@localhost:5432/smart_lean_0dte')
        trading_mode_service = TradingModeService(database_url)
    return trading_mode_service

def initialize_trading_mode_service(database_url: str) -> TradingModeService:
    """Initialize trading mode service with specific database URL"""
    global trading_mode_service
    trading_mode_service = TradingModeService(database_url)
    return trading_mode_service

