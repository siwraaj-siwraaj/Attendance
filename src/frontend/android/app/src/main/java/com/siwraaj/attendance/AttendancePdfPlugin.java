package com.siwraaj.attendance;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.graphics.Canvas;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.FrameLayout;
import android.graphics.pdf.PdfDocument;

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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AttendancePdf")
public class AttendancePdfPlugin extends Plugin {
    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();
    private WebView printWebView;
    private FrameLayout printContainer;

    private static final int PAGE_WIDTH = 595;
    private static final int PAGE_HEIGHT = 842;
    private static final int CONTENT_WIDTH = 794;

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
                WebView webView = new WebView(getContext());
                printWebView = webView;

                // Attach the temporary WebView to the Activity so Android WebView
                // completes layout/painting reliably before we render the PDF.
                printContainer = new FrameLayout(getContext());
                printContainer.setVisibility(View.INVISIBLE);
                printContainer.setLayoutParams(new ViewGroup.LayoutParams(1, 1));
                printContainer.addView(
                        webView,
                        new FrameLayout.LayoutParams(CONTENT_WIDTH, 1)
                );
                getActivity().addContentView(
                        printContainer,
                        new ViewGroup.LayoutParams(1, 1)
                );
                webView.setBackgroundColor(Color.WHITE);
                webView.getSettings().setJavaScriptEnabled(false);
                webView.getSettings().setDomStorageEnabled(false);

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        view.postDelayed(
                                () -> generatePdf(view, call, fileName),
                                250
                        );
                    }

                    @Override
                    public void onReceivedError(
                            WebView view,
                            int errorCode,
                            String description,
                            String failingUrl
                    ) {
                        cleanupWebView();
                        call.reject("PDF page failed to load: " + description);
                    }
                });

                webView.loadDataWithBaseURL(
                        null,
                        html,
                        "text/html",
                        "UTF-8",
                        null
                );
            } catch (Exception error) {
                cleanupWebView();
                call.reject(
                        "Unable to start PDF generation",
                        error
                );
            }
        });
    }

    private void generatePdf(
            WebView webView,
            PluginCall call,
            String fileName
    ) {
        try {
            webView.measure(
                    android.view.View.MeasureSpec.makeMeasureSpec(
                            CONTENT_WIDTH,
                            android.view.View.MeasureSpec.EXACTLY
                    ),
                    android.view.View.MeasureSpec.makeMeasureSpec(
                            0,
                            android.view.View.MeasureSpec.UNSPECIFIED
                    )
            );

            webView.layout(
                    0,
                    0,
                    CONTENT_WIDTH,
                    Math.max(webView.getMeasuredHeight(), 1)
            );

            final int contentHeight = Math.max(
                    webView.getContentHeight(),
                    webView.getMeasuredHeight()
            );

            if (contentHeight <= 0) {
                throw new IOException("PDF content has zero height");
            }

            final PdfDocument document = new PdfDocument();

            // Scale the WebView's 794px layout to A4 width.
            final float scale = PAGE_WIDTH / (float) CONTENT_WIDTH;
            final int sourcePageHeight = Math.max(
                    1,
                    Math.round(PAGE_HEIGHT / scale)
            );

            int pageNumber = 1;
            for (int top = 0; top < contentHeight; top += sourcePageHeight) {
                PdfDocument.PageInfo pageInfo =
                        new PdfDocument.PageInfo.Builder(
                                PAGE_WIDTH,
                                PAGE_HEIGHT,
                                pageNumber++
                        ).create();

                PdfDocument.Page page = document.startPage(pageInfo);
                Canvas canvas = page.getCanvas();

                canvas.drawColor(Color.WHITE);
                canvas.save();
                canvas.scale(scale, scale);
                canvas.translate(0, -top);
                webView.draw(canvas);
                canvas.restore();

                document.finishPage(page);
            }

            final File output = new File(
                    getContext().getCacheDir(),
                    "rossie_" + System.currentTimeMillis() + ".pdf"
            );

            try (FileOutputStream out = new FileOutputStream(output)) {
                document.writeTo(out);
                out.flush();
            } finally {
                document.close();
            }

            ioExecutor.execute(() -> {
                try {
                    Uri uri = copyToDownloads(output, fileName);
                    output.delete();

                    getActivity().runOnUiThread(() -> {
                        cleanupWebView();

                        JSObject result = new JSObject();
                        result.put("uri", uri.toString());
                        result.put("fileName", fileName);
                        call.resolve(result);
                    });
                } catch (Exception error) {
                    output.delete();
                    getActivity().runOnUiThread(() -> {
                        cleanupWebView();
                        call.reject(
                                "PDF could not be saved to Downloads",
                                error
                        );
                    });
                }
            });
        } catch (Exception error) {
            cleanupWebView();
            call.reject("Unable to generate PDF", error);
        }
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

            try {
                OutputStream output = resolver.openOutputStream(uri);
                if (output == null) {
                    throw new IOException("Unable to open Downloads output");
                }

                copyFile(source, output);

                ContentValues done = new ContentValues();
                done.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(uri, done, null, null);
                return uri;
            } catch (Exception error) {
                resolver.delete(uri, null, null);
                if (error instanceof IOException) {
                    throw (IOException) error;
                }
                throw new IOException(error);
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

        if (!name.toLowerCase().endsWith(".pdf")) {
            name += ".pdf";
        }

        return name;
    }

    private void cleanupWebView() {
        if (getActivity() == null) {
            return;
        }

        getActivity().runOnUiThread(() -> {
            if (printWebView != null) {
                printWebView.stopLoading();
                printWebView.setWebViewClient(null);
                if (printContainer != null) {
                    printContainer.removeView(printWebView);
                }
                printWebView.destroy();
                printWebView = null;
            }
            if (printContainer != null) {
                ViewParent parent = printContainer.getParent() instanceof ViewParent
                        ? (ViewParent) printContainer.getParent()
                        : null;
                if (parent instanceof ViewGroup) {
                    ((ViewGroup) parent).removeView(printContainer);
                }
                printContainer = null;
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        cleanupWebView();
        ioExecutor.shutdownNow();
        super.handleOnDestroy();
    }
}
