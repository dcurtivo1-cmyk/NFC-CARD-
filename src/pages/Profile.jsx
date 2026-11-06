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
import { DemoNotice, EmptyState, Loading } from "../components/UI";
import ProfileCard from "../components/ProfileCard";
import ShareModal from "../components/ShareModal";
import { savePageOffline } from "../lib/offline";

export default function Profile() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [share, setShare] = useState(params.get("created") === "1");
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  const [offlineReady, setOfflineReady] = useState(false);
  useEffect(() => {
    let current = true;
    setOfflineReady(false);
    if (state.document?.publishedAt) {
      savePageOffline(state.document.id).then((ready) => {
        if (current) setOfflineReady(ready);
      });
    }
    return () => {
      current = false;
    };
  }, [state.document]);
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
            : { error: error.message, missing: error.status === 404 },
        );
      }
    }
    refresh();
    return () => controller.abort();
  }, [id, attempt]);
  useEffect(() => {
    if (params.has("created")) {
      setShare(true);
      setParams({ manage: "1" }, { replace: true });
    }
  }, [params, setParams]);
  if (state.loading) return <Loading>Opening your page…</Loading>;
  const doc = state.document;
  if (!doc)
    return (
      <div className="section-container profile-missing">
        <EmptyState
          icon={Link2Off}
          title={
            state.missing
              ? "This little page isn’t here yet."
              : "We couldn’t load this page."
          }
        >
          {state.error ||
            "This page has not been published or has been deleted."}
        </EmptyState>
        <button
          className="btn btn-secondary"
          onClick={() => setAttempt((n) => n + 1)}
        >
          Try again
        </button>
      </div>
    );
  const owner = canManagePublishedPage(id) || !doc.publishedAt;
  const manage = owner && params.get("manage") === "1";
  if (!manage)
    return (
      <main
        id="main"
        className="profile-landing"
        style={{ background: doc.design.background }}
      >
        <div className="public-card-wrap">
          <ProfileCard document={doc} publicView />
        </div>
        {(offlineReady || doc.offline) && (
          <p
            className="profile-offline-status"
            role="status"
            style={{ color: doc.design.text }}
          >
            {doc.offline
              ? "Offline — showing saved info. Website links need internet."
              : "Available offline on this device."}
          </p>
        )}
      </main>
    );
  return (
    <main id="main" className="public-profile-page">
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
            Looking good,{" "}
            {doc.details.displayName?.split(" ")[0] ||
              doc.details.fullName.split(" ")[0]}
            <span>.</span>
          </h1>
          <p>
            {doc.publishedAt
              ? "Your generated demo profile, ready for NFC and QR sharing."
              : "Your local demo. Publish it to share with other devices."}
          </p>
        </div>
        <div className="public-card-wrap">
          <ProfileCard document={doc} publicView />
        </div>
        {owner && (
          <div className="public-demo-notice">
            <DemoNotice />
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
    </main>
  );
}
