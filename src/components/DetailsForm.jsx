import {
  Plus,
  Trash2,
  UserRound,
  Building2,
  ContactRound,
  AtSign,
  Link as LinkIcon,
  UtensilsCrossed,
  ChevronDown,
  ExternalLink,
  Images,
} from "lucide-react";
import { Field } from "./UI";
import ImageUpload from "./ImageUpload";
import { socialFields } from "../data/presets";

export function FormSection({
  title,
  description,
  icon: Icon,
  children,
  open = true,
  badge,
}) {
  return (
    <details className="form-section" open={open}>
      <summary>
        <span className="form-section-icon">
          <Icon size={19} />
        </span>
        <span>
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
        {badge && <span className="optional-badge">{badge}</span>}
        <ChevronDown size={17} className="section-chevron" />
      </summary>
      <div className="form-section-body">{children}</div>
    </details>
  );
}

export default function DetailsForm({ document, onChange, errors }) {
  const d = document.details,
    type = document.type;
  const field = (name, label, props = {}) => (
    <Field
      key={name}
      name={name}
      label={label}
      value={d[name]}
      onChange={onChange}
      error={errors[name]}
      {...props}
    />
  );
  const changeLink = (id, field, value) =>
    onChange(
      "customLinks",
      d.customLinks.map((link) =>
        link.id === id ? { ...link, [field]: value } : link,
      ),
    );
  const changeMenu = (id, field, value) =>
    onChange(
      "menuItems",
      d.menuItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  return (
    <div className="details-form">
      <FormSection
        title={type === "card" ? "The essentials" : "Your page details"}
        description="A proper introduction starts here."
        icon={UserRound}
      >
        <div className="form-grid">
          {field(
            "fullName",
            type === "card" ? "Full name" : "Page / business name",
            {
              placeholder:
                type === "card" ? "e.g. Alex Morgan" : "e.g. Sunday Studio",
              required: true,
              maxLength: 80,
              autoComplete: "name",
            },
          )}
          {field("displayName", "Display name", {
            placeholder: "How you’d like to be known",
            maxLength: 80,
            hint: "Optional. Uses your full name if left blank.",
          })}
          {field("position", type === "card" ? "Position / title" : "Tagline", {
            placeholder:
              type === "card"
                ? "e.g. Brand Designer"
                : "A little introduction to what you do",
            maxLength: 100,
          })}
          {field("businessName", "Business name", {
            placeholder: "e.g. Studio Sunday",
            maxLength: 100,
            autoComplete: "organization",
          })}
        </div>
        {type !== "card" &&
          field("headline", "Page headline", {
            placeholder: "Give your page a memorable headline",
            maxLength: 150,
          })}
        {field("bio", "A little about you", {
          textarea: true,
          rows: 3,
          placeholder: "What do you do? What do you love? Tell your story.",
          maxLength: 500,
          hint: `${d.bio.length}/500 characters`,
        })}
      </FormSection>
      <FormSection
        title="Your brand, at a glance"
        description="Put a face and a feeling to your name."
        icon={Building2}
        badge="OPTIONAL"
      >
        <ImageUpload
          label="Profile photo"
          name="profilePhoto"
          value={d.profilePhoto}
          onChange={onChange}
        />
        <ImageUpload
          label="Business logo"
          name="logo"
          value={d.logo}
          onChange={onChange}
        />
        <ImageUpload
          label="Cover photo"
          name="coverPhoto"
          value={d.coverPhoto}
          onChange={onChange}
          aspectRatio={3}
          outputWidth={1200}
        />
      </FormSection>
      <FormSection
        title="Showcase"
        description="Feature your work, a product, or a photo of your business."
        icon={Images}
        badge="OPTIONAL"
      >
        <ImageUpload
          label="Showcase image"
          name="showcaseImage"
          value={d.showcaseImage}
          onChange={onChange}
          aspectRatio={16 / 9}
          outputWidth={1024}
        />
        {field("showcaseCaption", "Showcase caption", {
          placeholder: "e.g. Our latest work, made with care",
          maxLength: 160,
          hint: "Optional. Appears below your image and describes it for screen readers.",
        })}
      </FormSection>
      {["review", "brochure", "nfc"].includes(type) && (
        <FormSection
          title={
            type === "review"
              ? "Your Google review link"
              : "Your main destination"
          }
          description={
            type === "review"
              ? "Send customers straight to your review form."
              : "Where should your main button take visitors?"
          }
          icon={ExternalLink}
        >
          {field(
            "actionUrl",
            type === "review"
              ? "Google review URL"
              : type === "brochure"
                ? "Brochure / services URL"
                : "Main button URL",
            {
              placeholder:
                type === "review"
                  ? "https://search.google.com/local/writereview?placeid=…"
                  : "https://example.com/services",
              required: type !== "nfc",
              inputMode: "url",
              hint:
                type === "review"
                  ? "Copy your own “Ask for reviews” link from your Google Business Profile."
                  : "Link to your hosted PDF, service page, booking page, or website.",
            },
          )}
        </FormSection>
      )}
      {type === "menu" && (
        <FormSection
          title="On the menu"
          description="Add your dishes, drinks, and everyday favorites."
          icon={UtensilsCrossed}
        >
          {d.menuItems.length === 0 && (
            <p className="inline-empty">
              A little empty plate. Add your first menu item below.
            </p>
          )}
          {d.menuItems.map((item, i) => (
            <div className="repeater-card" key={item.id}>
              <div className="repeater-heading">
                <span>Menu item {i + 1}</span>
                <button
                  className="icon-button"
                  aria-label={`Remove menu item ${i + 1}`}
                  onClick={() =>
                    onChange(
                      "menuItems",
                      d.menuItems.filter((x) => x.id !== item.id),
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="form-grid">
                <Field
                  label="Item name"
                  name={`menu-name-${i}`}
                  value={item.name}
                  onChange={(_, v) => changeMenu(item.id, "name", v)}
                  error={errors[`menu-name-${i}`]}
                  placeholder="e.g. Sunday iced latte"
                  maxLength={80}
                />
                <Field
                  label="Price"
                  name={`menu-price-${i}`}
                  value={item.price}
                  onChange={(_, v) => changeMenu(item.id, "price", v)}
                  error={errors[`menu-price-${i}`]}
                  placeholder="e.g. ₱180"
                  maxLength={30}
                />
              </div>
              <Field
                label="Description"
                name={`menu-description-${i}`}
                value={item.description}
                onChange={(_, v) => changeMenu(item.id, "description", v)}
                placeholder="What makes it delicious?"
                maxLength={200}
              />
              <Field
                label="Category"
                name={`menu-category-${i}`}
                value={item.category}
                onChange={(_, v) => changeMenu(item.id, "category", v)}
                placeholder="e.g. Coffee"
                maxLength={50}
              />
            </div>
          ))}
          <button
            className="btn btn-dashed"
            disabled={d.menuItems.length >= 100}
            onClick={() =>
              onChange("menuItems", [
                ...d.menuItems,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  price: "",
                  description: "",
                  category: "",
                },
              ])
            }
          >
            <Plus size={16} />
            Add a menu item
          </button>
          {field("actionUrl", "Full menu / order link", {
            placeholder: "https://example.com/menu",
            hint: "Optional. Add a link to a full menu or ordering service.",
          })}
        </FormSection>
      )}
      <FormSection
        title="Let’s stay in touch"
        description="Make it easy for the right people to find you."
        icon={ContactRound}
        badge="OPTIONAL"
      >
        <div className="form-grid">
          {field("email", "Email address", {
            placeholder: "hello@example.com",
            type: "email",
            autoComplete: "email",
          })}
          {field("phone", "Phone number", {
            placeholder: "+63 917 123 4567",
            type: "tel",
            autoComplete: "tel",
          })}
        </div>
        {field("website", "Website", {
          placeholder: "https://your-website.com",
          inputMode: "url",
        })}
        {field("address", "Address / location", {
          placeholder: "City, region, or your business address",
          maxLength: 200,
          autoComplete: "street-address",
          hint: "Only share an address you want visitors to see.",
        })}
      </FormSection>
      <FormSection
        title="Your social side"
        description="All your places, brought together."
        icon={AtSign}
        open={false}
        badge="OPTIONAL"
      >
        <div className="form-grid">
          {socialFields.map(([name, label, placeholder]) =>
            field(name, label, {
              placeholder,
              inputMode: name === "whatsapp" ? "tel" : "url",
            }),
          )}
        </div>
      </FormSection>
      <FormSection
        title="A few more good links"
        description="Your portfolio, booking page, or something you love."
        icon={LinkIcon}
        badge="OPTIONAL"
      >
        {d.customLinks.length === 0 && (
          <p className="inline-empty">
            Have something else to share? Give it a button.
          </p>
        )}
        {d.customLinks.map((link, i) => (
          <div className="repeater-card" key={link.id}>
            <div className="repeater-heading">
              <span>Custom link {i + 1}</span>
              <button
                className="icon-button"
                aria-label={`Remove custom link ${i + 1}`}
                onClick={() =>
                  onChange(
                    "customLinks",
                    d.customLinks.filter((l) => l.id !== link.id),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
            <Field
              name={`link-label-${i}`}
              label="Button label"
              value={link.label}
              onChange={(_, v) => changeLink(link.id, "label", v)}
              placeholder="e.g. Explore my portfolio"
              error={errors[`link-label-${i}`]}
              maxLength={70}
            />
            <Field
              name={`link-url-${i}`}
              label="Link URL"
              value={link.url}
              onChange={(_, v) => changeLink(link.id, "url", v)}
              placeholder="https://example.com"
              error={errors[`link-url-${i}`]}
              inputMode="url"
            />
          </div>
        ))}
        <button
          className="btn btn-dashed"
          disabled={d.customLinks.length >= 30}
          onClick={() =>
            onChange("customLinks", [
              ...d.customLinks,
              { id: crypto.randomUUID(), label: "", url: "" },
            ])
          }
        >
          <Plus size={16} />
          Add a custom link
        </button>
      </FormSection>
    </div>
  );
}
