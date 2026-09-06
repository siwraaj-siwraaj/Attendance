import { useEffect, useRef } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "rossie_last_backup";
const REMINDER_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function useAutoBackupReminder(enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const checkAndRemind = () => {
      const lastBackupRaw = localStorage.getItem(STORAGE_KEY);
      const lastBackup = lastBackupRaw ? Number(lastBackupRaw) : 0;
      const now = Date.now();

      if (lastBackup === 0 || now - lastBackup >= REMINDER_INTERVAL_MS) {
        toast.info("Reminder: Download a backup to keep your data safe", {
          duration: 6000,
          action: {
            label: "Dismiss",
            onClick: () => {},
          },
        });
      }
    };

    // Check immediately on mount / when enabled
    checkAndRemind();

    // Then check every 5 minutes (shorter than reminder interval so we catch it promptly)
    timerRef.current = setInterval(checkAndRemind, 5 * 60 * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled]);
}

export function markBackupDownloaded() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}
