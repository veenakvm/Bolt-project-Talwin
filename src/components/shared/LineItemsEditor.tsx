import { X } from 'lucide-react';
import { calculateLineItem, emptyLineItem, lineTaxable, type LineItem } from '../../lib/invoiceUtils';

export interface CatalogProduct {
  id: string;
  product_name: string;
  hsn_sac_code: string;
  unit_price: number;
  unit: string;
  gst_rate: number;
  description: string;
}

const UNITS = ['Pcs', 'Set', 'Nos', 'KW', 'LPH', 'Litre', 'HP', 'LPD', '-'];
const GST_RATES = [0, 5, 8.9, 12, 18, 28];

const input = 'px-2 py-1 border border-gray-300 rounded text-xs';

interface Props {
  items: LineItem[];
  products: CatalogProduct[];
  onChange: (items: LineItem[]) => void;
}

/** Editable line-item table shared by the invoice and quotation forms. */
export default function LineItemsEditor({ items, products, onChange }: Props) {
  const update = (index: number, patch: Partial<LineItem>) => {
    const next = [...items];
    next[index] = calculateLineItem({ ...next[index], ...patch });
    onChange(next);
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    update(index, {
      item_name: product.product_name,
      item_description: product.description || '',
      hsn_sac: product.hsn_sac_code || '',
      price_per_unit: product.unit_price || 0,
      unit: product.unit || 'Pcs',
      gst_rate: product.gst_rate ?? 18
    });
  };

  const remove = (index: number) => {
    if (items.length === 1) {
      alert('Need at least one item');
      return;
    }
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-white text-xs">
            <tr>
              <th className="px-2 py-2 text-left w-8">#</th>
              <th className="px-2 py-2 text-left min-w-[220px]">Product / Item</th>
              <th className="px-2 py-2 text-left">HSN</th>
              <th className="px-2 py-2 text-left">Qty</th>
              <th className="px-2 py-2 text-left">Unit</th>
              <th className="px-2 py-2 text-left">Rate</th>
              <th className="px-2 py-2 text-left">Disc %</th>
              <th className="px-2 py-2 text-right">Taxable</th>
              <th className="px-2 py-2 text-left">GST %</th>
              <th className="px-2 py-2 text-right">GST Amt</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-200 align-top">
                <td className="px-2 py-2 text-center text-gray-500">{index + 1}</td>
                <td className="px-2 py-2">
                  <select
                    value=""
                    onChange={(e) => selectProduct(index, e.target.value)}
                    className={`w-full ${input} mb-1`}
                  >
                    <option value="">-- Select from catalog --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.product_name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={item.item_name}
                    onChange={(e) => update(index, { item_name: e.target.value })}
                    placeholder="Item name"
                    className={`w-full ${input} mb-1`}
                  />
                  <textarea
                    value={item.item_description || ''}
                    onChange={(e) => update(index, { item_description: e.target.value })}
                    placeholder="Description / specs"
                    rows={1}
                    className={`w-full ${input} text-gray-600`}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={item.hsn_sac || ''}
                    onChange={(e) => update(index, { hsn_sac: e.target.value })}
                    className={`w-20 ${input}`}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => update(index, { quantity: parseFloat(e.target.value) })}
                    className={`w-14 ${input}`}
                    min="1"
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={item.unit}
                    onChange={(e) => update(index, { unit: e.target.value })}
                    className={`w-16 ${input}`}
                  >
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={item.price_per_unit}
                    onChange={(e) => update(index, { price_per_unit: parseFloat(e.target.value) })}
                    className={`w-24 ${input}`}
                    step="0.01"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={item.discount_percent || ''}
                    onChange={(e) => update(index, { discount_percent: parseFloat(e.target.value) })}
                    className={`w-14 ${input}`}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                  />
                </td>
                <td className="px-2 py-2 text-right text-xs font-semibold whitespace-nowrap">
                  {lineTaxable(item).toFixed(2)}
                </td>
                <td className="px-2 py-2">
                  <select
                    value={item.gst_rate}
                    onChange={(e) => update(index, { gst_rate: parseFloat(e.target.value) })}
                    className={`w-16 ${input}`}
                  >
                    {GST_RATES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2 text-right text-xs font-semibold whitespace-nowrap">
                  {item.gst_amount.toFixed(2)}
                </td>
                <td className="px-2 py-2 text-center">
                  <button type="button" onClick={() => remove(index)} className="text-red-600 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, emptyLineItem()])}
        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        + Add Row
      </button>
    </div>
  );
}
