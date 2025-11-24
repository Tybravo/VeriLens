'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TestTube, Play, BarChart3, Settings, FileText, Shield, Award, Clock, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import TestRunner from '@/components/TestRunner';

interface TestMetric {
  label: string;
  value: number | string;
  change?: number;
  icon: React.ComponentType<any>;
}

interface TestHistory {
  date: string;
  total: number;
  passed: number;
  failed: number;
  duration: number;
}

export default function TestPage() {
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [selectedTestType, setSelectedTestType] = useState<string>('all');

  const testMetrics: TestMetric[] = [
    {
      label: 'Total Tests Run',
      value: 247,
      change: 12.5,
      icon: TestTube,
    },
    {
      label: 'Success Rate',
      value: '94.3%',
      change: 2.1,
      icon: CheckCircle,
    },
    {
      label: 'Avg Duration',
      value: '18.2s',
      change: -5.3,
      icon: Clock,
    },
    {
      label: 'Active Certificates',
      value: 156,
      change: 8.7,
      icon: Award,
    },
  ];

  const testHistory: TestHistory[] = [
    { date: '2024-01-15', total: 45, passed: 42, failed: 3, duration: 820 },
    { date: '2024-01-14', total: 38, passed: 36, failed: 2, duration: 695 },
    { date: '2024-01-13', total: 52, passed: 49, failed: 3, duration: 945 },
    { date: '2024-01-12', total: 41, passed: 39, failed: 2, duration: 738 },
    { date: '2024-01-11', total: 71, passed: 67, failed: 4, duration: 1278 },
  ];

  const testCategories = [
    {
      id: 'workflow',
      name: 'Workflow Tests',
      description: 'Complete end-to-end workflow validation',
      icon: Play,
      testCount: 8,
      color: 'blue',
    },
    {
      id: 'ui',
      name: 'UI/UX Tests',
      description: 'User interface and experience testing',
      icon: Shield,
      testCount: 12,
      color: 'purple',
    },
    {
      id: 'performance',
      name: 'Performance Tests',
      description: 'Speed, load, and responsiveness testing',
      icon: BarChart3,
      testCount: 6,
      color: 'green',
    },
    {
      id: 'security',
      name: 'Security Tests',
      description: 'Security and encryption validation',
      icon: FileText,
      testCount: 9,
      color: 'red',
    },
    {
      id: 'blockchain',
      name: 'Blockchain Tests',
      description: 'Real Sui blockchain transaction testing',
      icon: Zap,
      testCount: 15,
      color: 'yellow',
    },
  ];

  const recentTests = [
    {
      name: 'Happy Path - Complete Success',
      status: 'passed',
      duration: '15.3s',
      timestamp: '2 minutes ago',
    },
    {
      name: 'Walrus Upload Failure',
      status: 'failed',
      duration: '4.8s',
      timestamp: '5 minutes ago',
    },
    {
      name: 'Seal Encryption Enabled',
      status: 'passed',
      duration: '22.1s',
      timestamp: '12 minutes ago',
    },
    {
      name: 'Mobile Responsive Test',
      status: 'passed',
      duration: '8.7s',
      timestamp: '18 minutes ago',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center space-x-3 mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
              <TestTube className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Verilens Test Suite
            </h1>
          </motion.div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive end-to-end testing for the Verilens authenticity verification workflow
          </p>
        </div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {testMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {metric.change && (
                    <div className={`text-sm font-medium ${
                      metric.change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-gray-400 text-sm">{metric.label}</div>
              </div>
            );
          })}
        </motion.div>

        {/* Test Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Test Categories</h2>
            <button
              onClick={() => setShowTestRunner(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105"
            >
              <Play className="w-4 h-4" />
              <span>Run Tests</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 ${getColorClasses(category.color)}`}
                  onClick={() => {
                    if (category.id === 'blockchain') {
                      window.location.href = '/test/blockchain';
                    } else {
                      setSelectedTestType(category.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(category.color)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                    </div>
                    <div className="text-2xl font-bold text-white">{category.testCount}</div>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{category.testCount} tests available</span>
                    <button className="text-xs hover:underline">View Tests →</button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Tests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Test Runs</h2>
            <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
              View All →
            </button>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="grid grid-cols-4 gap-4 text-gray-400 text-sm font-medium">
                <div>Test Name</div>
                <div>Status</div>
                <div>Duration</div>
                <div>Time</div>
              </div>
            </div>
            <div className="divide-y divide-gray-700">
              {recentTests.map((test, index) => (
                <div key={index} className="p-6 hover:bg-gray-800/30 transition-colors">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div className="text-white font-medium">{test.name}</div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(test.status)}
                      <span className={`capitalize ${
                        test.status === 'passed' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    <div className="text-gray-300">{test.duration}</div>
                    <div className="text-gray-400 text-sm">{test.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Test History Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Test History (Last 7 Days)</h3>
          <div className="space-y-4">
            {testHistory.map((day, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-20 text-gray-400 text-sm">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(day.passed / day.total) * 100}%` }}
                  />
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-green-400">{day.passed}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-red-400">{day.failed}</span>
                  </div>
                  <div className="text-gray-400">
                    {Math.round(day.duration / 1000)}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Test Runner Modal */}
      <TestRunner 
        isOpen={showTestRunner}
        onClose={() => setShowTestRunner(false)}
      />
    </motion.div>
  );
}