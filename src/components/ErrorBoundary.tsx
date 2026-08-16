"use client";

/**
 * Global error boundary.
 *
 * Catches render errors in the app shell and shows a friendly
 * fallback. Prevents the entire app from crashing on a single
 * component error. Reports to Sentry if configured.
 */

import React from "react";
import * as Sentry from "@sentry/nextjs";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: { react: { componentStack: info.componentStack ?? "" } },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          style={{
            padding: 24,
            margin: 24,
            border: "1px solid #f5c2c7",
            borderRadius: 8,
            background: "#f8d7da",
            color: "#842029",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Something went wrong.</h2>
          <p>
            Please refresh the page. If the problem persists, contact support.
          </p>
          {this.state.error && (
            <pre style={{ fontSize: 12, opacity: 0.7 }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
