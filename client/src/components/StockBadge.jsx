export default function StockBadge({ available, reorderPoint, inTransit }) {
  if (available <= 0) {
    return <span className="badge-danger">Out of Stock</span>;
  }
  if (available <= reorderPoint) {
    return (
      <span className="badge-warning">
        Low Stock ({available})
        {inTransit > 0 && <span className="ml-1 badge-info text-[10px]">+{inTransit} incoming</span>}
      </span>
    );
  }
  return <span className="badge-success">In Stock ({available})</span>;
}
