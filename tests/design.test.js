import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyPalette,
  backgroundStyles,
  buttonLayouts,
  buttonStyles,
  colorKeys,
  colorPalettes,
  designDefaults,
  fontOptions,
  headerLayouts,
  iconStyles,
  photoStyles,
} from "../src/data/design.js";
import { createDocument, themes } from "../src/data/presets.js";
import { normalizeDesign } from "../src/lib/design.js";
import { normalizeDocument } from "../src/lib/storage.js";

test("all 20 compositions survive saving and independent palette changes", () => {
  assert.equal(themes.length, 20);
  assert.equal(new Set(themes.map((theme) => theme.templateStyle)).size, 20);
  for (const theme of themes) {
    const document = createDocument("card", true);
    document.design = applyPalette(theme, colorPalettes[6]);
    const saved = normalizeDocument(JSON.parse(JSON.stringify(document)));
    assert.equal(saved.design.templateStyle, theme.templateStyle);
    assert.equal(saved.design.headerLayout, theme.headerLayout);
    assert.equal(saved.design.buttonLayout, theme.buttonLayout);
    assert.deepEqual(saved.details, document.details);
  }
  assert.equal(
    normalizeDesign({ templateStyle: "unsafe unknown" }).templateStyle,
    "standard",
  );
});

test("all design options survive the storage normalization boundary", () => {
  const options = {
    headerLayout: headerLayouts,
    buttonLayout: buttonLayouts,
    backgroundStyle: backgroundStyles,
    iconStyle: iconStyles,
    font: fontOptions,
    buttonStyle: buttonStyles,
    photoStyle: photoStyles,
  };
  const portrait = createDocument("card", true);
  Object.assign(portrait.design, {
    portraitSize: 120,
    portraitX: -12,
    portraitY: 9,
  });
  const restored = normalizeDocument(portrait).design;
  assert.equal(restored.portraitSize, 120);
  assert.equal(restored.portraitX, -12);
  assert.equal(restored.portraitY, 9);
  const constrained = normalizeDesign({
    portraitSize: 900,
    portraitX: -999,
    portraitY: NaN,
  });
  assert.equal(constrained.portraitSize, 140);
  assert.equal(constrained.portraitX, -35);
  assert.equal(constrained.portraitY, 0);
  for (const [key, choices] of Object.entries(options)) {
    for (const choice of choices) {
      const doc = createDocument("card", true);
      doc.design[key] = choice.id;
      assert.equal(
        normalizeDocument(doc).design[key],
        choice.id,
        `${key}: ${choice.id}`,
      );
    }
  }
});

test("palettes change colors independently from template, layout, typography and buttons", () => {
  const original = {
    ...themes[1],
    font: "editorial",
    headerLayout: "split",
    buttonLayout: "compact",
    iconStyle: "minimal",
    buttonStyle: "elevated",
  };
  for (const palette of colorPalettes) {
    const result = applyPalette(original, palette);
    colorKeys.forEach((key) => assert.equal(result[key], palette[key]));
    for (const key of [
      "id",
      "font",
      "headerLayout",
      "buttonLayout",
      "backgroundStyle",
      "iconStyle",
      "buttonStyle",
      "radius",
    ])
      assert.equal(result[key], original[key]);
    assert.equal(normalizeDesign(result).cover, result.cover);
  }
});

test("older saved designs keep their colors, font and original layout", () => {
  const legacy = {
    id: "dark",
    primary: "#778899",
    background: "#121212",
    text: "#ffffff",
    font: "mono",
    buttonStyle: "soft",
    radius: 19,
  };
  const result = normalizeDesign(legacy);
  for (const [key, value] of Object.entries(legacy))
    assert.equal(result[key], value);
  for (const [key, value] of Object.entries(designDefaults))
    assert.equal(result[key], value);
});

test("invalid saved styles and unsafe cover colors are replaced with supported values", () => {
  const design = normalizeDesign({
    id: "gradient",
    headerLayout: "unknown",
    buttonLayout: "bad",
    iconStyle: "bad",
    backgroundStyle: "url(evil)",
    font: "bad",
    buttonStyle: "bad",
    coverStart: "url(javascript:x)",
    coverEnd: "red); color: transparent",
    cover: "url(evil)",
    radius: -1,
  });
  for (const [key, value] of Object.entries(designDefaults))
    assert.equal(design[key], value);
  assert.equal(design.font, "sans");
  assert.equal(design.radius, 0);
  assert.match(design.coverStart, /^#[0-9a-f]{6}$/);
  assert.match(
    design.cover,
    /^linear-gradient\(125deg, #[0-9a-f]{6}, #[0-9a-f]{6}\)$/,
  );
});
