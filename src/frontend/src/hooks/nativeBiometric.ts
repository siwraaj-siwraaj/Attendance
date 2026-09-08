import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";

const SERVER = "https://sduxdklpycjrydqdtdtc.supabase.co";

export async function saveBiometricCredentials(
  username: string,
  password: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await NativeBiometric.setCredentials({
      username,
      password,
      server: SERVER,
    });
  } catch {
    // Biometric setup is optional; normal login still works.
  }
}

export async function biometricLogin(): Promise<{
  username: string;
  password: string;
} | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const saved = await NativeBiometric.isCredentialsSaved({
      server: SERVER,
    });

    if (!saved.isSaved) return null;

    const available = await NativeBiometric.isAvailable({
      useFallback: true,
    });

    if (!available.isAvailable) return null;

    await NativeBiometric.verifyIdentity({
      reason: "Unlock your Rossie account",
      title: "Sign in to Rossie",
      subtitle: "Use fingerprint or phone PIN",
      description: "Authenticate to continue",
      useFallback: true,
      maxAttempts: 3,
    });

    return await NativeBiometric.getCredentials({
      server: SERVER,
    });
  } catch {
    return null;
  }
}

export async function clearBiometricCredentials(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await NativeBiometric.deleteCredentials({
      server: SERVER,
    });
  } catch {
    // Ignore cleanup errors.
  }
}
