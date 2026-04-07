import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { inventory, categories as catApi } from '../services/api';
import useFetch from '../hooks/useFetch';
import StockBadge from '../components/StockBadge';
import { SearchIcon, PlusIcon, FilterIcon } from '../components/Icons';

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [distributor, setDistributor] = useState(searchParams.get('distributor') || '');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: cats } = useFetch(() => catApi.list());
  const { data, loading, refetch } = useFetch(
    () => inventory.list({ search, category, distributor, page, limit: 50 }),
    [search, category, distributor, page]
  );

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); refetch(); }, 300);
    return () => clearTimeout(timer);
  }, [search, category, distributor]);

  const hasFilters = category || distributor;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total || 0} items across {cats?.length || 0} categories</p>
        </div>
        <Link to="/inventory/new" className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Item
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="card mb-6 !p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, brand, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${hasFilters ? '!border-primary !text-primary' : ''}`}
          >
            <FilterIcon className="w-4 h-4" />
            Filters
            {hasFilters && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
          </button>
          {hasFilters && (
            <button onClick={() => { setCategory(''); setDistributor(''); }} className="btn-ghost text-xs">
              Clear filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 animate-slide-up">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input max-w-[220px]">
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
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th className="px-4 py-3">Item</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Size</th><th className="px-4 py-3 text-right">Cost</th><th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Margin</th><th className="px-4 py-3 text-center">Stock</th>
            </tr></thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Size</th>
                    <th className="text-right">Cost</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Margin</th>
                    <th className="text-center">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((item) => (
                    <tr key={item.id} className="group">
                      <td>
                        <Link to={`/inventory/${item.id}`} className="text-gray-900 group-hover:text-primary font-medium transition-colors">
                          {item.item_name}
                        </Link>
                        {item.sub_sku && (
                          <div className="text-xs text-gray-400 truncate max-w-[280px] mt-0.5">{item.sub_sku}</div>
                        )}
                      </td>
                      <td className="text-gray-500 text-xs">{item.category_name}</td>
                      <td className="text-gray-600">{item.brand || <span className="text-gray-300">—</span>}</td>
                      <td className="font-mono text-xs text-gray-500">{item.size || '—'}</td>
                      <td className="text-right font-mono text-gray-600">
                        {item.wholesale_cost ? `$${Number(item.wholesale_cost).toFixed(2)}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-right font-mono font-medium text-gray-900">
                        {item.retail_price ? `$${Number(item.retail_price).toFixed(2)}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-right">
                        {item.margin_pct ? (
                          <span className={`font-mono text-sm ${item.margin_pct >= 40 ? 'text-emerald-600' : item.margin_pct >= 25 ? 'text-gray-600' : 'text-amber-600'}`}>
                            {item.margin_pct}%
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-center">
                        <StockBadge available={item.qty_available} reorderPoint={item.reorder_point} inTransit={item.qty_in_transit} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-xs !px-3 disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === page ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="btn-secondary text-xs !px-3 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
