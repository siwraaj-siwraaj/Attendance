package com.siwraaj.attendance;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "AttendancePdf")
public class AttendancePdfPlugin extends Plugin {
    private static final int PAGE_WIDTH = 595;
    private static final int PAGE_HEIGHT = 842;
    private static final int CONTENT_WIDTH = 794;
    private static final int MAX_HEIGHT = 20000;

    private WebView printWebView;
    private FrameLayout printContainer;

    @PluginMethod
    public void savePdf(final PluginCall call) {
        final String html = call.getString("html");
        final String requestedName = call.getString("fileName");

        if (html == null || html.trim().isEmpty()) {
            call.reject("PDF HTML is empty");
            return;
        }

        final String fileName = sanitizeFileName(
                requestedName == null || requestedName.trim().isEmpty()
                        ? "Rossie_Report.pdf"
                        : requestedName
        );

        getActivity().runOnUiThread(() -> {
            try {
                cleanupWebViewNow();

                WebView webView = new WebView(getContext());
                printWebView = webView;

                printContainer = new FrameLayout(getContext());
                printContainer.setBackgroundColor(Color.TRANSPARENT);
                printContainer.setAlpha(0f);

                FrameLayout.LayoutParams containerParams =
                        new FrameLayout.LayoutParams(2, 2);
                containerParams.leftMargin = -10;
                containerParams.topMargin = -10;

                FrameLayout.LayoutParams webParams =
                        new FrameLayout.LayoutParams(CONTENT_WIDTH, 2);

                printContainer.addView(webView, webParams);
                getActivity().addContentView(printContainer, containerParams);

                webView.setBackgroundColor(Color.WHITE);
                webView.getSettings().setJavaScriptEnabled(false);
                webView.getSettings().setDomStorageEnabled(false);
                webView.getSettings().setOffscreenPreRaster(true);
                webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);

                webView.setWebViewClient(new WebViewClient() {
                    private boolean finished = false;

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (finished) return;
                        finished = true;

                        view.postDelayed(
                                () -> renderPdf(view, call, fileName),
                                500
                        );
                    }

                    @Override
                    public void onReceivedError(
                            WebView view,
                            int errorCode,
                            String description,
                            String failingUrl
                    ) {
                        rejectAndCleanup(
                                call,
                                "PDF page failed to load: " + description
                        );
                    }

                    @Override
                    public boolean onRenderProcessGone(
                            WebView view,
                            RenderProcessGoneDetail detail
                    ) {
                        rejectAndCleanup(
                                call,
                                "Android WebView renderer stopped while creating the PDF"
                        );
                        return true;
                    }
                });

                webView.loadDataWithBaseURL(
                        "https://rossie.local/",
                        html,
                        "text/html",
                        "UTF-8",
                        null
                );
            } catch (Exception error) {
                rejectAndCleanup(
                        call,
                        "Unable to start PDF generation: " + safeMessage(error)
                );
            }
        });
    }

    private void renderPdf(
            WebView webView,
            PluginCall call,
            String fileName
    ) {
        if (printWebView != webView) return;

        try {
            webView.measure(
                    View.MeasureSpec.makeMeasureSpec(
                            CONTENT_WIDTH,
                            View.MeasureSpec.EXACTLY
                    ),
                    View.MeasureSpec.makeMeasureSpec(
                            MAX_HEIGHT,
                            View.MeasureSpec.AT_MOST
                    )
            );

            int measuredHeight = webView.getMeasuredHeight();
            int contentHeight = Math.max(
                    (int) Math.ceil(webView.getContentHeight() * webView.getScale()),
                    measuredHeight
            );

            if (contentHeight <= 1) {
                rejectAndCleanup(call, "PDF content has no measurable height");
                return;
            }

            contentHeight = Math.min(contentHeight, MAX_HEIGHT);
            webView.layout(0, 0, CONTENT_WIDTH, contentHeight);

            PdfDocument document = new PdfDocument();
            float scale = PAGE_WIDTH / (float) CONTENT_WIDTH;
            int pageCount = (int) Math.ceil(
                    contentHeight * scale / PAGE_HEIGHT
            );

            if (pageCount < 1) pageCount = 1;

            for (int pageNumber = 0; pageNumber < pageCount; pageNumber++) {
                PdfDocument.PageInfo pageInfo =
                        new PdfDocument.PageInfo.Builder(
                                PAGE_WIDTH,
                                PAGE_HEIGHT,
                                pageNumber + 1
                        ).create();

                PdfDocument.Page page = document.startPage(pageInfo);
                Canvas canvas = page.getCanvas();

                canvas.drawColor(Color.WHITE);
                canvas.save();
                canvas.scale(scale, scale);
                canvas.translate(0, -(pageNumber * PAGE_HEIGHT) / scale);
                webView.draw(canvas);
                canvas.restore();

                document.finishPage(page);
            }

            File tempFile = new File(
                    getContext().getCacheDir(),
                    "rossie_print_" + System.currentTimeMillis() + ".pdf"
            );

            try (FileOutputStream output = new FileOutputStream(tempFile)) {
                document.writeTo(output);
            } finally {
                document.close();
            }

            saveTempPdfToDownloads(tempFile, fileName, call);
        } catch (Exception error) {
            rejectAndCleanup(
                    call,
                    "Unable to render PDF: " + safeMessage(error)
            );
        }
    }

    private void saveTempPdfToDownloads(
            File source,
            String fileName,
            PluginCall call
    ) {
        new Thread(() -> {
            try {
                Uri uri = copyToDownloads(source, fileName);
                source.delete();

                getActivity().runOnUiThread(() -> {
                    cleanupWebViewNow();

                    JSObject result = new JSObject();
                    result.put("uri", uri.toString());
                    result.put("fileName", fileName);
                    call.resolve(result);
                });
            } catch (Exception error) {
                source.delete();
                rejectAndCleanup(
                        call,
                        "PDF could not be saved to Downloads: " +
                                safeMessage(error)
                );
            }
        }).start();
    }

    private Uri copyToDownloads(File source, String fileName) throws IOException {
        ContentResolver resolver = getContext().getContentResolver();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
            values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
            values.put(
                    MediaStore.Downloads.RELATIVE_PATH,
                    Environment.DIRECTORY_DOWNLOADS
            );
            values.put(MediaStore.Downloads.IS_PENDING, 1);

            Uri uri = resolver.insert(
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                    values
            );

            if (uri == null) {
                throw new IOException("Unable to create Downloads entry");
            }

            boolean completed = false;
            try {
                OutputStream output = resolver.openOutputStream(uri);
                if (output == null) {
                    throw new IOException("Unable to open Downloads output");
                }

                copyFile(source, output);

                ContentValues done = new ContentValues();
                done.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(uri, done, null, null);

                completed = true;
                return uri;
            } finally {
                if (!completed) {
                    resolver.delete(uri, null, null);
                }
            }
        }

        File downloads = Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_DOWNLOADS
        );

        if (!downloads.exists() && !downloads.mkdirs()) {
            throw new IOException("Unable to create Downloads directory");
        }

        File destination = new File(downloads, fileName);
        try (FileOutputStream output = new FileOutputStream(destination)) {
            copyFile(source, output);
        }

        return Uri.fromFile(destination);
    }

    private void copyFile(File source, OutputStream output) throws IOException {
        try (OutputStream out = output;
             FileInputStream input = new FileInputStream(source)) {
            byte[] buffer = new byte[32 * 1024];
            int count;

            while ((count = input.read(buffer)) != -1) {
                out.write(buffer, 0, count);
            }

            out.flush();
        }
    }

    private String sanitizeFileName(String value) {
        String name = value.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
        return name;
    }

    private String safeMessage(Exception error) {
        String message = error.getMessage();
        return message == null || message.trim().isEmpty()
                ? error.getClass().getSimpleName()
                : message;
    }

    private void rejectAndCleanup(PluginCall call, String message) {
        getActivity().runOnUiThread(() -> {
            cleanupWebViewNow();
            call.reject(message);
        });
    }

    private void cleanupWebViewNow() {
        if (printWebView != null) {
            try {
                printWebView.stopLoading();
                printWebView.setWebViewClient(null);

                if (printContainer != null) {
                    printContainer.removeView(printWebView);
                }

                printWebView.destroy();
            } catch (Exception ignored) {
            }

            printWebView = null;
        }

        if (printContainer != null) {
            ViewParent parent = printContainer.getParent();
            if (parent instanceof ViewGroup) {
                ((ViewGroup) parent).removeView(printContainer);
            }
            printContainer = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        cleanupWebViewNow();
        super.handleOnDestroy();
    }
}
