import "./Offers.css";
export default function OfferBadge({ children = "عرض باكيج" }) {
  return <span className="offer-badge"><svg viewBox="0 0 120 76" preserveAspectRatio="none" aria-hidden="true"><path d="M20 2 H100 L118 38 L100 74 H20 L2 38 Z" /></svg><span>{children}</span></span>;
}
