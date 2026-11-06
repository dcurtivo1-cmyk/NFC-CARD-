import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeVCard,
  phoneUrl,
  safeUrl,
  validateDetails,
} from "../src/lib/profile.js";
import { createDocument, products } from "../src/data/presets.js";

test("links accept web addresses and reject executable or unsupported protocols", () => {
  assert.equal(safeUrl("example.com/hello"), "https://example.com/hello");
  assert.equal(
    safeUrl("https://example.com?q=test"),
    "https://example.com/?q=test",
  );
  for (const invalid of [
    "javascript:alert(1)",
    "data:text/html,x",
    "file:///etc/passwd",
    "vbscript:hello",
    "https://",
    "garbage",
    "ftp://example.com",
  ])
    assert.equal(safeUrl(invalid), "");
});
test("phone destinations preserve international country codes", () => {
  assert.equal(phoneUrl("+63 (917) 123-4567"), "tel:+639171234567");
  assert.equal(
    phoneUrl("+63 (917) 123-4567", true),
    "https://wa.me/639171234567",
  );
  assert.equal(phoneUrl(""), "");
});
test("validation flags names, links, email and phone without requiring optional details", () => {
  const doc = createDocument();
  assert.ok(validateDetails(doc.details).fullName);
  doc.details.fullName = "Jordan Cruz";
  assert.deepEqual(validateDetails(doc.details), {});
  Object.assign(doc.details, {
    email: "bad",
    phone: "abc",
    website: "javascript:x",
    customLinks: [{ label: "", url: "broken" }],
  });
  const errors = validateDetails(doc.details);
  for (const key of ["email", "phone", "website", "link-label-0", "link-url-0"])
    assert.ok(errors[key]);
});
test("page-specific validation requires real review links and complete menu items", () => {
  const review = createDocument("review", true);
  assert.ok(validateDetails(review.details, "review").actionUrl);
  review.details.actionUrl = "https://g.page/r/example/review";
  assert.deepEqual(validateDetails(review.details, "review"), {});
  const menu = createDocument("menu", true);
  menu.details.menuItems[0].name = "";
  assert.ok(validateDetails(menu.details, "menu")["menu-name-0"]);
});
test("vCard escapes structured values and prevents additional properties via line injection", () => {
  const details = {
    ...createDocument("card", true).details,
    fullName: "Lee; Ana, Jr.",
    businessName: "One\nTwo",
    bio: "Hi\nTEL:fake\\value",
  };
  const card = makeVCard(details);
  assert.ok(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"));
  assert.ok(card.includes("FN:Lee\\; Ana\\, Jr.\r\n"));
  assert.ok(card.includes("NOTE:Hi\\nTEL:fake\\\\value"));
  assert.ok(!card.includes("\r\nTEL:fake"));
  assert.ok(card.endsWith("END:VCARD\r\n"));
  assert.ok(
    makeVCard({ ...details, bio: "Hello\rTEL:fake" }).includes(
      "NOTE:Hello\\nTEL:fake",
    ),
  );
});
test("all six document types have isolated editable sample data", () => {
  assert.equal(products.length, 6);
  const a = createDocument("menu", true),
    b = createDocument("menu", true);
  a.details.menuItems[0].name = "Changed";
  assert.notEqual(a.details.menuItems[0].name, b.details.menuItems[0].name);
  assert.equal(createDocument("card", true).id, null);
});
