import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const pluginPath = path.join(
  frontendRoot,
  "node_modules/@capgo/capacitor-pdf-generator/android/src/main/java/app/capgo/pdfgenerator/PdfGeneratorPlugin.java",
);

if (!fs.existsSync(pluginPath)) {
  throw new Error(`PDF generator plugin source not found: ${pluginPath}`);
}

let source = fs.readFileSync(pluginPath, "utf8");

const start = source.indexOf("    private void sharePdf(PdfGenerationTask task, File file) {");
const end = source.indexOf("\n    private PrintAttributes createPrintAttributes", start);

if (start === -1 || end === -1) {
  throw new Error("Could not locate PdfGeneratorPlugin.sharePdf(); refusing to patch.");
}

const replacement = `    private void sharePdf(PdfGenerationTask task, File file) {
        if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.Q) {
            task.call.reject("Attendance PDF saving requires Android 10 or newer.");
            file.delete();
            task.finish();
            return;
        }

        android.content.ContentResolver resolver = getContext().getContentResolver();
        android.content.ContentValues values = new android.content.ContentValues();
        values.put(android.provider.MediaStore.Downloads.DISPLAY_NAME, task.options.fileName);
        values.put(android.provider.MediaStore.Downloads.MIME_TYPE, "application/pdf");
        values.put(android.provider.MediaStore.Downloads.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS);
        values.put(android.provider.MediaStore.Downloads.IS_PENDING, 1);

        Uri destination = resolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (destination == null) {
            file.delete();
            task.call.reject("Unable to create the PDF in Downloads.");
            task.finish();
            return;
        }

        boolean success = false;
        try (
            java.io.InputStream input = new java.io.BufferedInputStream(new java.io.FileInputStream(file));
            java.io.OutputStream output = new java.io.BufferedOutputStream(resolver.openOutputStream(destination))
        ) {
            if (output == null) {
                throw new java.io.IOException("Unable to open the Downloads output stream.");
            }

            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) {
                output.write(buffer, 0, count);
            }
            output.flush();

            android.content.ContentValues published = new android.content.ContentValues();
            published.put(android.provider.MediaStore.Downloads.IS_PENDING, 0);
            resolver.update(destination, published, null, null);
            success = true;

            JSObject result = new JSObject();
            result.put("type", "share");
            result.put("completed", true);
            result.put("uri", destination.toString());
            task.call.resolve(result);
        } catch (Exception ex) {
            resolver.delete(destination, null, null);
            task.call.reject("Unable to save the Attendance PDF: " + ex.getMessage(), ex);
        } finally {
            file.delete();
            if (!success) {
                try {
                    resolver.delete(destination, null, null);
                } catch (Exception ignored) {
                    // Best-effort cleanup only.
                }
            }
            task.finish();
        }
    }
`;

source = source.slice(0, start) + replacement + source.slice(end + 1);
fs.writeFileSync(pluginPath, source);
console.log("Patched PdfGenerator Android share output to save directly to Downloads and return a content URI.");