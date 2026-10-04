import React, { useState } from 'react';
import { BusinessProfile, CatalogTemplate, LineItemCategory, TradeType, UnitType } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Search, Plus, Trash2, Edit2, Check, BookOpen, Tag } from 'lucide-react';

interface CatalogManagerProps {
  templates: CatalogTemplate[];
  business: BusinessProfile;
  onUpdateTemplates: (templates: CatalogTemplate[]) => void;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  templates,
  business,
  onUpdateTemplates,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New item form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LineItemCategory>('labor');
  const [defaultQuantity, setDefaultQuantity] = useState(1);
  const [defaultUnit, setDefaultUnit] = useState<UnitType>('hours');
  const [defaultPrice, setDefaultPrice] = useState(150);
  const [defaultCost, setDefaultCost] = useState(65);
  const [taxable, setTaxable] = useState(false);

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSaveItem = () => {
    if (!title.trim()) {
      alert('Please provide an item title.');
      return;
    }

    if (editingId) {
      const updated = templates.map((t) =>
        t.id === editingId
          ? {
              ...t,
              title: title.trim(),
              description: description.trim(),
              category,
              defaultQuantity: Number(defaultQuantity) || 1,
              defaultUnit,
              defaultPrice: Number(defaultPrice) || 0,
              defaultCost: Number(defaultCost) || 0,
              taxable,
            }
          : t
      );
      onUpdateTemplates(updated);
      setEditingId(null);
    } else {
      const newItem: CatalogTemplate = {
        id: `custom_tmpl_${Date.now()}`,
        trade: business.trade,
        title: title.trim(),
        description: description.trim(),
        category,
        defaultQuantity: Number(defaultQuantity) || 1,
        defaultUnit,
        defaultPrice: Number(defaultPrice) || 0,
        defaultCost: Number(defaultCost) || 0,
        taxable,
      };
      onUpdateTemplates([newItem, ...templates]);
    }

    // Reset form
    setTitle('');
    setDescription('');
    setDefaultQuantity(1);
    setDefaultPrice(150);
    setDefaultCost(65);
    setShowAddForm(false);
  };

  const handleStartEdit = (item: CatalogTemplate) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setDefaultQuantity(item.defaultQuantity);
    setDefaultUnit(item.defaultUnit);
    setDefaultPrice(item.defaultPrice);
    setDefaultCost(item.defaultCost);
    setTaxable(item.taxable);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this catalog item?')) {
      onUpdateTemplates(templates.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Price Book & Service Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standardize your labor rates, equipment, and material packages for 1-click quoting.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setTitle('');
            setDescription('');
            setShowAddForm(!showAddForm);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs cursor-pointer self-start sm:self-auto transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Close Form' : 'Add Catalog Item'}</span>
        </button>
      </div>

      {/* Add / Edit Form Drawer */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {editingId ? 'Edit Catalog Service Item' : 'New Catalog Service Package'}
            </h3>
            <span className="text-[11px] text-slate-400">
              For {business.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item / Service Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Journeyman Diagnostic Labor"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LineItemCategory)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white capitalize"
              >
                <option value="labor">Labor</option>
                <option value="materials">Materials</option>
                <option value="permits_equipment">Permits & Equipment</option>
                <option value="service_fee">Service Fee</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Scope Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed customer-facing specification of what is included in this line item..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Unit Type
              </label>
              <select
                value={defaultUnit}
                onChange={(e) => setDefaultUnit(e.target.value as UnitType)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
              >
                <option value="hours">Hours</option>
                <option value="units">Units</option>
                <option value="flat rate">Flat Rate</option>
                <option value="sq ft">Sq Ft</option>
                <option value="linear ft">Linear Ft</option>
                <option value="days">Days</option>
                <option value="rooms">Rooms</option>
                <option value="trips">Trips</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Billing Price ({business.currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Cost ({business.currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={defaultCost}
                onChange={(e) => setDefaultCost(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono tabular-nums text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={taxable}
                onChange={(e) => setTaxable(e.target.checked)}
                className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
              />
              <span>Subject to Sales Tax by default</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingId ? 'Update Item' : 'Save to Price Book'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search price book by keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'labor', 'materials', 'permits_equipment', 'service_fee'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap cursor-pointer transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Items' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-3 px-4">Service & Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4 text-right">Client Rate</th>
              <th className="py-3 px-4 text-right">Est Cost</th>
              <th className="py-3 px-4 text-right">Margin %</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No catalog items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const profit = item.defaultPrice - item.defaultCost;
                const margin = item.defaultPrice > 0 ? (profit / item.defaultPrice) * 100 : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap capitalize text-slate-600">
                      {item.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      per {item.defaultUnit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(item.defaultPrice, business.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums whitespace-nowrap">
                      {formatCurrency(item.defaultCost, business.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          margin >= 45
                            ? 'text-emerald-700'
                            : margin >= 30
                            ? 'text-amber-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {margin.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
