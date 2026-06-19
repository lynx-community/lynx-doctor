const promos = [
  { id: "free-shipping", title: "Free shipping", subtitle: "Orders over $50" },
  { id: "new-arrivals", title: "New arrivals", subtitle: "Fresh Lynx gear" }
];

export function PromoRail() {
  return (
    <view className="promoRail">
      {promos.map((promo) => (
        <view className="promoCard" key={promo.id}>
          <text className="promoTitle">{promo.title}</text>
          <text className="promoSubtitle">{promo.subtitle}</text>
        </view>
      ))}
    </view>
  );
}
