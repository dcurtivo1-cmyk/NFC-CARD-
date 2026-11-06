import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MousePointer2,
  Sparkles,
  Paintbrush,
  Share2,
  MoveUpRight,
  ScanLine,
  Plus,
} from "lucide-react";
import ProfileCard, { DecorativeQR } from "../components/ProfileCard";
import ProductIcon from "../components/ProductIcon";
import { createDocument, products } from "../data/presets";

export default function Landing() {
  const sample = createDocument("card", true);
  return (
    <>
      <section className="hero-section section-container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-spark">
              <Sparkles size={12} />
            </span>{" "}
            A BETTER WAY TO SAY HELLO
          </div>
          <h1>
            Small page.
            <br />
            Big <span className="serif-accent">possibilities.</span>
            <svg className="hero-swish" viewBox="0 0 340 18" aria-hidden="true">
              <path
                d="M3 14Q155-8 335 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </h1>
          <p className="hero-description">
            You’re more than a name on a business card.
            <br className="desktop-break" /> Bring your world together in one
            beautiful, shareable page.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-large" to="/create">
              Create your free page <ArrowUpRight size={19} />
            </Link>
            <a className="text-link" href="#how-it-works">
              See how it works <ArrowRight size={16} />
            </a>
          </div>
          <div className="hero-perks">
            <span>
              <Check size={14} />
              No sign-up needed
            </span>
            <span>
              <Check size={14} />
              Make it yours
            </span>
            <span>
              <Check size={14} />
              Ready in minutes
            </span>
          </div>
          <div className="hero-local-note">
            <span className="status-dot" /> Your own page, published for NFC
            cards and QR sharing.
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-grid" />
          <div className="hero-orbit" />
          <span className="decor-plus plus-one">
            <Plus size={18} />
          </span>
          <span className="decor-plus plus-two">
            <Plus size={15} />
          </span>
          <div className="floating-label label-design">
            <span>
              <Paintbrush size={17} />
            </span>
            <div>
              Your style.<strong>Your first impression.</strong>
            </div>
            <Sparkles size={15} className="floating-spark" />
          </div>
          <div className="hero-phone-position">
            <ProfileCard document={sample} phone hero />
          </div>
          <div className="floating-label label-qr">
            <div className="mini-qr">
              <DecorativeQR />
            </div>
            <div>
              <strong>
                Good connections
                <br />
                start with a scan.
              </strong>
              <span>Try it. Make your own.</span>
            </div>
            <ScanLine size={17} />
          </div>
          <div className="floating-cursor">
            <MousePointer2 size={21} fill="currentColor" />
            <span>Made for you</span>
          </div>
          <div className="hero-caption">
            <span /> Your next introduction, reimagined.
          </div>
        </div>
      </section>
      <div className="intro-strip">
        <div className="section-container">
          <span>ONE LINK. A WORLD OF YOU.</span>
          <p>
            For the <strong>makers</strong>, the <strong>doers</strong>, and the{" "}
            <strong>nice-to-meet-you’s.</strong>
          </p>
          <span className="strip-spark">✳</span>
        </div>
      </div>
      <section className="products-section section-container" id="products">
        <div className="section-heading">
          <div>
            <div className="eyebrow">A LITTLE PAGE FOR EVERY BIG IDEA</div>
            <h2>What will you put out there?</h2>
          </div>
          <Link to="/create" className="text-link">
            Explore all products <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="landing-products">
          {products.map((product) => (
            <Link
              to={`/create?type=${product.id}`}
              className={`landing-product product-${product.color}`}
              key={product.id}
            >
              <div className="product-topline">
                <ProductIcon product={product} />
                <ArrowUpRight size={19} />
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <span className="product-bottom">
                Make it yours <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="section-container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">FROM HELLO TO HERE YOU GO</div>
              <h2>A few minutes. All you.</h2>
            </div>
            <p>
              No code. No complicated setup.
              <br />
              Just a little creativity and you’re off.
            </p>
          </div>
          <div className="how-steps">
            {[
              [
                "01",
                MousePointer2,
                "Pick your starting point",
                "A business card, a menu, or a home for your links. There’s a page for that.",
              ],
              [
                "02",
                Paintbrush,
                "Give it your personality",
                "Add your details, choose a theme, and watch your page come to life.",
              ],
              [
                "03",
                Share2,
                "Make your introduction",
                "Generate your demo, save your QR, and keep your next hello close at hand.",
              ],
            ].map(([number, Icon, title, text]) => (
              <div className="how-step" key={number}>
                <div className="step-art">
                  <span>{number}</span>
                  <Icon size={29} strokeWidth={1.4} />
                  <div className="step-line" />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="cta-section section-container">
        <div className="cta-box">
          <div>
            <span className="eyebrow">GOOD THINGS START WITH A HELLO</span>
            <h2>
              Your next connection
              <br />
              is a little page away.
            </h2>
            <Link to="/create" className="btn btn-white">
              Let’s make your page <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="cta-art" aria-hidden="true">
            <div className="cta-card">
              <span>
                hello<span>there.</span>
              </span>
              <MoveUpRight size={61} strokeWidth={1.4} />
              <div>ONE LINK. ENDLESS POSSIBILITIES.</div>
            </div>
            <span className="cta-star">✳</span>
          </div>
        </div>
      </section>
    </>
  );
}
