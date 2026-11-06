import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  PenLine,
  Sparkles,
  FileText,
  ScanLine,
} from "lucide-react";
import { products } from "../data/presets";
import ProductIcon from "../components/ProductIcon";
import { DemoNotice, Modal } from "../components/UI";

export default function Selection() {
  const [filter, setFilter] = useState("All products");
  const [selected, setSelected] = useState(null);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => {
    const p = products.find((p) => p.id === params.get("type"));
    if (p) setSelected(p);
  }, [params]);
  const close = () => {
    setSelected(null);
    if (params.has("type")) setParams({}, { replace: true });
  };
  return (
    <div className="selection-page section-container">
      <Link to="/" className="back-link">
        <ArrowLeft size={15} />
        Back to home
      </Link>
      <div className="page-heading centered">
        <div className="eyebrow">LET’S MAKE SOMETHING THAT’S YOU</div>
        <h1>Start with a little possibility.</h1>
        <p>
          Pick the page that fits your idea. We’ll help you bring it to life.
        </p>
      </div>
      <div
        className="selection-tabs"
        role="tablist"
        aria-label="Product category"
      >
        {["All products", "Personal", "Business"].map((tab) => (
          <button
            role="tab"
            aria-selected={tab === filter}
            key={tab}
            className={tab === filter ? "active" : ""}
            onClick={() => setFilter(tab)}
          >
            {tab}
            {tab === "All products" && <span>6</span>}
          </button>
        ))}
      </div>
      <div className="selection-grid">
        {products
          .filter((p) => filter === "All products" || p.category === filter)
          .map((product) => (
            <button
              className={`selection-card product-${product.color}`}
              onClick={() => setSelected(product)}
              key={product.id}
            >
              <div className="selection-art">
                <ProductIcon product={product} size={31} />
                <span className="art-line line-one" />
                <span className="art-line line-two" />
                <div className="art-page">
                  <span />
                  <i />
                  <i />
                  <b />
                  <b />
                  {product.id === "menu" ? (
                    <span className="art-small-label">TODAY’S MENU</span>
                  ) : product.id === "review" ? (
                    <span className="art-small-label">★★★★★</span>
                  ) : product.id === "nfc" ? (
                    <ScanLine size={25} />
                  ) : (
                    <span className="art-small-label">a little more you.</span>
                  )}
                </div>
                <span className="product-category">{product.category}</span>
              </div>
              <div className="selection-card-content">
                <h2>
                  {product.name}
                  {product.id === "card" && (
                    <span className="popular-badge">POPULAR</span>
                  )}
                </h2>
                <p>{product.description}</p>
                <span className="selection-card-link">
                  Create your{" "}
                  {product.id === "nfc"
                    ? "landing page"
                    : product.name.toLowerCase()}
                  <ArrowRight size={17} />
                </span>
              </div>
            </button>
          ))}
      </div>
      <div className="selection-bottom">
        <Check size={16} />
        <span>
          Every page includes a custom theme, live preview, and downloadable QR
          code.
        </span>
      </div>
      <DemoNotice />
      {selected && (
        <Modal
          title={`Your ${selected.name.toLowerCase()}, your way.`}
          onClose={close}
        >
          <ProductIcon product={selected} />
          <p className="modal-intro">
            A blank canvas or a little inspiration? Either way, you’ll add and
            edit your details manually.
          </p>
          <button
            className="mode-option"
            onClick={() => navigate(`/editor?type=${selected.id}`)}
          >
            <span className="mode-icon">
              <PenLine size={21} />
            </span>
            <span>
              <strong>Start from scratch</strong>
              <small>Enter your details in our guided manual editor.</small>
            </span>
            <ArrowRight size={18} />
          </button>
          <button
            className="mode-option"
            onClick={() => navigate(`/editor?type=${selected.id}&sample=1`)}
          >
            <span className="mode-icon">
              <Sparkles size={21} />
            </span>
            <span>
              <strong>Try sample details</strong>
              <small>Explore an example, then make every part yours.</small>
            </span>
            <ArrowRight size={18} />
          </button>
          <div className="mode-footer">
            <FileText size={15} />
            No account needed. Save drafts locally, then generate to publish.
          </div>
        </Modal>
      )}
    </div>
  );
}
