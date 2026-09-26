package com.siwraaj.attendance;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;

import androidx.annotation.Nullable;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;


public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(AttendancePdfPlugin.class);
        registerPlugin(AttendanceNotificationsPlugin.class);
        registerPlugin(AttendancePushPlugin.class);
        super.onCreate(savedInstanceState);
        createPushNotificationChannel();

        Window window = getWindow();

        // Draw the WebView behind both system bars so the Rossie header is
        // visually continuous with the Android status-bar area.
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.rgb(7, 11, 22));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
            window,
            window.getDecorView()
        );
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);

        // Android 15 enforces edge-to-edge for apps targeting recent SDKs.
        // Keep the WebView content below the status bar while retaining the
        // dark Rossie background behind the system bar.
        final View content = findViewById(android.R.id.content);
        if (content != null) {
            ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
                final int top = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
                view.setPadding(view.getPaddingLeft(), top, view.getPaddingRight(), view.getPaddingBottom());
                return insets;
            });
            ViewCompat.requestApplyInsets(content);
        }
    }

    private void createPushNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
            "rossie_push",
            "Rossie notifications",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Login requests and Rossie account notifications");
        channel.enableVibration(true);
        channel.setShowBadge(true);
        manager.createNotificationChannel(channel);
    }
}
