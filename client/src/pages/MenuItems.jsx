import { Link } from 'react-router-dom';
import { menu } from '../services/api';
import useFetch from '../hooks/useFetch';

export default function MenuItems() {
  const { data: items, loading } = useFetch(() => menu.list());

  const grouped = items?.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Menu Items</h1>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#6B6B6B]">Loading...</div>
      ) : (
        <div className="space-y-6">
          {grouped && Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category} className="card">
              <h2 className="text-lg font-semibold mb-4">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryItems.map(item => (
                  <div key={item.id} className="border border-border rounded-lg p-4 hover:shadow-warm transition-shadow">
                    <div className="font-medium">{item.name}</div>
                    {item.description && <div className="text-sm text-[#6B6B6B] mt-1">{item.description}</div>}
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-mono font-medium text-primary">
                        {item.price ? `$${Number(item.price).toFixed(2)}` : 'Price TBD'}
                      </span>
                      <span className={`badge ${item.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {item.ingredients?.length > 0 && (
                      <div className="mt-2 text-xs text-[#6B6B6B]">
                        {item.ingredients.length} ingredient{item.ingredients.length !== 1 ? 's' : ''} linked
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
