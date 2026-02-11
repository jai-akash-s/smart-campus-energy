import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Home = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Smart Campus <span className="text-blue-600">Energy Monitoring</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Real-time energy consumption monitoring and analytics for. Optimize energy usage, reduce costs, and track environmental impact.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/login" className="btn-primary px-8 py-3 text-lg">
                Get Started
              </Link>
              <button className="px-8 py-3 rounded-lg border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="card p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-Time Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Live energy consumption data with instant updates</p>
            </div>
            <div className="card p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Sensors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">12+ IoT sensors monitoring AC, lighting, and power</p>
            </div>
            <div className="card p-6">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cost Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monitor expenses and optimize energy spending</p>
            </div>
            <div className="card p-6">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Alerts & Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Anomaly detection and automated notifications</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-blue-600 text-white rounded-2xl p-12 text-center mb-16">
            <h2 className="text-3xl font-bold mb-12">System Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <p className="text-4xl font-bold mb-2">12</p>
                <p className="text-blue-100">Active Sensors</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">4</p>
                <p className="text-blue-100">Buildings Monitored</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">24/7</p>
                <p className="text-blue-100">Live Monitoring</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">99.9%</p>
                <p className="text-blue-100">Uptime</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to monitor energy?</h2>
            <Link to="/register" className="btn-primary px-8 py-3 text-lg inline-block">
              Sign Up Now
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 mt-20 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
            <p>© 2026 Smart Campus Energy Monitoring</p>
          </div>
        </footer>
      </main>
    </>
  );
};

export default Home;
