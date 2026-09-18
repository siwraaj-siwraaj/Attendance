import { registerPlugin } from "@capacitor/core";

interface AttendancePushPlugin {
  requestPermission(): Promise<void>;
  getToken(): Promise<{ token: string }>;
  deleteToken(): Promise<void>;
}

const AttendancePush = registerPlugin<AttendancePushPlugin>("AttendancePush");

export async function registerPushTokenForCurrentUser() {
  try {
    await AttendancePush.requestPermission();
    const { token } = await AttendancePush.getToken();
    return token;
  } catch {
    return null;
  }
}

export async function deletePushToken() {
  try {
    await AttendancePush.deleteToken();
  } catch {
    // Ignore unsupported/browser builds.
  }
}
