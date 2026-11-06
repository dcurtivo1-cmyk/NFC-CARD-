import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  Check,
  X,
  Info,
  AlertCircle,
  LoaderCircle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const FeedbackContext = createContext();
export const useFeedback = () => useContext(FeedbackContext);

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const notify = (message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t.slice(-2), { id, message, type }]);
    timers.current.push(
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5500),
    );
  };
  const confirm = (options) =>
    new Promise((resolve) => setConfirmation({ ...options, resolve }));
  const finish = (value) => {
    confirmation.resolve(value);
    setConfirmation(null);
  };
  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`toast ${toast.type}`} key={toast.id}>
            {toast.type === "error" ? (
              <AlertCircle size={19} />
            ) : toast.type === "info" ? (
              <Info size={19} />
            ) : (
              <Check size={19} />
            )}
            <span>{toast.message}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() =>
                setToasts((t) => t.filter((x) => x.id !== toast.id))
              }
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      {confirmation && (
        <Modal title={confirmation.title} onClose={() => finish(false)}>
          <p className="muted leading-relaxed">{confirmation.message}</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => finish(false)}>
              Keep working
            </button>
            <button className="btn btn-danger" onClick={() => finish(true)}>
              {confirmation.label || "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useRef(`modal-${crypto.randomUUID()}`).current;
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current.focus();
    const keydown = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const focusable = [
          ...ref.current.querySelectorAll(
            'button, a[href], input, select, textarea, [tabindex="0"]',
          ),
        ].filter((el) => !el.disabled);
        const first = focusable[0],
          last = focusable.at(-1);
        if (!focusable.length) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={ref}
      >
        <div className="modal-heading">
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function Field({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  required,
  textarea,
  ...props
}) {
  const id = props.id || `field-${name}`;
  const Input = textarea ? "textarea" : "input";
  return (
    <div className={`field ${props.className || ""}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      <Input
        {...props}
        className={`input ${error ? "input-error" : ""}`}
        id={id}
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-hint` : undefined}
      />
      {(error || hint) && (
        <p id={`${id}-hint`} className={error ? "field-error" : "field-hint"}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function Brand({ light = false }) {
  return (
    <Link
      to="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Folio home"
    >
      <span className="brand-mark">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 20V4h15v5H11v3h7v5h-7v3H5Z" fill="currentColor" />
        </svg>
      </span>
      folio<span className="brand-period">.</span>
    </Link>
  );
}

export function DemoNotice({ compact = false }) {
  return (
    <div className={`demo-notice ${compact ? "compact" : ""}`}>
      <span className="status-dot" />
      <span>
        <strong>Local demo</strong>
        {compact
          ? " · Saved in this browser"
          : " — Your work stays in this browser. Shared profiles need this browser’s saved data; cross-device access requires a backend."}
      </span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Sparkles, title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={29} />
      </span>
      <h2>{title}</h2>
      <p className="muted">{children}</p>
      {action && (
        <Link className="btn btn-primary" to={action.to}>
          {action.label}
          <ArrowUpRight size={17} />
        </Link>
      )}
    </div>
  );
}

export function Loading({ children = "Getting things ready…" }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={25} />
      <p>{children}</p>
    </div>
  );
}
