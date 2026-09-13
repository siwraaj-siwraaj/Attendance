package com.siwraaj.attendance;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
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
    private static final int PDF_WIDTH = 595;
    private static final int PDF_HEIGHT = 842;
    private static final int HTML_WIDTH = 794;
    private static final int MAX_RENDER_RETRIES = 12;
    private static final long RENDER_RETRY_DELAY_MS = 150L;

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

        final String finalHtml = html;
        final String finalFilename = filename;
        mainHandler.post(() -> renderAndSave(call, finalHtml, finalFilename));
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void renderAndSave(PluginCall call, String html, String filename) {
        final WebView webView = new WebView(getContext());
        final File tempFile = new File(
            getContext().getCacheDir(),
            "attendance-" + UUID.randomUUID() + ".pdf"
        );
        final boolean[] finished = {false};

        webView.setBackgroundColor(Color.WHITE);
        webView.getSettings().setJavaScriptEnabled(false);
        webView.getSettings().setDomStorageEnabled(false);
        webView.setInitialScale(100);

        final Runnable cleanup = () -> {
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
                scheduleRenderAttempt(
                    view,
                    0,
                    tempFile,
                    call,
                    filename,
                    cleanup,
                    finished
                );
            }
        });

        try {
            webView.loadDataWithBaseURL(
                "https://attendance.local/",
                html,
                "text/html",
                "UTF-8",
                null
            );
        } catch (Exception e) {
            fail(
                call,
                "Unable to load the Attendance report: " + message(e),
                cleanup
            );
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void scheduleRenderAttempt(
        WebView view,
        int attempt,
        File tempFile,
        PluginCall call,
        String filename,
        Runnable cleanup,
        boolean[] finished
    ) {
        mainHandler.postDelayed(() -> {
            if (finished[0]) return;

            try {
                int widthSpec = View.MeasureSpec.makeMeasureSpec(
                    HTML_WIDTH,
                    View.MeasureSpec.EXACTLY
                );
                int heightSpec = View.MeasureSpec.makeMeasureSpec(
                    0,
                    View.MeasureSpec.UNSPECIFIED
                );
                view.measure(widthSpec, heightSpec);

                int width = view.getMeasuredWidth();
                int measuredHeight = view.getMeasuredHeight();
                int contentHeight = Math.round(
                    view.getContentHeight() * Math.max(1f, view.getScale())
                );
                int height = Math.max(measuredHeight, contentHeight);

                if (width <= 0 || height <= 0) {
                    if (attempt < MAX_RENDER_RETRIES) {
                        scheduleRenderAttempt(
                            view,
                            attempt + 1,
                            tempFile,
                            call,
                            filename,
                            cleanup,
                            finished
                        );
                        return;
                    }
                    throw new IllegalStateException(
                        "Attendance report did not finish rendering."
                    );
                }

                view.layout(0, 0, width, height);
                writePdf(
                    view,
                    width,
                    height,
                    tempFile,
                    call,
                    filename,
                    cleanup,
                    finished
                );
            } catch (Exception e) {
                fail(
                    call,
                    "Unable to render the Attendance PDF: " + message(e),
                    cleanup
                );
            }
        }, RENDER_RETRY_DELAY_MS);
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void writePdf(
        WebView webView,
        int webWidth,
        int webHeight,
        File tempFile,
        PluginCall call,
        String filename,
        Runnable cleanup,
        boolean[] finished
    ) throws Exception {
        PdfDocument document = new PdfDocument();
        float scale = (float) PDF_WIDTH / (float) webWidth;
        float sourcePageHeight = PDF_HEIGHT / scale;
        int pageCount = Math.max(
            1,
            (int) Math.ceil(webHeight / sourcePageHeight)
        );

        try {
            for (int pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(
                    PDF_WIDTH,
                    PDF_HEIGHT,
                    pageIndex + 1
                ).create();
                PdfDocument.Page page = document.startPage(pageInfo);
                Canvas canvas = page.getCanvas();
                canvas.drawColor(Color.WHITE);
                canvas.save();
                canvas.scale(scale, scale);
                canvas.clipRect(0, 0, webWidth, sourcePageHeight);
                canvas.translate(0, -pageIndex * sourcePageHeight);
                webView.draw(canvas);
                canvas.restore();
                document.finishPage(page);
            }

            try (FileOutputStream output = new FileOutputStream(tempFile)) {
                document.writeTo(output);
                output.flush();
            } finally {
                document.close();
            }

            mainHandler.post(() -> publish(
                call,
                filename,
                tempFile,
                cleanup,
                finished
            ));
        } catch (Exception e) {
            try {
                document.close();
            } catch (Exception ignored) {
            }
            throw e;
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void publish(
        PluginCall call,
        String filename,
        File tempFile,
        Runnable cleanup,
        boolean[] finished
    ) {
        if (finished[0]) return;

        Uri destination = null;
        try {
            ContentResolver resolver = getContext().getContentResolver();
            ContentValues values = new ContentValues();
            values.put(
                android.provider.MediaStore.Downloads.DISPLAY_NAME,
                filename
            );
            values.put(
                android.provider.MediaStore.Downloads.MIME_TYPE,
                "application/pdf"
            );
            values.put(
                android.provider.MediaStore.Downloads.RELATIVE_PATH,
                Environment.DIRECTORY_DOWNLOADS
            );
            values.put(
                android.provider.MediaStore.Downloads.IS_PENDING,
                1
            );

            destination = resolver.insert(
                android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                values
            );
            if (destination == null) {
                throw new IllegalStateException(
                    "Android could not create the Downloads file."
                );
            }

            try (
                InputStream input = new FileInputStream(tempFile);
                OutputStream output = resolver.openOutputStream(destination)
            ) {
                if (output == null) {
                    throw new IllegalStateException(
                        "Android could not open the Downloads file."
                    );
                }
                byte[] buffer = new byte[64 * 1024];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    output.write(buffer, 0, count);
                }
                output.flush();
            }

            ContentValues published = new ContentValues();
            published.put(
                android.provider.MediaStore.Downloads.IS_PENDING,
                0
            );
            resolver.update(destination, published, null, null);

            finished[0] = true;
            JSObject result = new JSObject();
            result.put("uri", destination.toString());
            result.put("filename", filename);
            call.resolve(result);
            cleanup.run();
        } catch (Exception e) {
            if (destination != null) {
                try {
                    getContext().getContentResolver().delete(
                        destination,
                        null,
                        null
                    );
                } catch (Exception ignored) {
                }
            }
            fail(
                call,
                "Unable to save the Attendance PDF: " + message(e),
                cleanup
            );
        }
    }

    private void fail(PluginCall call, String message, Runnable cleanup) {
        try {
            call.reject(message);
        } catch (Exception ignored) {
        }
        cleanup.run();
    }

    private static String message(Exception e) {
        String message = e.getMessage();
        return message == null || message.trim().isEmpty()
            ? e.getClass().getSimpleName()
            : message;
    }
}
