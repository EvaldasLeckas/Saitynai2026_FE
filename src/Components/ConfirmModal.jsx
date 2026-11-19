import { useEffect } from "react";



function ConfirmModal({ title, message, confirmLabel = "Delete", danger = true, busy, onConfirm, onCancel }) {  // close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onCancel}>×</button>
        </div>

        <p className="modal-text">{message}</p>

        <div className="modal-actions">
          <button className="action-button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
<button
  className={`action-button ${danger ? "action-danger" : ""}`}
  onClick={onConfirm}
  disabled={busy}
>
  {busy ? "Working..." : confirmLabel}
</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;