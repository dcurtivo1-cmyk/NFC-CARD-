import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleHelp,
  Eye,
  LoaderCircle,
  Palette,
  PenLine,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import { createDocument, products } from "../data/presets";
import {
  cacheEditor,
  clearEditor,
  readDocuments,
  readEditor,
  saveDocument,
} from "../lib/storage";
import { validateDetails } from "../lib/profile";
import { publishPage } from "../lib/publishing";
import { DemoNotice, EmptyState, Modal, useFeedback } from "../components/UI";
import ProductIcon from "../components/ProductIcon";
import ProfileCard from "../components/ProfileCard";
import DetailsForm from "../components/DetailsForm";
import DesignForm from "../components/DesignForm";

function loadInitial(id, params) {
  try {
    if (id) {
      const doc = readDocuments().find((d) => d.id === id);
      return doc
        ? { doc }
        : { error: "This saved page could not be found in this browser." };
    }
    if (params.has("resume")) {
      const doc = readEditor();
      if (doc) return { doc };
    }
    const type = products.some((p) => p.id === params.get("type"))
      ? params.get("type")
      : "card";
    return { doc: createDocument(type, params.get("sample") === "1") };
  } catch (e) {
    return { error: e.message };
  }
}

export default function Editor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [initial] = useState(() => loadInitial(id, params));
  const [document, setDocument] = useState(initial.doc || createDocument());
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [recoveryError, setRecoveryError] = useState(false);
  const cacheWarning = useRef(false);
  const navigate = useNavigate();
  const { notify, confirm } = useFeedback();
  const product = products.find((p) => p.id === document.type);
  useEffect(() => {
    if (initial.error) return;
    const timer = setTimeout(() => {
      try {
        cacheEditor(document);
        setRecovered(true);
        setRecoveryError(false);
      } catch (e) {
        setRecovered(false);
        setRecoveryError(true);
        if (!cacheWarning.current) {
          notify(e.message, "error");
          cacheWarning.current = true;
        }
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [document]);
  useEffect(() => {
    const beforeUnload = (e) => {
      if (dirty && !recovered) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, recovered]);
  const changeField = (name, value) => {
    setDocument((doc) => ({
      ...doc,
      details: { ...doc.details, [name]: value },
    }));
    setDirty(true);
    setRecovered(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      if (["customLinks", "menuItems"].includes(name))
        Object.keys(next)
          .filter((k) =>
            k.startsWith(name === "customLinks" ? "link-" : "menu-"),
          )
          .forEach((k) => delete next[k]);
      return next;
    });
  };
  const validate = () => {
    const nextErrors = validateDetails(document.details, document.type);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStep(0);
      notify(
        "A few details need your attention. Please check the highlighted fields.",
        "error",
      );
      setTimeout(() => {
        const el = window.document.getElementsByName(
          Object.keys(nextErrors)[0],
        )[0];
        if (el) {
          let parent = el.parentElement;
          while (parent) {
            if (parent.tagName === "DETAILS") parent.open = true;
            parent = parent.parentElement;
          }
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      return false;
    }
    return true;
  };
  const moveStep = (index) => {
    if (index > 0 && !validate()) return;
    setStep(index);
    window.scrollTo({ top: 90, behavior: "smooth" });
  };
  const persist = async (generate) => {
    if ((generate || document.publishedAt) && !validate()) return;
    setBusy(true);
    try {
      let saved = saveDocument(
        document,
        generate || document.status === "generated" ? "generated" : "draft",
      );
      setDocument(saved);
      if (generate || saved.publishedAt) {
        saved = await publishPage(saved);
        setDocument(saved);
        try {
          saveDocument(saved, "generated");
        } catch {
          notify(
            "Published successfully, but the local workspace could not save its publishing status. Keep your private edit key in this browser.",
            "info",
          );
        }
      }
      setDirty(false);
      try {
        cacheEditor(saved);
      } catch {
        /* Primary save succeeded; recovery cache is optional. */
      }
      if (generate) {
        notify(
          document.status === "generated"
            ? "Your published page has been updated at the same URL."
            : "Your demo is published. Your link and QR are ready!",
        );
        navigate(`/p/${saved.id}?created=1`);
      } else
        notify(
          document.status === "generated"
            ? saved.publishedAt
              ? "Changes saved and published at the same URL."
              : "Changes saved to your local demo. Generate to publish it."
            : "Draft saved to your workspace. Pick up right where you left off.",
        );
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const reset = async () => {
    const accepted = await confirm({
      title: "A fresh start?",
      message:
        "This clears the current editor’s details and design. Your saved draft or generated profile stays in your workspace until you save over it.",
      label: "Reset editor",
    });
    if (!accepted) return;
    setDocument((doc) => ({
      ...createDocument(doc.type),
      id: doc.id,
      status: doc.status,
      createdAt: doc.createdAt,
      publishedAt: doc.publishedAt,
      publishedUrl: doc.publishedUrl,
    }));
    setErrors({});
    setStep(0);
    setDirty(true);
    clearEditor();
    notify("Editor reset. A blank canvas, just for you.");
  };
  if (initial.error)
    return (
      <div className="section-container">
        <EmptyState
          title="We couldn’t open that page."
          action={{ to: "/dashboard", label: "Go to workspace" }}
        >
          {initial.error}
        </EmptyState>
      </div>
    );
  return (
    <div className="editor-page section-container">
      <div className="editor-breadcrumb">
        <Link to="/create">
          <ArrowLeft size={15} />
          All products
        </Link>
        <span>/</span>
        <span>{product.name}</span>
        <span className="manual-chip">
          <PenLine size={11} />
          Manual editor
        </span>
      </div>
      <div className="editor-title-row">
        <div>
          <div className="editor-title">
            <ProductIcon product={product} size={22} />
            <h1>Make a little impression.</h1>
          </div>
          <p>Your details. Your style. Your very own corner of the internet.</p>
        </div>
        <div className="editor-top-actions">
          <button
            className="icon-button help-button"
            onClick={() => setHelp(true)}
            aria-label="About saving and sharing"
          >
            <CircleHelp size={19} />
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => persist(false)}
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            {document.status === "generated" ? "Save changes" : "Save draft"}
          </button>
        </div>
      </div>
      <div className="editor-status-row">
        <DemoNotice compact />
        <a className="mobile-preview-link text-link" href="#live-preview">
          <Smartphone size={13} />
          View live preview
          <ArrowRight size={12} />
        </a>
      </div>
      <div className="editor-layout">
        <div className="editor-panel">
          <div className="editor-steps" aria-label="Editor steps">
            {[
              [PenLine, "Your details"],
              [Palette, "Make it yours"],
              [Eye, "Final look"],
            ].map(([Icon, label], i) => (
              <button
                key={label}
                className={`${step === i ? "active" : ""} ${step > i ? "complete" : ""}`}
                aria-current={step === i ? "step" : undefined}
                onClick={() => moveStep(i)}
              >
                <span>{step > i ? <Check size={13} /> : `0${i + 1}`}</span>
                <span>{label}</span>
                {i < 2 && <ArrowRight size={13} className="step-arrow" />}
              </button>
            ))}
          </div>
          <div className="editor-panel-heading">
            <div>
              <span className="eyebrow">STEP 0{step + 1} OF 03</span>
              <h2>
                {
                  [
                    "First, a little about you.",
                    "A style that feels like you.",
                    "Looking good. Ready to say hello?",
                  ][step]
                }
              </h2>
              <p>
                {
                  [
                    "Fill in the good stuff. Your preview follows along.",
                    "Start with a theme, then make the small things your own.",
                    "Give your details one last look before generating your demo.",
                  ][step]
                }
              </p>
            </div>
          </div>
          {step === 0 && (
            <DetailsForm
              document={document}
              onChange={changeField}
              errors={errors}
            />
          )}
          {step === 1 && (
            <DesignForm
              design={document.design}
              hasCoverPhoto={Boolean(document.details.coverPhoto)}
              onChange={(design) => {
                setDocument((doc) => ({ ...doc, design }));
                setDirty(true);
                setRecovered(false);
              }}
            />
          )}
          {step === 2 && (
            <div className="final-review">
              <div className="ready-illustration">
                <FileCheck2 size={43} strokeWidth={1.4} />
                <Sparkles size={22} />
              </div>
              <h3>A little page. Entirely you.</h3>
              <p className="muted">
                You’re one click away from a saved demo profile, a real profile
                URL, and its downloadable QR code.
              </p>
              <div className="review-summary">
                <div>
                  <span>Page type</span>
                  <strong>{product.name}</strong>
                </div>
                <div>
                  <span>Display name</span>
                  <strong>
                    {document.details.displayName || document.details.fullName}
                  </strong>
                </div>
                <div>
                  <span>Theme</span>
                  <strong>{document.design.name} · Customized</strong>
                </div>
                <div>
                  <span>Your links</span>
                  <strong>
                    {document.details.customLinks.length} custom{" "}
                    {document.details.customLinks.length === 1
                      ? "link"
                      : "links"}
                  </strong>
                </div>
              </div>
              <div className="review-note">
                <ShieldCheck size={20} />
                <p>
                  <strong>Publish for NFC and QR sharing.</strong>Generating
                  uploads your page and photos for anyone with the link to see.
                  Updates keep the same URL, so your NFC card keeps working.
                </p>
              </div>
              <button
                className="btn btn-primary btn-large generate-button"
                onClick={() => persist(true)}
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle size={18} className="spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                {document.status === "generated"
                  ? "Update demo profile"
                  : "Generate my demo"}
                <ArrowUpRight size={17} />
              </button>
              <span className="generate-caption">
                Drafts stay in this browser. Generate to publish your page.
              </span>
            </div>
          )}
          <div className="editor-panel-footer">
            <button className="text-link reset-link" onClick={reset}>
              <RotateCcw size={14} />
              Reset
            </button>
            <div>
              {step > 0 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => moveStep(step - 1)}
                >
                  <ArrowLeft size={15} />
                  Back
                </button>
              )}
              {step < 2 && (
                <button
                  className="btn btn-primary"
                  onClick={() => moveStep(step + 1)}
                >
                  {step === 0 ? "Make it yours" : "Preview my page"}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        <aside className="preview-panel" id="live-preview">
          <div className="preview-heading">
            <span>
              <Smartphone size={16} />
              LIVE PREVIEW
            </span>
            <span className="live-indicator">
              <i />
              Updates as you go
            </span>
          </div>
          <div className="preview-stage">
            <ProfileCard document={document} phone />
          </div>
          <div className="preview-caption">
            <span className="preview-dot" />
            This is your good side. Every side is.
          </div>
          <div className="recovery-status">
            <Check size={13} />
            {recoveryError
              ? "Auto-recovery unavailable. Save your draft."
              : recovered
                ? "Recovery copy saved in this browser"
                : "Updating your recovery copy…"}
          </div>
          <a className="mobile-preview-link text-link" href="#main">
            <ArrowLeft size={13} />
            Back to your editor
          </a>
        </aside>
      </div>
      {help && (
        <Modal
          title="A small guide to your little page."
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <h3>Save draft</h3>
            <p>
              Keep an unfinished page in My workspace. Your current editor is
              also cached automatically so you can resume it after a refresh.
            </p>
            <h3>Generate demo</h3>
            <p>
              Publish your page and images at a permanent URL. Download its QR
              code, copy its URL for an NFC card, or export a contact file.
            </p>
            <h3>Sharing beyond this browser</h3>
            <p>
              Generated pages are uploaded to the publishing server. Anyone with
              the link can open them. Keep this browser's site data: it holds
              your drafts and private keys for updating published pages.
            </p>
            <h3>Your images</h3>
            <p>
              Profile photos and logos are cropped to 512 × 512 JPEGs. Showcase
              images use 1024 × 576; cover photos use a 1200 × 400 landscape
              crop. Images are processed before being stored in your browser.
              Large collections can reach your browser’s storage limit.
            </p>
            <Link className="text-link" to="/about-demo">
              More about this prototype <ArrowUpRight size={15} />
            </Link>
          </div>
        </Modal>
      )}
    </div>
  );
}
