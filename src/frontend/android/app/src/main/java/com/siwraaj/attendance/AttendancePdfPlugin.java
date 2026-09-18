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
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "AttendancePdf")
public class AttendancePdfPlugin extends Plugin {
    private static final int PAGE_WIDTH = 794;
    private static final int PAGE_HEIGHT = 1123;

    private WebView printWebView;
    private FrameLayout printContainer;
    private boolean finished;

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
            finished = false;
            try {
                cleanupWebViewNow();

                WebView webView = new WebView(getActivity());
                printWebView = webView;

                printContainer = new FrameLayout(getActivity());
                FrameLayout.LayoutParams containerParams =
                        new FrameLayout.LayoutParams(PAGE_WIDTH, PAGE_HEIGHT);
                containerParams.leftMargin = 0;
                containerParams.topMargin = 0;

                FrameLayout.LayoutParams webParams =
                        new FrameLayout.LayoutParams(PAGE_WIDTH, PAGE_HEIGHT);
                printContainer.addView(webView, webParams);
                getActivity().addContentView(printContainer, containerParams);

                webView.setAlpha(1f);
                webView.setBackgroundColor(Color.WHITE);
                webView.getSettings().setJavaScriptEnabled(true);
                webView.getSettings().setDomStorageEnabled(false);
                // The native WebView uses the device density by default. Without
                // an explicit print viewport, the 794px report is treated like a
                // phone-width page and text becomes oversized/wraps incorrectly.
                // Keep CSS pixels 1:1 with our A4 canvas.
                webView.getSettings().setUseWideViewPort(false);
                webView.getSettings().setLoadWithOverviewMode(false);
                webView.getSettings().setTextZoom(100);
                webView.getSettings().setLoadsImagesAutomatically(true);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);
                webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);

                webView.setWebViewClient(new WebViewClient() {
                    private boolean started = false;

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (started) return;
                        started = true;

                        // Wait for one layout/paint cycle so the DOM has a real
                        // measured height before drawing it into PdfDocument.
                        view.evaluateJavascript(
                                "(function(){return Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,document.body.offsetHeight,document.documentElement.offsetHeight);})()",
                                value -> view.postDelayed(
                                        () -> renderWebViewToPdf(view, call, fileName, parseHeight(value)),
                                        250
                                )
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
                        html.replace(
                                "<head>",
                                "<head><meta name=\"viewport\" content=\"width=794, initial-scale=1, maximum-scale=1, user-scalable=no\" />"
                        ),
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

    private int parseHeight(String value) {
        try {
            String clean = value == null ? "" : value.replace("\"", "").trim();
            double parsed = Double.parseDouble(clean);
            if (parsed > 0 && parsed < 1000000) return (int) Math.ceil(parsed);
        } catch (Exception ignored) {}
        return PAGE_HEIGHT;
    }

    private void renderWebViewToPdf(
            WebView webView,
            PluginCall call,
            String fileName,
            int reportedHeight
    ) {
        if (finished || printWebView != webView) return;

        File tempFile = new File(
                getContext().getCacheDir(),
                "rossie_pdf_" + System.currentTimeMillis() + ".pdf"
        );

        PdfDocument document = new PdfDocument();

        try {
            // Force a deterministic A4-sized WebView layout. The old
            // implementation could reach the PDF stage with a zero/unlaid-out
            // WebView, which is why it failed at runtime.
            int widthSpec = View.MeasureSpec.makeMeasureSpec(
                    PAGE_WIDTH,
                    View.MeasureSpec.EXACTLY
            );
            int heightSpec = View.MeasureSpec.makeMeasureSpec(
                    0,
                    View.MeasureSpec.UNSPECIFIED
            );

            webView.measure(widthSpec, heightSpec);

            int contentHeight = Math.max(PAGE_HEIGHT, reportedHeight);

            webView.layout(
                    0,
                    0,
                    PAGE_WIDTH,
                    contentHeight
            );

            // WebView content height can occasionally be reported before its
            // document body has expanded. Fall back to the measured/layout
            // height rather than allowing a zero-page PDF.
            contentHeight = Math.max(
                    PAGE_HEIGHT,
                    webView.getHeight()
            );

            int pageCount =
                    (contentHeight + PAGE_HEIGHT - 1) / PAGE_HEIGHT;

            for (int pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                PdfDocument.PageInfo pageInfo =
                        new PdfDocument.PageInfo.Builder(
                                PAGE_WIDTH,
                                PAGE_HEIGHT,
                                pageIndex + 1
                        ).create();

                PdfDocument.Page page = document.startPage(pageInfo);
                Canvas canvas = page.getCanvas();

                canvas.drawColor(Color.WHITE);
                canvas.save();
                canvas.clipRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
                canvas.translate(0, -(pageIndex * PAGE_HEIGHT));

                webView.draw(canvas);

                canvas.restore();
                document.finishPage(page);
            }

            try (FileOutputStream output = new FileOutputStream(tempFile)) {
                document.writeTo(output);
            } finally {
                document.close();
            }

            saveTempPdfToDownloads(tempFile, fileName, call);
        } catch (Exception error) {
            try {
                document.close();
            } catch (Exception ignored) {
            }

            tempFile.delete();

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
                    finished = true;
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
            // MediaProvider can reject an insert when the requested display name
            // already exists in Downloads ("Failed to build unique file"). Pick
            // an unused display name before inserting instead of relying on the
            // provider to rename/reconcile the collision.
            // Always use a fresh filename. Some Android MediaProvider versions can
            // still reject a duplicate even after a DISPLAY_NAME query, so avoid
            // the collision path entirely.
            String uniqueName = addTimestampSuffix(fileName);

            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, uniqueName);
            values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
            values.put(
                    MediaStore.Downloads.RELATIVE_PATH,
                    Environment.DIRECTORY_DOWNLOADS
            );
            values.put(MediaStore.Downloads.IS_PENDING, 1);

            Uri uri;
            try {
                uri = resolver.insert(
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                        values
                );
            } catch (Exception firstError) {
                // A concurrent save can claim the chosen name between the query
                // and insert. Retry once with a timestamped name.
                String retryName = addTimestampSuffix(uniqueName);
                values.put(MediaStore.Downloads.DISPLAY_NAME, retryName);
                try {
                    uri = resolver.insert(
                            MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                            values
                    );
                } catch (Exception retryError) {
                    throw new IOException(
                            "Unable to create Downloads entry: " +
                                    safeMessage(retryError),
                            retryError
                    );
                }
            }

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

        File destination = new File(downloads, findUniqueLegacyName(downloads, fileName));
        try (FileOutputStream output = new FileOutputStream(destination)) {
            copyFile(source, output);
        }

        return Uri.fromFile(destination);
    }

    private String findUniqueDownloadName(
            ContentResolver resolver,
            String fileName
    ) {
        String base = fileName;
        String extension = "";
        int dot = fileName.lastIndexOf('.');
        if (dot > 0) {
            base = fileName.substring(0, dot);
            extension = fileName.substring(dot);
        }

        String candidate = fileName;
        for (int index = 0; index < 100; index++) {
            if (!downloadNameExists(resolver, candidate)) {
                return candidate;
            }
            candidate = base + " (" + (index + 1) + ")" + extension;
        }

        return base + " (" + System.currentTimeMillis() + ")" + extension;
    }

    private boolean downloadNameExists(
            ContentResolver resolver,
            String fileName
    ) {
        String[] projection = {MediaStore.Downloads.DISPLAY_NAME};
        String selection =
                MediaStore.Downloads.DISPLAY_NAME + " = ? AND " +
                MediaStore.Downloads.RELATIVE_PATH + " = ?";
        String[] selectionArgs = {
                fileName,
                Environment.DIRECTORY_DOWNLOADS + "/"
        };

        try (android.database.Cursor cursor = resolver.query(
                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                null
        )) {
            return cursor != null && cursor.moveToFirst();
        } catch (Exception ignored) {
            return false;
        }
    }

    private String addTimestampSuffix(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot > 0) {
            return fileName.substring(0, dot) + "_" +
                    System.currentTimeMillis() + fileName.substring(dot);
        }
        return fileName + "_" + System.currentTimeMillis();
    }

    private String findUniqueLegacyName(File downloads, String fileName) {
        String base = fileName;
        String extension = "";
        int dot = fileName.lastIndexOf('.');
        if (dot > 0) {
            base = fileName.substring(0, dot);
            extension = fileName.substring(dot);
        }

        File candidate = new File(downloads, fileName);
        for (int index = 1; candidate.exists() && index < 100; index++) {
            candidate = new File(
                    downloads,
                    base + " (" + index + ")" + extension
            );
        }

        return candidate.getName();
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
        if (!name.toLowerCase().endsWith(".pdf")) {
            name += ".pdf";
        }
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
            if (finished) return;
            finished = true;
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
