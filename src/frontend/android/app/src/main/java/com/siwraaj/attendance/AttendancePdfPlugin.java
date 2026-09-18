package com.siwraaj.attendance;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
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

                WebView webView = new WebView(getActivity());
                printWebView = webView;

                // Android recommends a dedicated WebView for createPrintDocumentAdapter().
                // Keep it attached to the Activity and VISIBLE, but outside the user's
                // usable area so the print renderer has a real window to render into.
                printContainer = new FrameLayout(getActivity());
                FrameLayout.LayoutParams containerParams =
                        new FrameLayout.LayoutParams(1, 1);
                containerParams.leftMargin = 0;
                containerParams.topMargin = 0;

                FrameLayout.LayoutParams webParams =
                        new FrameLayout.LayoutParams(794, 1123);

                printContainer.addView(webView, webParams);
                getActivity().addContentView(printContainer, containerParams);

                webView.setAlpha(0.01f);
                webView.setBackgroundColor(android.graphics.Color.WHITE);
                webView.getSettings().setJavaScriptEnabled(false);
                webView.getSettings().setDomStorageEnabled(false);
                webView.getSettings().setLoadsImagesAutomatically(true);

                webView.setWebViewClient(new WebViewClient() {
                    private boolean started = false;

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (started) return;
                        started = true;

                        // Give WebView one frame to finish layout/paint before
                        // handing it to Android's print renderer.
                        view.postDelayed(
                                () -> beginPrint(view, call, fileName),
                                300
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

    private void beginPrint(
            WebView webView,
            PluginCall call,
            String fileName
    ) {
        if (printWebView != webView) return;

        try {
            final PrintDocumentAdapter adapter =
                    webView.createPrintDocumentAdapter(fileName);

            final PrintAttributes attributes =
                    new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .setResolution(
                                    new PrintAttributes.Resolution(
                                            "rossie_pdf",
                                            "Rossie PDF",
                                            300,
                                            300
                                    )
                            )
                            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                            .build();

            adapter.onLayout(
                    null,
                    attributes,
                    new CancellationSignal(),
                    new PrintDocumentAdapter.LayoutResultCallback() {
                        @Override
                        public void onLayoutFinished(
                                PrintDocumentInfo info,
                                boolean changed
                        ) {
                            writePdf(adapter, attributes, call, fileName);
                        }

                        @Override
                        public void onLayoutFailed(CharSequence error) {
                            rejectAndCleanup(
                                    call,
                                    "Android could not lay out the PDF: " +
                                            (error == null ? "unknown error" : error)
                            );
                        }

                        @Override
                        public void onLayoutCancelled() {
                            rejectAndCleanup(call, "PDF layout was cancelled");
                        }
                    },
                    new Bundle()
            );
        } catch (Exception error) {
            rejectAndCleanup(
                    call,
                    "Unable to prepare PDF printer: " + safeMessage(error)
            );
        }
    }

    private void writePdf(
            PrintDocumentAdapter adapter,
            PrintAttributes attributes,
            PluginCall call,
            String fileName
    ) {
        File tempFile = new File(
                getContext().getCacheDir(),
                "rossie_print_" + System.currentTimeMillis() + ".pdf"
        );

        ParcelFileDescriptor pfd = null;

        try {
            pfd = ParcelFileDescriptor.open(
                    tempFile,
                    ParcelFileDescriptor.MODE_CREATE |
                            ParcelFileDescriptor.MODE_TRUNCATE |
                            ParcelFileDescriptor.MODE_WRITE_ONLY
            );

            final ParcelFileDescriptor destination = pfd;

            adapter.onWrite(
                    new PageRange[]{PageRange.ALL_PAGES},
                    destination,
                    new CancellationSignal(),
                    new PrintDocumentAdapter.WriteResultCallback() {
                        @Override
                        public void onWriteFinished(PageRange[] pages) {
                            closeQuietly(destination);
                            saveTempPdfToDownloads(tempFile, fileName, call);
                        }

                        @Override
                        public void onWriteFailed(CharSequence error) {
                            closeQuietly(destination);
                            tempFile.delete();
                            rejectAndCleanup(
                                    call,
                                    "Android could not write the PDF: " +
                                            (error == null ? "unknown error" : error)
                            );
                        }

                        @Override
                        public void onWriteCancelled() {
                            closeQuietly(destination);
                            tempFile.delete();
                            rejectAndCleanup(call, "PDF writing was cancelled");
                        }
                    }
            );
        } catch (Exception error) {
            closeQuietly(pfd);
            tempFile.delete();
            rejectAndCleanup(
                    call,
                    "Unable to write PDF: " + safeMessage(error)
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

    private void closeQuietly(ParcelFileDescriptor pfd) {
        if (pfd == null) return;
        try {
            pfd.close();
        } catch (IOException ignored) {
        }
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
