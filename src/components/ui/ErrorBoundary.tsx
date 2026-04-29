"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Karigai UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <h2 className="font-display text-3xl text-ink">Something went wrong</h2>
          <p className="mt-2 font-body text-sm leading-6 text-muted">
            Karigai hit an unexpected UI error. Try again and we will reload this view.
          </p>
          <Button className="mt-5" onClick={() => this.setState({ hasError: false })}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }
}
