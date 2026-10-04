import React, { useState } from 'react';
import { CatalogTemplate, LineItem, LineItemCategory } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Search, Plus, Check, Filter } from 'lucide-react';

interface CatalogPickerModalProps {
  templates: CatalogTemplate[];
  currencySymbol: string;
  onAddItems: (items: LineItem[]) => void;
  onClose: () => void;
}

export const CatalogPickerModal: React.FC<CatalogPickerModalProps> = ({
  templates,
  currencySymbol,
  onAddItems,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = templates.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddSelected = () => {
    const itemsToAdd: LineItem[] = templates
      .filter((t) => selectedIds.includes(t.id))
      .map((t) => ({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        category: t.category,
        description: `${t.title} - ${t.description}`,
        quantity: t.defaultQuantity,
        unit: t.defaultUnit,
        unitPrice: t.defaultPrice,
        unitCost: t.defaultCost,
        taxable: t.taxable,
        isOptional: false,
        selected: true,
      }));

    if (itemsToAdd.length > 0) {
      onAddItems(itemsToAdd);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Service Catalog & Price Book
            </h3>
            <p className="text-xs text-slate-500">
              Select standard service packages or materials to insert into quote
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search services, labor, parts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'labor', 'materials', 'permits_equipment', 'service_fee'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1.5 rounded-md font-medium capitalize whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 bg-slate-50 border border-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px]">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No catalog items match your search.
            </div>
          ) : (
            filtered.map((item) => {
              const isChecked = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleSelect(item.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isChecked
                      ? 'border-blue-900 bg-blue-50/50 ring-1 ring-blue-900'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelect(item.id)}
                      className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(item.defaultPrice, currencySymbol)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      per {item.defaultUnit}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedIds.length} item{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleAddSelected}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Quote ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
