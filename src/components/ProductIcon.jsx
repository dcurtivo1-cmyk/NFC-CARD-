import {
  ContactRound,
  UtensilsCrossed,
  PanelsTopLeft,
  Star,
  AtSign,
  ScanLine,
} from "lucide-react";
const icons = {
  ContactRound,
  UtensilsCrossed,
  PanelsTopLeft,
  Star,
  AtSign,
  ScanLine,
};
export default function ProductIcon({ product, size = 23 }) {
  const Icon = icons[product.icon];
  return (
    <span className={`product-icon color-${product.color}`}>
      <Icon size={size} strokeWidth={1.65} />
    </span>
  );
}
