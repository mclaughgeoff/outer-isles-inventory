import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboard } from '../services/api';
import useFetch from '../hooks/useFetch';

const fmt = (n) => Number(n || 0).toLocaleString();
const fmtCurrency = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function LocationBar({ onShelf, inBack, inTransit }) {
  const total = onShelf + inBack + inTransit;
  if (total === 0) return <div className="h-2 rounded-full bg-gray-100 w-full" />;
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 w-full">
      <div className="bg-emerald-500 transition-all" style={{ width: `${(onShelf / total) * 100}%` }} title={`Shelf: ${onShelf}`} />
      <div className="bg-amber-400 transition-all" style={{ width: `${(inBack / total) * 100}%` }} title={`Back: ${inBack}`} />
      <div className="bg-blue-400 transition-all" style={{ width: `${(inTransit / total) * 100}%` }} title={`Transit: ${inTransit}`} />
    </div>
  );
}

function StatusDot({ status }) {
  const colors = { in: 'bg-emerald-500', low: 'bg-amber-500', out: 'bg-red-500' };
  return <span className={`w-2 h-2 rounded-full ${colors[status]} inline-block`} />;
}

function getStatus(available, reorderPoint) {
  if (available <= 0) return 'out';
  if (available <= reorderPoint) return 'low';
  return 'in';
}

