import { useState } from "react";
import { trpc } from "./lib/trpc";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BillItem {
  itemId: string;
  nameEn: string;
  quantity: number;
  rate: number;
  total: number;
}

const firmDetails = {
  name: "JAISWAL SALES",
  address: "APMC Market, Near Bus Stop, At. Po. Tejgadh, Ta. Dist. Chhotaudepur, Gujarat",
  gstn: "24AAMFJ3444P1ZW",
  pan: "AAMFJ3444P",
  bank: "State Bank Of India Tejgadh, A/C No: 36107439043, IFSC: SBIN0003845",
  contact: "+91 9999999999",
};

export function Billing({ vendor, setActiveTab, setExportedBillDate }: { vendor: any, setActiveTab: (tab: "routes" | "items" | "summary") => void, setExportedBillDate: (date: string | null) => void }) {
  const { data: items = [] } = trpc.items.listItems.useQuery();
  const utils = trpc.useUtils();
  const createBillMutation = trpc.bills.createBill.useMutation({
    onSuccess: async (data) => {
      toast.success("Bill created successfully");
      setBillItems([]);
      await utils.bills.listAllBills.invalidate();
      const newBillDate = new Date(data.date);
      setExportedBillDate(newBillDate.toLocaleDateString());
      setActiveTab("summary");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const selectedItem = items.find((i: any) => i.id === selectedItemId);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      toast.error("Please select an item");
      return;
    }
    const newItem: BillItem = {
      itemId: selectedItem.id,
      nameEn: selectedItem.nameEn,
      quantity,
      rate: selectedItem.rate,
      total: quantity * selectedItem.rate,
    };
    setBillItems([...billItems, newItem]);
    // Reset form
    setSelectedItemId('');
    setQuantity(1);
  };
  
  const subTotal = billItems.reduce((acc, item) => acc + item.total, 0);
  let gstTotal = 0;
  billItems.forEach((billItem) => {
    const item = items.find((i: any) => i.id === billItem.itemId);
    if (item?.hasGst && item.gstPercentage) {
      gstTotal += (billItem.total * item.gstPercentage) / 100;
    }
  });

  const handleCreateBill = () => {
    createBillMutation.mutate({
      vendorId: vendor.id,
      date: new Date().toISOString(),
      items: billItems.map(({ itemId, quantity, rate }) => ({ itemId, quantity, rate })),
      total: subTotal,
      gstTotal,
    });
  };

  const handleDownloadBill = () => {
    const doc = new jsPDF();
    const addHeader = (title: string) => {
      doc.setFontSize(18);
      doc.text(firmDetails.name, 14, 22);
      doc.setFontSize(10);
      doc.text(firmDetails.address, 14, 30);
      doc.text(`GSTIN: ${firmDetails.gstn} | PAN: ${firmDetails.pan}`, 14, 36);
      doc.text(`Contact: ${firmDetails.contact}`, 14, 42);
      doc.line(14, 44, 196, 44);
      doc.setFontSize(14);
      doc.text(title, 105, 52, { align: "center" });
    };

    const addFooter = () => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
        doc.text(firmDetails.bank, 14, 280);
      }
    };

    addHeader(`Bill for ${vendor.name}`);
    let billY = 60;
    doc.setFontSize(10);
    doc.text(`Vendor: ${vendor.name}`, 14, billY); billY += 6;
    doc.text(`Contact: ${vendor.contact || 'N/A'}`, 14, billY); billY += 6;
    doc.text(`Address: ${vendor.address || 'N/A'}`, 14, billY); billY += 8;

    autoTable(doc, {
      startY: billY,
      head: [["Item", "Qty", "Rate", "Amount"]],
      body: billItems.map(item => [
        item.nameEn,
        item.quantity.toString(),
        item.rate.toFixed(2),
        item.total.toFixed(2),
      ]),
    });
    let finalY = (doc as any).lastAutoTable.finalY;
    finalY += 10;
    doc.text(`Subtotal: ${subTotal.toFixed(2)}`, 14, finalY);
    finalY += 6;
    doc.text(`GST: ${gstTotal.toFixed(2)}`, 14, finalY);
    finalY += 6;
    doc.text(`Total: ${(subTotal + gstTotal).toFixed(2)}`, 14, finalY);
    addFooter();
    doc.save(`bill-${vendor.name}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="w-full p-4">
      <h2 className="text-2xl font-semibold mb-4">Create Bill for {vendor.name}</h2>
      
      <form onSubmit={handleAddItem} className="mb-4 p-4 border rounded bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Add Item</h3>
        <div className="grid grid-cols-3 gap-4">
          <select
            title="Select an item"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="p-2 border rounded col-span-2"
          >
            <option value="">Select an item</option>
            {items.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.nameEn} (Rate: {item.rate})
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>
        <button type="submit" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">Add Item</button>
      </form>

      <div>
        <h3 className="text-lg font-semibold mb-2">Bill Items</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Item</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Rate</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {billItems.map((item, index) => (
              <tr key={index}>
                <td className="border p-2">{item.nameEn}</td>
                <td className="border p-2">{item.quantity}</td>
                <td className="border p-2">{item.rate.toFixed(2)}</td>
                <td className="border p-2">{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Bill Summary</h3>
        <p>Subtotal: {subTotal.toFixed(2)}</p>
        <p>GST: {gstTotal.toFixed(2)}</p>
        <p className="font-bold">Total: {(subTotal + gstTotal).toFixed(2)}</p>
        <div className="mt-4 flex gap-4">
          <button
            onClick={handleCreateBill}
            className="px-4 py-2 bg-green-500 text-white rounded"
            disabled={createBillMutation.isPending || billItems.length === 0}
          >
            Export to Summary & Create Bill
          </button>
          <button
            onClick={handleDownloadBill}
            className="px-4 py-2 bg-blue-500 text-white rounded"
            disabled={billItems.length === 0}
          >
            Download Bill
          </button>
        </div>
      </div>
    </div>
  );
}
