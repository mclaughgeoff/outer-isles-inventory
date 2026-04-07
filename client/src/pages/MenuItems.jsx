import { useState } from 'react';
import { menu } from '../services/api';
import useFetch from '../hooks/useFetch';
import { SearchIcon, PlusIcon, FilterIcon, MenuIcon as MenuPageIcon } from '../components/Icons';

const API = '/api';
const json = (r) => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); });
const get = (path) => fetch(`${API}${path}`, { credentials: 'include' }).then(json);
const post = (path, body) => fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }).then(json);
const put = (path, body) => fetch(`${API}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }).then(json);

// --- New Inventory Item Modal (inline creation from ingredient picker) ---
function NewInventoryItemModal({ onClose, onCreated, prefillName }) {
  const { data: cats } = useFetch(() => get('/categories'));
  const [form, setForm] = useState({
    item_name: prefillName || '', brand: '', category_id: '', size: '', format: '',
    wholesale_cost: '', retail_price: '', sub_sku: '', distributor: '',
    moq: '', delivery_minimum: '', shipping_cost: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await post('/inventory', {
        ...form,
        wholesale_cost: form.wholesale_cost ? parseFloat(form.wholesale_cost) : null,
        retail_price: form.retail_price ? parseFloat(form.retail_price) : null,
        moq: form.moq ? parseInt(form.moq) : null,
        delivery_minimum: form.delivery_minimum ? parseFloat(form.delivery_minimum) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
      });
      onCreated(created);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-xl max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <h2 className="section-title mb-1">Add New Inventory Item</h2>
        <p className="text-sm text-gray-500 mb-5">This ingredient isn't in inventory yet. Create it here.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Item Name *</label>
              <input value={form.item_name} onChange={e => set('item_name', e.target.value)} className="input" required placeholder="e.g. DIJON MUSTARD" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
              <input value={form.brand} onChange={e => set('brand', e.target.value)} className="input" placeholder="e.g. MAILLE" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className="input">
                <option value="">Select...</option>
                {cats?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Size</label>
              <input value={form.size} onChange={e => set('size', e.target.value)} className="input" placeholder="e.g. 12 OZ" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Format</label>
              <input value={form.format} onChange={e => set('format', e.target.value)} className="input" placeholder="e.g. CPG, JAR" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Wholesale Cost</label>
              <input type="number" step="0.01" value={form.wholesale_cost} onChange={e => set('wholesale_cost', e.target.value)} className="input font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Retail Price</label>
              <input type="number" step="0.01" value={form.retail_price} onChange={e => set('retail_price', e.target.value)} className="input font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Distributor</label>
              <input value={form.distributor} onChange={e => set('distributor', e.target.value)} className="input" placeholder="e.g. FAIRE" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">MOQ</label>
              <input type="number" value={form.moq} onChange={e => set('moq', e.target.value)} className="input font-mono" />
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create & Use'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Ingredient search row ---
function IngredientRow({ ingredient, inventoryItems, onUpdate, onRemove, onRequestNewItem }) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = search.length > 0
    ? inventoryItems.filter(i =>
        i.item_name.toLowerCase().includes(search.toLowerCase()) ||
        (i.brand && i.brand.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 8)
    : [];

  const selectedItem = inventoryItems.find(i => i.id === ingredient.inventory_item_id);

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-500 mb-1">Inventory Item</label>
        {selectedItem ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 text-sm">
              <span className="font-medium text-gray-900">{selectedItem.item_name}</span>
              {selectedItem.brand && <span className="text-gray-500"> — {selectedItem.brand}</span>}
              {selectedItem.size && <span className="text-gray-400 text-xs ml-1">({selectedItem.size})</span>}
            </div>
            <button onClick={() => onUpdate({ ...ingredient, inventory_item_id: null })} className="text-xs text-gray-400 hover:text-gray-600">change</button>
          </div>
        ) : (
          <div className="relative">
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="input text-sm"
              placeholder="Search inventory items..."
            />
            {showDropdown && search.length > 0 && (
              <div className="dropdown-menu top-full left-0 right-0 mt-1">
                {filtered.map(item => (
                  <button
                    key={item.id}
                    className="dropdown-item"
                    onMouseDown={() => {
                      onUpdate({ ...ingredient, inventory_item_id: item.id });
                      setSearch('');
                      setShowDropdown(false);
                    }}
                  >
                    <span className="font-medium">{item.item_name}</span>
                    {item.brand && <span className="text-gray-400"> — {item.brand}</span>}
                    {item.size && <span className="text-gray-400 text-xs ml-1">({item.size})</span>}
                  </button>
                ))}
                {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No matches</div>}
                <button
                  className="dropdown-item !text-primary !font-medium border-t border-gray-100"
                  onMouseDown={() => { setShowDropdown(false); onRequestNewItem(search); }}
                >
                  + Create new inventory item{search ? `: "${search}"` : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="w-20">
        <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
        <input type="number" step="0.01" min="0" value={ingredient.quantity_used || ''} onChange={e => onUpdate({ ...ingredient, quantity_used: parseFloat(e.target.value) || 0 })} className="input text-sm font-mono" />
      </div>
      <div className="w-24">
        <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
        <select value={ingredient.unit || ''} onChange={e => onUpdate({ ...ingredient, unit: e.target.value })} className="input text-sm">
          <option value="">—</option>
          <option value="each">each</option><option value="oz">oz</option><option value="lb">lb</option>
          <option value="slice">slice</option><option value="tbsp">tbsp</option><option value="tsp">tsp</option>
          <option value="cup">cup</option><option value="ml">mL</option><option value="g">g</option>
        </select>
      </div>
      <button onClick={onRemove} className="mt-5 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

// --- Menu Item Edit/Create Modal ---
function MenuItemModal({ item, onClose, onSave }) {
  const { data: inventoryData, refetch: refetchInventory } = useFetch(() => get('/inventory?limit=500'));
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    kitchen_name: item?.kitchen_name || '',
    category: item?.category || '',
    price: item?.price || '',
    tax_category: item?.tax_category || 'meal_tax',
    vendor: item?.vendor || '',
  });
  const [ingredients, setIngredients] = useState(
    item?.ingredients?.filter(i => i.inventory_item_id)?.map(i => ({
      _key: Math.random(), inventory_item_id: i.inventory_item_id, quantity_used: i.quantity_used, unit: i.unit,
    })) || []
  );
  const [saving, setSaving] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [pendingIdx, setPendingIdx] = useState(null);
  const [newItemPrefill, setNewItemPrefill] = useState('');

  const set = (k, v) => setForm({ ...form, [k]: v });
  const invItems = inventoryData?.items || [];

  const addIngredient = () => setIngredients([...ingredients, { _key: Math.random(), inventory_item_id: null, quantity_used: 1, unit: 'each' }]);

  const updateIngredient = (idx, updated) => {
    const next = [...ingredients];
    next[idx] = { ...updated, _key: next[idx]._key };
    setIngredients(next);
  };

  const handleRequestNewItem = (idx, searchText) => {
    setPendingIdx(idx);
    setNewItemPrefill(searchText);
    setShowNewItemModal(true);
  };

  const handleNewItemCreated = (newItem) => {
    setShowNewItemModal(false);
    refetchInventory();
    if (pendingIdx !== null) {
      const next = [...ingredients];
      next[pendingIdx] = { ...next[pendingIdx], inventory_item_id: newItem.id };
      setIngredients(next);
      setPendingIdx(null);
    }
  };

  const totalCost = ingredients.reduce((sum, ing) => {
    if (!ing.inventory_item_id) return sum;
    const inv = invItems.find(i => i.id === ing.inventory_item_id);
    if (!inv?.wholesale_cost || !ing.quantity_used) return sum;
    return sum + (parseFloat(inv.wholesale_cost) * ing.quantity_used);
  }, 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price ? parseFloat(form.price) : null,
        ingredients: ingredients.filter(i => i.inventory_item_id).map(({ _key, ...rest }) => rest),
      };
      if (item?.id) { await put(`/menu/${item.id}`, payload); }
      else { await post('/menu', payload); }
      onSave();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const menuCategories = ['Baked Goods', 'Sandwiches', 'Prepared Dinners', 'Beverages', 'Sides', 'Other'];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <h2 className="section-title mb-5">{item?.id ? 'Edit Menu Item' : 'New Menu Item'}</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="e.g. Turkey Club Sandwich" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
                <option value="">Select category...</option>
                {menuCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Vendor / Source</label>
              <input value={form.vendor} onChange={e => set('vendor', e.target.value)} className="input" placeholder="e.g. b.wild Baking Company" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
              <input type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} className="input font-mono" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tax Category</label>
              <select value={form.tax_category} onChange={e => set('tax_category', e.target.value)} className="input">
                <option value="meal_tax">Meal Tax</option><option value="standard">Standard</option><option value="exempt">Exempt</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kitchen Name</label>
              <input value={form.kitchen_name} onChange={e => set('kitchen_name', e.target.value)} className="input" placeholder="If different from display name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} className="input" placeholder="Optional" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Ingredients</h3>
                <p className="text-xs text-gray-400">Link inventory items used to make this</p>
              </div>
              <button onClick={addIngredient} className="btn-secondary text-xs">
                <PlusIcon className="w-3.5 h-3.5" /> Add Ingredient
              </button>
            </div>

            {ingredients.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400">No ingredients linked</p>
                <button onClick={addIngredient} className="text-sm text-primary hover:underline mt-1">Add your first ingredient</button>
              </div>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <IngredientRow
                    key={ing._key}
                    ingredient={ing}
                    inventoryItems={invItems}
                    onUpdate={(updated) => updateIngredient(idx, updated)}
                    onRemove={() => setIngredients(ingredients.filter((_, i) => i !== idx))}
                    onRequestNewItem={(text) => handleRequestNewItem(idx, text)}
                  />
                ))}
              </div>
            )}

            {ingredients.length > 0 && totalCost > 0 && (
              <div className="mt-3 flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Est. ingredient cost</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-semibold text-gray-900">${totalCost.toFixed(2)}</span>
                  {form.price && totalCost > 0 && (
                    <span className={`text-xs font-medium ${((parseFloat(form.price) - totalCost) / parseFloat(form.price)) * 100 >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {Math.round(((parseFloat(form.price) - totalCost) / parseFloat(form.price)) * 100)}% margin
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Menu Item'}</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>

      {showNewItemModal && (
        <NewInventoryItemModal
          onClose={() => { setShowNewItemModal(false); setPendingIdx(null); }}
          onCreated={handleNewItemCreated}
          prefillName={newItemPrefill}
        />
      )}
    </div>
  );
}

