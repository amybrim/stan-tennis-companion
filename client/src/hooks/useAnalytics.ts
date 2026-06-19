import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useGuestSession } from "@/contexts/GuestSessionContext";

/**
 * useAnalytics — fire-and-forget event tracking hook.
 * Never blocks the user. Never throws.
 */
export function useAnalytics() {
  const { token } = useGuestSession();
  const logMutation = trpc.analytics.log.useMutation();

  const track = useCallback(
    (event: string, label?: string, page?: string, metadata?: Record<string, unknown>) => {
      if (!token) return;
      logMutation.mutate({
        guestId: token,
        event,
        page,
        label,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      });
    },
    [token] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { track };
}
