import { useState } from "react";
import { trpc } from "./lib/trpc";
import { toast } from "sonner";

export function Items() {
  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.items.listItems.useQuery();
  const createItemMutation = trpc.items.createItem.useMutation({
    onSuccess: () => {
      utils.items.listItems.invalidate();
      toast.success("Item created successfully");
      setNewItem({
        nameEn: "",
        nameGu: "",
        rate: 0,
        hasGst: false,
        gstPercentage: 0,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [newItem, setNewItem] = useState({
    nameEn: "",
    nameGu: "",
    rate: 0,
    hasGst: false,
    gstPercentage: 0,
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.nameEn || !newItem.rate) return;
    createItemMutation.mutate(newItem);
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-4">Items</h2>
      <form onSubmit={handleCreateItem} className="mb-8 p-4 border rounded bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Add New Item</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={newItem.nameEn}
            onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
            placeholder="Item name (English)"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            value={newItem.nameGu}
            onChange={(e) => setNewItem({ ...newItem, nameGu: e.target.value })}
            placeholder="Item name (Gujarati)"
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            value={newItem.rate || ""}
            onChange={(e) => setNewItem({ ...newItem, rate: parseFloat(e.target.value) || 0 })}
            placeholder="Rate"
            className="w-full p-2 border rounded"
            required
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newItem.hasGst}
                onChange={(e) => setNewItem({ ...newItem, hasGst: e.target.checked })}
              />
              Has GST
            </label>
            {newItem.hasGst && (
              <select
                value={newItem.gstPercentage}
                onChange={(e) => setNewItem({ ...newItem, gstPercentage: parseInt(e.target.value) })}
                className="p-2 border rounded"
                title="GST Percentage"
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={createItemMutation.isPending}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Add Item
        </button>
      </form>
      <div>
        <h3 className="text-lg font-semibold mb-2">Existing Items</h3>
        {isLoading ? (
          <p>Loading items...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="p-4 border rounded">
                <p className="font-semibold">{item.nameEn}</p>
                <p>{item.nameGu}</p>
                <p>Rate: ₹{item.rate.toFixed(2)}</p>
                {item.hasGst && <p>GST: {item.gstPercentage}%</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
