import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { inventory, stock, categories as catApi } from '../services/api';
import useFetch from '../hooks/useFetch';
import { ArrowLeftIcon } from '../components/Icons';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

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
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleMove = async () => {
    try {
      await stock.move(id, moveForm);
      refetch();
      setMoveForm({ ...moveForm, quantity: 1 });
    } catch (err) { alert(err.message); }
  };

  const handleReceive = async () => {
    const qty = prompt('How many units received?');
    if (!qty) return;
    try {
      await stock.receive(id, { quantity: parseInt(qty), to_location: 'back' });
      refetch();
    } catch (err) { alert(err.message); }
  };

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-100 rounded w-32" />
      <div className="h-8 bg-gray-100 rounded w-64" />
      <div className="card"><div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-gray-50 rounded" />)}</div></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/inventory" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">{isNew ? 'New Item' : currentForm.item_name}</h1>
          {!isNew && currentForm.brand && (
            <p className="text-sm text-gray-500">{currentForm.brand} · {currentForm.category_name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Item Details Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Item Details</h2>
              {!isNew && !editing && (
                <button onClick={() => { setForm({ ...item }); setEditing(true); }} className="btn-secondary text-sm">Edit</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Item Name">
                {editing ? <input value={currentForm.item_name || ''} onChange={(e) => set('item_name', e.target.value)} className="input" />
                  : <div className="text-sm font-medium">{currentForm.item_name || '—'}</div>}
              </Field>
              <Field label="Category">
                {editing ? (
                  <select value={currentForm.category_id || ''} onChange={(e) => set('category_id', e.target.value)} className="input">
                    <option value="">Select...</option>
                    {cats?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : <div className="text-sm">{currentForm.category_name || '—'}</div>}
              </Field>
              <Field label="Brand">
                {editing ? <input value={currentForm.brand || ''} onChange={(e) => set('brand', e.target.value)} className="input" />
                  : <div className="text-sm">{currentForm.brand || '—'}</div>}
              </Field>
              <Field label="Size">
                {editing ? <input value={currentForm.size || ''} onChange={(e) => set('size', e.target.value)} className="input" />
                  : <div className="text-sm font-mono">{currentForm.size || '—'}</div>}
              </Field>
              <div className="col-span-2">
                <Field label="Description / Sub-SKU">
                  {editing ? <input value={currentForm.sub_sku || ''} onChange={(e) => set('sub_sku', e.target.value)} className="input" />
                    : <div className="text-sm text-gray-500">{currentForm.sub_sku || '—'}</div>}
                </Field>
              </div>
              <Field label="Format">
                {editing ? <input value={currentForm.format || ''} onChange={(e) => set('format', e.target.value)} className="input" />
                  : <div className="text-sm">{currentForm.format || '—'}</div>}
              </Field>
              <Field label="Distributor">
                {editing ? <input value={currentForm.distributor || ''} onChange={(e) => set('distributor', e.target.value)} className="input" />
                  : <div className="text-sm">{currentForm.distributor || '—'}</div>}
              </Field>
            </div>

            {/* Pricing */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Pricing</h3>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Wholesale Cost">
                  {editing ? <input type="number" step="0.01" value={currentForm.wholesale_cost || ''} onChange={(e) => set('wholesale_cost', e.target.value)} className="input font-mono" />
                    : <div className="text-sm font-mono">{currentForm.wholesale_cost ? `$${Number(currentForm.wholesale_cost).toFixed(2)}` : '—'}</div>}
                </Field>
                <Field label="Retail Price">
                  {editing ? <input type="number" step="0.01" value={currentForm.retail_price || ''} onChange={(e) => set('retail_price', e.target.value)} className="input font-mono" />
                    : <div className="text-sm font-mono font-medium">{currentForm.retail_price ? `$${Number(currentForm.retail_price).toFixed(2)}` : '—'}</div>}
                </Field>
                <Field label="Margin">
                  <div className={`text-sm font-mono font-semibold ${currentForm.margin_pct >= 40 ? 'text-emerald-600' : currentForm.margin_pct >= 25 ? 'text-gray-700' : 'text-amber-600'}`}>
                    {currentForm.margin_pct ? `${currentForm.margin_pct}%` : '—'}
                  </div>
                </Field>
              </div>
            </div>

            {/* Ordering */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Ordering</h3>
              <div className="grid grid-cols-3 gap-4">
                <Field label="MOQ">
                  {editing ? <input type="number" value={currentForm.moq || ''} onChange={(e) => set('moq', e.target.value)} className="input font-mono" />
                    : <div className="text-sm font-mono">{currentForm.moq || '—'}</div>}
                </Field>
                <Field label="Delivery Minimum">
                  {editing ? <input type="number" step="0.01" value={currentForm.delivery_minimum || ''} onChange={(e) => set('delivery_minimum', e.target.value)} className="input font-mono" />
                    : <div className="text-sm font-mono">{currentForm.delivery_minimum ? `$${Number(currentForm.delivery_minimum).toFixed(2)}` : '—'}</div>}
                </Field>
                <Field label="Shipping">
                  {editing ? <input value={currentForm.shipping_cost || ''} onChange={(e) => set('shipping_cost', e.target.value)} className="input" />
                    : <div className="text-sm">{currentForm.shipping_cost || '—'}</div>}
                </Field>
              </div>
            </div>

            {editing && (
              <div className="mt-6 pt-5 border-t border-gray-100 flex gap-3">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : isNew ? 'Create Item' : 'Save Changes'}
                </button>
                {!isNew && <button onClick={() => { setEditing(false); setForm(null); }} className="btn-secondary">Cancel</button>}
              </div>
            )}
          </div>

          {/* Movement History */}
          {!isNew && item?.movements?.length > 0 && (
            <div className="card">
              <h2 className="section-title mb-4">Stock Movement History</h2>
              <div className="space-y-1">
                {item.movements.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <span className="font-medium capitalize text-gray-900">{m.movement_type}</span>
                      {m.from_location && <span className="text-gray-500"> · {m.from_location} → {m.to_location}</span>}
                      {m.notes && <span className="text-gray-400 ml-2">— {m.notes}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono font-semibold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        {!isNew && (
          <div className="space-y-6">
            {/* Stock Levels */}
            <div className="card">
              <h2 className="section-title mb-4">Stock Levels</h2>
              <div className="space-y-3">
                {[
                  { label: 'On Shelf', value: item?.qty_on_shelf ?? 0, color: 'text-gray-900' },
                  { label: 'In Back', value: item?.qty_in_back ?? 0, color: 'text-gray-900' },
                  { label: 'In Transit', value: item?.qty_in_transit ?? 0, color: 'text-blue-600' },
                  { label: 'Reserved (CSA)', value: item?.qty_reserved_csa ?? 0, color: 'text-amber-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`font-mono font-medium ${color}`}>{value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span className="font-mono font-semibold">{item?.qty_total ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Available</span>
                    <span className={`font-mono font-semibold text-lg ${(item?.qty_available ?? 0) <= 0 ? 'text-red-600' : (item?.qty_available ?? 0) <= (item?.reorder_point ?? 0) ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {item?.qty_available ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Move Stock */}
            <div className="card">
              <h2 className="section-title mb-4">Move Stock</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="From">
                    <select value={moveForm.from_location} onChange={(e) => setMoveForm({ ...moveForm, from_location: e.target.value })} className="input text-sm">
                      <option value="back">Back</option><option value="shelf">Shelf</option><option value="transit">Transit</option>
                    </select>
                  </Field>
                  <Field label="To">
                    <select value={moveForm.to_location} onChange={(e) => setMoveForm({ ...moveForm, to_location: e.target.value })} className="input text-sm">
                      <option value="shelf">Shelf</option><option value="back">Back</option>
                    </select>
                  </Field>
                </div>
                <Field label="Quantity">
                  <input type="number" min="1" value={moveForm.quantity} onChange={(e) => setMoveForm({ ...moveForm, quantity: parseInt(e.target.value) })} className="input font-mono text-sm" />
                </Field>
                <button onClick={handleMove} className="btn-primary w-full text-sm">Move Stock</button>
              </div>
            </div>

            <button onClick={handleReceive} className="btn-secondary w-full">
              Receive Shipment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
