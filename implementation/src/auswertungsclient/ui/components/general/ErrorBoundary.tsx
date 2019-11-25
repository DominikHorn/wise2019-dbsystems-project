import * as React from "react";
import { renderError } from "../../guiUtil";

interface IState {
  readonly error?: Error;
}

export function withErrorBoundary<TProps>(
  WrappedComponent: React.ComponentType<TProps>,
  errorRenderer: (error: Error) => React.ReactNode = (error: Error) =>
    renderError(error.message)
): React.ComponentType<TProps> {
  return class ErrorBoundary extends React.Component<TProps, IState> {
    constructor(props: TProps) {
      super(props);
      this.state = {};
    }

    static getDerivedStateFromError(error: Error) {
      return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
      console.error("Caught error:", error);
      console.error("Error did provide the following information:", info);
    }

    render() {
      const { error } = this.state;
      if (error) {
        return errorRenderer(error);
      }
      return <WrappedComponent {...this.props} />;
    }
  };
}
