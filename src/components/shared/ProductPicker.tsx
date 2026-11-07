import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface PickedProduct {
  product_id: string | null;
  product_name: string;
  product_specs: string;
}

interface CatalogEntry {
  id: string;
  product_name: string;
  description: string;
  unit: string;
  unit_price: number;
}

let catalogCache: Promise<CatalogEntry[]> | null = null;

/** Loads the product catalog once and shares it between pickers on the page. */
export function useProductCatalog(): CatalogEntry[] {
  const [products, setProducts] = useState<CatalogEntry[]>([]);
  useEffect(() => {
    if (!catalogCache) {
      catalogCache = (async () => {
        const { data, error } = await supabase
          .from('products')
          .select('id, product_name, description, unit, unit_price')
          .order('product_name');
        if (error) {
          console.error('Error fetching products:', error.message);
          catalogCache = null;
          return [];
        }
        return data || [];
      })();
    }
    let active = true;
    catalogCache.then(p => { if (active) setProducts(p); });
    return () => { active = false; };
  }, []);
  return products;
}

interface Props {
  value: PickedProduct;
  onChange: (value: PickedProduct) => void;
  label?: string;
  ringClass?: string;
}

/** Choose a product from the catalog; shows its specs underneath. */
export default function ProductPicker({ value, onChange, label = 'Product', ringClass = 'focus:ring-blue-500' }: Props) {
  const products = useProductCatalog();

  const select = (id: string) => {
    const p = products.find(x => x.id === id);
    onChange(p
      ? { product_id: p.id, product_name: p.product_name, product_specs: p.description || '' }
      : { product_id: null, product_name: '', product_specs: '' });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value.product_id || ''}
        onChange={(e) => select(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${ringClass} focus:border-transparent`}
      >
        <option value="">-- Select product --</option>
        {value.product_id && !products.some(p => p.id === value.product_id) && (
          <option value={value.product_id}>{value.product_name}</option>
        )}
        {products.map(p => (
          <option key={p.id} value={p.id}>{p.product_name}</option>
        ))}
      </select>
      {value.product_specs && (
        <p className="mt-1 text-xs text-gray-600 whitespace-pre-line bg-gray-50 border border-gray-200 rounded p-2">
          <span className="font-semibold">Specs: </span>{value.product_specs}
        </p>
      )}
    </div>
  );
}
