import { Component } from "react";
import Button from "./Button";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary capturou um erro:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <p className="text-base font-bold text-text-primary">
            Algo deu errado.
          </p>
          <p className="text-sm text-text-tertiary">
            Tente novamente ou volte mais tarde.
          </p>
          <Button onClick={this.handleRetry}>Tentar de novo</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
