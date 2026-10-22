import "./Offers.css";
export default function OfferBadge({ children }) {
  return <span className="offer-badge"><img src="/images/offers/discount-tag.png" alt="" aria-hidden="true" /><span>{children}</span></span>;
}