// --- Main Menu Items Page ---
export default function MenuItems() {
  const { data: items, loading, refetch } = useFetch(() => menu.list());
  const { data: inventoryData } = useFetch(() => get('/inventory?limit=500'));
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const invItems = inventoryData?.items || [];

  // Get unique categories
  const categories = [...new Set(items?.map(i => i.category).filter(Boolean))].sort();

  // Filter items
  const filtered = items?.filter(item => {
    if (search) {
      const s = search.toLowerCase();
      if (!item.name.toLowerCase().includes(s) && !(item.vendor || '').toLowerCase().includes(s)) return false;
    }
    if (categoryFilter && item.category !== categoryFilter) return false;
    return true;
  }) || [];

  // Group by category
  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Inventory surplus helper: items with available > reorder_point * 2
  const getInventorySurplus = (menuItem) => {
    if (!menuItem.ingredients?.length) return null;
    const linked = menuItem.ingredients.filter(i => i.inventory_item_id);
    if (linked.length === 0) return null;
    const allSurplus = linked.every(ing => {
      const inv = invItems.find(i => i.id === ing.inventory_item_id);
      return inv && inv.qty_available > (inv.reorder_point || 2) * 2;
    });
    const anySurplus = linked.some(ing => {
      const inv = invItems.find(i => i.id === ing.inventory_item_id);
      return inv && inv.qty_available > (inv.reorder_point || 2) * 2;
    });
    const anyLow = linked.some(ing => {
      const inv = invItems.find(i => i.id === ing.inventory_item_id);
      return inv && inv.qty_available <= (inv.reorder_point || 2);
    });
    if (anyLow) return 'low';
    if (allSurplus) return 'surplus';
    if (anySurplus) return 'partial';
    return 'ok';
  };

  const surplusLabel = {
    surplus: { text: 'Surplus inventory', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10' },
    partial: { text: 'Some surplus', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10' },
    ok: { text: 'Stocked', className: 'bg-gray-50 text-gray-500 ring-1 ring-gray-200' },
    low: { text: 'Low inventory', className: 'bg-red-50 text-red-600 ring-1 ring-red-600/10' },
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Menu Items</h1>
          <p className="text-sm text-gray-500 mt-1">{items?.length || 0} items across {categories.length} categories</p>
        </div>
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Menu Item
        </button>
      </div>

      {/* Search + Filters */}
      <div className="card !p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary ${categoryFilter ? '!border-primary !text-primary' : ''}`}>
            <FilterIcon className="w-4 h-4" /> Filters
            {categoryFilter && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
          </button>
          {categoryFilter && (
            <button onClick={() => setCategoryFilter('')} className="btn-ghost text-xs">Clear</button>
          )}
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 flex-wrap animate-slide-up">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!categoryFilter ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${categoryFilter === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse"><div className="h-5 bg-gray-100 rounded w-32 mb-3" /><div className="h-4 bg-gray-50 rounded w-20" /></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <MenuPageIcon className="empty-icon mx-auto" />
          <h3>{search || categoryFilter ? 'No matching items' : 'No menu items yet'}</h3>
          <p>{search || categoryFilter ? 'Try adjusting your search or filters.' : 'Create your first menu item to get started.'}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{category}</h2>
                <span className="text-xs text-gray-400">{categoryItems.length} items</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryItems.map(item => {
                  const surplus = getInventorySurplus(item);
                  return (
                    <div
                      key={item.id}
                      className="card-hover !p-4"
                      onClick={() => { setEditingItem(item); setShowModal(true); }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <span className="font-mono text-sm font-semibold text-primary flex-shrink-0">
                          {item.price ? `$${Number(item.price).toFixed(2)}` : '—'}
                        </span>
                      </div>
                      {item.vendor && <div className="text-xs text-gray-400 mb-2">from {item.vendor}</div>}
                      {item.description && <div className="text-sm text-gray-500 mb-2">{item.description}</div>}
                      <div className="flex items-center gap-2 mt-3">
                        {item.ingredients?.filter(i => i.inventory_item_id)?.length > 0 ? (
                          <span className="badge-neutral text-2xs">
                            {item.ingredients.filter(i => i.inventory_item_id).length} ingredients
                          </span>
                        ) : (
                          <span className="badge text-2xs bg-amber-50 text-amber-600 ring-1 ring-amber-200">No ingredients</span>
                        )}
                        {surplus && surplusLabel[surplus] && (
                          <span className={`badge text-2xs ${surplusLabel[surplus].className}`}>
                            {surplusLabel[surplus].text}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <MenuItemModal
          item={editingItem}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSave={() => { setShowModal(false); setEditingItem(null); refetch(); }}
        />
      )}
    </div>
  );
}
