package android.print;

import android.print.PrintDocumentAdapter.LayoutResultCallback;
import android.print.PrintDocumentInfo;

public final class AttendanceLayoutResultCallback extends LayoutResultCallback {
    public interface Listener {
        void onFinished(PrintDocumentInfo info, boolean changed);
        void onFailed(CharSequence error);
        void onCancelled();
    }

    private final Listener listener;

    public AttendanceLayoutResultCallback(Listener listener) {
        super();
        this.listener = listener;
    }

    @Override
    public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
        listener.onFinished(info, changed);
    }

    @Override
    public void onLayoutFailed(CharSequence error) {
        listener.onFailed(error);
    }

    @Override
    public void onLayoutCancelled() {
        listener.onCancelled();
    }
}
