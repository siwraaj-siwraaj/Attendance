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
  throw new Error(`PDF generator Android source not found: ${pluginPath}`);
}

let source = fs.readFileSync(pluginPath, "utf8");

if (source.includes("MediaStore.Downloads.EXTERNAL_CONTENT_URI") && source.includes("Direct Downloads save for Rossie")) {
  console.log("PDF generator native save patch already applied.");
  process.exit(0);
}

source = source.replace(
  "import android.content.Intent;\n",
  "import android.content.Intent;\nimport android.content.ContentValues;\nimport android.content.ContentResolver;\nimport android.os.Build;\nimport android.os.Environment;\nimport android.provider.MediaStore;\nimport java.io.FileInputStream;\nimport java.io.OutputStream;\n",
);

const start = source.indexOf("    private void sharePdf(PdfGenerationTask task, File file) {");
const end = source.indexOf("\n    private PrintAttributes createPrintAttributes", start);

if (start === -1 || end === -1) {
  throw new Error("Could not locate PdfGenerator sharePdf method; refusing to patch native source.");
}

const replacement = `    // Direct Downloads save for Rossie. Attendance PDFs can be large, so avoid
    // ACTION_SEND/share-chooser and avoid moving PDF bytes back through JavaScript.
    // MediaStore writes the already-generated native PDF directly into Downloads.
    private void sharePdf(PdfGenerationTask task, File file) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            task.call.reject("Attendance PDF save requires Android 10 or newer.");
            task.finish();
            return;
        }

        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, task.options.fileName);
        values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
        values.put(MediaStore.Downloads.IS_PENDING, 1);

        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
            task.call.reject("Unable to create the PDF in Downloads.");
            task.finish();
            return;
        }

        try (FileInputStream input = new FileInputStream(file);
             OutputStream output = resolver.openOutputStream(uri)) {
            if (output == null) {
                throw new IllegalStateException("Unable to open Downloads output stream.");
            }
            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) {
                output.write(buffer, 0, count);
            }
            output.flush();

            ContentValues completed = new ContentValues();
            completed.put(MediaStore.Downloads.IS_PENDING, 0);
            resolver.update(uri, completed, null, null);

            JSObject result = new JSObject();
            result.put("type", "share");
            result.put("completed", true);
            result.put("uri", uri.toString());
            task.call.resolve(result);
        } catch (Exception ex) {
            resolver.delete(uri, null, null);
            task.call.reject("Unable to save the Attendance PDF.", ex);
        } finally {
            file.delete();
            task.finish();
        }
    }
`;

source = source.slice(0, start) + replacement + source.slice(end);
fs.writeFileSync(pluginPath, source);
console.log("Patched PDF generator native Attendance save to write directly to Android Downloads.");
