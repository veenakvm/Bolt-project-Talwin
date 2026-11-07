import { lineTaxable, type LineItem } from '../../lib/invoiceUtils';

interface Props {
  items: LineItem[];
  gstTotal: number;
}

/** Read-only line-item table for the on-screen invoice / quotation preview. GST is the last column. */
export default function LineItemsPreview({ items, gstTotal }: Props) {
  const taxableTotal = items.reduce((s, i) => s + lineTaxable(i), 0);
  const qtyTotal = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <table className="w-full mb-4 text-xs border-collapse">
      <thead>
        <tr className="bg-gray-800 text-white">
          <th className="p-1.5 text-left w-6">#</th>
          <th className="p-1.5 text-left">Item & Description</th>
          <th className="p-1.5 text-left">HSN</th>
          <th className="p-1.5 text-right">Qty</th>
          <th className="p-1.5 text-left">Unit</th>
          <th className="p-1.5 text-right">Rate</th>
          <th className="p-1.5 text-right">Disc</th>
          <th className="p-1.5 text-right">Taxable</th>
          <th className="p-1.5 text-right">GST</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={item.id || i} className="border-b border-gray-200 align-top">
            <td className="p-1.5 text-center text-gray-500">{i + 1}</td>
            <td className="p-1.5">
              <div className="font-semibold">{item.item_name}</div>
              {item.item_description && (
                <div className="text-gray-500 whitespace-pre-line">{item.item_description}</div>
              )}
            </td>
            <td className="p-1.5 text-gray-600 whitespace-nowrap">{item.hsn_sac || '—'}</td>
            <td className="p-1.5 text-right">{item.quantity}</td>
            <td className="p-1.5">{item.unit}</td>
            <td className="p-1.5 text-right whitespace-nowrap">₹{item.price_per_unit.toFixed(2)}</td>
            <td className="p-1.5 text-right">{item.discount_percent ? `${item.discount_percent}%` : '—'}</td>
            <td className="p-1.5 text-right whitespace-nowrap">₹{lineTaxable(item).toFixed(2)}</td>
            <td className="p-1.5 text-right whitespace-nowrap">
              ₹{item.gst_amount.toFixed(2)}
              <div className="text-gray-500">@ {item.gst_rate}%</div>
            </td>
          </tr>
        ))}
        <tr className="bg-gray-100 font-bold border-t-2 border-b-2 border-gray-800">
          <td></td>
          <td className="p-1.5">Total</td>
          <td></td>
          <td className="p-1.5 text-right">{qtyTotal}</td>
          <td colSpan={3}></td>
          <td className="p-1.5 text-right whitespace-nowrap">₹{taxableTotal.toFixed(2)}</td>
          <td className="p-1.5 text-right whitespace-nowrap">₹{gstTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  );
}
