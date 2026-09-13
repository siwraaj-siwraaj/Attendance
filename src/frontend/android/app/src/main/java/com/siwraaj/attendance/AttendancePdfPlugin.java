package com.siwraaj.attendance;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.RequiresApi;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;

@CapacitorPlugin(name = "AttendancePdf")
public class AttendancePdfPlugin extends Plugin {
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void save(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("Attendance PDF saving requires Android 10 or newer.");
            return;
        }

        String html = call.getString("html");
        String filename = call.getString("filename");
        if (html == null || html.trim().isEmpty()) {
            call.reject("PDF HTML is empty.");
            return;
        }
        if (filename == null || filename.trim().isEmpty()) {
            filename = "Attendance_Sheet.pdf";
        }
        if (!filename.toLowerCase().endsWith(".pdf")) {
            filename += ".pdf";
        }

        final String finalFilename = filename;
        final String finalHtml = html;
        mainHandler.post(() -> renderAndSave(call, finalHtml, finalFilename));
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void renderAndSave(PluginCall call, String html, String filename) {
        final WebView webView = new WebView(getContext());
        final File tempFile = new File(getContext().getCacheDir(), "attendance-" + UUID.randomUUID() + ".pdf");
        final boolean[] completed = {false};

        webView.setVisibility(View.INVISIBLE);
        webView.getSettings().setJavaScriptEnabled(false);
        webView.getSettings().setDomStorageEnabled(false);
        webView.setBackgroundColor(android.graphics.Color.WHITE);

        Runnable cleanup = () -> {
            try {
                webView.stopLoading();
                webView.destroy();
            } catch (Exception ignored) {
            }
            if (tempFile.exists()) {
                //noinspection ResultOfMethodCallIgnored
                tempFile.delete();
            }
        };

        webView.setWebViewClient(new WebViewClient() {
            private boolean started;

            @Override
            public void onPageFinished(WebView view, String url) {
                if (started) return;
                started = true;

                try {
                    PrintDocumentAdapter adapter = view.createPrintDocumentAdapter("Attendance");
                    PrintAttributes attributes = new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setResolution(new PrintAttributes.Resolution("attendance", "attendance", 300, 300))
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build();

                    adapter.onLayout(
                        null,
                        attributes,
                        null,
                        new PrintDocumentAdapter.LayoutResultCallback() {
                            @Override
                            public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
                                try {
                                    ParcelFileDescriptorHolder holder = ParcelFileDescriptorHolder.open(tempFile);
                                    adapter.onWrite(
                                        new android.print.PageRange[]{android.print.PageRange.ALL_PAGES},
                                        holder.pfd,
                                        null,
                                        new PrintDocumentAdapter.WriteResultCallback() {
                                            @Override
                                            public void onWriteFinished(android.print.PageRange[] pages) {
                                                holder.close();
                                                mainHandler.post(() -> publish(call, filename, tempFile, cleanup, completed));
                                            }

                                            @Override
                                            public void onWriteFailed(CharSequence error) {
                                                holder.close();
                                                mainHandler.post(() -> fail(call, "Android PDF rendering failed: " + error, cleanup));
                                            }
                                        }
                                    );
                                } catch (Exception e) {
                                    fail(call, "Unable to write the PDF: " + e.getMessage(), cleanup);
                                }
                            }

                            @Override
                            public void onLayoutFailed(CharSequence error) {
                                fail(call, "Unable to lay out the PDF: " + error, cleanup);
                            }
                        },
                        null
                    );
                } catch (Exception e) {
                    fail(call, "Unable to start PDF rendering: " + e.getMessage(), cleanup);
                }
            }
        });

        try {
            webView.loadDataWithBaseURL("https://attendance.local/", html, "text/html", "UTF-8", null);
        } catch (Exception e) {
            fail(call, "Unable to load the Attendance report: " + e.getMessage(), cleanup);
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void publish(PluginCall call, String filename, File tempFile, Runnable cleanup, boolean[] completed) {
        if (completed[0]) return;
        Uri destination = null;
        try {
            ContentResolver resolver = getContext().getContentResolver();
            ContentValues values = new ContentValues();
            values.put(android.provider.MediaStore.Downloads.DISPLAY_NAME, filename);
            values.put(android.provider.MediaStore.Downloads.MIME_TYPE, "application/pdf");
            values.put(android.provider.MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            values.put(android.provider.MediaStore.Downloads.IS_PENDING, 1);

            destination = resolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (destination == null) {
                throw new IllegalStateException("Android could not create the Downloads file.");
            }

            try (InputStream input = new FileInputStream(tempFile);
                 OutputStream output = resolver.openOutputStream(destination)) {
                if (output == null) throw new IllegalStateException("Android could not open the Downloads file.");
                byte[] buffer = new byte[64 * 1024];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    output.write(buffer, 0, count);
                }
                output.flush();
            }

            ContentValues published = new ContentValues();
            published.put(android.provider.MediaStore.Downloads.IS_PENDING, 0);
            resolver.update(destination, published, null, null);

            completed[0] = true;
            JSObject result = new JSObject();
            result.put("uri", destination.toString());
            result.put("filename", filename);
            call.resolve(result);
            cleanup.run();
        } catch (Exception e) {
            if (destination != null) {
                try { getContext().getContentResolver().delete(destination, null, null); } catch (Exception ignored) {}
            }
            fail(call, "Unable to save the Attendance PDF: " + e.getMessage(), cleanup);
        }
    }

    private void fail(PluginCall call, String message, Runnable cleanup) {
        try { call.reject(message); } catch (Exception ignored) {}
        cleanup.run();
    }

    private static final class ParcelFileDescriptorHolder {
        final android.os.ParcelFileDescriptor pfd;

        private ParcelFileDescriptorHolder(android.os.ParcelFileDescriptor pfd) {
            this.pfd = pfd;
        }

        static ParcelFileDescriptorHolder open(File file) throws Exception {
            return new ParcelFileDescriptorHolder(
                android.os.ParcelFileDescriptor.open(
                    file,
                    android.os.ParcelFileDescriptor.MODE_CREATE
                        | android.os.ParcelFileDescriptor.MODE_READ_WRITE
                        | android.os.ParcelFileDescriptor.MODE_TRUNCATE
                )
            );
        }

        void close() {
            try { pfd.close(); } catch (Exception ignored) {}
        }
    }
}
