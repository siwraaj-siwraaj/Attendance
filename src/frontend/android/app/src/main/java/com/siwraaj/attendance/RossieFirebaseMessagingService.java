package com.siwraaj.attendance;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class RossieFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "rossie_push";

    @Override
    public void onMessageReceived(RemoteMessage message) {
        String title = message.getNotification() != null && message.getNotification().getTitle() != null
                ? message.getNotification().getTitle()
                : message.getData().get("title") != null ? message.getData().get("title") : "Rossie";
        String body = message.getNotification() != null && message.getNotification().getBody() != null
                ? message.getNotification().getBody()
                : message.getData().get("body") != null ? message.getData().get("body") : "";
        showNotification(title, body);
    }

    @Override
    public void onNewToken(String token) {
        // The web layer registers the current token after authentication.
        getSharedPreferences("rossie_push", MODE_PRIVATE)
                .edit().putString("fcm_token", token).apply();
    }

    private void showNotification(String title, String body) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(new NotificationChannel(
                    CHANNEL_ID,
                    "Rossie notifications",
                    NotificationManager.IMPORTANCE_HIGH
            ));
        }

        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch == null) launch = new Intent(this, MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pending = PendingIntent.getActivity(
                this, (int) System.currentTimeMillis(), launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pending);

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        manager.notify((int) (System.currentTimeMillis() & 0x7fffffff), builder.build());
    }
}
