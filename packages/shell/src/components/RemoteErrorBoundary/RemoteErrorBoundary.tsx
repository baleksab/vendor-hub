import { Alert } from "@mantine/core";
import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; title: string; message: string };

export class RemoteErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <Alert color="red" title={this.props.title}>
          {this.props.message}
        </Alert>
      );
    }

    return this.props.children;
  }
}
