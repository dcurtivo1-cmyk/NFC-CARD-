import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Pencil,
  Share2,
  Link2Off,
} from "lucide-react";
import { readDocuments } from "../lib/storage";
import { canManagePublishedPage, fetchPublishedPage } from "../lib/publishing";
import { EmptyState, Loading } from "../components/UI";
import ProfileCard from "../components/ProfileCard";
import ShareModal from "../components/ShareModal";

export default function Profile() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [share, setShare] = useState(params.get("created") === "1");
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      setState({ loading: true });
      try {
        const document = await fetchPublishedPage(id, controller.signal);
        if (!controller.signal.aborted) setState({ document });
      } catch (error) {
        if (controller.signal.aborted) return;
        let local;
        try {
          local = readDocuments().find(
            (d) => d.id === id && d.status === "generated" && !d.publishedAt,
          );
        } catch {
          /* Public reads never depend on browser storage. */
        }
        setState(
          error.status === 404 && local
            ? { document: local }
            : { error: error.message, retry: error.status !== 404 },
        );
      }
    }
    refresh();
    return () => controller.abort();
  }, [id, attempt]);
  useEffect(() => {
    if (params.has("created")) {
      setShare(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);
  if (state.loading) return <Loading>Opening your page…</Loading>;
  const doc = state.document;
  if (!doc)
    return (
      <div className="section-container profile-missing">
        <EmptyState
          icon={Link2Off}
          title="This little page isn’t here yet."
          action={{ to: "/create", label: "Create your own page" }}
        >
          {state.error ||
            "This page has not been published or has been deleted."}
        </EmptyState>
        {state.retry && (
          <button
            className="btn btn-secondary"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </button>
        )}
      </div>
    );
  const owner = canManagePublishedPage(id) || !doc.publishedAt;
  return (
    <div className="public-profile-page">
      <div className="section-container">
        <div className="public-toolbar">
          <Link to={owner ? "/dashboard" : "/"} className="back-link">
            <ArrowLeft size={15} />
            {owner ? "My workspace" : "Folio Studio"}
          </Link>
          <div>
            {owner && (
              <Link
                className="btn btn-secondary btn-small"
                to={`/editor/${doc.id}`}
              >
                <Pencil size={14} />
                Edit page
              </Link>
            )}
            <button
              className="btn btn-primary btn-small"
              onClick={() => setShare(true)}
            >
              <Share2 size={14} />
              Share & QR
            </button>
          </div>
        </div>
        <div className="public-heading">
          <div className="eyebrow">YOUR NEXT HELLO STARTS HERE</div>
          <h1>
            {doc.details.displayName || doc.details.fullName}
            <span>.</span>
          </h1>
          <p>
            {doc.publishedAt
              ? "A little page, ready to connect."
              : "Your local demo. Publish it to share with other devices."}
          </p>
        </div>
        <div className="public-card-wrap">
          <ProfileCard document={doc} publicView />
        </div>
        {owner && (
          <div className="public-demo-notice">
            <Link to="/about-demo" className="text-link">
              About publishing and NFC cards <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
      </div>
      {share && (
        <ShareModal
          document={doc}
          onClose={() => setShare(false)}
          onPublished={(document) => setState({ document })}
        />
      )}
    </div>
  );
}
