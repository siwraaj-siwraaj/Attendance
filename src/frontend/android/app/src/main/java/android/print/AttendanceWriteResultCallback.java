package android.print;

import android.print.PageRange;
import android.print.PrintDocumentAdapter.WriteResultCallback;

public final class AttendanceWriteResultCallback extends WriteResultCallback {
    public interface Listener {
        void onFinished(PageRange[] pages);
        void onFailed(CharSequence error);
        void onCancelled();
    }

    private final Listener listener;

    public AttendanceWriteResultCallback(Listener listener) {
        super();
        this.listener = listener;
    }

    @Override
    public void onWriteFinished(PageRange[] pages) {
        listener.onFinished(pages);
    }

    @Override
    public void onWriteFailed(CharSequence error) {
        listener.onFailed(error);
    }

    @Override
    public void onWriteCancelled() {
        listener.onCancelled();
    }
}
