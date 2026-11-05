import { Suspense, type ReactNode } from "react";

import { RemoteErrorBoundary } from "../RemoteErrorBoundary/RemoteErrorBoundary";
import { RemoteFallback } from "../RemoteFallback/RemoteFallback";

type Props = { errorTitle: string; errorMessage: string; children: ReactNode };

export function RemoteSlot({ errorTitle, errorMessage, children }: Props) {
  return (
    <RemoteErrorBoundary title={errorTitle} message={errorMessage}>
      <Suspense fallback={<RemoteFallback />}>{children}</Suspense>
    </RemoteErrorBoundary>
  );
}
