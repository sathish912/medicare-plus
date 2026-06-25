import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong.</h1>
          <p className="text-slate-700 mb-4">The application encountered an unexpected error.</p>
          <div className="bg-slate-100 p-4 rounded overflow-auto text-sm font-mono text-red-800">
            <p className="font-bold">{this.state.error && this.state.error.toString()}</p>
            <br />
            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
