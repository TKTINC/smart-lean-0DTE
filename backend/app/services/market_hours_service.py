"""
Market Hours Intelligence Service
Handles market hours detection, trading windows, and scheduling
"""

import logging
from datetime import datetime, time, timezone
from typing import Dict, Any, Optional
import pytz
from enum import Enum

logger = logging.getLogger(__name__)

class MarketSession(Enum):
    PRE_MARKET = "pre_market"
    REGULAR = "regular"
    AFTER_HOURS = "after_hours"
    CLOSED = "closed"
    WEEKEND = "weekend"

class MarketHoursService:
    """Service for managing market hours and trading windows"""
    
    def __init__(self):
        self.eastern_tz = pytz.timezone('America/New_York')
        
        # Market hours (Eastern Time)
        self.pre_market_start = time(4, 0)  # 4:00 AM ET
        self.pre_market_end = time(9, 30)   # 9:30 AM ET
        self.regular_start = time(9, 30)    # 9:30 AM ET
        self.regular_end = time(16, 0)      # 4:00 PM ET
        self.after_hours_start = time(16, 0) # 4:00 PM ET
        self.after_hours_end = time(20, 0)   # 8:00 PM ET
        
        # Trading windows for different activities
        self.trading_window = (self.regular_start, self.regular_end)
        self.data_collection_window = (self.pre_market_start, self.after_hours_end)
        self.learning_window = (time(20, 0), time(4, 0))  # 8 PM - 4 AM ET
        
        logger.info("Market Hours Service initialized")
    
    def get_current_et_time(self) -> datetime:
        """Get current time in Eastern timezone"""
        return datetime.now(self.eastern_tz)
    
    def get_market_session(self, dt: Optional[datetime] = None) -> MarketSession:
        """Determine current market session"""
        if dt is None:
            dt = self.get_current_et_time()
        
        # Convert to ET if not already
        if dt.tzinfo != self.eastern_tz:
            dt = dt.astimezone(self.eastern_tz)
        
        # Check if weekend
        if dt.weekday() >= 5:  # Saturday = 5, Sunday = 6
            return MarketSession.WEEKEND
        
        current_time = dt.time()
        
        # Determine session
        if self.pre_market_start <= current_time < self.pre_market_end:
            return MarketSession.PRE_MARKET
        elif self.regular_start <= current_time < self.regular_end:
            return MarketSession.REGULAR
        elif self.after_hours_start <= current_time < self.after_hours_end:
            return MarketSession.AFTER_HOURS
        else:
            return MarketSession.CLOSED
    
    def is_trading_hours(self, dt: Optional[datetime] = None) -> bool:
        """Check if current time is within regular trading hours"""
        session = self.get_market_session(dt)
        return session == MarketSession.REGULAR
    
    def is_data_collection_hours(self, dt: Optional[datetime] = None) -> bool:
        """Check if current time is within data collection window"""
        if dt is None:
            dt = self.get_current_et_time()
        
        session = self.get_market_session(dt)
        return session in [MarketSession.PRE_MARKET, MarketSession.REGULAR, MarketSession.AFTER_HOURS]
    
    def is_learning_hours(self, dt: Optional[datetime] = None) -> bool:
        """Check if current time is within learning window"""
        if dt is None:
            dt = self.get_current_et_time()
        
        # Learning happens during closed hours and weekends
        session = self.get_market_session(dt)
        return session in [MarketSession.CLOSED, MarketSession.WEEKEND]
    
    def time_to_market_open(self, dt: Optional[datetime] = None) -> Optional[int]:
        """Get seconds until market opens (None if already open)"""
        if dt is None:
            dt = self.get_current_et_time()
        
        if self.is_trading_hours(dt):
            return None
        
        # Calculate next market open
        next_open = dt.replace(hour=9, minute=30, second=0, microsecond=0)
        
        # If it's after market hours today, next open is tomorrow
        if dt.time() >= self.regular_end or dt.weekday() >= 5:
            # Move to next weekday
            days_ahead = 1
            if dt.weekday() == 4:  # Friday
                days_ahead = 3  # Skip to Monday
            elif dt.weekday() == 5:  # Saturday
                days_ahead = 2  # Skip to Monday
            
            next_open = next_open.replace(day=dt.day + days_ahead)
        
        return int((next_open - dt).total_seconds())
    
    def time_to_market_close(self, dt: Optional[datetime] = None) -> Optional[int]:
        """Get seconds until market closes (None if already closed)"""
        if dt is None:
            dt = self.get_current_et_time()
        
        if not self.is_trading_hours(dt):
            return None
        
        market_close = dt.replace(hour=16, minute=0, second=0, microsecond=0)
        return int((market_close - dt).total_seconds())
    
    def get_market_status(self, dt: Optional[datetime] = None) -> Dict[str, Any]:
        """Get comprehensive market status"""
        if dt is None:
            dt = self.get_current_et_time()
        
        session = self.get_market_session(dt)
        is_trading = self.is_trading_hours(dt)
        is_data_collection = self.is_data_collection_hours(dt)
        is_learning = self.is_learning_hours(dt)
        
        time_to_open = self.time_to_market_open(dt)
        time_to_close = self.time_to_market_close(dt)
        
        return {
            "current_time": dt.isoformat(),
            "session": session.value,
            "is_trading_hours": is_trading,
            "is_data_collection_hours": is_data_collection,
            "is_learning_hours": is_learning,
            "time_to_open_seconds": time_to_open,
            "time_to_close_seconds": time_to_close,
            "next_trading_session": self._get_next_trading_session(dt),
            "trading_windows": {
                "pre_market": f"{self.pre_market_start} - {self.pre_market_end} ET",
                "regular": f"{self.regular_start} - {self.regular_end} ET",
                "after_hours": f"{self.after_hours_start} - {self.after_hours_end} ET"
            }
        }
    
    def _get_next_trading_session(self, dt: datetime) -> str:
        """Get description of next trading session"""
        session = self.get_market_session(dt)
        
        if session == MarketSession.PRE_MARKET:
            return "Regular trading starts at 9:30 AM ET"
        elif session == MarketSession.REGULAR:
            return "After hours trading starts at 4:00 PM ET"
        elif session == MarketSession.AFTER_HOURS:
            return "Market closed until 4:00 AM ET tomorrow"
        elif session == MarketSession.WEEKEND:
            return "Market opens Monday at 9:30 AM ET"
        else:  # CLOSED
            if dt.time() < self.pre_market_start:
                return "Pre-market starts at 4:00 AM ET"
            else:
                return "Pre-market starts at 4:00 AM ET tomorrow"
    
    def should_collect_data(self, dt: Optional[datetime] = None) -> bool:
        """Determine if data collection should be active"""
        return self.is_data_collection_hours(dt)
    
    def should_execute_trades(self, dt: Optional[datetime] = None) -> bool:
        """Determine if trade execution should be active"""
        return self.is_trading_hours(dt)
    
    def should_run_learning(self, dt: Optional[datetime] = None) -> bool:
        """Determine if learning algorithms should run"""
        return self.is_learning_hours(dt)
    
    def get_eod_report_time(self) -> time:
        """Get end-of-day report generation time"""
        return time(16, 30)  # 4:30 PM ET (30 minutes after market close)
    
    def should_generate_eod_report(self, dt: Optional[datetime] = None) -> bool:
        """Check if it's time to generate EOD report"""
        if dt is None:
            dt = self.get_current_et_time()
        
        eod_time = self.get_eod_report_time()
        current_time = dt.time()
        
        # Generate report within 5 minutes of EOD time on weekdays
        return (dt.weekday() < 5 and 
                abs((current_time.hour * 60 + current_time.minute) - 
                    (eod_time.hour * 60 + eod_time.minute)) <= 5)

# Global instance
market_hours_service = MarketHoursService()

