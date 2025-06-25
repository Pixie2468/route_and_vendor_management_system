import { useState } from "react";
import { trpc } from "./lib/trpc";
import { Billing } from "./Billing";
import { toast } from "sonner";

export function Routes({ setActiveTab, setExportedBillDate }: { setActiveTab: (tab: "routes" | "items" | "summary") => void, setExportedBillDate: (date: string | null) => void }) {
  const utils = trpc.useUtils();
  const { data: routes = [] } = trpc.routes.listRoutes.useQuery();
  const createRouteMutation = trpc.routes.createRoute.useMutation({
    onSuccess: () => {
      utils.routes.listRoutes.invalidate();
      toast.success("Route created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [newRouteName, setNewRouteName] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName) return;
    createRouteMutation.mutate({ name: newRouteName });
    setNewRouteName("");
  };

  return (
    <div className="flex gap-8">
      <div className="w-1/3">
        <h2 className="text-2xl font-semibold mb-4">Routes</h2>
        <form onSubmit={handleCreateRoute} className="mb-4">
          <input
            type="text"
            value={newRouteName}
            onChange={(e) => setNewRouteName(e.target.value)}
            placeholder="New route name"
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            disabled={!newRouteName || createRouteMutation.isPending}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Add Route
          </button>
        </form>
        <ul className="space-y-2">
          {routes.map((route) => (
            <li
              key={route.id}
              className={`p-2 rounded cursor-pointer ${
                selectedRoute === route.id ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              onClick={() => {
                setSelectedRoute(route.id);
                setSelectedVendor(null);
              }}
            >
              {route.name}
            </li>
          ))}
        </ul>
      </div>
      {selectedRoute && (
        <VendorList
          routeId={selectedRoute}
          selectedVendor={selectedVendor}
          onSelectVendor={setSelectedVendor}
        />
      )}
      {selectedVendor && (
        <div className="w-full">
          <Billing vendor={selectedVendor} setActiveTab={setActiveTab} setExportedBillDate={setExportedBillDate} />
        </div>
      )}
    </div>
  );
}

function VendorList({
  routeId,
  selectedVendor,
  onSelectVendor,
}: {
  routeId: string;
  selectedVendor: any | null;
  onSelectVendor: (vendor: any | null) => void;
}) {
  const utils = trpc.useUtils();
  const { data: vendors = [] } = trpc.routes.listVendorsByRoute.useQuery(routeId);
  const createVendorMutation = trpc.routes.addVendorToRoute.useMutation({
    onSuccess: () => {
      utils.routes.listVendorsByRoute.invalidate({ routeId });
      toast.success("Vendor created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorContact, setNewVendorContact] = useState("");
  const [newVendorAddress, setNewVendorAddress] = useState("");

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName) return;
    createVendorMutation.mutate({
      name: newVendorName,
      routeId,
      contact: newVendorContact,
      address: newVendorAddress,
    });
    setNewVendorName("");
    setNewVendorContact("");
    setNewVendorAddress("");
  };

  return (
    <div className="w-2/3">
      <h2 className="text-2xl font-semibold mb-4">Vendors</h2>
      <form onSubmit={handleCreateVendor} className="mb-4">
        <input
          type="text"
          value={newVendorName}
          onChange={(e) => setNewVendorName(e.target.value)}
          placeholder="New vendor name"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={newVendorContact}
          onChange={(e) => setNewVendorContact(e.target.value)}
          placeholder="Contact details"
          className="w-full p-2 border rounded mt-2"
        />
        <input
          type="text"
          value={newVendorAddress}
          onChange={(e) => setNewVendorAddress(e.target.value)}
          placeholder="Address"
          className="w-full p-2 border rounded mt-2"
        />
        <button
          type="submit"
          disabled={!newVendorName || createVendorMutation.isPending}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Add Vendor
        </button>
      </form>
      <div className="grid grid-cols-2 gap-4">
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            className={`p-4 border rounded cursor-pointer ${
              selectedVendor?.id === vendor.id ? "border-blue-500" : "hover:border-gray-300"
            }`}
            onClick={() => onSelectVendor(vendor)}
          >
            <h3 className="font-semibold">{vendor.name}</h3>
            {vendor.contact && <p className="text-sm">Contact: {vendor.contact}</p>}
            {vendor.address && <p className="text-sm">Address: {vendor.address}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
