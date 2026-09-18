package com.siwraaj.attendance;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;

@CapacitorPlugin(name = "AttendancePush")
public class AttendancePushPlugin extends Plugin {
    private static final int PERMISSION_REQUEST_CODE = 7402;

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(),
                new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_CODE);
        }
        call.resolve();
    }

    @PluginMethod
    public void getToken(PluginCall call) {
        try {
            if (FirebaseApp.getApps(getContext()).isEmpty()) {
                call.reject("Firebase is not configured. Add google-services.json.");
                return;
            }
            FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful() || task.getResult() == null) {
                        call.reject("Could not obtain Firebase push token");
                        return;
                    }
                    JSObject result = new JSObject();
                    result.put("token", task.getResult());
                    call.resolve(result);
                });
        } catch (Exception e) {
            call.reject(e.getMessage() == null ? "Firebase push is unavailable" : e.getMessage());
        }
    }

    @PluginMethod
    public void deleteToken(PluginCall call) {
        try {
            if (FirebaseApp.getApps(getContext()).isEmpty()) {
                call.resolve();
                return;
            }
            FirebaseMessaging.getInstance().deleteToken().addOnCompleteListener(task -> call.resolve());
        } catch (Exception e) {
            call.resolve();
        }
    }
}
