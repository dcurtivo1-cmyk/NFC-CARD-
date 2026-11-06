import { colorPalettes, coverGradient, designDefaults } from "./design.js";

const templateSettings = {
  modern: {
    palette: "ocean",
    headerLayout: "split",
    buttonLayout: "stacked",
    backgroundStyle: "solid",
    iconStyle: "rounded",
  },
  dark: {
    palette: "midnight",
    headerLayout: "centered",
    buttonLayout: "grid",
    backgroundStyle: "gradient",
    iconStyle: "outline",
  },
  minimal: {
    palette: "mono",
    headerLayout: "minimal",
    buttonLayout: "compact",
    backgroundStyle: "solid",
    iconStyle: "minimal",
  },
  gradient: {
    palette: "lavender",
    headerLayout: "classic",
    buttonLayout: "stacked",
    backgroundStyle: "solid",
    iconStyle: "circle",
  },
  elegant: {
    palette: "sand",
    headerLayout: "centered",
    buttonLayout: "stacked",
    backgroundStyle: "dots",
    iconStyle: "outline",
  },
};

export const themes = [
  {
    id: "modern",
    name: "Modern Blue",
    primary: "#3269d5",
    background: "#f3f7ff",
    text: "#182d4d",
    cover: "linear-gradient(125deg, #dce8ff, #a9c7fb)",
    font: "sans",
    radius: 16,
    buttonStyle: "filled",
  },
  {
    id: "dark",
    name: "Premium Dark",
    primary: "#bcb0fa",
    background: "#20212b",
    text: "#f6f4ff",
    cover: "linear-gradient(125deg, #44415d, #22232c)",
    font: "sans",
    radius: 16,
    buttonStyle: "filled",
  },
  {
    id: "minimal",
    name: "Minimal Light",
    primary: "#34383d",
    background: "#ffffff",
    text: "#24272b",
    cover: "linear-gradient(125deg, #ecece8, #d7dbd3)",
    font: "sans",
    radius: 8,
    buttonStyle: "outline",
  },
  {
    id: "gradient",
    name: "Gradient",
    primary: "#7854d5",
    background: "#fcf9ff",
    text: "#302742",
    cover: "linear-gradient(120deg, #c5c4f6 0%, #e2c5ee 48%, #f6d8c4 100%)",
    font: "sans",
    radius: 16,
    buttonStyle: "filled",
  },
  {
    id: "elegant",
    name: "Elegant",
    primary: "#7c6751",
    background: "#faf6ef",
    text: "#3e352b",
    cover: "linear-gradient(125deg, #e3d9c7, #c9b89b)",
    font: "serif",
    radius: 6,
    buttonStyle: "outline",
  },
].map((theme) => {
  const { palette: paletteId, ...layout } = templateSettings[theme.id];
  const palette = colorPalettes.find((item) => item.id === paletteId);
  return {
    ...designDefaults,
    ...theme,
    ...layout,
    cover: coverGradient(palette),
    coverStart: palette.coverStart,
    coverEnd: palette.coverEnd,
  };
});

export const products = [
  {
    id: "card",
    name: "Calling Card",
    icon: "ContactRound",
    label: "Your next great introduction.",
    description:
      "Your details, your links, your personality. All in one memorable card.",
    color: "violet",
    category: "Personal",
    action: "Save contact",
  },
  {
    id: "menu",
    name: "Digital Menu",
    icon: "UtensilsCrossed",
    label: "Good taste. One scan away.",
    description:
      "Serve up your menu with a simple, beautifully accessible page.",
    color: "orange",
    category: "Business",
    action: "View our menu",
  },
  {
    id: "brochure",
    name: "Digital Brochure",
    icon: "PanelsTopLeft",
    label: "Give your business a little space.",
    description:
      "A pocket-sized showcase for your services, offers, and big ideas.",
    color: "blue",
    category: "Business",
    action: "Explore our services",
  },
  {
    id: "review",
    name: "Google Review",
    icon: "Star",
    label: "Make kind words go further.",
    description:
      "Give happy customers a direct path to your Google review page.",
    color: "yellow",
    category: "Business",
    action: "Leave a Google review",
  },
  {
    id: "social",
    name: "Social Media Page",
    icon: "AtSign",
    label: "All your corners of the internet.",
    description:
      "Bring your social profiles and favorite links together in one place.",
    color: "pink",
    category: "Personal",
    action: "Explore my links",
  },
  {
    id: "nfc",
    name: "NFC / QR Landing Page",
    icon: "ScanLine",
    label: "One tap. So many possibilities.",
    description:
      "Create a home for your NFC tag or QR code. Ready for real connections.",
    color: "green",
    category: "Business",
    action: "Let’s connect",
  },
];

export const socialFields = [
  ["facebook", "Facebook", "https://facebook.com/yourname"],
  ["instagram", "Instagram", "https://instagram.com/yourname"],
  ["tiktok", "TikTok", "https://tiktok.com/@yourname"],
  ["linkedin", "LinkedIn", "https://linkedin.com/in/yourname"],
  ["youtube", "YouTube", "https://youtube.com/@yourname"],
  ["whatsapp", "WhatsApp", "+63 917 000 0000"],
];

export const blankDetails = {
  fullName: "",
  displayName: "",
  position: "",
  businessName: "",
  bio: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  profilePhoto: "",
  coverPhoto: "",
  logo: "",
  showcaseImage: "",
  showcaseCaption: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  linkedin: "",
  youtube: "",
  whatsapp: "",
  customLinks: [],
  headline: "",
  actionUrl: "",
  menuItems: [],
};

export const sampleDetails = {
  ...blankDetails,
  fullName: "Alex Morgan",
  displayName: "Alex Morgan",
  position: "Brand Designer",
  businessName: "Studio Sunday",
  bio: "Turning thoughtful ideas into brands that feel like you. Let’s make something good together.",
  email: "hello@example.com",
  phone: "+63 917 123 4567",
  website: "https://example.com",
  address: "Makati, Metro Manila",
  instagram: "https://instagram.com",
  linkedin: "https://linkedin.com",
  profilePhoto: "/alex-portrait.svg",
  customLinks: [
    {
      id: "sample-portfolio",
      label: "Explore my portfolio",
      url: "https://example.com",
    },
  ],
};

export function createDocument(type = "card", sample = false) {
  const details = structuredClone(sample ? sampleDetails : blankDetails);
  if (sample && type !== "card") {
    Object.assign(details, {
      fullName: "Sunday Studio",
      displayName: "Sunday Studio",
      businessName: "Sunday Studio",
      position: "A little space for good things.",
      headline: products.find((p) => p.id === type)?.label || "",
      bio: "Thoughtfully made, happily shared. Discover a little more about what we do.",
      actionUrl:
        type === "review"
          ? "https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID"
          : "https://example.com",
      menuItems:
        type === "menu"
          ? [
              {
                id: "m1",
                name: "Sunday iced latte",
                description: "Espresso, oat milk, a little sunshine.",
                price: "₱180",
                category: "Coffee",
              },
              {
                id: "m2",
                name: "Butter croissant",
                description: "Golden, flaky, baked every morning.",
                price: "₱140",
                category: "From the oven",
              },
            ]
          : [],
    });
  }
  return {
    id: null,
    type,
    status: "draft",
    details,
    design: { ...themes[3] },
    updatedAt: null,
    createdAt: null,
  };
}
