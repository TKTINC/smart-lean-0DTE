import React from 'react';

const Analytics = ({ isConnected }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <div className="text-sm text-gray-400">
          {isConnected ? 'Live Data' : 'Demo Mode'}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Analytics</h3>
        <p className="text-gray-400">Advanced analytics and backtesting features coming soon...</p>
      </div>
    </div>
  );
};

export default Analytics;

