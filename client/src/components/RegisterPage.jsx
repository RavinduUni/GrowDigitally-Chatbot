import React, { useState } from "react";
import api from "../services/api";

/* ─── Field definition ─────────────────────────── */
const FIELDS = [
  {
    id: "companyName",
    label: "Company Name",
    type: "text",
    placeholder: "ABC Hotel",
    icon: "business",
  },
  {
    id: "ownerName",
    label: "Owner / Contact Name",
    type: "text",
    placeholder: "John Smith",
    icon: "person",
  },
  {
    id: "email",
    label: "Business Email",
    type: "email",
    placeholder: "john@abchotel.com",
    icon: "mail",
  },
  {
    id: "websiteUrl",
    label: "Website URL",
    type: "url",
    placeholder: "https://abchotel.com",
    icon: "language",
  },
];

/* ─── Copy-to-clipboard helper ─────────────────── */
const useCopy = () => {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return { copied, copy };
};

/* ═══════════════════════════════════════════════
   RegisterPage Component
═══════════════════════════════════════════════ */
const RegisterPage = () => {
  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    websiteUrl: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState(null); // success payload

  const { copied: tokenCopied, copy: copyToken } = useCopy();
  const { copied: embedCopied, copy: copyEmbed } = useCopy();

  /* ── Validation ──────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    if (!form.ownerName.trim()) e.ownerName = "Owner name is required";
    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address";
    }
    if (!form.websiteUrl.trim()) {
      e.websiteUrl = "Website URL is required";
    } else if (!/^https?:\/\/.+/.test(form.websiteUrl)) {
      e.websiteUrl = "URL must start with http:// or https://";
    }
    return e;
  };

  /* ── Submit ──────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setServerError("");
    setIsLoading(true);

    try {
      const res = await api.post("/api/business/register", form);
      setResult(res.data);
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Field change ──────────────────────────────── */
  const handleChange = (id, val) => {
    setForm((prev) => ({ ...prev, [id]: val }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  /* ─────────────────────────────────────────────
     SUCCESS SCREEN
  ───────────────────────────────────────────── */
  if (result) {
    return (
      <div style={styles.page}>
        {/* Blurred gradient orbs */}
        <div style={{ ...styles.orb, ...styles.orb1 }} />
        <div style={{ ...styles.orb, ...styles.orb2 }} />

        <div style={{ ...styles.card, ...styles.successCard }}>
          {/* Icon */}
          <div style={styles.successIconWrap}>
            <span className="material-symbols-outlined" style={styles.successIcon}>
              check_circle
            </span>
          </div>

          <h1 style={styles.successTitle}>You're all set! 🎉</h1>
          <p style={styles.successSub}>
            Welcome aboard, <strong>{result.companyName}</strong>. Your AI chatbot
            is being trained on your website.
          </p>

          {/* Business ID */}
          <div style={styles.infoBlock}>
            <span style={styles.infoLabel}>Business ID</span>
            <code style={styles.infoCode}>{result.businessId}</code>
          </div>

          {/* Widget Token */}
          <div style={styles.infoBlock}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Widget Token</span>
              <button
                style={styles.copyBtn}
                onClick={() => copyToken(result.widgetToken)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  {tokenCopied ? "check" : "content_copy"}
                </span>
                {tokenCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <code style={styles.infoCode}>{result.widgetToken}</code>
          </div>

          {/* Embed Code */}
          <div style={styles.infoBlock}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Embed Code</span>
              <button
                style={styles.copyBtn}
                onClick={() => copyEmbed(result.embedCode)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  {embedCopied ? "check" : "content_copy"}
                </span>
                {embedCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre style={styles.embedPre}>{result.embedCode}</pre>
          </div>

          <p style={styles.helpText}>
            Paste the embed code just before the{" "}
            <code style={{ color: "#93bbfd" }}>&lt;/body&gt;</code> tag of your
            website. Your chatbot will be live as soon as training completes.
          </p>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     REGISTRATION FORM
  ───────────────────────────────────────────── */
  return (
    <div style={styles.page}>
      {/* Blurred gradient orbs */}
      <div style={{ ...styles.orb, ...styles.orb1 }} />
      <div style={{ ...styles.orb, ...styles.orb2 }} />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrap}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "28px", color: "#5b9cf6" }}
            >
              smart_toy
            </span>
          </div>
          <h1 style={styles.title}>Get Your AI Chatbot</h1>
          <p style={styles.subtitle}>
            Fill in your details and we'll set up a custom AI assistant trained
            on your website — in minutes.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          {FIELDS.map((field) => (
            <div key={field.id} style={styles.fieldGroup}>
              <label style={styles.label} htmlFor={field.id}>
                {field.label}
              </label>
              <div style={styles.inputWrap}>
                <span
                  className="material-symbols-outlined"
                  style={styles.inputIcon}
                >
                  {field.icon}
                </span>
                <input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors[field.id] ? styles.inputError : {}),
                  }}
                  autoComplete="off"
                />
              </div>
              {errors[field.id] && (
                <span style={styles.errorText}>{errors[field.id]}</span>
              )}
            </div>
          ))}

          {/* Server error */}
          {serverError && (
            <div style={styles.serverError}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                error
              </span>
              {serverError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.submitBtn,
              ...(isLoading ? styles.submitBtnDisabled : {}),
            }}
          >
            {isLoading ? (
              <>
                <span style={styles.spinner} />
                Setting up your chatbot...
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  rocket_launch
                </span>
                Get Started — It's Free
              </>
            )}
          </button>
        </form>

        <p style={styles.footerNote}>
          By registering you agree to our Terms of Service. No credit card
          required.
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   STYLES (inline — works inside Shadow DOM)
───────────────────────────────────────────── */
const styles = {
  page: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(ellipse at 20% 20%, #0d1b3e 0%, #060d1f 60%, #0a0a1a 100%)",
    fontFamily: "'Inter', sans-serif",
    overflow: "auto",
    padding: "24px 16px",
    boxSizing: "border-box",
    zIndex: 9999,
  },
  orb: {
    position: "fixed",
    borderRadius: "50%",
    filter: "blur(80px)",
    pointerEvents: "none",
    zIndex: 0,
  },
  orb1: {
    width: "400px",
    height: "400px",
    background: "rgba(59, 130, 246, 0.18)",
    top: "-80px",
    left: "-80px",
  },
  orb2: {
    width: "350px",
    height: "350px",
    background: "rgba(139, 92, 246, 0.15)",
    bottom: "-60px",
    right: "-60px",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "480px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "24px",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    padding: "40px 36px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
    boxSizing: "border-box",
  },
  successCard: {
    maxWidth: "520px",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoWrap: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "rgba(91,156,246,0.15)",
    border: "1px solid rgba(91,156,246,0.3)",
    marginBottom: "16px",
  },
  title: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#f0f4ff",
    margin: "0 0 8px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#8b9bb4",
    margin: 0,
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#c5d0e8",
    letterSpacing: "0.3px",
  },
  inputWrap: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "20px",
    color: "#5b9cf6",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    color: "#e8eeff",
    fontSize: "14px",
    padding: "13px 16px 13px 46px",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  inputError: {
    borderColor: "#f87171",
    background: "rgba(248,113,113,0.06)",
  },
  errorText: {
    fontSize: "12px",
    color: "#f87171",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  serverError: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(248,113,113,0.12)",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    color: "#fca5a5",
  },
  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "15px 24px",
    background: "linear-gradient(135deg, #3b82f6 0%, #6d28d9 100%)",
    border: "none",
    borderRadius: "14px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.3px",
    boxShadow: "0 8px 24px rgba(59,130,246,0.35)",
    transition: "opacity 0.2s, transform 0.15s",
    fontFamily: "inherit",
    marginTop: "4px",
  },
  submitBtnDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "gd-spin 0.8s linear infinite",
    display: "inline-block",
    flexShrink: 0,
  },
  footerNote: {
    fontSize: "12px",
    color: "#5a6a85",
    textAlign: "center",
    marginTop: "20px",
    marginBottom: 0,
    lineHeight: 1.5,
  },

  /* ── Success screen ── */
  successIconWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
  },
  successIcon: {
    fontSize: "56px",
    color: "#34d399",
    filter: "drop-shadow(0 0 16px rgba(52,211,153,0.5))",
  },
  successTitle: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#f0f4ff",
    textAlign: "center",
    margin: "0 0 8px",
    letterSpacing: "-0.5px",
  },
  successSub: {
    fontSize: "14px",
    color: "#8b9bb4",
    textAlign: "center",
    lineHeight: 1.6,
    margin: "0 0 28px",
  },
  infoBlock: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "12px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  infoLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#5b9cf6",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  infoCode: {
    display: "block",
    fontSize: "13px",
    color: "#c5d0e8",
    wordBreak: "break-all",
    fontFamily: "'Courier New', monospace",
  },
  embedPre: {
    fontSize: "12px",
    color: "#c5d0e8",
    wordBreak: "break-all",
    whiteSpace: "pre-wrap",
    margin: 0,
    fontFamily: "'Courier New', monospace",
  },
  copyBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(91,156,246,0.15)",
    border: "1px solid rgba(91,156,246,0.3)",
    borderRadius: "8px",
    color: "#5b9cf6",
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 10px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.15s",
  },
  helpText: {
    fontSize: "13px",
    color: "#5a6a85",
    lineHeight: 1.6,
    marginTop: "16px",
    marginBottom: 0,
    textAlign: "center",
  },
};

/* Inject keyframes for spinner into document */
if (typeof document !== "undefined" && !document.getElementById("gd-register-styles")) {
  const style = document.createElement("style");
  style.id = "gd-register-styles";
  style.textContent = `
    @keyframes gd-spin { to { transform: rotate(360deg); } }
    #gd-register-form input:focus {
      border-color: rgba(91,156,246,0.6) !important;
      background: rgba(91,156,246,0.08) !important;
    }
    #gd-register-form button[type="submit"]:not(:disabled):hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);
}

export default RegisterPage;
