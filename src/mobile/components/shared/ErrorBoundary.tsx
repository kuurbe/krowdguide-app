import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Name shown in fallback UI — e.g. "Map", "Predict", "Account" */
  name?: string;
  /** Optional custom fallback */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches render errors in child tree
 * and shows a graceful fallback instead of crashing the app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name ?? 'unknown'}]`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[var(--k-bg)]">
          <div className="w-16 h-16 rounded-2xl liquid-glass flex items-center justify-center mb-5"
               style={{ boxShadow: 'var(--k-glow-coral)' }}>
            <AlertTriangle className="w-8 h-8 text-[var(--k-color-coral)]" />
          </div>

          <h3 className="type-title-2 text-[var(--k-text)] mb-2">
            {this.props.name ? `${this.props.name} hit a snag` : 'Something went wrong'}
          </h3>

          <p className="text-[13px] text-[var(--k-text-m)] max-w-[260px] mb-6 leading-relaxed">
            {this.state.error?.message
              ? `Error: ${this.state.error.message.slice(0, 120)}`
              : 'An unexpected error occurred. Try again or restart the app.'}
          </p>

          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold
                       bg-gradient-to-r from-[var(--k-color-coral)] to-[var(--k-color-purple)] text-white
                       ios-press"
            style={{ boxShadow: 'var(--k-glow-coral)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