export default function StockOverview() {
  const { data, loading } = useFetch(() => dashboard.stockOverview());
  const [view, setView] = useState('location'); // location | category | transit

  const totals = data?.totals || {};
  const byCategory = data?.byCategory || [];
  const allItems = data?.allItems || [];
  const inTransit = data?.inTransit || [];

  const statusCounts = {
    in: totals.in_stock_count || 0,
    low: totals.low_stock_count || 0,
    out: totals.out_of_stock_count || 0,
  };
  const totalItems = statusCounts.in + statusCounts.low + statusCounts.out;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Stock Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Where everything is across your store</p>
        </div>
        <Link to="/stock" className="btn-secondary text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          Manage Stock
        </Link>
      </div>

      {/* Top Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card !p-4 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-16 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="card !p-4">
            <div className="text-xs font-medium text-gray-500 mb-1">On Shelf</div>
            <div className="text-xl font-semibold text-emerald-600 font-mono">{fmt(totals.total_on_shelf)}</div>
            <div className="text-2xs text-gray-400 mt-1">units</div>
          </div>
          <div className="card !p-4">
            <div className="text-xs font-medium text-gray-500 mb-1">In Back</div>
            <div className="text-xl font-semibold text-amber-600 font-mono">{fmt(totals.total_in_back)}</div>
            <div className="text-2xs text-gray-400 mt-1">units</div>
          </div>
          <div className="card !p-4">
            <div className="text-xs font-medium text-gray-500 mb-1">In Transit</div>
            <div className="text-xl font-semibold text-blue-600 font-mono">{fmt(totals.total_in_transit)}</div>
            <div className="text-2xs text-gray-400 mt-1">units</div>
          </div>
          <div className="card !p-4">
            <div className="text-xs font-medium text-gray-500 mb-1">Reserved (CSA)</div>
            <div className="text-xl font-semibold text-purple-600 font-mono">{fmt(totals.total_reserved_csa)}</div>
            <div className="text-2xs text-gray-400 mt-1">units</div>
          </div>
          <div className="card !p-4">
            <div className="text-xs font-medium text-gray-500 mb-1">Total On Hand</div>
            <div className="text-xl font-semibold text-gray-900 font-mono">{fmt(totals.total_on_hand)}</div>
            <div className="text-2xs text-gray-400 mt-1">shelf + back</div>
          </div>
          <div className="card !p-4">
            <div className="text-xs font-medium text-gray-500 mb-1">Inventory Value</div>
            <div className="text-xl font-semibold text-gray-900 font-mono">{fmtCurrency(totals.total_inventory_value)}</div>
            <div className="text-2xs text-gray-400 mt-1">at cost</div>
          </div>
        </div>
      )}

      {/* Status Ring + Category Breakdown */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Status Summary */}
          <div className="card">
            <h2 className="section-title mb-4">Stock Status</h2>
            <div className="flex items-center justify-center mb-5">
              {/* Simple donut chart */}
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {totalItems > 0 && (() => {
                    const inPct = (statusCounts.in / totalItems) * 100;
                    const lowPct = (statusCounts.low / totalItems) * 100;
                    const outPct = (statusCounts.out / totalItems) * 100;
                    const inOffset = 0;
                    const lowOffset = inPct;
                    const outOffset = inPct + lowPct;
                    return (
                      <>
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3"
                          strokeDasharray={`${inPct} ${100 - inPct}`} strokeDashoffset={`-${inOffset}`} />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3"
                          strokeDasharray={`${lowPct} ${100 - lowPct}`} strokeDashoffset={`-${lowOffset}`} />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3"
                          strokeDasharray={`${outPct} ${100 - outPct}`} strokeDashoffset={`-${outOffset}`} />
                      </>
                    );
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold font-mono text-gray-900">{totalItems}</span>
                  <span className="text-2xs text-gray-400">items</span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              <Link to="/inventory?stock_filter=in" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <StatusDot status="in" />
                  <span className="text-sm text-gray-700">In Stock</span>
                </div>
                <span className="font-mono text-sm font-semibold text-emerald-600">{statusCounts.in}</span>
              </Link>
              <Link to="/inventory?stock_filter=low" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <StatusDot status="low" />
                  <span className="text-sm text-gray-700">Low Stock</span>
                </div>
                <span className="font-mono text-sm font-semibold text-amber-600">{statusCounts.low}</span>
              </Link>
              <Link to="/inventory?stock_filter=out" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <StatusDot status="out" />
                  <span className="text-sm text-gray-700">Out of Stock</span>
                </div>
                <span className="font-mono text-sm font-semibold text-red-600">{statusCounts.out}</span>
              </Link>
            </div>
          </div>

          {/* By Category */}
          <div className="card lg:col-span-2">
            <h2 className="section-title mb-4">Stock by Category</h2>
            <div className="space-y-3">
              {byCategory.map((cat) => {
                const catTotal = cat.on_shelf + cat.in_back + cat.in_transit;
                return (
                  <div key={cat.category} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{cat.category || 'Uncategorized'}</span>
                        <span className="text-2xs text-gray-400">{cat.item_count} items</span>
                      </div>
                      <span className="font-mono text-sm text-gray-600">{fmt(catTotal)}</span>
                    </div>
                    <LocationBar onShelf={cat.on_shelf} inBack={cat.in_back} inTransit={cat.in_transit} />
                    <div className="flex gap-4 mt-1">
                      <span className="text-2xs text-gray-400">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />{cat.on_shelf} shelf
                      </span>
                      <span className="text-2xs text-gray-400">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />{cat.in_back} back
                      </span>
                      {cat.in_transit > 0 && (
                        <span className="text-2xs text-gray-400">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />{cat.in_transit} transit
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* View Tabs */}
      {!loading && (
        <>
          <div className="flex items-center gap-2 mb-4">
            {[
              { id: 'location', label: 'All Items', count: allItems.length },
              { id: 'transit', label: 'In Transit', count: inTransit.length },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === id
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
                <span className={`ml-1.5 text-xs ${view === id ? 'text-white/70' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Items Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-center">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Shelf
                    </span>
                  </th>
                  <th className="text-center">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Back
                    </span>
                  </th>
                  <th className="text-center">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" /> Transit
                    </span>
                  </th>
                  <th className="text-center">Available</th>
                  <th>Location Split</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {(view === 'transit' ? inTransit : allItems).map((item) => {
                  const status = getStatus(item.qty_available, item.reorder_point);
                  const onShelf = item.qty_on_shelf || 0;
                  const inBack = item.qty_in_back || 0;
                  const transit = item.qty_in_transit || 0;
                  return (
                    <tr key={item.id} className="group">
                      <td>
                        <Link to={`/inventory/${item.id}`} className="text-gray-900 group-hover:text-primary font-medium transition-colors">
                          {item.item_name}
                        </Link>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {item.brand && <span>{item.brand}</span>}
                          {item.category_name && <span> · {item.category_name}</span>}
                        </div>
                      </td>
                      <td className="text-center font-mono text-sm">
                        <span className={onShelf > 0 ? 'text-emerald-700 font-medium' : 'text-gray-300'}>{onShelf}</span>
                      </td>
                      <td className="text-center font-mono text-sm">
                        <span className={inBack > 0 ? 'text-amber-700 font-medium' : 'text-gray-300'}>{inBack}</span>
                      </td>
                      <td className="text-center font-mono text-sm">
                        {transit > 0 ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                            <svg className="w-3 h-3 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                            {transit}
                          </span>
                        ) : (
                          <span className="text-gray-300">0</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`font-mono text-sm font-semibold ${
                          status === 'out' ? 'text-red-600' : status === 'low' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {item.qty_available}
                        </span>
                      </td>
                      <td className="min-w-[120px]">
                        <LocationBar onShelf={onShelf} inBack={inBack} inTransit={transit} />
                      </td>
                      <td className="text-center">
                        {status === 'in' && <span className="badge-success">In Stock</span>}
                        {status === 'low' && <span className="badge-warning">Low</span>}
                        {status === 'out' && <span className="badge-danger">Out</span>}
                      </td>
                    </tr>
                  );
                })}
                {(view === 'transit' ? inTransit : allItems).length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {view === 'transit' ? 'No items in transit' : 'No items found'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {view === 'transit' ? 'Items will appear here when shipments are on the way' : ''}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 px-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-3 h-2 rounded-sm bg-emerald-500" /> On Shelf — visible to customers
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-3 h-2 rounded-sm bg-amber-400" /> In Back — stored in back room
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-3 h-2 rounded-sm bg-blue-400" /> In Transit — on the way
            </div>
          </div>
        </>
      )}
    </div>
  );
}
