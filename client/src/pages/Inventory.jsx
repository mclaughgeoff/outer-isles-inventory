import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { inventory, categories as catApi } from '../services/api';
import useFetch from '../hooks/useFetch';
import StockBadge from '../components/StockBadge';

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [distributor, setDistributor] = useState(searchParams.get('distributor') || '');
  const [page, setPage] = useState(1);

  const { data: cats } = useFetch(() => catApi.list());
  const { data, loading, refetch } = useFetch(
    () => inventory.list({ search, category, distributor, page, limit: 50 }),
    [search, category, distributor, page]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      refetch();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, distributor]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <Link to="/inventory/new" className="btn-primary">+ Add Item</Link>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input max-w-xs"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input max-w-[200px]">
            <option value="">All Categories</option>
            {cats?.map((c) => (
              <option key={c.id} value={c.name}>{c.name} ({c.item_count})</option>
            ))}
          </select>
          <select value={distributor} onChange={(e) => setDistributor(e.target.value)} className="input max-w-[180px]">
            <option value="">All Distributors</option>
            <option value="FAIRE">Faire</option>
            <option value="AIRGOODS">Air Goods</option>
          </select>
          {(search || category || distributor) && (
            <button onClick={() => { setSearch(''); setCategory(''); setDistributor(''); }} className="btn-outline text-sm">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B6B6B]">Loading inventory...</div>
      ) : (
        <>
          <div className="text-sm text-[#6B6B6B] mb-3">
            Showing {data?.items?.length} of {data?.total} items
          </div>
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/60 border-b border-border">
                    <th className="text-left px-4 py-3 font-medium">Item</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Brand</th>
                    <th className="text-left px-4 py-3 font-medium">Size</th>
                    <th className="text-right px-4 py-3 font-medium">Wholesale</th>
                    <th className="text-right px-4 py-3 font-medium">Retail</th>
                    <th className="text-right px-4 py-3 font-medium">Margin</th>
                    <th className="text-center px-4 py-3 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((item, i) => (
                    <tr key={item.id} className={`border-b border-border/50 hover:bg-cream/30 transition-colors ${i % 2 === 0 ? '' : 'bg-cream/20'}`}>
                      <td className="px-4 py-3">
                        <Link to={`/inventory/${item.id}`} className="text-primary hover:underline font-medium">
                          {item.item_name}
                        </Link>
                        {item.sub_sku && <div className="text-xs text-[#6B6B6B] truncate max-w-[250px]">{item.sub_sku}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#6B6B6B]">{item.category_name}</td>
                      <td className="px-4 py-3">{item.brand || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{item.size || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono">{item.wholesale_cost ? `$${Number(item.wholesale_cost).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono">{item.retail_price ? `$${Number(item.retail_price).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono">{item.margin_pct ? `${item.margin_pct}%` : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <StockBadge available={item.qty_available} reorderPoint={item.reorder_point} inTransit={item.qty_in_transit} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline text-sm">
                Previous
              </button>
              <span className="text-sm text-[#6B6B6B]">Page {page} of {data.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-outline text-sm">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
