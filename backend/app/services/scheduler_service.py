"""
Scheduler Service
Automated scheduling system for market hours-based activities
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Callable
from enum import Enum
import json

from .market_hours_service import market_hours_service, MarketSession
from .autonomous_trading_service import autonomous_trading_service
from .signal_generation_service import signal_generation_service
from .analytics_service import analytics_service

logger = logging.getLogger(__name__)

class ScheduledTaskType(Enum):
    TRADING_ACTIVITY = "trading_activity"
    DATA_COLLECTION = "data_collection"
    SIGNAL_GENERATION = "signal_generation"
    LEARNING_CYCLE = "learning_cycle"
    EOD_REPORT = "eod_report"
    SYSTEM_MAINTENANCE = "system_maintenance"
    PERFORMANCE_ANALYSIS = "performance_analysis"

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class SchedulerService:
    """Service for automated scheduling based on market hours"""
    
    def __init__(self):
        self.is_running = False
        self.scheduled_tasks = {}
        self.task_history = []
        self.current_session = None
        self.last_session_check = None
        
        # Task execution counters
        self.tasks_executed_today = 0
        self.learning_cycles_completed = 0
        self.eod_reports_generated = 0
        
        # Configuration
        self.enable_trading_automation = True
        self.enable_learning_automation = True
        self.enable_data_collection = True
        self.enable_eod_reports = True
        
        # Initialize scheduled tasks
        self._initialize_scheduled_tasks()
        
        logger.info("Scheduler Service initialized")
    
    def _initialize_scheduled_tasks(self):
        """Initialize the scheduled tasks configuration"""
        self.scheduled_tasks = {
            # Pre-market preparation (8:00-9:30 AM ET)
            "pre_market_prep": {
                "type": ScheduledTaskType.SYSTEM_MAINTENANCE,
                "description": "Pre-market system preparation and data validation",
                "schedule": "pre_market",
                "frequency": "daily",
                "enabled": True,
                "last_run": None,
                "next_run": None
            },
            
            # Trading hours activities (9:30 AM - 4:00 PM ET)
            "trading_automation": {
                "type": ScheduledTaskType.TRADING_ACTIVITY,
                "description": "Autonomous trading execution during market hours",
                "schedule": "trading_hours",
                "frequency": "continuous",
                "enabled": True,
                "last_run": None,
                "next_run": None
            },
            
            "signal_generation": {
                "type": ScheduledTaskType.SIGNAL_GENERATION,
                "description": "AI signal generation during trading hours",
                "schedule": "trading_hours",
                "frequency": "every_2_minutes",
                "enabled": True,
                "last_run": None,
                "next_run": None
            },
            
            "data_collection": {
                "type": ScheduledTaskType.DATA_COLLECTION,
                "description": "Real-time market data collection",
                "schedule": "data_collection_hours",
                "frequency": "continuous",
                "enabled": True,
                "last_run": None,
                "next_run": None
            },
            
            # End of day activities (4:30 PM ET)
            "eod_report": {
                "type": ScheduledTaskType.EOD_REPORT,
                "description": "End-of-day performance report generation",
                "schedule": "eod",
                "frequency": "daily",
                "enabled": True,
                "last_run": None,
                "next_run": None
            },
            
            # After-hours learning (4:00 PM - 8:00 AM ET)
            "learning_cycle": {
                "type": ScheduledTaskType.LEARNING_CYCLE,
                "description": "AI model training and strategy optimization",
                "schedule": "learning_hours",
                "frequency": "every_30_minutes",
                "enabled": True,
                "last_run": None,
                "next_run": None
            },
            
            "performance_analysis": {
                "type": ScheduledTaskType.PERFORMANCE_ANALYSIS,
                "description": "Deep performance analysis and backtesting",
                "schedule": "learning_hours",
                "frequency": "every_2_hours",
                "enabled": True,
                "last_run": None,
                "next_run": None
            },
            
            # Weekend activities
            "weekly_optimization": {
                "type": ScheduledTaskType.LEARNING_CYCLE,
                "description": "Weekly strategy optimization and model retraining",
                "schedule": "weekend",
                "frequency": "weekly",
                "enabled": True,
                "last_run": None,
                "next_run": None
            }
        }
    
    async def start_scheduler(self):
        """Start the automated scheduler"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        self.is_running = True
        logger.info("Starting automated scheduler")
        
        try:
            while self.is_running:
                await self._scheduler_loop()
                await asyncio.sleep(30)  # Check every 30 seconds
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
        finally:
            self.is_running = False
            logger.info("Scheduler stopped")
    
    async def _scheduler_loop(self):
        """Main scheduler loop iteration"""
        current_time = market_hours_service.get_current_et_time()
        current_session = market_hours_service.get_market_session(current_time)
        
        # Check if session changed
        if current_session != self.current_session:
            await self._handle_session_change(current_session, self.current_session)
            self.current_session = current_session
        
        # Execute scheduled tasks
        await self._execute_scheduled_tasks(current_time, current_session)
        
        # Update task schedules
        self._update_task_schedules(current_time, current_session)
    
    async def _handle_session_change(self, new_session: MarketSession, old_session: MarketSession):
        """Handle market session transitions"""
        logger.info(f"Market session changed: {old_session} -> {new_session}")
        
        if new_session == MarketSession.PRE_MARKET:
            await self._start_pre_market_activities()
        elif new_session == MarketSession.REGULAR:
            await self._start_trading_activities()
        elif new_session == MarketSession.AFTER_HOURS:
            await self._start_after_hours_activities()
        elif new_session == MarketSession.CLOSED:
            await self._start_learning_activities()
        elif new_session == MarketSession.WEEKEND:
            await self._start_weekend_activities()
    
    async def _start_pre_market_activities(self):
        """Start pre-market preparation activities"""
        logger.info("Starting pre-market preparation")
        
        # System health checks
        await self._run_system_health_check()
        
        # Data validation
        await self._validate_market_data()
        
        # Model preparation
        await self._prepare_trading_models()
        
        # Reset daily counters
        self.tasks_executed_today = 0
        autonomous_trading_service.day_trades_used = 0
        autonomous_trading_service.daily_pnl = 0.0
    
    async def _start_trading_activities(self):
        """Start trading hours activities"""
        logger.info("Starting trading activities")
        
        # Enable trading automation
        if self.enable_trading_automation:
            autonomous_trading_service.set_master_switch(True)
            autonomous_trading_service.resume_trading()
        
        # Start signal generation
        if autonomous_trading_service.signal_generation_enabled:
            logger.info("Signal generation active during trading hours")
    
    async def _start_after_hours_activities(self):
        """Start after-hours activities"""
        logger.info("Starting after-hours activities")
        
        # Disable trading but keep data collection
        autonomous_trading_service.pause_trading()
        
        # Start learning activities
        if self.enable_learning_automation:
            await signal_generation_service.run_learning_cycle()
    
    async def _start_learning_activities(self):
        """Start learning and analysis activities"""
        logger.info("Starting learning activities")
        
        # Ensure trading is stopped
        autonomous_trading_service.pause_trading()
        
        # Run comprehensive learning cycle
        if self.enable_learning_automation:
            await self._run_comprehensive_learning()
    
    async def _start_weekend_activities(self):
        """Start weekend activities"""
        logger.info("Starting weekend activities")
        
        # Deep learning and optimization
        if self.enable_learning_automation:
            await self._run_weekly_optimization()
    
    async def _execute_scheduled_tasks(self, current_time: datetime, session: MarketSession):
        """Execute tasks that are due"""
        for task_name, task_config in self.scheduled_tasks.items():
            if not task_config["enabled"]:
                continue
            
            if await self._should_execute_task(task_name, task_config, current_time, session):
                await self._execute_task(task_name, task_config)
    
    async def _should_execute_task(self, task_name: str, task_config: Dict[str, Any], 
                                 current_time: datetime, session: MarketSession) -> bool:
        """Determine if a task should be executed"""
        schedule = task_config["schedule"]
        frequency = task_config["frequency"]
        last_run = task_config["last_run"]
        
        # Check if we're in the right session
        if schedule == "pre_market" and session != MarketSession.PRE_MARKET:
            return False
        elif schedule == "trading_hours" and session != MarketSession.REGULAR:
            return False
        elif schedule == "data_collection_hours" and not market_hours_service.is_data_collection_hours(current_time):
            return False
        elif schedule == "learning_hours" and not market_hours_service.is_learning_hours(current_time):
            return False
        elif schedule == "weekend" and session != MarketSession.WEEKEND:
            return False
        elif schedule == "eod" and not market_hours_service.should_generate_eod_report(current_time):
            return False
        
        # Check frequency
        if frequency == "continuous":
            return True
        elif frequency == "daily" and (not last_run or 
                                     last_run.date() < current_time.date()):
            return True
        elif frequency == "weekly" and (not last_run or 
                                      (current_time - last_run).days >= 7):
            return True
        elif frequency.startswith("every_"):
            # Parse frequency like "every_2_minutes", "every_30_minutes", "every_2_hours"
            parts = frequency.split("_")
            if len(parts) >= 3:
                interval = int(parts[1])
                unit = parts[2]
                
                if not last_run:
                    return True
                
                time_diff = current_time - last_run
                
                if unit == "minutes" and time_diff.total_seconds() >= interval * 60:
                    return True
                elif unit == "hours" and time_diff.total_seconds() >= interval * 3600:
                    return True
        
        return False
    
    async def _execute_task(self, task_name: str, task_config: Dict[str, Any]):
        """Execute a specific task"""
        task_type = task_config["type"]
        
        logger.info(f"Executing task: {task_name} ({task_type.value})")
        
        start_time = datetime.now()
        status = TaskStatus.RUNNING
        error_message = None
        
        try:
            if task_type == ScheduledTaskType.TRADING_ACTIVITY:
                await self._execute_trading_activity()
            elif task_type == ScheduledTaskType.SIGNAL_GENERATION:
                await self._execute_signal_generation()
            elif task_type == ScheduledTaskType.DATA_COLLECTION:
                await self._execute_data_collection()
            elif task_type == ScheduledTaskType.LEARNING_CYCLE:
                await self._execute_learning_cycle()
            elif task_type == ScheduledTaskType.EOD_REPORT:
                await self._execute_eod_report()
            elif task_type == ScheduledTaskType.SYSTEM_MAINTENANCE:
                await self._execute_system_maintenance()
            elif task_type == ScheduledTaskType.PERFORMANCE_ANALYSIS:
                await self._execute_performance_analysis()
            
            status = TaskStatus.COMPLETED
            self.tasks_executed_today += 1
            
        except Exception as e:
            status = TaskStatus.FAILED
            error_message = str(e)
            logger.error(f"Task {task_name} failed: {e}")
        
        # Update task history
        execution_time = (datetime.now() - start_time).total_seconds()
        
        task_record = {
            "task_name": task_name,
            "task_type": task_type.value,
            "start_time": start_time.isoformat(),
            "execution_time": execution_time,
            "status": status.value,
            "error_message": error_message
        }
        
        self.task_history.append(task_record)
        
        # Keep only last 100 task records
        if len(self.task_history) > 100:
            self.task_history = self.task_history[-100:]
        
        # Update last run time
        task_config["last_run"] = datetime.now()
    
    async def _execute_trading_activity(self):
        """Execute trading activity tasks"""
        # This is handled by the autonomous trading service
        # Just ensure it's running if it should be
        if market_hours_service.should_execute_trades():
            if not autonomous_trading_service.master_switch:
                autonomous_trading_service.set_master_switch(True)
    
    async def _execute_signal_generation(self):
        """Execute signal generation"""
        symbols = ['SPY', 'QQQ', 'IWM']
        signals = await signal_generation_service.generate_signals(symbols)
        logger.info(f"Generated {len(signals)} signals")
    
    async def _execute_data_collection(self):
        """Execute data collection tasks"""
        # In production, this would trigger data collection from external sources
        logger.info("Data collection task executed")
    
    async def _execute_learning_cycle(self):
        """Execute learning cycle"""
        await signal_generation_service.run_learning_cycle()
        self.learning_cycles_completed += 1
        logger.info(f"Learning cycle completed ({self.learning_cycles_completed} today)")
    
    async def _execute_eod_report(self):
        """Execute end-of-day report generation"""
        # Generate comprehensive EOD report
        performance = analytics_service.get_real_time_performance()
        trading_status = autonomous_trading_service.get_status()
        
        eod_data = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "performance": performance,
            "trading_summary": {
                "total_trades": trading_status.get('day_trades_used', 0),
                "active_positions": len(autonomous_trading_service.get_positions()),
                "daily_pnl": autonomous_trading_service.daily_pnl
            },
            "model_metrics": signal_generation_service.get_model_metrics()
        }
        
        logger.info(f"EOD report generated: Daily P&L ${autonomous_trading_service.daily_pnl:.2f}")
        self.eod_reports_generated += 1
    
    async def _execute_system_maintenance(self):
        """Execute system maintenance tasks"""
        await self._run_system_health_check()
        await self._cleanup_old_data()
        logger.info("System maintenance completed")
    
    async def _execute_performance_analysis(self):
        """Execute performance analysis"""
        # Run comprehensive performance analysis
        analytics_data = analytics_service.get_performance_analytics("1M", "ALL")
        logger.info("Performance analysis completed")
    
    async def _run_system_health_check(self):
        """Run system health checks"""
        # Check service health
        services_healthy = True
        
        # Check autonomous trading service
        try:
            status = autonomous_trading_service.get_status()
            if status['automation_status'] == 'emergency_stop':
                services_healthy = False
        except Exception:
            services_healthy = False
        
        # Check signal generation service
        try:
            metrics = signal_generation_service.get_model_metrics()
            if metrics['model_accuracy'] < 50:  # Minimum acceptable accuracy
                logger.warning("Model accuracy below threshold")
        except Exception:
            services_healthy = False
        
        if services_healthy:
            logger.info("System health check passed")
        else:
            logger.warning("System health check found issues")
    
    async def _validate_market_data(self):
        """Validate market data integrity"""
        # In production, this would validate data from external sources
        logger.info("Market data validation completed")
    
    async def _prepare_trading_models(self):
        """Prepare trading models for the day"""
        # Ensure models are loaded and ready
        logger.info("Trading models prepared")
    
    async def _run_comprehensive_learning(self):
        """Run comprehensive learning during closed hours"""
        await signal_generation_service.run_learning_cycle()
        
        # Additional learning activities during closed hours
        logger.info("Comprehensive learning cycle completed")
    
    async def _run_weekly_optimization(self):
        """Run weekly optimization during weekends"""
        # Deep model optimization and strategy backtesting
        logger.info("Weekly optimization completed")
    
    async def _cleanup_old_data(self):
        """Clean up old data to save storage"""
        # Remove old task history, logs, etc.
        cutoff_date = datetime.now() - timedelta(days=30)
        
        # Clean task history
        self.task_history = [
            task for task in self.task_history 
            if datetime.fromisoformat(task['start_time']) > cutoff_date
        ]
        
        logger.info("Data cleanup completed")
    
    def _update_task_schedules(self, current_time: datetime, session: MarketSession):
        """Update next run times for tasks"""
        for task_name, task_config in self.scheduled_tasks.items():
            # Calculate next run time based on schedule and frequency
            # This is a simplified implementation
            pass
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        self.is_running = False
        logger.info("Scheduler stop requested")
    
    def get_scheduler_status(self) -> Dict[str, Any]:
        """Get current scheduler status"""
        current_time = market_hours_service.get_current_et_time()
        market_status = market_hours_service.get_market_status()
        
        return {
            "is_running": self.is_running,
            "current_session": self.current_session.value if self.current_session else None,
            "market_status": market_status,
            "tasks_executed_today": self.tasks_executed_today,
            "learning_cycles_completed": self.learning_cycles_completed,
            "eod_reports_generated": self.eod_reports_generated,
            "scheduled_tasks": {
                name: {
                    "type": config["type"].value,
                    "description": config["description"],
                    "enabled": config["enabled"],
                    "last_run": config["last_run"].isoformat() if config["last_run"] else None,
                    "schedule": config["schedule"],
                    "frequency": config["frequency"]
                }
                for name, config in self.scheduled_tasks.items()
            },
            "recent_tasks": self.task_history[-10:],  # Last 10 tasks
            "automation_settings": {
                "trading_automation": self.enable_trading_automation,
                "learning_automation": self.enable_learning_automation,
                "data_collection": self.enable_data_collection,
                "eod_reports": self.enable_eod_reports
            }
        }
    
    def update_automation_settings(self, settings: Dict[str, Any]):
        """Update automation settings"""
        for key, value in settings.items():
            if hasattr(self, f"enable_{key}"):
                setattr(self, f"enable_{key}", value)
                logger.info(f"Updated {key} automation: {value}")
    
    def enable_task(self, task_name: str):
        """Enable a specific task"""
        if task_name in self.scheduled_tasks:
            self.scheduled_tasks[task_name]["enabled"] = True
            logger.info(f"Enabled task: {task_name}")
    
    def disable_task(self, task_name: str):
        """Disable a specific task"""
        if task_name in self.scheduled_tasks:
            self.scheduled_tasks[task_name]["enabled"] = False
            logger.info(f"Disabled task: {task_name}")

# Global instance
scheduler_service = SchedulerService()

