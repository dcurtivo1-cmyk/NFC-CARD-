import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  HardDrive,
  Globe,
  ShieldCheck,
} from "lucide-react";
export default function AboutDemo() {
  return (
    <div className="about-page section-container">
      <Link to="/" className="back-link">
        <ArrowLeft size={15} />
        Back to home
      </Link>
      <div className="page-heading">
        <div className="eyebrow">A REAL PROTOTYPE. CLEAR EXPECTATIONS.</div>
        <h1>A little transparency.</h1>
        <p>
          Folio Studio is a working, local-first demo of a digital page
          generator.
        </p>
      </div>
      <div className="about-grid">
        <article>
          <HardDrive size={27} />
          <h2>What works right now</h2>
          <p>
            Create all six page types, customize your design, upload and crop
            images, save and load drafts, generate local profiles, and edit them
            later. Contact links, map destinations, QR downloads, and vCard
            exports work.
          </p>
          <p>
            Your drafts, generated profiles, images, and editor recovery copy
            are stored in localStorage on this origin. There is no account or
            backend. Nothing is uploaded to a profile server.
          </p>
        </article>
        <article>
          <Globe size={27} />
          <h2>What a shared URL means</h2>
          <p>
            Every QR code contains the actual generated profile URL. That route
            reads its data from this browser. Another device, browser, private
            window, port, or domain will not have that saved data.
          </p>
          <p>
            Deploying the static site makes the app accessible, but does not
            publish local profiles. Public sharing requires a persistent
            database and media storage that the profile route can read by ID.
          </p>
        </article>
        <article>
          <ShieldCheck size={27} />
          <h2>A path to production</h2>
          <p>
            Replace the local storage adapter with authenticated APIs for
            creation, updates, and deletion, a persistent database for profiles,
            and object storage for images. Public profile routes should fetch
            published data by ID.
          </p>
          <p>
            Add ownership checks, server-side validation, abuse controls, upload
            scanning, and a recovery policy before launching. Keep draft data
            private and expose only intended public fields.
          </p>
        </article>
      </div>
      <div className="about-bottom">
        <h2>A few practical details</h2>
        <p>
          Clearing site data removes saved pages. Browser storage has a limited
          quota; images are resized to help keep it small. The built-in sample
          is illustrative, and its external links are examples. All uploaded
          photos are cropped locally. The NFC option creates a destination page
          and QR code; writing to physical NFC tags requires a separate
          NFC-writing app or device.
        </p>
        <Link to="/create" className="btn btn-primary">
          Make your little page <ArrowUpRight size={17} />
        </Link>
      </div>
    </div>
  );
}
