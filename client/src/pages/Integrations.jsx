import { useState } from 'react';

const integrations = [
  {
    id: 'square',
    name: 'Square',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Square%2C_Inc._-_Square_logo.svg/150px-Square%2C_Inc._-_Square_logo.svg.png',
    category: 'Point of Sale',
    status: 'available',
    description: 'Sync your POS transactions with inventory in real time. Automatically deduct stock when items sell, track daily revenue by product, and reconcile cash vs card payments.',
    features: [
      'Real-time stock deduction on sale',
      'Daily sales reports by item and category',
      'Automatic reorder alerts based on sell-through rate',
      'Menu item pricing sync (push/pull)',
      'Transaction history and payment reconciliation',
    ],
    setupNote: 'Requires a Square Developer API access token. Generate one from your Square Developer Dashboard under Applications > Credentials.',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    logo: 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-shopping-bag-full-color-66166b2e55d67988b56b4bd28b63c271e2b9713358cb723070a92bde17ad7571.svg',
    category: 'E-Commerce',
    status: 'available',
    description: 'Connect your online storefront to sync product listings, inventory levels, and orders. Keep your in-store and online stock counts in perfect sync.',
    features: [
      'Two-way inventory sync (online + in-store)',
      'Auto-publish new items to your Shopify store',
      'Online order fulfillment tracking',
      'Unified product catalog management',
      'Customer order history across channels',
    ],
    setupNote: 'Requires a Shopify Admin API access token. Create a custom app in your Shopify admin under Settings > Apps and sales channels > Develop apps.',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    logo: 'https://quickbooks.intuit.com/cas/dam/IMAGE/A7dqP7W9z/quickbooks-logo-green-rgb.png',
    category: 'Accounting',
    status: 'available',
    description: 'Automatically sync purchase orders, cost of goods sold, and revenue data with your accounting software. Eliminate double-entry and keep your books accurate.',
    features: [
      'Purchase order sync as bills/expenses',
      'COGS tracking by product category',
      'Revenue categorization from POS sales',
      'Vendor payment tracking',
      'Monthly P&L report data feed',
    ],
    setupNote: 'Requires OAuth 2.0 connection via Intuit Developer. You\'ll authorize Outer Isles to access your QuickBooks company from the Intuit sign-in flow.',
  },
  {
    id: 'faire',
    name: 'Faire',
    logo: 'https://cdn.faire.com/static/logo-faire-teal.svg',
    category: 'Wholesale Marketplace',
    status: 'available',
    description: 'Streamline wholesale ordering by syncing your Faire catalog with inventory. Auto-create purchase orders from Faire and track inbound shipments.',
    features: [
      'Auto-import Faire orders as purchase orders',
      'Inbound shipment tracking and receiving',
      'Wholesale cost updates from Faire catalog',
      'New product discovery alerts',
      'Order history and reorder suggestions',
    ],
    setupNote: 'Requires a Faire API key from your Faire brand portal. Navigate to Settings > API Access to generate credentials.',
  },
  {
    id: 'toast',
    name: 'Toast POS',
    logo: 'https://pos.toasttab.com/hubfs/Toast_Logos/toast-logo-orange.svg',
    category: 'Restaurant POS',
    status: 'coming_soon',
    description: 'Purpose-built for food service. Sync menu items, modifiers, and prep ingredients with your Toast POS for seamless kitchen-to-inventory tracking.',
    features: [
      'Menu item and modifier sync',
      'Ingredient-level stock deduction per sale',
      'Prep waste tracking',
      'Recipe costing integration',
      'Kitchen display system coordination',
    ],
    setupNote: 'Requires Toast API Partner credentials. Apply through the Toast Developer portal for API access.',
  },
  {
    id: 'usps',
    name: 'USPS / Shipping',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/USPS_Eagle_symbol.svg/150px-USPS_Eagle_symbol.svg.png',
    category: 'Shipping & Logistics',
    status: 'coming_soon',
    description: 'Track CSA box shipments and vendor deliveries. Get real-time shipping updates and automate delivery notifications to CSA members.',
    features: [
      'CSA box shipment tracking',
      'Delivery notification emails to members',
      'Vendor inbound shipment ETAs',
      'Shipping cost tracking per order',
      'Address validation for CSA members',
    ],
    setupNote: 'Requires USPS Web Tools API credentials. Register at the USPS Web Tools portal for a free API key.',
  },
];

const statusStyles = {
  connected: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Connected' },
  available: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Available' },
  coming_soon: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Coming Soon' },
};

function IntegrationCard({ integration, onConfigure }) {
  const status = statusStyles[integration.status];
  return (
    <div className="card hover:shadow-md transition-all group cursor-pointer" onClick={() => onConfigure(integration)}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
          <img
            src={integration.logo}
            alt={integration.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<span class="text-lg font-bold text-gray-400">${integration.name.charAt(0)}</span>`;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {integration.name}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1.5">{integration.category}</p>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{integration.description}</p>
        </div>
      </div>
    </div>
  );
}

function IntegrationDetailModal({ integration, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const status = statusStyles[integration.status];
  const isComingSoon = integration.status === 'coming_soon';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden p-2.5">
              <img
                src={integration.logo}
                alt={integration.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-xl font-bold text-gray-400">${integration.name.charAt(0)}</span>`;
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{integration.name}</h2>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{integration.category}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-gray-600 leading-relaxed">{integration.description}</p>

          {/* Features */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">What you get</h3>
            <ul className="space-y-2">
              {integration.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Setup */}
          {!isComingSoon && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Setup</h3>
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
                <p className="text-sm text-amber-800 leading-relaxed">{integration.setupNote}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Key / Access Token</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="input w-full"
                />
                <p className="text-xs text-gray-400 mt-1.5">Your key is encrypted and stored securely. You can revoke access at any time.</p>
              </div>
            </div>
          )}

          {isComingSoon && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Coming Soon</p>
              <p className="text-xs text-gray-500 mt-1">This integration is on our roadmap. We'll notify you when it's ready.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          {!isComingSoon && (
            <button
              disabled={!apiKey.trim()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Integrations() {
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? integrations
    : integrations.filter((i) => i.status === filter);

  const categories = [...new Set(integrations.map((i) => i.category))];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">Connect your tools to streamline operations</p>
        </div>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-semibold text-gray-900">0</div>
            <div className="text-xs text-gray-500">Connected</div>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-semibold text-gray-900">{integrations.filter(i => i.status === 'available').length}</div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-semibold text-gray-900">{integrations.filter(i => i.status === 'coming_soon').length}</div>
            <div className="text-xs text-gray-500">Coming Soon</div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { value: 'all', label: 'All' },
          { value: 'available', label: 'Available' },
          { value: 'coming_soon', label: 'Coming Soon' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Integration cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConfigure={setSelectedIntegration}
          />
        ))}
      </div>

      {/* Detail modal */}
      {selectedIntegration && (
        <IntegrationDetailModal
          integration={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
        />
      )}
    </div>
  );
}
