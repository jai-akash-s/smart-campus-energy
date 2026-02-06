import React from 'react';

const StatCard = ({ title, value, unit, icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  };

  const iconBg = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  };

  return (
    <div className={`${colorClasses[color]} card border-l-4 p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">{unit}</span>
          </p>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.direction === 'up' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}% from last month
            </p>
          )}
        </div>
        <div className={`${iconBg[color]} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
export default StatCard;
