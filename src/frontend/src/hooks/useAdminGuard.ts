import { useCallback } from "react";
import { useAuth } from "./useAuth";

/**
 * Real role-based action guard. Replaces the previous inert stub.
 *
 * `guardAction` runs the action only when the current role permits writes
 * (i.e. not View Only). For Admin/Attendance/Contract roles it executes
 * immediately; for View Only it no-ops so the UI never mutates data the role
 * cannot change. The backend independently enforces the same rule.
 */
export function useAdminGuard() {
  const { canEdit, isAdmin } = useAuth();

  const guardAction = useCallback(
    (action: () => void) => {
      if (canEdit) action();
    },
    [canEdit],
  );

  return {
    canEdit,
    isAdmin,
    guardAction,
  };
}
