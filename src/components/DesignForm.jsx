import {
  Check,
  Palette,
  Type,
  Square,
  MousePointer2,
  LayoutTemplate,
  PanelTop,
  Rows3,
  Wallpaper,
  Shapes,
  Instagram,
  Move,
  UserRound,
} from "lucide-react";
import { themes } from "../data/presets";
import {
  applyPalette,
  backgroundStyles,
  buttonLayouts,
  buttonStyles,
  colorKeys,
  colorPalettes,
  coverGradient,
  fontOptions,
  headerLayouts,
  iconStyles,
  photoStyles,
} from "../data/design";
import { FormSection } from "./DetailsForm";

function ChoiceGrid({ label, options, value, onChange, kind }) {
  return (
    <fieldset className={`design-choices choice-${kind}`}>
      <legend className="sr-only">{label}</legend>
      <div className="design-choice-grid">
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            className={`design-choice ${value === option.id ? "selected" : ""}`}
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
          >
            <span
              className={`choice-illustration illustration-${kind} option-${option.id}`}
              aria-hidden="true"
            >
              {kind === "icons" ? (
                <Instagram size={21} />
              ) : (
                <>
                  <i />
                  <b />
                  <em />
                  <span />
                </>
              )}
            </span>
            <strong>{option.name}</strong>
            {option.description && <small>{option.description}</small>}
            {value === option.id && (
              <span className="design-choice-check" aria-hidden="true">
                <Check size={11} />
              </span>
            )}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function DesignForm({
  design,
  onChange,
  hasCoverPhoto = false,
  businessCard = false,
  portraitSrc = "",
}) {
  const portraitMode = businessCard && design.photoStyle !== "circle";
  const update = (patch) => {
    const next = { ...design, ...patch };
    if ("coverStart" in patch || "coverEnd" in patch)
      next.cover = coverGradient(next);
    onChange(next);
  };
  return (
    <div
      className={`design-form ${portraitMode ? "portrait-design" : ""}`}
      style={{
        "--design-accent": design.primary,
        "--design-background": design.background,
      }}
    >
      {businessCard && (
        <FormSection
          title="Profile photo style"
          description="Choose a round photo or an unframed portrait. You can switch anytime without replacing the image."
          icon={UserRound}
        >
          <fieldset className="design-choices">
            <legend className="sr-only">Profile photo style</legend>
            <div className="photo-style-options">
              {photoStyles.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`design-choice ${(design.photoStyle ?? "portrait") === option.id ? "selected" : ""}`}
                  aria-pressed={(design.photoStyle ?? "portrait") === option.id}
                  onClick={() => update({ photoStyle: option.id })}
                >
                  <span
                    className={`photo-style-sample photo-style-${option.id}`}
                    aria-hidden="true"
                  >
                    {portraitSrc ? (
                      <img src={portraitSrc} alt="" />
                    ) : (
                      <UserRound size={32} />
                    )}
                  </span>
                  <strong>{option.name}</strong>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </fieldset>
        </FormSection>
      )}
      <FormSection
        title="Choose your template"
        description="Start with a complete look, then customize every detail."
        icon={LayoutTemplate}
      >
        <fieldset>
          <legend className="sr-only">Template</legend>
          <div className="theme-grid">
            {themes.map((theme) => (
              <button
                type="button"
                className={`theme-option ${design.id === theme.id ? "selected" : ""}`}
                key={theme.id}
                onClick={() =>
                  onChange({
                    ...theme,
                    photoStyle: design.photoStyle ?? "portrait",
                    portraitSize: design.portraitSize,
                    portraitX: design.portraitX,
                    portraitY: design.portraitY,
                  })
                }
                aria-pressed={design.id === theme.id}
              >
                <div
                  className={`theme-art template-${theme.headerLayout} template-buttons-${theme.buttonLayout}`}
                  style={{ background: theme.background }}
                >
                  <div
                    className="theme-cover"
                    style={{ background: theme.cover }}
                  />
                  {portraitMode ? (
                    portraitSrc && (
                      <img
                        className="theme-portrait"
                        src={portraitSrc}
                        alt=""
                      />
                    )
                  ) : (
                    <span
                      className="theme-avatar"
                      style={{ background: theme.primary }}
                    />
                  )}
                  <i style={{ background: theme.text }} />
                  <i style={{ background: theme.text }} />
                  <b
                    style={{
                      background: theme.primary,
                      borderRadius: theme.radius / 2,
                    }}
                  />
                  {design.id === theme.id && (
                    <span className="theme-check">
                      <Check size={13} />
                    </span>
                  )}
                </div>
                <span>{theme.name}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </FormSection>
      {portraitMode && (
        <FormSection
          title="Portrait placement"
          description="Place the complete portrait in front of your banner. Upload a transparent PNG or WebP in Your details."
          icon={Move}
        >
          {[
            ["portraitSize", "Portrait size", 50, 140],
            ["portraitX", "Portrait horizontal position", -35, 35],
            ["portraitY", "Portrait vertical position", -30, 30],
          ].map(([key, label, min, max]) => (
            <label className="range-field" key={key}>
              <span>
                {label}
                <output>
                  {design[key] ?? (key === "portraitSize" ? 100 : 0)}%
                </output>
              </span>
              <input
                type="range"
                aria-label={label}
                min={min}
                max={max}
                step="1"
                value={design[key] ?? (key === "portraitSize" ? 100 : 0)}
                onChange={(event) =>
                  update({ [key]: Number(event.target.value) })
                }
              />
            </label>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() =>
              update({ portraitSize: 100, portraitX: 0, portraitY: 0 })
            }
          >
            Reset portrait position
          </button>
          <p className="field-hint">
            Size keeps the image proportions. Moving or enlarging it can place
            part of the image outside the banner. Positive vertical values move
            it up. The information section stays white.
          </p>
        </FormSection>
      )}
      <FormSection
        title="Color palette"
        description="Pair any template with colors that feel like you."
        icon={Palette}
      >
        <fieldset className="palette-options">
          <legend className="sr-only">Color palette presets</legend>
          {colorPalettes.map((palette) => {
            const selected = colorKeys.every(
              (key) => design[key].toLowerCase() === palette[key].toLowerCase(),
            );
            return (
              <button
                type="button"
                key={palette.id}
                className={`palette-option ${selected ? "selected" : ""}`}
                aria-pressed={selected}
                onClick={() => onChange(applyPalette(design, palette))}
              >
                <span className="palette-swatches" aria-hidden="true">
                  {[
                    palette.primary,
                    palette.background,
                    palette.coverStart,
                    palette.coverEnd,
                  ].map((color, i) => (
                    <i key={i} style={{ background: color }} />
                  ))}
                </span>
                <span>{palette.name}</span>
              </button>
            );
          })}
        </fieldset>
        {hasCoverPhoto && (
          <p className="field-hint">
            Your cover photo appears over the header colors. Remove it in Your
            details to show the gradient again.
          </p>
        )}
        <p className="design-custom-label">Or fine-tune your own colors</p>
        <div className="color-fields">
          {[
            ["primary", "Primary color"],
            ["background", "Background"],
            ["text", "Text color"],
            ["coverStart", "Header start color"],
            ["coverEnd", "Header end color"],
          ].map(([key, label]) => (
            <label className="color-field" key={key} htmlFor={`color-${key}`}>
              <span>{label}</span>
              <div>
                <input
                  id={`color-${key}`}
                  aria-label={label}
                  type="color"
                  value={design[key]}
                  onChange={(e) => update({ [key]: e.target.value })}
                />
                <span>{design[key].toUpperCase()}</span>
              </div>
            </label>
          ))}
        </div>
      </FormSection>
      <FormSection
        title="Header layout"
        description="Choose how your photo, cover, and introduction come together."
        icon={PanelTop}
      >
        <ChoiceGrid
          label="Header layout"
          kind="header"
          options={
            portraitMode
              ? headerLayouts.map((layout) => ({
                  ...layout,
                  name: layout.id === "split" ? "Left aligned" : layout.name,
                  description:
                    layout.id === "centered"
                      ? "A portrait banner with centered details below."
                      : "A portrait banner with details below.",
                }))
              : headerLayouts
          }
          value={design.headerLayout}
          onChange={(headerLayout) => update({ headerLayout })}
        />
      </FormSection>
      <FormSection
        title="Button layout"
        description="Arrange your custom links. The main action stays easy to find."
        icon={Rows3}
      >
        <ChoiceGrid
          label="Button layout"
          kind="layout"
          options={buttonLayouts}
          value={design.buttonLayout}
          onChange={(buttonLayout) => update({ buttonLayout })}
        />
      </FormSection>
      <FormSection
        title="Background style"
        description="A clean color, a gentle gradient, or a subtle pattern."
        icon={Wallpaper}
      >
        <ChoiceGrid
          label="Background style"
          kind="background"
          options={backgroundStyles}
          value={design.backgroundStyle}
          onChange={(backgroundStyle) => update({ backgroundStyle })}
        />
      </FormSection>
      <FormSection
        title="Fonts & corners"
        description="Set the tone with typography and softer or sharper edges."
        icon={Type}
      >
        <label className="field">
          <span className="field-label">Font family</span>
          <select
            className="input"
            value={design.font}
            onChange={(e) => update({ font: e.target.value })}
          >
            {fontOptions.map((font) => (
              <option key={font.id} value={font.id}>
                {font.name}
              </option>
            ))}
          </select>
        </label>
        <p
          className="font-specimen"
          style={{
            fontFamily: fontOptions.find((font) => font.id === design.font)
              ?.family,
          }}
        >
          A little page. Entirely you.<span>Aa Bb Cc · 0123456789</span>
        </p>
        <label className="range-field">
          <span>
            <Square size={15} />
            Corner radius <strong>{design.radius}px</strong>
          </span>
          <input
            type="range"
            min="0"
            max="28"
            value={design.radius}
            onChange={(e) => update({ radius: Number(e.target.value) })}
          />
        </label>
      </FormSection>
      <FormSection
        title="Button style"
        description="Decide how each action stands out."
        icon={MousePointer2}
      >
        <fieldset>
          <legend className="sr-only">Button style</legend>
          <div className="button-style-options expanded-button-styles">
            {buttonStyles.map((style) => (
              <button
                type="button"
                key={style.id}
                className={`button-style-choice ${style.id} ${design.buttonStyle === style.id ? "selected" : ""}`}
                aria-pressed={design.buttonStyle === style.id}
                onClick={() => update({ buttonStyle: style.id })}
                style={{ "--choice-color": design.primary }}
              >
                <span aria-hidden="true">
                  <i />
                </span>
                <strong>{style.name}</strong>
                {design.buttonStyle === style.id && <Check size={13} />}
              </button>
            ))}
          </div>
        </fieldset>
      </FormSection>
      <FormSection
        title="Icon style"
        description="Give social and contact icons a finishing touch."
        icon={Shapes}
      >
        <ChoiceGrid
          label="Icon style"
          kind="icons"
          options={iconStyles}
          value={design.iconStyle}
          onChange={(iconStyle) => update({ iconStyle })}
        />
      </FormSection>
      <div className="editor-tip">
        <span>✳</span>
        <p>
          <strong>A little design tip</strong>Mix templates, palettes, and
          layouts freely. Keep a good contrast between your background and text
          so your page stays easy to read.
        </p>
      </div>
    </div>
  );
}
