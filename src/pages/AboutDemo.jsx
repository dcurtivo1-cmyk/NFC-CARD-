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
        <div className="eyebrow">YOUR PAGE. YOUR NEXT CONNECTION.</div>
        <h1>A little transparency.</h1>
        <p>
          Create your page, publish it, and share its permanent URL with an NFC
          card or QR code.
        </p>
      </div>
      <div className="about-grid">
        <article>
          <HardDrive size={27} />
          <h2>What works right now</h2>
          <p>
            Create all six page types, customize your design, upload and crop
            images, save and load drafts, publish profiles, and edit them later.
            Contact links, map destinations, QR downloads, and vCard exports
            work.
          </p>
          <p>
            Drafts and editor recovery stay in this browser. Generating a page
            uploads its details, design, and photos to the publishing server.
            Only publish information you want anyone with the URL to see.
          </p>
        </article>
        <article>
          <Globe size={27} />
          <h2>What a shared URL means</h2>
          <p>
            Every QR code contains your published profile URL. Visitors open the
            page from the server without an account or your browser's saved
            data. Use that same URL when writing an NFC card.
          </p>
          <p>
            Published edits keep the same URL, so printed QR codes and NFC cards
            keep working. Deleting a published page removes it from the server
            and stops its link from opening.
          </p>
        </article>
        <article>
          <ShieldCheck size={27} />
          <h2>Keep your editing access</h2>
          <p>
            This browser holds the private key that lets you update or delete
            your published pages. Visitors never receive that key. Return to My
            workspace in this browser to make changes.
          </p>
          <p>
            Clearing site data removes drafts and editing keys. Published pages
            remain online, but cannot be edited without their key. There is
            currently no account-based recovery or workspace sync.
          </p>
        </article>
      </div>
      <div className="about-bottom">
        <h2>A few practical details</h2>
        <p>
          Pages can contain up to 1.5 MB of details and photos. Browser storage
          also has a limited quota; images are resized to help keep it small.
          The built-in sample is illustrative, and its external links are
          examples. All uploaded photos are cropped locally. The NFC option
          creates a destination page and QR code; writing to physical NFC tags
          requires a separate NFC-writing app or device.
        </p>
        <Link to="/create" className="btn btn-primary">
          Make your little page <ArrowUpRight size={17} />
        </Link>
      </div>
    </div>
  );
}
