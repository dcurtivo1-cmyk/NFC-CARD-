import {
  ArrowUpRight,
  Mail,
  Phone,
  MapPin,
  Globe,
  Download,
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  Music2,
  MessageCircle,
  Star,
  Link as LinkIcon,
  Sparkles,
  Wifi,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import { downloadVCard, phoneUrl, safeUrl } from "../lib/profile";
import { products } from "../data/presets";
import { useFeedback } from "./UI";
import { designDefaults, fontOptions } from "../data/design";

const socialIcons = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2,
  whatsapp: MessageCircle,
};

export default function ProfileCard({
  document,
  phone = false,
  hero = false,
  publicView = false,
}) {
  const { details: d, design, type } = document;
  const { headerLayout, buttonLayout, backgroundStyle, iconStyle } = {
    ...designDefaults,
    ...design,
  };
  const feedback = useFeedback();
  const product = products.find((p) => p.id === type) || products[0];
  const name =
    d.displayName ||
    d.fullName ||
    (type === "card" ? "Your name here" : "Your page name");
  const external = { target: "_blank", rel: "noopener noreferrer" };
  const saveContact = () => {
    if (!d.fullName.trim()) {
      feedback?.notify("Add your name before exporting a contact.", "info");
      return;
    }
    downloadVCard(d);
    feedback?.notify(
      "Contact downloaded. Open the .vcf file to add it to your contacts.",
    );
  };
  const socials = Object.keys(socialIcons).filter(
    (key) =>
      d[key] && (key === "whatsapp" ? phoneUrl(d[key], true) : safeUrl(d[key])),
  );
  return (
    <div
      className={`${phone ? "phone-frame" : ""} ${hero ? "hero-phone" : ""}`}
    >
      {phone && (
        <div className="phone-status">
          <span>9:41</span>
          <span className="phone-island" />
          <span>
            <Wifi size={12} />
            <span className="battery" />
          </span>
        </div>
      )}
      <article
        className={`profile-card ${phone ? "in-phone" : ""} button-${design.buttonStyle} header-${headerLayout} links-${buttonLayout} background-${backgroundStyle} icon-${iconStyle} ${d.coverPhoto ? "with-cover-photo" : ""}`}
        style={{
          "--profile-primary": design.primary,
          "--profile-bg": design.background,
          "--profile-text": design.text,
          "--profile-radius": `${design.radius}px`,
          "--profile-cover-start": design.coverStart || design.primary,
          "--profile-cover-end": design.coverEnd || design.background,
          fontFamily: fontOptions.find((font) => font.id === design.font)
            ?.family,
        }}
      >
        <div className="profile-cover" style={{ background: design.cover }}>
          {d.coverPhoto ? (
            <img
              className="profile-cover-photo"
              src={d.coverPhoto}
              alt={`${d.fullName || name} cover photo`}
            />
          ) : (
            <>
              <div className="cover-orbit orbit-one" />
              <div className="cover-orbit orbit-two" />
            </>
          )}
          {d.logo && (
            <img
              src={d.logo}
              alt={`${d.businessName || name} logo`}
              className="profile-logo"
            />
          )}
          {hero && (
            <span className="cover-brand">
              STUDIO SUNDAY <span>®</span>
            </span>
          )}
        </div>
        <div className="profile-content">
          <div className="profile-identity">
            <div className="avatar-wrap">
              {d.profilePhoto ? (
                <img
                  className="profile-avatar"
                  src={d.profilePhoto}
                  alt={d.fullName || "Profile photo"}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              <span className="avatar-fallback" aria-hidden="true">
                {name
                  .split(" ")
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <span className="avatar-badge" aria-hidden="true">
                <Sparkles size={12} />
              </span>
            </div>
            <div className="profile-identity-copy">
              <h2 className="profile-name">{name}</h2>
              {(d.position ||
                (type === "card" && (d.businessName || !publicView))) && (
                <p className="profile-position">
                  {d.position ||
                    (!publicView && !d.businessName ? "What you do" : "")}
                  {d.businessName && type === "card" && (
                    <>
                      {d.position && (
                        <>
                          {" "}
                          <span>at</span>{" "}
                        </>
                      )}
                      {d.businessName}
                    </>
                  )}
                </p>
              )}
              {d.headline && type !== "card" && (
                <h3 className="profile-headline">{d.headline}</h3>
              )}
            </div>
          </div>
          {(d.bio || !publicView) && (
            <p className="profile-bio">
              {d.bio ||
                "A little introduction goes a long way. Tell people what makes you, you."}
            </p>
          )}
          {d.showcaseImage && (
            <figure className="profile-showcase">
              <img
                src={d.showcaseImage}
                alt={d.showcaseCaption || `${d.businessName || name} showcase`}
              />
              {d.showcaseCaption && (
                <figcaption>{d.showcaseCaption}</figcaption>
              )}
            </figure>
          )}
          {socials.length > 0 && (
            <div className="profile-socials">
              {socials.map((key) => {
                const Icon = socialIcons[key];
                return (
                  <a
                    key={key}
                    href={
                      key === "whatsapp"
                        ? phoneUrl(d[key], true)
                        : safeUrl(d[key])
                    }
                    {...external}
                    aria-label={
                      key === "linkedin"
                        ? "LinkedIn"
                        : key.charAt(0).toUpperCase() + key.slice(1)
                    }
                  >
                    <Icon size={17} />
                  </a>
                );
              })}
            </div>
          )}
          {type === "card" ? (
            <button
              className="profile-button profile-main-button"
              onClick={saveContact}
            >
              <Download size={16} />
              Save contact
              <ArrowUpRight size={15} />
            </button>
          ) : (
            safeUrl(d.actionUrl) && (
              <a
                className="profile-button profile-main-button"
                href={safeUrl(d.actionUrl)}
                {...external}
              >
                {type === "review" ? (
                  <Star size={16} />
                ) : (
                  <LinkIcon size={16} />
                )}
                {product.action}
                <ArrowUpRight size={15} />
              </a>
            )
          )}
          {type === "menu" && d.menuItems.length > 0 && (
            <div className="profile-menu">
              {d.menuItems.map((item) => (
                <div className="profile-menu-item" key={item.id}>
                  <span className="menu-category">{item.category}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <b>{item.price}</b>
                  </div>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          )}
          <div className="profile-links">
            {d.customLinks.map(
              (link) =>
                safeUrl(link.url) && (
                  <a
                    className="profile-button profile-link"
                    key={link.id}
                    href={safeUrl(link.url)}
                    {...external}
                  >
                    <span>{link.label || "Your link"}</span>
                    <ArrowUpRight size={15} />
                  </a>
                ),
            )}
          </div>
          <div className="profile-contact">
            {d.email && (
              <a href={`mailto:${encodeURIComponent(d.email)}`}>
                <Mail size={15} />
                <span>{d.email}</span>
                <ArrowUpRight size={13} />
              </a>
            )}
            {phoneUrl(d.phone) && (
              <a href={phoneUrl(d.phone)}>
                <Phone size={15} />
                <span>{d.phone}</span>
                <ArrowUpRight size={13} />
              </a>
            )}
            {safeUrl(d.website) && (
              <a href={safeUrl(d.website)} {...external}>
                <Globe size={15} />
                <span>
                  {d.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </span>
                <ArrowUpRight size={13} />
              </a>
            )}
            {d.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.address)}`}
                {...external}
              >
                <MapPin size={15} />
                <span>{d.address}</span>
                <ArrowUpRight size={13} />
              </a>
            )}
          </div>
          <div className="profile-powered">
            Made with{" "}
            <Link to="/">
              folio<span>.</span>
            </Link>
            {publicView && (
              <span className="profile-demo-label">Local demo</span>
            )}
          </div>
        </div>
      </article>
      {phone && (
        <div className="phone-bottom">
          <span />
        </div>
      )}
    </div>
  );
}

export function DecorativeQR() {
  return (
    <QRCodeSVG
      value={
        typeof window === "undefined"
          ? "https://example.com"
          : `${window.location.origin}/create`
      }
      size={61}
      level="M"
      marginSize={0}
      fgColor="#2e263f"
    />
  );
}
