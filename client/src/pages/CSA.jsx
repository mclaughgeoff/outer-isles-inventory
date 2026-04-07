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
  const [addingItem, setAddingItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQty, setItemQty] = useState(1);

  const handleAddItem = async () => {
    if (!selectedItemId) return;
    try {
      await post(`/csa/boxes/${box.id}/items`, { inventory_item_id: parseInt(selectedItemId), quantity: itemQty });
      setAddingItem(false);
      setSelectedItemId('');
      setItemQty(1);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await fetch(`${API}/csa/boxes/${box.id}/items/${itemId}`, { method: 'DELETE', credentials: 'include' });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-8 text-[#6B6B6B]">Loading...</div>;

  const boxItems = detail?.items || [];
  const activeMembers = detail?.active_member_count || 0;

  return (
    <div>
      <button onClick={onBack} className="text-[#6B6B6B] hover:text-[#2D2D2D] mb-4">&larr; Back to boxes</button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">{detail?.name || box.name}</h2>
          <div className="text-sm text-[#6B6B6B] mt-1">
            Week of {new Date(detail?.week_start || box.week_start).toLocaleDateString()} · <span className={`badge ${statusColors[detail?.status || box.status]}`}>{detail?.status || box.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Box Contents ({boxItems.length} items)</h3>
              {(detail?.status === 'draft' || detail?.status === 'published') && (
                <button onClick={() => setAddingItem(true)} className="btn-primary text-sm">+ Add Item</button>
              )}
            </div>

            {addingItem && (
              <div className="border border-primary/30 rounded-lg p-4 mb-4 bg-primary/5">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Select Item</label>
                    <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="input text-sm">
                      <option value="">Choose an inventory item...</option>
                      {inventoryData?.items?.map(i => (
                        <option key={i.id} value={i.id}>{i.item_name} — {i.brand} ({i.size})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Qty per box</label>
                    <input type="number" min="1" value={itemQty} onChange={e => setItemQty(parseInt(e.target.value))} className="input font-mono text-sm" />
                  </div>
                  <button onClick={handleAddItem} className="btn-primary text-sm">Add</button>
                  <button onClick={() => setAddingItem(false)} className="btn-outline text-sm">Cancel</button>
                </div>
              </div>
            )}

            {boxItems.length === 0 ? (
              <p className="text-[#6B6B6B] text-sm py-4">No items in this box yet. Add items to start curating.</p>
            ) : (
              <div className="space-y-2">
                {boxItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 border border-border/50 rounded-lg hover:bg-cream/30">
                    <div>
                      <div className="font-medium text-sm">{item.item_name}</div>
                      <div className="text-xs text-[#6B6B6B]">{item.brand} · {item.size}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono text-sm">{item.quantity} per box</div>
                        <div className="text-xs text-[#6B6B6B]">{item.quantity * activeMembers} total needed</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm ${item.qty_available >= item.quantity * activeMembers ? 'text-success' : 'text-danger'}`}>
                          {item.qty_available} avail
                        </div>
                        {item.qty_available < item.quantity * activeMembers && (
                          <div className="text-xs text-danger">Short {(item.quantity * activeMembers) - item.qty_available}</div>
                        )}
                      </div>
                      {(detail?.status === 'draft' || detail?.status === 'published') && (
                        <button onClick={() => handleRemoveItem(item.id)} className="text-danger hover:text-danger/80 text-xs ml-2">Remove</button>
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
