import { registerPlugin } from "@capacitor/core";

interface AttendanceNotificationsPlugin {
  requestPermission(): Promise<void>;
  notify(options: { title: string; body: string }): Promise<void>;
}

const AttendanceNotifications = registerPlugin<AttendanceNotificationsPlugin>(
  "AttendanceNotifications",
);

export async function requestNotificationPermission() {
  try {
    await AttendanceNotifications.requestPermission();
  } catch {
    // Browser builds and devices without the native plugin simply ignore this.
  }
}

export async function showAppNotification(title: string, body: string) {
  try {
    await AttendanceNotifications.notify({ title, body });
    return true;
  } catch {
    try {
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(title, { body });
          return true;
        }
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            new Notification(title, { body });
            return true;
          }
        }
      }
    } catch {
      // Ignore unsupported browser notification APIs.
    }
    return false;
  }
}
