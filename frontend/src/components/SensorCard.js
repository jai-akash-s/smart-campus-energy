import React from 'react';
import clsx from 'clsx';

const SensorCard = ({ sensor, onToggle, showDetails = false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ac':
        return '❄️';
      case 'light':
        return '💡';
      case 'meter':
        return '⚡';
      case 'temperature':
        return '🌡️';
      default:
        return '📡';
    }
  };

  const isHighUsage = sensor.power > (sensor.threshold * 0.8);
  const isCritical = sensor.power > sensor.threshold;

  return (
    <div className={clsx(
      'card p-5 cursor-pointer transition-all duration-300 hover:shadow-lg',
      isCritical && 'border-l-4 border-red-500',
      isHighUsage && !isCritical && 'border-l-4 border-yellow-500'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-3xl">{getTypeIcon(sensor.type)}</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{sensor.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{sensor.buildingName}</p>
          </div>
        </div>
        <span className={clsx('badge text-xs', getStatusColor(sensor.status))}>
          {sensor.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Power</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{sensor.power.toFixed(2)} kW</p>
        </div>
        {sensor.temp > 0 && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Temperature</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{sensor.temp.toFixed(1)}°C</p>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            {sensor.voltage > 0 && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Voltage</p>
                <p className="font-semibold text-gray-900 dark:text-white">{sensor.voltage}V</p>
              </div>
            )}
            {sensor.current > 0 && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Current</p>
                <p className="font-semibold text-gray-900 dark:text-white">{sensor.current}A</p>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            Toggle Control
          </button>
        </div>
      )}

      {/* Power Usage Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div
          className={clsx(
            'h-full transition-all duration-300',
            isCritical ? 'bg-red-500' : isHighUsage ? 'bg-yellow-500' : 'bg-green-500'
          )}
          style={{ width: `${Math.min((sensor.power / sensor.threshold) * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {Math.round((sensor.power / sensor.threshold) * 100)}% of threshold
      </p>
    </div>
  );
};

export default SensorCard;
