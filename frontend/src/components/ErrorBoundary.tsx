'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-6">😵</div>
            <h1 className="text-2xl font-bold text-[#1a2e1c] mb-3">Something went wrong</h1>
            <p className="text-[#4b6b50] mb-2 text-sm leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="mt-6 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
