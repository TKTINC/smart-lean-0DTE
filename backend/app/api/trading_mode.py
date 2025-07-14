"""
Trading Mode API Endpoints

API endpoints for managing paper/live trading mode switching and 
separate P&L tracking.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any, Optional
from datetime import datetime, date
from pydantic import BaseModel

from ..services.trading_mode_service import (
    get_trading_mode_service, 
    TradingModeService, 
    TradingMode
)

router = APIRouter(prefix="/api/trading-mode", tags=["Trading Mode"])

# Pydantic models for request/response

class TradingModeSwitch(BaseModel):
    mode: str  # 'paper' or 'live'

class PositionCreate(BaseModel):
    symbol: str
    option_type: str  # 'CALL' or 'PUT'
    strike: float
    expiration: date
    quantity: int
    entry_price: float
    entry_time: Optional[datetime] = None

class PositionUpdate(BaseModel):
    current_price: Optional[float] = None
    exit_price: Optional[float] = None
    status: Optional[str] = None

class TradingModeStatus(BaseModel):
    current_mode: str
    mode_description: str
    current_session_id: Optional[int]
    ibkr_port: int
    account_balance: float
    is_paper_trading: bool

class AnalyticsResponse(BaseModel):
    mode: str
    period_days: int
    total_pnl: float
    total_trades: int
    successful_trades: int
    win_rate: float
    current_portfolio_value: float
    daily_analytics: List[Dict[str, Any]]

@router.get("/status", response_model=TradingModeStatus)
async def get_trading_mode_status(
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Get current trading mode status"""
    try:
        status = service.get_status()
        return TradingModeStatus(**status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@router.post("/switch")
async def switch_trading_mode(
    mode_switch: TradingModeSwitch,
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Switch between paper and live trading modes"""
    try:
        # Validate mode
        if mode_switch.mode.lower() not in ['paper', 'live']:
            raise HTTPException(status_code=400, detail="Mode must be 'paper' or 'live'")
        
        # Convert to enum
        new_mode = TradingMode.PAPER if mode_switch.mode.lower() == 'paper' else TradingMode.LIVE
        
        # Switch mode
        success = service.set_trading_mode(new_mode)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to switch trading mode")
        
        # Return new status
        status = service.get_status()
        
        return {
            "success": True,
            "message": f"Successfully switched to {new_mode.value} trading",
            "new_status": status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to switch mode: {str(e)}")

@router.get("/modes")
async def get_available_modes():
    """Get available trading modes and their configurations"""
    return {
        "available_modes": [
            {
                "mode": "paper",
                "description": "Paper Trading Mode",
                "port": 4001,
                "account_suffix": "_PAPER"
            },
            {
                "mode": "live", 
                "description": "Live Trading Mode",
                "port": 4002,
                "account_suffix": "_LIVE"
            }
        ]
    }

@router.post("/positions")
async def create_position(
    position: PositionCreate,
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Create a new position in current trading mode"""
    try:
        position_data = position.dict()
        position_id = service.add_position(position_data)
        
        if position_id is None:
            raise HTTPException(status_code=500, detail="Failed to create position")
        
        return {
            "success": True,
            "position_id": position_id,
            "mode": service.get_current_mode().value,
            "message": f"Position created in {service.get_current_mode().value} mode"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create position: {str(e)}")

@router.get("/positions")
async def get_positions(
    mode: Optional[str] = None,
    status: str = "OPEN",
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Get positions for specified mode (or current mode)"""
    try:
        # Parse mode if provided
        trading_mode = None
        if mode:
            if mode.lower() == 'paper':
                trading_mode = TradingMode.PAPER
            elif mode.lower() == 'live':
                trading_mode = TradingMode.LIVE
            else:
                raise HTTPException(status_code=400, detail="Mode must be 'paper' or 'live'")
        
        positions = service.get_positions(trading_mode, status)
        
        return {
            "mode": (trading_mode or service.get_current_mode()).value,
            "status_filter": status,
            "count": len(positions),
            "positions": positions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get positions: {str(e)}")

@router.put("/positions/{position_id}")
async def update_position(
    position_id: int,
    updates: PositionUpdate,
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Update a position"""
    try:
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        
        success = service.update_position(position_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Position not found or update failed")
        
        return {
            "success": True,
            "position_id": position_id,
            "mode": service.get_current_mode().value,
            "message": "Position updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update position: {str(e)}")

@router.post("/positions/{position_id}/close")
async def close_position(
    position_id: int,
    exit_price: float,
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Close a position"""
    try:
        success = service.close_position(position_id, exit_price)
        
        if not success:
            raise HTTPException(status_code=404, detail="Position not found or close failed")
        
        return {
            "success": True,
            "position_id": position_id,
            "exit_price": exit_price,
            "mode": service.get_current_mode().value,
            "message": "Position closed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to close position: {str(e)}")

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    mode: Optional[str] = None,
    days: int = 30,
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Get analytics for specified mode"""
    try:
        # Parse mode if provided
        trading_mode = None
        if mode:
            if mode.lower() == 'paper':
                trading_mode = TradingMode.PAPER
            elif mode.lower() == 'live':
                trading_mode = TradingMode.LIVE
            else:
                raise HTTPException(status_code=400, detail="Mode must be 'paper' or 'live'")
        
        analytics = service.get_analytics(trading_mode, days)
        
        if not analytics:
            # Return empty analytics if no data
            current_mode = (trading_mode or service.get_current_mode()).value
            return AnalyticsResponse(
                mode=current_mode,
                period_days=0,
                total_pnl=0.0,
                total_trades=0,
                successful_trades=0,
                win_rate=0.0,
                current_portfolio_value=service.get_account_balance(),
                daily_analytics=[]
            )
        
        return AnalyticsResponse(**analytics)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@router.get("/analytics/comparison")
async def get_mode_comparison(
    days: int = 30,
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Compare performance between paper and live trading"""
    try:
        comparison = service.get_mode_comparison(days)
        
        return {
            "comparison_period_days": days,
            "paper_trading": comparison.get('paper_trading', {}),
            "live_trading": comparison.get('live_trading', {}),
            "performance_difference": comparison.get('performance_difference', {}),
            "summary": {
                "paper_total_pnl": comparison.get('paper_trading', {}).get('total_pnl', 0),
                "live_total_pnl": comparison.get('live_trading', {}).get('total_pnl', 0),
                "paper_win_rate": comparison.get('paper_trading', {}).get('win_rate', 0),
                "live_win_rate": comparison.get('live_trading', {}).get('win_rate', 0),
                "better_performer": "live" if comparison.get('performance_difference', {}).get('pnl_difference', 0) > 0 else "paper"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get comparison: {str(e)}")

@router.post("/sessions/start")
async def start_trading_session(
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Start a new trading session for current mode"""
    try:
        session_id = service.start_trading_session()
        
        if session_id is None:
            raise HTTPException(status_code=500, detail="Failed to start trading session")
        
        return {
            "success": True,
            "session_id": session_id,
            "mode": service.get_current_mode().value,
            "message": f"Started new {service.get_current_mode().value} trading session"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@router.post("/sessions/end")
async def end_trading_session(
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """End the current trading session"""
    try:
        success = service.end_trading_session()
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to end trading session")
        
        return {
            "success": True,
            "mode": service.get_current_mode().value,
            "message": f"Ended {service.get_current_mode().value} trading session"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

@router.post("/analytics/update")
async def update_daily_analytics(
    mode: Optional[str] = None,
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Update daily analytics for specified mode"""
    try:
        # Parse mode if provided
        trading_mode = None
        if mode:
            if mode.lower() == 'paper':
                trading_mode = TradingMode.PAPER
            elif mode.lower() == 'live':
                trading_mode = TradingMode.LIVE
            else:
                raise HTTPException(status_code=400, detail="Mode must be 'paper' or 'live'")
        
        success = service.update_daily_analytics(trading_mode)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update analytics")
        
        target_mode = (trading_mode or service.get_current_mode()).value
        
        return {
            "success": True,
            "mode": target_mode,
            "message": f"Updated daily analytics for {target_mode} mode"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update analytics: {str(e)}")

@router.get("/health")
async def trading_mode_health_check(
    service: TradingModeService = Depends(get_trading_mode_service)
):
    """Health check for trading mode service"""
    try:
        status = service.get_status()
        
        return {
            "status": "healthy",
            "current_mode": status['current_mode'],
            "session_active": status['current_session_id'] is not None,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

