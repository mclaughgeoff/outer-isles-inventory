import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { inventory, stock, categories as catApi } from '../services/api';
import useFetch from '../hooks/useFetch';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { data: item, loading, refetch } = useFetch(() => isNew ? Promise.resolve(null) : inventory.get(id), [id]);
  const { data: cats } = useFetch(() => catApi.list());

  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [moveForm, setMoveForm] = useState({ from_location: 'back', to_location: 'shelf', quantity: 1 });

  const currentForm = form || item || {};
  const set = (field, value) => setForm({ ...currentForm, [field]: value });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const created = await inventory.create(currentForm);
        navigate(`/inventory/${created.id}`);
      } else {
        await inventory.update(id, currentForm);
        setEditing(false);
        setForm(null);
        refetch();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async () => {
    try {
      await stock.move(id, moveForm);
      refetch();
      setMoveForm({ ...moveForm, quantity: 1 });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReceive = async () => {
    const qty = prompt('How many units received?');
    if (!qty) return;
    try {
      await stock.receive(id, { quantity: parseInt(qty), to_location: 'back' });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-[#6B6B6B]">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/inventory" className="text-[#6B6B6B] hover:text-[#2D2D2D]">&larr; Inventory</Link>
        <h1 className="text-2xl font-semibold">{isNew ? 'New Item' : currentForm.item_name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Item Details</h2>
              {!isNew && !editing && (
                <button onClick={() => { setForm({ ...item }); setEditing(true); }} className="btn-outline text-sm">Edit</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Item Name</label>
                {editing ? (
                  <input value={currentForm.item_name || ''} onChange={(e) => set('item_name', e.target.value)} className="input" />
                ) : (
                  <div className="font-medium">{currentForm.item_name || '—'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Category</label>
                {editing ? (
                  <select value={currentForm.category_id || ''} onChange={(e) => set('category_id', e.target.value)} className="input">
                    <option value="">Select...</option>
                    {cats?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <div>{currentForm.category_name || '—'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Brand</label>
                {editing ? (
                  <input value={currentForm.brand || ''} onChange={(e) => set('brand', e.target.value)} className="input" />
                ) : (
                  <div>{currentForm.brand || '—'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Size</label>
                {editing ? (
                  <input value={currentForm.size || ''} onChange={(e) => set('size', e.target.value)} className="input" />
                ) : (
                  <div className="font-mono">{currentForm.size || '—'}</div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Description / Sub-SKU</label>
                {editing ? (
                  <input value={currentForm.sub_sku || ''} onChange={(e) => set('sub_sku', e.target.value)} className="input" />
                ) : (
                  <div className="text-sm text-[#6B6B6B]">{currentForm.sub_sku || '—'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Format</label>
                {editing ? (
                  <input value={currentForm.format || ''} onChange={(e) => set('format', e.target.value)} className="input" />
                ) : (
                  <div>{currentForm.format || '—'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Distributor</label>
                {editing ? (
                  <input value={currentForm.distributor || ''} onChange={(e) => set('distributor', e.target.value)} className="input" />
                ) : (
                  <div>{currentForm.distributor || '—'}</div>
                )}
              </div>
            </div>

            <hr className="my-4 border-border" />
            <h3 className="text-sm font-semibold mb-3">Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Wholesale Cost</label>
                {editing ? (
                  <input type="number" step="0.01" value={currentForm.wholesale_cost || ''} onChange={(e) => set('wholesale_cost', e.target.value)} className="input font-mono" />
                ) : (
                  <div className="font-mono">{currentForm.wholesale_cost ? `$${Number(currentForm.wholesale_cost).toFixed(2)}` : '—'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Retail Price</label>
                {editing ? (
                  <input type="number" step="0.01" value={currentForm.retail_price || ''} onChange={(e) => set('retail_price', e.target.value)} className="input font-mono" />
                ) : (
                  <div className="font-mono">{currentForm.retail_price ? `$${Number(currentForm.retail_price).toFixed(2)}` : '—'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Margin</label>
                <div className="font-mono text-primary font-medium">{currentForm.margin_pct ? `${currentForm.margin_pct}%` : '—'}</div>
              </div>
            </div>

            <hr className="my-4 border-border" />
            <h3 className="text-sm font-semibold mb-3">Ordering</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">MOQ</label>
                {editing ? (
                  <input type="number" value={currentForm.moq || ''} onChange={(e) => set('moq', e.target.value)} className="input font-mono" />
                ) : (
                  <div className="font-mono">{currentForm.moq || '—'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Delivery Min.</label>
                {editing ? (
                  <input type="number" step="0.01" value={currentForm.delivery_minimum || ''} onChange={(e) => set('delivery_minimum', e.target.value)} className="input font-mono" />
                ) : (
                  <div className="font-mono">{currentForm.delivery_minimum ? `$${Number(currentForm.delivery_minimum).toFixed(2)}` : '—'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Shipping</label>
                {editing ? (
                  <input value={currentForm.shipping_cost || ''} onChange={(e) => set('shipping_cost', e.target.value)} className="input" />
                ) : (
                  <div className="text-sm">{currentForm.shipping_cost || '—'}</div>
                )}
              </div>
            </div>

            {editing && (
              <div className="mt-6 flex gap-3">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : isNew ? 'Create Item' : 'Save Changes'}
                </button>
                {!isNew && (
                  <button onClick={() => { setEditing(false); setForm(null); }} className="btn-outline">Cancel</button>
                )}
              </div>
            )}
          </div>

          {!isNew && item?.movements?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Stock Movement History</h2>
              <div className="space-y-2">
                {item.movements.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-sm px-3 py-2 border border-border/50 rounded-md">
                    <div>
                      <span className="font-medium capitalize">{m.movement_type}</span>
                      {m.from_location && <span className="text-[#6B6B6B]"> {m.from_location} &rarr; {m.to_location}</span>}
                      {m.notes && <span className="text-[#6B6B6B] ml-2">— {m.notes}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono font-medium ${m.quantity > 0 ? 'text-success' : 'text-danger'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                      <span className="text-xs text-[#6B6B6B]">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isNew && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Stock Levels</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B6B6B]">On Shelf</span>
                  <span className="font-mono font-medium">{item?.qty_on_shelf ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B6B6B]">In Back</span>
                  <span className="font-mono font-medium">{item?.qty_in_back ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B6B6B]">In Transit</span>
                  <span className="font-mono font-medium text-blue-600">{item?.qty_in_transit ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B6B6B]">Reserved (CSA)</span>
                  <span className="font-mono font-medium text-secondary">{item?.qty_reserved_csa ?? 0}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-mono font-semibold">{item?.qty_total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Available</span>
                  <span className={`font-mono font-semibold ${(item?.qty_available ?? 0) <= 0 ? 'text-danger' : 'text-success'}`}>
                    {item?.qty_available ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Move Stock</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">From</label>
                    <select value={moveForm.from_location} onChange={(e) => setMoveForm({ ...moveForm, from_location: e.target.value })} className="input text-sm">
                      <option value="back">Back</option>
                      <option value="shelf">Shelf</option>
                      <option value="transit">Transit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">To</label>
                    <select value={moveForm.to_location} onChange={(e) => setMoveForm({ ...moveForm, to_location: e.target.value })} className="input text-sm">
                      <option value="shelf">Shelf</option>
                      <option value="back">Back</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Quantity</label>
                  <input type="number" min="1" value={moveForm.quantity} onChange={(e) => setMoveForm({ ...moveForm, quantity: parseInt(e.target.value) })} className="input font-mono text-sm" />
                </div>
                <button onClick={handleMove} className="btn-primary w-full text-sm">Move Stock</button>
              </div>
            </div>

            <button onClick={handleReceive} className="btn-secondary w-full text-sm">
              Receive Shipment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
