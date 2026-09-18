package com.siwraaj.attendance;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.webkit.WebView;
import android.webkit.WebViewClient;

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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AttendancePdf")
public class AttendancePdfPlugin extends Plugin {
    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();
    private WebView printWebView;

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
                webView.setBackgroundColor(Color.WHITE);
                webView.getSettings().setJavaScriptEnabled(false);
                webView.getSettings().setDomStorageEnabled(false);

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        view.postDelayed(
                                () -> startPdfWrite(view, call, fileName),
                                120
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
            } catch (Throwable error) {
                cleanupWebView();
                call.reject("Unable to start PDF generation", error);
            }
        });
    }

    private void startPdfWrite(
            WebView webView,
            PluginCall call,
            String fileName
    ) {
        try {
            PrintAttributes attributes = new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                    .setResolution(new PrintAttributes.Resolution(
                            "rossie_pdf",
                            "Rossie PDF",
                            300,
                            300
                    ))
                    .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                    .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                    .build();

            PrintDocumentAdapter adapter =
                    webView.createPrintDocumentAdapter(fileName);

            adapter.onStart();

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
                            writeAdapterToCache(adapter, call, fileName);
                        }

                        @Override
                        public void onLayoutFailed(CharSequence error) {
                            adapter.onFinish();
                            cleanupWebView();
                            call.reject(
                                    "PDF layout failed" +
                                            (error == null ? "" : ": " + error)
                            );
                        }

                        @Override
                        public void onLayoutCancelled() {
                            adapter.onFinish();
                            cleanupWebView();
                            call.reject("PDF layout was cancelled");
                        }
                    },
                    new Bundle()
            );
        } catch (Throwable error) {
            cleanupWebView();
            call.reject("Unable to prepare PDF", error);
        }
    }

    private void writeAdapterToCache(
            PrintDocumentAdapter adapter,
            PluginCall call,
            String fileName
    ) {
        final File output = new File(
                getContext().getCacheDir(),
                "rossie_" + System.currentTimeMillis() + ".pdf"
        );

        try {
            if (!output.createNewFile()) {
                throw new IOException("Unable to create temporary PDF file");
            }

            final ParcelFileDescriptor descriptor = ParcelFileDescriptor.open(
                    output,
                    ParcelFileDescriptor.MODE_CREATE
                            | ParcelFileDescriptor.MODE_TRUNCATE
                            | ParcelFileDescriptor.MODE_WRITE_ONLY
            );

            adapter.onWrite(
                    new PageRange[]{PageRange.ALL_PAGES},
                    descriptor,
                    new CancellationSignal(),
                    new PrintDocumentAdapter.WriteResultCallback() {
                        @Override
                        public void onWriteFinished(PageRange[] pages) {
                            closeQuietly(descriptor);
                            adapter.onFinish();

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
                                } catch (Throwable error) {
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
                        }

                        @Override
                        public void onWriteFailed(CharSequence error) {
                            closeQuietly(descriptor);
                            adapter.onFinish();
                            output.delete();
                            cleanupWebView();
                            call.reject(
                                    "PDF write failed" +
                                            (error == null ? "" : ": " + error)
                            );
                        }

                        @Override
                        public void onWriteCancelled() {
                            closeQuietly(descriptor);
                            adapter.onFinish();
                            output.delete();
                            cleanupWebView();
                            call.reject("PDF write was cancelled");
                        }
                    }
            );
        } catch (Throwable error) {
            adapter.onFinish();
            output.delete();
            cleanupWebView();
            call.reject("Unable to write PDF", error);
        }
    }

    private Uri copyToDownloads(File source, String fileName) throws IOException {
        ContentResolver resolver = getContext().getContentResolver();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
            values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
            values.put(MediaStore.Downloads.RELATIVE_PATH, "Download");
            values.put(MediaStore.Downloads.IS_PENDING, 1);

            Uri uri = resolver.insert(
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                    values
            );

            if (uri == null) {
                throw new IOException("MediaStore did not create a Downloads entry");
            }

            try {
                copyFile(source, resolver.openOutputStream(uri));

                ContentValues done = new ContentValues();
                done.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(uri, done, null, null);
                return uri;
            } catch (Throwable error) {
                resolver.delete(uri, null, null);
                if (error instanceof IOException) {
                    throw (IOException) error;
                }
                throw new IOException(error);
            }
        }

        File downloads = android.os.Environment.getExternalStoragePublicDirectory(
                android.os.Environment.DIRECTORY_DOWNLOADS
        );
        if (!downloads.exists() && !downloads.mkdirs()) {
            throw new IOException("Unable to create Downloads directory");
        }

        File destination = new File(downloads, fileName);
        try (FileOutputStream out = new FileOutputStream(destination)) {
            copyFile(source, out);
        }
        return Uri.fromFile(destination);
    }

    private void copyFile(File source, OutputStream output) throws IOException {
        if (output == null) {
            throw new IOException("Unable to open Downloads output stream");
        }

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

    private void closeQuietly(ParcelFileDescriptor descriptor) {
        try {
            descriptor.close();
        } catch (IOException ignored) {
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
                printWebView.destroy();
                printWebView = null;
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
