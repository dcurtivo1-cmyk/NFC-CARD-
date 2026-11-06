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
import { DemoNotice, EmptyState } from "../components/UI";
import ProfileCard from "../components/ProfileCard";
import ShareModal from "../components/ShareModal";

export default function Profile() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [share, setShare] = useState(params.get("created") === "1");
  const [state, setState] = useState(() => read(id));
  useEffect(() => {
    const refresh = () => setState(read(id));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("folio-storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("folio-storage", refresh);
    };
  }, [id]);
  useEffect(() => {
    if (params.has("created")) {
      setShare(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);
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
            "This is a local demo URL. Its profile data is only available in the browser where it was generated. Try the original browser, or create a new page here."}
        </EmptyState>
        <Link className="text-link" to="/dashboard">
          Check this browser’s workspace <ArrowRightIcon />
        </Link>
      </div>
    );
  return (
    <div className="public-profile-page">
      <div className="section-container">
        <div className="public-toolbar">
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={15} />
            My workspace
          </Link>
          <div>
            <Link
              className="btn btn-secondary btn-small"
              to={`/editor/${doc.id}`}
            >
              <Pencil size={14} />
              Edit page
            </Link>
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
          <p>Your generated demo profile, just as visitors would see it.</p>
        </div>
        <div className="public-card-wrap">
          <ProfileCard document={doc} publicView />
        </div>
        <div className="public-demo-notice">
          <DemoNotice />
          <Link to="/about-demo" className="text-link">
            How to make profiles work across devices <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      {share && <ShareModal document={doc} onClose={() => setShare(false)} />}
    </div>
  );
}
const ArrowRightIcon = () => <ArrowUpRight size={15} />;
function read(id) {
  try {
    return {
      document: readDocuments().find(
        (d) => d.id === id && d.status === "generated",
      ),
      error: null,
    };
  } catch (e) {
    return { document: null, error: e.message };
  }
}
