package com.siwraaj.attendance;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import androidx.core.content.FileProvider;
import android.provider.MediaStore;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.AttendanceLayoutResultCallback;
import android.print.AttendanceWriteResultCallback;
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
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "AttendancePdf")
public class AttendancePdfPlugin extends Plugin {
    private static final int WEBVIEW_WIDTH = 794;
    private static final int WEBVIEW_HEIGHT = 1123;

    private WebView printWebView;
    private FrameLayout printContainer;
    private boolean finished;

    @PluginMethod
    public void openPdf(final PluginCall call) {
        final String uriString = call.getString("uri");

        if (uriString == null || uriString.trim().isEmpty()) {
            call.reject("PDF URI is empty");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);

            // Downloads/MediaStore returns a content:// URI on modern Android.
            // For older Android versions, convert our file:// URI through the
            // existing FileProvider before handing it to a PDF viewer.
            if ("file".equalsIgnoreCase(uri.getScheme())) {
                uri = FileProvider.getUriForFile(
                        getContext(),
                        getContext().getPackageName() + ".fileprovider",
                        new File(uri.getPath())
                );
            }

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/pdf");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception error) {
            call.reject(
                    "PDF was saved, but no PDF viewer could be opened: " +
                            safeMessage(error)
            );
        }
    }

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
                        new FrameLayout.LayoutParams(WEBVIEW_WIDTH, WEBVIEW_HEIGHT);
                FrameLayout.LayoutParams webParams =
                        new FrameLayout.LayoutParams(WEBVIEW_WIDTH, WEBVIEW_HEIGHT);

                printContainer.addView(webView, webParams);
                getActivity().addContentView(printContainer, containerParams);

                webView.setAlpha(1f);
                webView.setBackgroundColor(android.graphics.Color.WHITE);
                webView.getSettings().setJavaScriptEnabled(true);
                webView.getSettings().setDomStorageEnabled(false);
                webView.getSettings().setLoadsImagesAutomatically(true);
                webView.getSettings().setTextZoom(100);
                webView.setInitialScale(100);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);
                webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);

                webView.setWebViewClient(new WebViewClient() {
                    private boolean started = false;

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (started) return;
                        started = true;

                        // Give the WebView one layout/paint cycle before handing it
                        // to Android's print engine. The print engine performs the
                        // actual A4 pagination and scaling.
                        view.postDelayed(
                                () -> createA4PrintPdf(view, call, fileName),
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
                        rejectAndCleanup(call, "PDF page failed to load: " + description);
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

                // Do not inject a phone-width viewport here. The HTML contains
                // print CSS with an explicit A4 page and the Android print engine
                // will paginate it to A4.
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

    private void createA4PrintPdf(
            WebView webView,
            PluginCall call,
            String fileName
    ) {
        if (finished || printWebView != webView) return;

        File tempFile = new File(
                getContext().getCacheDir(),
                "rossie_print_" + System.currentTimeMillis() + ".pdf"
        );

        try {
            // A dedicated WebView + createPrintDocumentAdapter is Android's
            // supported HTML-to-PDF path. It handles A4 page geometry and
            // multi-page pagination instead of slicing a screen-sized canvas.
            PrintDocumentAdapter adapter =
                    webView.createPrintDocumentAdapter(fileName);

            adapter.onStart();

            PrintAttributes attributes = new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                    .setResolution(new PrintAttributes.Resolution(
                            "rossie_pdf",
                            "Rossie PDF",
                            300,
                            300
                    ))
                    .setMinMargins(new PrintAttributes.Margins(
                            0,
                            0,
                            0,
                            0
                    ))
                    .build();

            adapter.onLayout(
                    null,
                    attributes,
                    new CancellationSignal(),
                    new AttendanceLayoutResultCallback(
                            new AttendanceLayoutResultCallback.Listener() {
                                @Override
                                public void onFinished(
                                        PrintDocumentInfo info,
                                        boolean changed
                                ) {
                                    writePrintAdapter(adapter, tempFile, call, fileName);
                                }

                                @Override
                                public void onFailed(CharSequence error) {
                                    rejectAndCleanup(
                                            call,
                                            "Unable to lay out A4 PDF: " +
                                                    (error == null ? "unknown error" : error)
                                    );
                                }

                                @Override
                                public void onCancelled() {
                                    rejectAndCleanup(call, "PDF layout was cancelled");
                                }
                            }
                    ),
                    new Bundle()
            );
        } catch (Exception error) {
            tempFile.delete();
            rejectAndCleanup(
                    call,
                    "Unable to prepare A4 PDF: " + safeMessage(error)
            );
        }
    }

    private void writePrintAdapter(
            PrintDocumentAdapter adapter,
            File tempFile,
            PluginCall call,
            String fileName
    ) {
        if (finished) return;

        try {
            final ParcelFileDescriptor destination =
                    ParcelFileDescriptor.open(
                            tempFile,
                            ParcelFileDescriptor.MODE_CREATE |
                                    ParcelFileDescriptor.MODE_TRUNCATE |
                                    ParcelFileDescriptor.MODE_READ_WRITE
                    );

            adapter.onWrite(
                    new PageRange[]{PageRange.ALL_PAGES},
                    destination,
                    new CancellationSignal(),
                    new AttendanceWriteResultCallback(
                            new AttendanceWriteResultCallback.Listener() {
                                @Override
                                public void onFinished(PageRange[] pages) {
                                    closeQuietly(destination);
                                    adapter.onFinish();
                                    saveTempPdfToDownloads(tempFile, fileName, call);
                                }

                                @Override
                                public void onFailed(CharSequence error) {
                                    closeQuietly(destination);
                                    adapter.onFinish();
                                    tempFile.delete();
                                    rejectAndCleanup(
                                            call,
                                            "Unable to render A4 PDF: " +
                                                    (error == null ? "unknown error" : error)
                                    );
                                }

                                @Override
                                public void onCancelled() {
                                    closeQuietly(destination);
                                    adapter.onFinish();
                                    tempFile.delete();
                                    rejectAndCleanup(call, "PDF rendering was cancelled");
                                }
                            }
                    )
            );
        } catch (Exception error) {
            tempFile.delete();
            rejectAndCleanup(
                    call,
                    "Unable to write A4 PDF: " + safeMessage(error)
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

        File destination = new File(
                downloads,
                findUniqueLegacyName(downloads, fileName)
        );

        try (FileOutputStreamCompat output = new FileOutputStreamCompat(destination)) {
            copyFile(source, output);
        }

        return Uri.fromFile(destination);
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

    private void closeQuietly(ParcelFileDescriptor descriptor) {
        try {
            if (descriptor != null) descriptor.close();
        } catch (Exception ignored) {
        }
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

    // Small OutputStream wrapper so the same copy helper works for both
    // MediaStore and legacy filesystem destinations.
    private static class FileOutputStreamCompat extends OutputStream {
        private final java.io.FileOutputStream delegate;

        FileOutputStreamCompat(File file) throws IOException {
            delegate = new java.io.FileOutputStream(file);
        }

        @Override
        public void write(int b) throws IOException {
            delegate.write(b);
        }

        @Override
        public void write(byte[] b, int off, int len) throws IOException {
            delegate.write(b, off, len);
        }

        @Override
        public void flush() throws IOException {
            delegate.flush();
        }

        @Override
        public void close() throws IOException {
            delegate.close();
        }
    }
}
