export default function StockBadge({ available, reorderPoint, inTransit }) {
  if (available <= 0) {
    return <span className="badge-danger">Out of stock</span>;
  }
  if (available <= reorderPoint) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="badge-warning">Low ({available})</span>
        {inTransit > 0 && <span className="badge-info">+{inTransit}</span>}
      </div>
    );
  }
  return <span className="badge-success">{available} in stock</span>;
}
