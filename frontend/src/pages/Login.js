import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#1d4ed8_0%,#0f172a_45%,#020617_100%)] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(2,6,23,0.55)] bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between p-10 text-white bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100 font-bold">Smart Campus Energy</p>
            <h2 className="text-4xl font-black mt-4 leading-tight">Monitor. Analyze. Optimize.</h2>
            <p className="mt-4 text-blue-100 text-sm">
              Secure access for operations and administration across your campus energy network.
            </p>
          </div>
          <div className="space-y-2 text-sm text-blue-100">
            <p>Live sensor telemetry</p>
            <p>Energy and cost insights</p>
            <p>Role-based control</p>
          </div>
        </div>

        <div className="p-7 md:p-10">
          <div className="mb-8">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 9v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9l-10-7zm0 14l-3-4h6l-3 4zm0-6L9 11h8l-4-3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sign in to Smart Campus Energy Monitor</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold py-3.5 shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            New user?{' '}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
