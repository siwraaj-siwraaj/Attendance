package com.siwraaj.attendance;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "AttendanceNotifications")
public class AttendanceNotificationsPlugin extends Plugin {
    private static final String CHANNEL_ID = "rossie_account";
    private static final int PERMISSION_REQUEST_CODE = 7401;

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    PERMISSION_REQUEST_CODE
                );
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void notify(PluginCall call) {
        String title = call.getString("title", "Rossie");
        String body = call.getString("body", "");
        createChannel();

        NotificationManager manager =
            (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            call.reject("Notification permission not granted");
            return;
        }

        IntentLauncher.launch(getActivity(), manager, title, body);
        call.resolve();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager =
            (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Rossie account notifications",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Login requests and account approval updates");
        manager.createNotificationChannel(channel);
    }

    private static final class IntentLauncher {
        static void launch(android.app.Activity activity, NotificationManager manager, String title, String body) {
            android.content.Intent intent = activity.getPackageManager()
                .getLaunchIntentForPackage(activity.getPackageName());
            if (intent == null) {
                intent = new android.content.Intent(activity, MainActivity.class);
            }
            intent.setFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP | android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                activity,
                (int) System.currentTimeMillis(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(activity, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

            manager.notify((int) (System.currentTimeMillis() & 0x7fffffff), builder.build());
        }
    }
}
