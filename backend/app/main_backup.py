"""
Smart-Lean-0DTE System - Simplified Main Application
Cost-optimized FastAPI application for professional 0DTE trading
"""

import os
import logging
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Smart-Lean-0DTE System",
    description="Professional 0DTE Options Trading with 89-90% Cost Reduction",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for demo data
demo_data = {
    "performance": {
        "totalTrades": 1247,
        "winRate": 78.5,
        "totalPnL": 45670.25,
        "todayPnL": 1234.50
    },
    "recentSignals": [
        {
            "id": 1,
            "symbol": "SPY",
            "type": "CALL",
            "strike": 445,
            "signal": "BUY",
            "confidence": 0.85,
            "time": "09:31:15"
        },
        {
            "id": 2,
            "symbol": "QQQ",
            "type": "PUT",
            "strike": 375,
            "signal": "SELL",
            "confidence": 0.78,
            "time": "09:30:45"
        },
        {
            "id": 3,
            "symbol": "IWM",
            "type": "CALL",
            "strike": 195,
            "signal": "BUY",
            "confidence": 0.82,
            "time": "09:30:12"
        }
    ],
    "performanceChart": [
        {"time": "09:30", "pnl": 0},
        {"time": "10:00", "pnl": 250},
        {"time": "10:30", "pnl": 180},
        {"time": "11:00", "pnl": 420},
        {"time": "11:30", "pnl": 380},
        {"time": "12:00", "pnl": 650},
        {"time": "12:30", "pnl": 580},
        {"time": "13:00", "pnl": 720},
        {"time": "13:30", "pnl": 890},
        {"time": "14:00", "pnl": 1234}
    ],
    "costMetrics": {
        "monthlyCost": 485,
        "costSavings": 89.2,
        "efficiency": 94.5
    }
}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Smart-Lean-0DTE System API",
        "version": "1.0.0",
        "status": "operational",
        "cost_optimization": "89-90% reduction",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "lean_mode": os.getenv("LEAN_MODE", "true"),
        "services": {
            "api": "healthy",
            "database": "healthy",  # Simplified for demo
            "cache": "healthy"      # Simplified for demo
        }
    }

@app.get("/api/dashboard")
async def get_dashboard_data():
    """Get dashboard data for the frontend"""
    return demo_data

@app.get("/api/trading/positions")
async def get_positions():
    """Get current trading positions"""
    return {
        "positions": [
            {
                "id": 1,
                "symbol": "SPY",
                "type": "CALL",
                "strike": 445,
                "quantity": 10,
                "avgPrice": 2.45,
                "currentPrice": 2.67,
                "pnl": 220,
                "pnlPercent": 8.98
            },
            {
                "id": 2,
                "symbol": "QQQ",
                "type": "PUT",
                "strike": 375,
                "quantity": -5,
                "avgPrice": 1.85,
                "currentPrice": 1.62,
                "pnl": 115,
                "pnlPercent": 12.43
            }
        ]
    }

@app.get("/api/trading/orders")
async def get_orders():
    """Get recent orders"""
    return {
        "orders": [
            {
                "id": 1,
                "symbol": "SPY",
                "type": "CALL",
                "strike": 446,
                "action": "BUY",
                "quantity": 5,
                "price": 2.30,
                "status": "PENDING",
                "time": "14:23:15"
            },
            {
                "id": 2,
                "symbol": "QQQ",
                "type": "PUT",
                "strike": 374,
                "action": "SELL",
                "quantity": 3,
                "price": 1.95,
                "status": "FILLED",
                "time": "14:20:45"
            }
        ]
    }

@app.get("/api/system/info")
async def get_system_info():
    """Get system information"""
    return {
        "system": "Smart-Lean-0DTE",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "lean_mode": True,
        "cost_optimization": {
            "enabled": True,
            "savings_percent": 89.2,
            "monthly_cost": "$485",
            "vs_enterprise": "$4,200+ saved"
        },
        "features": {
            "real_time_data": True,
            "ai_signals": True,
            "risk_management": True,
            "cost_optimization": True,
            "paper_trading": True
        }
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    logger.info(f"Starting Smart-Lean-0DTE System on {host}:{port}")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Lean Mode: {os.getenv('LEAN_MODE', 'true')}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )

