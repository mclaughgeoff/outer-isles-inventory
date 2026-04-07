import { useState } from 'react';
import { inventory, stock } from '../services/api';
import useFetch from '../hooks/useFetch';

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
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Stock Management</h1>

      <div className="card mb-6">
        <input
          type="text"
          placeholder="Search for an item to update stock..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-md"
        />
      </div>

      {actionItem && (
        <div className="card mb-6 border-2 border-primary/30">
          <h2 className="text-lg font-semibold mb-2">
            {actionType === 'move' ? 'Move Stock' : 'Receive Shipment'}: {actionItem.item_name}
          </h2>
          <div className="text-sm text-[#6B6B6B] mb-4">
            Current: Shelf {actionItem.qty_on_shelf} · Back {actionItem.qty_in_back} · Transit {actionItem.qty_in_transit}
          </div>
          <div className="flex items-end gap-3">
            {actionType === 'move' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">From</label>
                  <select value={fromLoc} onChange={(e) => setFromLoc(e.target.value)} className="input text-sm">
                    <option value="back">Back</option>
                    <option value="shelf">Shelf</option>
                    <option value="transit">Transit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">To</label>
                  <select value={toLoc} onChange={(e) => setToLoc(e.target.value)} className="input text-sm">
                    <option value="shelf">Shelf</option>
                    <option value="back">Back</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Qty</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} className="input w-20 font-mono text-sm" />
            </div>
            <button onClick={handleAction} className="btn-primary text-sm">Confirm</button>
            <button onClick={() => { setActionItem(null); setActionType(null); }} className="btn-outline text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-[#6B6B6B]">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/60 border-b border-border">
                <th className="text-left px-4 py-3 font-medium">Item</th>
                <th className="text-center px-4 py-3 font-medium">Shelf</th>
                <th className="text-center px-4 py-3 font-medium">Back</th>
                <th className="text-center px-4 py-3 font-medium">Transit</th>
                <th className="text-center px-4 py-3 font-medium">Available</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((item, i) => (
                <tr key={item.id} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-cream/20'}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.item_name}</div>
                    <div className="text-xs text-[#6B6B6B]">{item.brand} · {item.size}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono">{item.qty_on_shelf}</td>
                  <td className="px-4 py-3 text-center font-mono">{item.qty_in_back}</td>
                  <td className="px-4 py-3 text-center font-mono text-blue-600">{item.qty_in_transit}</td>
                  <td className={`px-4 py-3 text-center font-mono font-medium ${item.qty_available <= 0 ? 'text-danger' : item.qty_available <= item.reorder_point ? 'text-warning' : 'text-success'}`}>
                    {item.qty_available}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => { setActionItem(item); setActionType('move'); setQuantity(1); }}
                      className="text-xs text-primary hover:underline mr-3"
                    >
                      Move
                    </button>
                    <button
                      onClick={() => { setActionItem(item); setActionType('receive'); setQuantity(1); }}
                      className="text-xs text-secondary hover:underline"
                    >
                      Receive
                    </button>
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
