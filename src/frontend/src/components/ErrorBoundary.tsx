import { Component, type ReactNode } from "react";

interface Props {
  tabName?: string;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] px-4">
          <div
            className="glass-card rounded-2xl p-8 max-w-sm w-full text-center"
            data-ocid="error_boundary.panel"
          >
            <h2 className="text-xl font-bold text-white mb-2">
              Something went wrong
              {this.props.tabName ? ` in ${this.props.tabName} tab` : ""}
              Something went wrong
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-orange glow-orange px-6 py-2.5 rounded-xl text-sm font-semibold transition-smooth hover:opacity-90"
              data-ocid="error_boundary.reload_button"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
