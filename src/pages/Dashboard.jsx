import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Search,
  FileText,
  ContactRound,
  Layers,
  Copy,
  Trash2,
  Pencil,
  Share2,
  LayoutGrid,
  Clock3,
  AlertCircle,
} from "lucide-react";
import { products } from "../data/presets";
import { canManagePublishedPage, deletePublishedPage } from "../lib/publishing";
import {
  deleteDocument,
  readDocuments,
  readEditor,
  saveDocument,
} from "../lib/storage";
import { DemoNotice, EmptyState, useFeedback } from "../components/UI";
import ProductIcon from "../components/ProductIcon";
import ShareModal from "../components/ShareModal";

function load() {
  try {
    const documents = readDocuments();
    let recovery = null;
    try {
      recovery = readEditor();
    } catch {
      /* A bad recovery copy should not hide saved pages. */
    }
    return { documents, recovery, error: null };
  } catch (e) {
    return { documents: [], recovery: null, error: e.message };
  }
}
function formatDate(date) {
  return Number.isNaN(new Date(date).getTime())
    ? "earlier"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(date));
}

export default function Dashboard() {
  const [data, setData] = useState(load);
  const [filter, setFilter] = useState("All pages");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [share, setShare] = useState(null);
  const { notify, confirm } = useFeedback();
  useEffect(() => {
    const refresh = () => setData(load());
    window.addEventListener("storage", refresh);
    window.addEventListener("folio-storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("folio-storage", refresh);
    };
  }, []);
  const filtered = useMemo(
    () =>
      data.documents
        .filter(
          (d) =>
            (filter === "All pages" ||
              d.status === (filter === "Drafts" ? "draft" : "generated")) &&
            `${d.details.fullName} ${d.details.displayName} ${d.details.businessName} ${products.find((p) => p.id === d.type)?.name}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "name"
            ? (a.details.displayName || a.details.fullName).localeCompare(
                b.details.displayName || b.details.fullName,
              )
            : sort === "oldest"
              ? new Date(a.updatedAt) - new Date(b.updatedAt)
              : new Date(b.updatedAt) - new Date(a.updatedAt),
        ),
    [data, filter, search, sort],
  );
  const remove = async (doc) => {
    if (
      !(await confirm({
        title: "Delete this little page?",
        message: `“${doc.details.displayName || doc.details.fullName || "Untitled page"}” will be deleted${doc.publishedAt ? " from the publishing server and this browser. Its NFC and QR link will stop working" : " from this browser"}. This can’t be undone.`,
        label: "Delete page",
      }))
    )
      return;
    try {
      if (doc.publishedAt || canManagePublishedPage(doc.id))
        await deletePublishedPage(doc.id);
      deleteDocument(doc.id);
      notify(
        doc.publishedAt
          ? "Published page deleted. Its NFC and QR link is no longer active."
          : "Page deleted from this browser.",
      );
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const duplicate = (doc) => {
    try {
      const copy = structuredClone(doc);
      copy.id = null;
      copy.createdAt = null;
      copy.publishedAt = null;
      copy.publishedUrl = null;
      copy.details.fullName = `${copy.details.fullName || "Untitled"} (copy)`;
      copy.details.displayName = copy.details.displayName
        ? `${copy.details.displayName} (copy)`
        : "";
      saveDocument(copy, "draft");
      notify("A new draft copy is ready in your workspace.");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  return (
    <div className="dashboard-page section-container">
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow">A LITTLE SPACE FOR YOUR BIG IDEAS</div>
          <h1>
            Your workspace<span>.</span>
          </h1>
          <p>
            Good things, all in one place. Pick up, polish, and put them out
            there.
          </p>
        </div>
        <Link className="btn btn-primary" to="/create">
          <Plus size={17} />
          Create a new page
        </Link>
      </div>
      <DemoNotice />
      <div className="dashboard-stats">
        {[
          [
            LayoutGrid,
            "Your pages",
            data.documents.length,
            "All the things you’re making",
          ],
          [
            FileText,
            "Drafts",
            data.documents.filter((d) => d.status === "draft").length,
            "A little work in progress",
          ],
          [
            ContactRound,
            "Generated demos",
            data.documents.filter((d) => d.status === "generated").length,
            "Ready for another hello",
          ],
        ].map(([Icon, label, count, description]) => (
          <div className="stat-card" key={label}>
            <span className="stat-icon">
              <Icon size={20} />
            </span>
            <div>
              <span>{label}</span>
              <strong>{count.toString().padStart(2, "0")}</strong>
              <small>{description}</small>
            </div>
          </div>
        ))}
      </div>
      {data.recovery && !data.error && (
        <div className="resume-banner">
          <span className="resume-icon">
            <Clock3 size={21} />
          </span>
          <div>
            <strong>A little something you were working on.</strong>
            <p>
              {data.recovery.details.displayName ||
                data.recovery.details.fullName ||
                "Your untitled page"}{" "}
              · Auto-recovered editor
            </p>
          </div>
          <Link className="text-link" to="/editor?resume=1">
            Continue editing
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <div className="workspace-toolbar">
        <div className="workspace-tabs">
          {["All pages", "Drafts", "Generated"].map((tab) => (
            <button
              key={tab}
              className={filter === tab ? "active" : ""}
              onClick={() => setFilter(tab)}
            >
              {tab}
              {tab === "All pages" && <span>{data.documents.length}</span>}
            </button>
          ))}
        </div>
        <div className="workspace-filters">
          <label className="search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a little page…"
              aria-label="Search saved pages"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="sort-select"
            aria-label="Sort saved pages"
          >
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>
      {data.error ? (
        <EmptyState
          icon={AlertCircle}
          title="We couldn’t read your saved pages."
        >
          {data.error} Your browser’s existing data has been left in place.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={
            search || filter !== "All pages"
              ? "No pages in this little corner."
              : "Your next great idea goes here."
          }
          action={
            !search && filter === "All pages"
              ? { to: "/create", label: "Create your first page" }
              : null
          }
        >
          {search || filter !== "All pages"
            ? "Try another search or filter to find what you’re looking for."
            : "Create a digital card, a menu, or a home for your links. We’ll keep your drafts right here."}
        </EmptyState>
      ) : (
        <div className="workspace-grid">
          {filtered.map((doc) => {
            const product = products.find((p) => p.id === doc.type);
            return (
              <article className="workspace-card" key={doc.id}>
                <Link
                  to={
                    doc.status === "generated"
                      ? `/p/${doc.id}?manage=1`
                      : `/editor/${doc.id}`
                  }
                  className="workspace-card-art"
                  style={{ background: doc.design.cover }}
                  aria-label={`Open ${doc.details.displayName || doc.details.fullName || "Untitled page"}`}
                >
                  <div
                    className={`workspace-mini-page ${doc.type === "card" ? "mini-portrait-card" : ""} mini-header-${doc.design.headerLayout} mini-links-${doc.design.buttonLayout}`}
                    style={{
                      background:
                        doc.type === "card" ? "#fff" : doc.design.background,
                      "--portrait-size": `${doc.design.portraitSize ?? 100}%`,
                      "--portrait-x": `${doc.design.portraitX ?? 0}%`,
                      "--portrait-y": `${doc.design.portraitY ?? 0}%`,
                    }}
                  >
                    <div
                      className={`mini-page-cover ${doc.details.coverPhoto ? "has-cover-photo" : ""}`}
                      style={{ background: doc.design.cover }}
                    >
                      {doc.details.coverPhoto && (
                        <img
                          className="mini-cover-photo"
                          src={doc.details.coverPhoto}
                          alt=""
                        />
                      )}
                      {doc.type === "card" && doc.details.profilePhoto && (
                        <img
                          className="mini-portrait"
                          src={doc.details.profilePhoto}
                          alt=""
                        />
                      )}
                    </div>
                    {doc.type !== "card" &&
                      (doc.details.profilePhoto ? (
                        <img src={doc.details.profilePhoto} alt="" />
                      ) : (
                        <span
                          className="mini-page-avatar"
                          style={{ background: doc.design.primary }}
                        >
                          {(doc.details.fullName || "F")[0]}
                        </span>
                      ))}
                    <strong style={{ color: doc.design.text }}>
                      {doc.details.displayName ||
                        doc.details.fullName ||
                        "Untitled page"}
                    </strong>
                    <small style={{ color: doc.design.text }}>
                      {doc.details.position || product.name}
                    </small>
                    <i style={{ background: doc.design.primary }} />
                    <b />
                    <b />
                  </div>
                  <span className={`document-status ${doc.status}`}>
                    <i />
                    {doc.publishedAt
                      ? "Published"
                      : doc.status === "generated"
                        ? "Local demo"
                        : "Draft"}
                  </span>
                </Link>
                <div className="workspace-card-body">
                  <span className="workspace-product">
                    <ProductIcon product={product} size={13} />
                    {product.name}
                  </span>
                  <h2>
                    <Link to={`/editor/${doc.id}`}>
                      {doc.details.displayName ||
                        doc.details.fullName ||
                        "Untitled page"}
                    </Link>
                  </h2>
                  <p>Edited {formatDate(doc.updatedAt)}</p>
                  <div className="workspace-card-actions">
                    <Link to={`/editor/${doc.id}`} className="text-link">
                      <Pencil size={14} />
                      Edit page
                    </Link>
                    <div>
                      {doc.status === "generated" && (
                        <button
                          className="icon-button"
                          aria-label={`Share ${doc.details.fullName}`}
                          onClick={() => setShare(doc)}
                        >
                          <Share2 size={16} />
                        </button>
                      )}
                      <button
                        className="icon-button"
                        aria-label={`Duplicate ${doc.details.fullName}`}
                        onClick={() => duplicate(doc)}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="icon-button delete-button"
                        aria-label={`Delete ${doc.details.fullName}`}
                        onClick={() => remove(doc)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          <Link className="new-workspace-card" to="/create">
            <span>
              <Plus size={25} />
            </span>
            <strong>Room for another idea.</strong>
            <p>Let’s make something good.</p>
            <span className="text-link">
              Create a page <ArrowUpRight size={16} />
            </span>
          </Link>
        </div>
      )}
      <p className="workspace-footnote">
        Drafts and private editing keys stay in this browser. Published pages
        remain online; clearing site data removes your ability to edit them.
      </p>
      {share && <ShareModal document={share} onClose={() => setShare(null)} />}
    </div>
  );
}
