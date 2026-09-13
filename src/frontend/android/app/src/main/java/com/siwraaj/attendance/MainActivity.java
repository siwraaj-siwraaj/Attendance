package com.siwraaj.attendance;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.webkit.WebView;

import androidx.annotation.Nullable;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int APP_BACKGROUND = Color.rgb(4, 9, 19);
    private static final int NAVIGATION_BACKGROUND = Color.rgb(7, 11, 22);

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        registerPlugin(AttendancePdfPlugin.class);

        // Keep the exact same dark surface visible during the hand-off from
        // Android's launch splash to the Capacitor WebView. This prevents the
        // default white Activity/WebView surface from flashing on cold launch.
        SplashScreen.installSplashScreen(this);

        Window window = getWindow();
        window.setBackgroundDrawable(new ColorDrawable(APP_BACKGROUND));
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(NAVIGATION_BACKGROUND);

        super.onCreate(savedInstanceState);

        // Capacitor creates the WebView during super.onCreate(). Explicitly
        // paint it before the first page is rendered so its initial surface
        // cannot fall back to Android/WebView's default white background.
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setBackgroundColor(APP_BACKGROUND);
            webView.setBackgroundResource(0);
        }

        // Draw the WebView behind both system bars so the app header remains
        // visually continuous with the Android status-bar area.
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(NAVIGATION_BACKGROUND);

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
    }
}
