import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';

const API = '/api';
const json = (r) => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); });
const post = (path, body) => fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }).then(json);
const put = (path, body) => fetch(`${API}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }).then(json);
const get = (path) => fetch(`${API}${path}`, { credentials: 'include' }).then(json);

const statusColors = {
  active: 'badge-success',
  paused: 'badge-warning',
  cancelled: 'badge-danger',
  draft: 'badge-neutral',
  published: 'badge-info',
  locked: 'badge-warning',
  delivered: 'badge-success',
};

function MemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState(member || { name: '', email: '', phone: '', subscription_status: 'active', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (member?.id) {
        await put(`/csa/members/${member.id}`, form);
      } else {
        await post('/csa/members', form);
      }
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{member?.id ? 'Edit Member' : 'Add Member'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="input" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Status</label>
            <select value={form.subscription_status} onChange={e => set('subscription_status', e.target.value)} className="input">
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Notes</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="input" rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BoxModal({ box, onClose, onSave }) {
  const [form, setForm] = useState(box || {
    name: '',
    week_start: new Date().toISOString().split('T')[0],
    status: 'draft',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (box?.id) {
        await put(`/csa/boxes/${box.id}`, form);
      } else {
        await post('/csa/boxes', form);
      }
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{box?.id ? 'Edit Box' : 'New Weekly Box'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Box Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="input" required placeholder="e.g. Spring Harvest Box — Week of 4/7" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Week Start (Monday)</label>
              <input type="date" value={form.week_start} onChange={e => set('week_start', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="locked">Locked</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Notes</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="input" rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BoxDetail({ box, onBack, onRefresh }) {
  const { data: detail, loading, refetch } = useFetch(() => get(`/csa/boxes/${box.id}`), [box.id]);
  const { data: inventoryData } = useFetch(() => get('/inventory?limit=500'), []);
  const { data: menuData } = useFetch(() => get('/menu'), []);
  const [addingItem, setAddingItem] = useState(false);
  const [addMode, setAddMode] = useState('grocery'); // 'grocery' or 'menu'
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemSearch, setItemSearch] = useState('');

  const invItems = inventoryData?.items || [];
  const allMenuItems = menuData || [];

  // Calculate surplus score for menu items based on ingredient inventory
  const menuWithSurplus = allMenuItems.map(m => {
    const linked = m.ingredients?.filter(i => i.inventory_item_id) || [];
    if (linked.length === 0) return { ...m, surplusScore: 0, surplusLabel: 'unknown', ingredientCount: 0 };
    let minRatio = Infinity;
    let allHaveSurplus = true;
    let anyLow = false;
    let anyOut = false;
    for (const ing of linked) {
      const inv = invItems.find(i => i.id === ing.inventory_item_id);
      if (!inv) { allHaveSurplus = false; continue; }
      const ratio = inv.qty_available / Math.max(inv.reorder_point || 2, 1);
      minRatio = Math.min(minRatio, ratio);
      if (ratio <= 0) { anyOut = true; anyLow = true; }
      else if (ratio <= 1) anyLow = true;
      if (ratio <= 2) allHaveSurplus = false;
    }
    let surplusLabel;
    if (anyOut) surplusLabel = 'avoid';
    else if (anyLow) surplusLabel = 'low';
    else if (allHaveSurplus) surplusLabel = 'surplus';
    else surplusLabel = 'neutral';
    const surplusScore = anyOut ? -2 : anyLow ? -1 : (allHaveSurplus ? minRatio + 10 : minRatio);
    return { ...m, surplusScore, surplusLabel, ingredientCount: linked.length };
  }).sort((a, b) => b.surplusScore - a.surplusScore);

  const recommendedMenu = menuWithSurplus.filter(m => m.surplusLabel === 'surplus');

  const handleAddItem = async () => {
    if (!selectedItemId) return;
    try {
      await post(`/csa/boxes/${box.id}/items`, { inventory_item_id: parseInt(selectedItemId), quantity: itemQty });
      setAddingItem(false);
      setSelectedItemId('');
      setItemQty(1);
      setItemSearch('');
      refetch();
    } catch (err) { alert(err.message); }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await fetch(`${API}/csa/boxes/${box.id}/items/${itemId}`, { method: 'DELETE', credentials: 'include' });
      refetch();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  const boxItems = detail?.items || [];
  const activeMembers = detail?.active_member_count || 0;

  // Filter items for search
  const filteredGrocery = itemSearch
    ? invItems.filter(i => i.item_name.toLowerCase().includes(itemSearch.toLowerCase()) || (i.brand && i.brand.toLowerCase().includes(itemSearch.toLowerCase())))
    : invItems;

  const filteredMenu = itemSearch
    ? menuWithSurplus.filter(m => m.name.toLowerCase().includes(itemSearch.toLowerCase()))
    : menuWithSurplus;

  return (
    <div>
      <button onClick={onBack} className="btn-ghost mb-4">&larr; Back to boxes</button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="page-title">{detail?.name || box.name}</h2>
          <div className="text-sm text-gray-500 mt-1">
            Week of {new Date(detail?.week_start || box.week_start).toLocaleDateString()} · <span className={`badge ${statusColors[detail?.status || box.status]}`}>{detail?.status || box.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Box Contents ({boxItems.length} items)</h3>
              {(detail?.status === 'draft' || detail?.status === 'published') && !addingItem && (
                <button onClick={() => setAddingItem(true)} className="btn-primary text-sm">+ Add Item</button>
              )}
            </div>

            {addingItem && (
              <div className="border border-primary/20 rounded-xl p-4 mb-4 bg-gray-50 animate-slide-up">
                {/* Grocery / Menu toggle */}
                <div className="flex items-center gap-1 mb-3 bg-gray-100 rounded-lg p-0.5 w-fit">
                  <button
                    onClick={() => { setAddMode('grocery'); setSelectedItemId(''); }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${addMode === 'grocery' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                  >Grocery Item</button>
                  <button
                    onClick={() => { setAddMode('menu'); setSelectedItemId(''); }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${addMode === 'menu' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                  >Menu Item</button>
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    placeholder={`Search ${addMode === 'grocery' ? 'inventory' : 'menu'} items...`}
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="input text-sm"
                  />
                </div>

                {addMode === 'menu' && !itemSearch && (
                  <>
                    {recommendedMenu.length > 0 && (
                      <div className="mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-emerald-700">Recommended — Surplus Ingredients</span>
                          <span className="text-2xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">{recommendedMenu.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recommendedMenu.map(m => (
                            <button
                              key={m.id}
                              onClick={() => setSelectedItemId(String(m.id))}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedItemId === String(m.id) ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-emerald-100 border border-emerald-200'}`}
                            >
                              {m.name} {m.price ? `— $${Number(m.price).toFixed(2)}` : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {menuWithSurplus.filter(m => m.surplusLabel === 'avoid').length > 0 && (
                      <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                        <span className="text-2xs font-medium text-red-600">
                          {menuWithSurplus.filter(m => m.surplusLabel === 'avoid').length} items have out-of-stock ingredients — marked below
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white mb-3">
                  {addMode === 'grocery' ? (
                    filteredGrocery.slice(0, 50).map(i => (
                      <button
                        key={i.id}
                        onClick={() => setSelectedItemId(String(i.id))}
                        className={`w-full text-left px-3 py-2 text-sm border-b border-gray-50 transition-colors flex items-center justify-between ${selectedItemId === String(i.id) ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}
                      >
                        <div>
                          <span className="font-medium">{i.item_name}</span>
                          {i.brand && <span className="text-gray-400"> — {i.brand}</span>}
                          {i.size && <span className="text-gray-400 text-xs ml-1">({i.size})</span>}
                        </div>
                        <span className={`font-mono text-xs ${i.qty_available > i.reorder_point ? 'text-emerald-600' : i.qty_available > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                          {i.qty_available} avail
                        </span>
                      </button>
                    ))
                  ) : (
                    filteredMenu.map(m => {
                      const badgeStyles = {
                        surplus: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
                        neutral: 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/10',
                        low: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
                        avoid: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
                        unknown: 'bg-gray-50 text-gray-400 ring-1 ring-gray-300/30',
                      };
                      const badgeLabels = {
                        surplus: 'Surplus',
                        neutral: 'Stocked',
                        low: 'Low Ingredients',
                        avoid: 'Avoid — Out of Stock',
                        unknown: 'No Ingredients Linked',
                      };
                      const badgeIcons = {
                        surplus: '↑',
                        neutral: '•',
                        low: '↓',
                        avoid: '✕',
                        unknown: '?',
                      };
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedItemId(String(m.id))}
                          className={`w-full text-left px-3 py-2.5 text-sm border-b border-gray-50 transition-colors flex items-center justify-between gap-2 ${selectedItemId === String(m.id) ? 'bg-primary/10 text-primary' : m.surplusLabel === 'avoid' ? 'opacity-60 hover:bg-red-50/50' : 'hover:bg-gray-50'}`}
                        >
                          <div className="min-w-0">
                            <span className="font-medium">{m.name}</span>
                            {m.category && <span className="text-gray-400 text-xs ml-2">{m.category}</span>}
                            {m.price ? <span className="text-gray-400 text-xs ml-1">— ${Number(m.price).toFixed(2)}</span> : null}
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium whitespace-nowrap flex-shrink-0 ${badgeStyles[m.surplusLabel] || badgeStyles.unknown}`}>
                            <span>{badgeIcons[m.surplusLabel] || '?'}</span>
                            {badgeLabels[m.surplusLabel] || 'Unknown'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex items-end gap-3">
                  {selectedItemId && (
                    <div className="flex items-center gap-2 flex-1 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-sm">
                      <span className="text-primary font-medium">
                        Selected: {addMode === 'grocery'
                          ? invItems.find(i => i.id === parseInt(selectedItemId))?.item_name
                          : allMenuItems.find(m => m.id === parseInt(selectedItemId))?.name
                        }
                      </span>
                    </div>
                  )}
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                    <input type="number" min="1" value={itemQty} onChange={e => setItemQty(parseInt(e.target.value))} className="input font-mono text-sm" />
                  </div>
                  <button onClick={handleAddItem} disabled={!selectedItemId} className="btn-primary text-sm disabled:opacity-40">Add</button>
                  <button onClick={() => { setAddingItem(false); setItemSearch(''); setSelectedItemId(''); }} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            )}

            {boxItems.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400">No items in this box yet</p>
                <p className="text-xs text-gray-400 mt-1">Add grocery or menu items to start curating</p>
              </div>
            ) : (
              <div className="space-y-2">
                {boxItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{item.item_name}</div>
                      <div className="text-xs text-gray-400">{item.brand} · {item.size}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono text-sm">{item.quantity} / box</div>
                        <div className="text-xs text-gray-400">{item.quantity * activeMembers} total</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-medium ${item.qty_available >= item.quantity * activeMembers ? 'text-emerald-600' : 'text-red-600'}`}>
                          {item.qty_available} avail
                        </div>
                        {item.qty_available < item.quantity * activeMembers && (
                          <div className="text-xs text-red-500">Short {(item.quantity * activeMembers) - item.qty_available}</div>
                        )}
                      </div>
                      {(detail?.status === 'draft' || detail?.status === 'published') && (
                        <button onClick={() => handleRemoveItem(item.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Box Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Items in box</span>
                <span className="font-mono">{boxItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Active members</span>
                <span className="font-mono">{activeMembers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Total units needed</span>
                <span className="font-mono">{boxItems.reduce((sum, i) => sum + i.quantity * activeMembers, 0)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Stock issues</span>
                <span className={`font-mono font-medium ${boxItems.some(i => i.qty_available < i.quantity * activeMembers) ? 'text-danger' : 'text-success'}`}>
                  {boxItems.filter(i => i.qty_available < i.quantity * activeMembers).length} items short
                </span>
              </div>
            </div>
          </div>

          {detail?.notes && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <p className="text-sm text-[#6B6B6B]">{detail.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CSA() {
  const [tab, setTab] = useState('boxes');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [viewingBox, setViewingBox] = useState(null);

  const { data: members, loading: membersLoading, refetch: refetchMembers } = useFetch(() => get('/csa/members'));
  const { data: boxes, loading: boxesLoading, refetch: refetchBoxes } = useFetch(() => get('/csa/boxes'));

  if (viewingBox) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6">CSA Box Management</h1>
        <BoxDetail box={viewingBox} onBack={() => setViewingBox(null)} onRefresh={refetchBoxes} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">CSA Box Management</h1>

      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setTab('boxes')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'boxes' ? 'border-primary text-primary' : 'border-transparent text-[#6B6B6B] hover:text-[#2D2D2D]'}`}
        >
          Weekly Boxes
        </button>
        <button
          onClick={() => setTab('members')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'members' ? 'border-primary text-primary' : 'border-transparent text-[#6B6B6B] hover:text-[#2D2D2D]'}`}
        >
          Members ({members?.length || 0})
        </button>
      </div>

      {tab === 'boxes' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowBoxModal(true)} className="btn-primary">+ New Weekly Box</button>
          </div>

          {boxesLoading ? (
            <div className="text-center py-8 text-[#6B6B6B]">Loading...</div>
          ) : boxes?.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-[#6B6B6B]">No weekly boxes yet</div>
              <p className="text-sm text-[#6B6B6B] mt-1">Create your first weekly box to start curating CSA deliveries.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boxes?.map(box => (
                <div
                  key={box.id}
                  onClick={() => setViewingBox(box)}
                  className="card cursor-pointer hover:shadow-warm-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{box.name}</h3>
                    <span className={`badge ${statusColors[box.status]}`}>{box.status}</span>
                  </div>
                  <div className="text-sm text-[#6B6B6B]">
                    Week of {new Date(box.week_start).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-[#6B6B6B] mt-2">
                    {box.item_count || 0} items · Click to manage
                  </div>
                  {box.notes && <div className="text-xs text-[#6B6B6B] mt-2 truncate">{box.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditingMember(null); setShowMemberModal(true); }} className="btn-primary">+ Add Member</button>
          </div>

          {membersLoading ? (
            <div className="text-center py-8 text-[#6B6B6B]">Loading...</div>
          ) : members?.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-[#6B6B6B]">No CSA members yet</div>
              <p className="text-sm text-[#6B6B6B] mt-1">Add members to start managing subscriptions.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/60 border-b border-border">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Phone</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-center px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members?.map((m, i) => (
                    <tr key={m.id} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-cream/20'}`}>
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3 text-[#6B6B6B]">{m.email || '—'}</td>
                      <td className="px-4 py-3 text-[#6B6B6B]">{m.phone || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${statusColors[m.subscription_status]}`}>{m.subscription_status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setEditingMember(m); setShowMemberModal(true); }}
                          className="text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showMemberModal && (
        <MemberModal
          member={editingMember}
          onClose={() => { setShowMemberModal(false); setEditingMember(null); }}
          onSave={() => { setShowMemberModal(false); setEditingMember(null); refetchMembers(); }}
        />
      )}

      {showBoxModal && (
        <BoxModal
          onClose={() => setShowBoxModal(false)}
          onSave={() => { setShowBoxModal(false); refetchBoxes(); }}
        />
      )}
    </div>
  );
}
