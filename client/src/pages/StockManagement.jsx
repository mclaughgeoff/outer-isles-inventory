import { useState } from 'react';
import { inventory, stock } from '../services/api';
import useFetch from '../hooks/useFetch';
import { SearchIcon, XIcon } from '../components/Icons';

export default function StockManagement() {
  const [search, setSearch] = useState('');
  const { data, loading, refetch } = useFetch(() => inventory.list({ search, limit: 200 }), [search]);
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [fromLoc, setFromLoc] = useState('back');
  const [toLoc, setToLoc] = useState('shelf');

  const handleAction = async () => {
    if (!actionItem) return;
    try {
      if (actionType === 'move') {
        await stock.move(actionItem.id, { from_location: fromLoc, to_location: toLoc, quantity });
      } else if (actionType === 'receive') {
        await stock.receive(actionItem.id, { quantity, to_location: 'back' });
      }
      setActionItem(null);
      setActionType(null);
      setQuantity(1);
      refetch();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Stock Management</h1>
        <p className="text-sm text-gray-500 mt-1">Move stock between locations and receive shipments</p>
      </div>

      <div className="card !p-4 mb-6">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for an item to update stock..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {actionItem && (
        <div className="card mb-6 !border-primary/30 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="section-title">
                {actionType === 'move' ? 'Move Stock' : 'Receive Shipment'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{actionItem.item_name} — {actionItem.brand}</p>
            </div>
            <button onClick={() => { setActionItem(null); setActionType(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mb-4">
            {[
              { label: 'Shelf', value: actionItem.qty_on_shelf },
              { label: 'Back', value: actionItem.qty_in_back },
              { label: 'Transit', value: actionItem.qty_in_transit, color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-lg px-3 py-2 text-center flex-1">
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className={`font-mono font-semibold ${s.color || 'text-gray-900'}`}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-3">
            {actionType === 'move' && (
              <>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">From</label>
                  <select value={fromLoc} onChange={(e) => setFromLoc(e.target.value)} className="input text-sm">
                    <option value="back">Back</option><option value="shelf">Shelf</option><option value="transit">Transit</option>
                  </select>
                </div>
                <div className="text-gray-300 pb-2">→</div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">To</label>
                  <select value={toLoc} onChange={(e) => setToLoc(e.target.value)} className="input text-sm">
                    <option value="shelf">Shelf</option><option value="back">Back</option>
                  </select>
                </div>
              </>
            )}
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Qty</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} className="input font-mono text-sm" />
            </div>
            <button onClick={handleAction} className="btn-primary text-sm">Confirm</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="table-wrapper"><table><thead><tr><th>Item</th><th>Shelf</th><th>Back</th><th>Transit</th><th>Available</th><th>Actions</th></tr></thead>
          <tbody>{Array.from({ length: 8 }).map((_, i) => <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)}</tbody></table></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-center">Shelf</th>
                <th className="text-center">Back</th>
                <th className="text-center">Transit</th>
                <th className="text-center">Available</th>
                <th className="text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="font-medium text-gray-900">{item.item_name}</div>
                    <div className="text-xs text-gray-400">{item.brand} · {item.size}</div>
                  </td>
                  <td className="text-center font-mono">{item.qty_on_shelf}</td>
                  <td className="text-center font-mono">{item.qty_in_back}</td>
                  <td className="text-center font-mono text-blue-600">{item.qty_in_transit}</td>
                  <td className="text-center">
                    <span className={`font-mono font-semibold ${item.qty_available <= 0 ? 'text-red-600' : item.qty_available <= item.reorder_point ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {item.qty_available}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setActionItem(item); setActionType('move'); setQuantity(1); }}
                        className="btn-ghost text-xs !px-2"
                      >
                        Move
                      </button>
                      <button
                        onClick={() => { setActionItem(item); setActionType('receive'); setQuantity(1); }}
                        className="btn-ghost text-xs !px-2 !text-primary"
                      >
                        Receive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
