import { trpc } from "./lib/trpc";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

function formatDate(dateNum: string | number | Date) {
  const d = new Date(dateNum);
  return d.toLocaleDateString();
}

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
  contact: "8401772172",
};

interface Item {
  id: string;
  nameEn: string;
  hasGst: boolean;
  gstPercentage?: number;
}

interface Bill {
  id: string;
  vendorId: string;
  date: string;
  total: number;
  gstTotal: number;
  items: {
    itemId: string;
    quantity: number;
    rate: number;
  }[];
}

interface DailySummary {
  day: string;
  bills: Bill[];
  total: number;
  gstTotal: number;
  netTotal: number;
  billCount: number;
  itemCount: number;
  itemSummary: {
    item: Item;
    totalQuantity: number;
    totalAmount: number;
    preTaxAmount: number;
    gstAmount: number;
    totalWithTax: number;
  }[];
}

export default function Summary({ exportedBillDate, setExportedBillDate }: { exportedBillDate: string | null, setExportedBillDate: (date: string | null) => void }) {
  const { data: bills = [], isLoading: billsLoading } = trpc.bills.listAllBills.useQuery();
  const { data: items = [], isLoading: itemsLoading } = trpc.items.listItems.useQuery();
  const { data: vendors = [], isLoading: vendorsLoading } = trpc.routes.listVendorsByRoute.useQuery();
  const utils = trpc.useUtils();

  const deleteBillMutation = trpc.bills.deleteBill.useMutation({
    onSuccess: async () => {
      toast.success("Bill deleted successfully");
      await utils.bills.listAllBills.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete bill: ${error.message}`);
    },
  });

  const [downloading, setDownloading] = useState(false);
  const [filterType, setFilterType] = useState("all"); // 'all', 'today', 'lastWeek', 'lastMonth', 'custom'
  const [customDate, setCustomDate] = useState("");
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (exportedBillDate) {
      setFilterType("custom");
      setCustomDate(exportedBillDate);
      toast.success(`Showing summary for ${exportedBillDate}`);
      setExportedBillDate(null); // Reset after applying
    }
  }, [exportedBillDate, setExportedBillDate]);

  const itemMap = Object.fromEntries(items.map((item: any) => [item.id, item]));
  const vendorMap = Object.fromEntries(vendors.map((v: any) => [v.id, v]));

  const filteredBills: Bill[] = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterType) {
      case "today":
        return bills.filter((bill: Bill) => {
          const billDate = new Date(bill.date);
          return new Date(billDate.getFullYear(), billDate.getMonth(), billDate.getDate()).getTime() === today.getTime();
        });
      case "lastWeek": {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        return bills.filter((bill: Bill) => new Date(bill.date) >= lastWeek);
      }
      case "lastMonth": {
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        return bills.filter((bill: Bill) => new Date(bill.date) >= lastMonth);
      }
      case "custom": {
        if (!customDate) return [];
        return bills.filter((bill: Bill) => formatDate(bill.date) === customDate);
      }
      default: // 'all'
        return bills as Bill[];
    }
  }, [bills, filterType, customDate]);

  const billsByDay: Record<string, Bill[]> = useMemo(() => {
    const byDay: Record<string, Bill[]> = {};
    filteredBills.forEach((bill) => {
      const day = formatDate(bill.date);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(bill);
    });
    return byDay;
  }, [filteredBills]);

  const dailySummaries: DailySummary[] = useMemo(() => {
    return Object.entries(billsByDay).map(([day, dayBills]) => {
      const total = dayBills.reduce((acc, bill) => acc + bill.total, 0);
      const gstTotal = dayBills.reduce((acc, bill) => acc + bill.gstTotal, 0);
      const dailyItemSummary: Record<string, {
        item: Item;
        totalQuantity: number;
        totalAmount: number;
      }> = {};
      
      dayBills.forEach((bill) => {
        if (bill.items && Array.isArray(bill.items)) {
          bill.items.forEach((item) => {
            if (!dailyItemSummary[item.itemId]) {
              dailyItemSummary[item.itemId] = {
                item: itemMap[item.itemId],
                totalQuantity: 0,
                totalAmount: 0,
              };
            }
            dailyItemSummary[item.itemId].totalQuantity += item.quantity;
            dailyItemSummary[item.itemId].totalAmount += item.quantity * item.rate;
          });
        }
      });

      return {
        day,
        bills: dayBills,
        total,
        gstTotal,
        netTotal: total + gstTotal,
        billCount: dayBills.length,
        itemCount: Object.keys(dailyItemSummary).length,
        itemSummary: Object.values(dailyItemSummary).map(summary => {
          const item = summary.item;
          const preTaxAmount = summary.totalAmount;
          let gstAmount = 0;
          if (item?.hasGst && item.gstPercentage) {
            gstAmount = (preTaxAmount * item.gstPercentage) / 100;
          }
          return {
            ...summary,
            preTaxAmount,
            gstAmount,
            totalWithTax: preTaxAmount + gstAmount,
          };
        }),
      };
    });
  }, [billsByDay, itemMap]);

  const allDays = useMemo(() => {
    const days: string[] = Array.from(new Set(bills.map((bill: Bill) => formatDate(bill.date))));
    return days.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [bills]);

  const sortedDailySummaries = useMemo(() => {
    return [...dailySummaries].sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime());
  }, [dailySummaries]);

  if (billsLoading || itemsLoading || vendorsLoading) {
    return <div>Loading...</div>;
  }

  const downloadAllPDF = () => {
    setDownloading(true);
    console.log("Data for PDF generation:", JSON.stringify(filteredBills, null, 2));
    try {
      const doc = new jsPDF();
      const itemMap = items.reduce((acc: any, item: any) => ({ ...acc, [item.id]: item }), {});
      const vendorMap = vendors.reduce((acc: any, vendor: any) => ({ ...acc, [vendor.id]: vendor }), {});

      const addPageFooter = (doc: jsPDF) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, 290, { align: "center" });
          doc.text(firmDetails.bank, 14, 280);
        }
      };
      
      const addBillHeader = (doc: jsPDF, title: string) => {
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

      // --- Global Summary Page ---
      const globalTotal = filteredBills.reduce((acc: any, bill: any) => acc + bill.total, 0);
      const globalGstTotal = filteredBills.reduce((acc: any, bill: any) => acc + bill.gstTotal, 0);
      const globalNetTotal = globalTotal + globalGstTotal;
      const globalItemSummary: Record<string, { item: any; totalQuantity: number; totalAmount: number; totalGst: number; }> = {};
      
      filteredBills.forEach((bill: any) => {
        if (bill.items && Array.isArray(bill.items)) {
          bill.items.forEach((item: any) => {
            const itemModel = itemMap[item.itemId];
            if (!globalItemSummary[item.itemId]) {
              globalItemSummary[item.itemId] = {
                item: itemModel,
                totalQuantity: 0,
                totalAmount: 0,
                totalGst: 0,
              };
            }
            const preTaxAmount = item.quantity * item.rate;
            globalItemSummary[item.itemId].totalQuantity += item.quantity;
            globalItemSummary[item.itemId].totalAmount += preTaxAmount;
            if (itemModel?.hasGst && itemModel.gstPercentage) {
              globalItemSummary[item.itemId].totalGst += (preTaxAmount * itemModel.gstPercentage) / 100;
            }
          });
        }
      });
      
      const filterTitle = filterType === 'custom' && customDate ? `from ${customDate}` : (filterType !== 'all' ? `for ${filterType}` : 'for all dates');
      addBillHeader(doc, `Overall Summary ${filterTitle}`);
      let y = 60;
      doc.setFontSize(12);
      doc.text(`Total Bills: ${filteredBills.length}`, 14, y); y += 8;
      doc.text(`Total Amount: ₹${globalTotal.toFixed(2)}`, 14, y); y += 8;
      doc.text(`Total GST: ₹${globalGstTotal.toFixed(2)}`, 14, y); y += 8;
      doc.text(`Net Total: ₹${globalNetTotal.toFixed(2)}`, 14, y); y += 10;
      
      autoTable(doc, {
        startY: y,
        head: [["Item Name", "Total Qty", "Amount (w/o tax)", "Total GST", "Total Amount (w/ tax)"]],
        body: Object.values(globalItemSummary).map((summaryItem: any) => {
          const totalWithTax = summaryItem.totalAmount + summaryItem.totalGst;
          return [
            summaryItem.item?.nameEn || 'Item not found',
            summaryItem.totalQuantity.toString(),
            `₹${summaryItem.totalAmount.toFixed(2)}`,
            `₹${summaryItem.totalGst.toFixed(2)}`,
            `₹${totalWithTax.toFixed(2)}`,
          ];
        }),
      });

      // --- Individual Bill Pages ---
      filteredBills
      .sort((a: Bill, b: Bill) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach((bill: Bill) => {
        doc.addPage();
        const vendor = vendorMap[bill.vendorId];
        addBillHeader(doc, `Bill for ${vendor?.name || 'N/A'}`);
        
        let billY = 60;
        if (vendor) {
          doc.setFontSize(10);
          doc.text(`Vendor: ${vendor.name}`, 14, billY); billY += 6;
          doc.text(`Route: ${vendor.route?.name || 'N/A'}`, 14, billY); billY += 6;
          doc.text(`Contact: ${vendor.contact || 'N/A'}`, 14, billY); billY += 6;
          doc.text(`Address: ${vendor.address || 'N/A'}`, 14, billY); billY += 8;
        }

        const billItems = bill.items && Array.isArray(bill.items) ? bill.items.map((item: any) => {
          const itemObj = itemMap[item.itemId];
          return {
            itemId: item.itemId,
            nameEn: itemObj?.nameEn || 'Item not found',
            quantity: item.quantity,
            rate: item.rate,
            total: item.quantity * item.rate,
          };
        }) : [];

        const subTotal = billItems.reduce((acc: number, item: any) => acc + item.total, 0);
        let gstTotal = 0;
        billItems.forEach((billItem: any) => {
          const item = itemMap[billItem.itemId];
          if (item?.hasGst && item.gstPercentage) {
            gstTotal += (billItem.total * item.gstPercentage) / 100;
          }
        });

        autoTable(doc, {
          startY: billY,
          head: [["Item", "Qty", "Rate", "Amount (w/o tax)", "GST", "Amount (w/ tax)"]],
          body: billItems.map((item: any) => {
            const itemModel = itemMap[item.itemId];
            let itemGst = 0;
            if (itemModel?.hasGst && itemModel.gstPercentage) {
              itemGst = (item.total * itemModel.gstPercentage) / 100;
            }
            const totalWithTax = item.total + itemGst;
            return [
              item.nameEn,
              item.quantity.toString(),
              item.rate.toFixed(2),
              item.total.toFixed(2),
              itemGst.toFixed(2),
              totalWithTax.toFixed(2),
            ];
          }),
          foot: [
            [{ content: 'Sub-Total', colSpan: 5, styles: { halign: 'right' } }, `₹${subTotal.toFixed(2)}`],
            [{ content: 'GST', colSpan: 5, styles: { halign: 'right' } }, `₹${gstTotal.toFixed(2)}`],
            [{ content: 'Grand Total', colSpan: 5, styles: { halign: 'right' } }, `₹${(subTotal + gstTotal).toFixed(2)}`],
          ],
        });
      });

      addPageFooter(doc);
      doc.save(`summary-${filterType}-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("Failed to generate PDF", error);
      toast.error("Failed to generate PDF. See console for details.");
    } finally {
      setDownloading(false);
    }
  };

  const renderFoundMessage = () => {
    if (filteredBills.length > 0) {
      const uniqueDates = new Set(filteredBills.map((bill: Bill) => formatDate(bill.date)));
      return `Found ${filteredBills.length} bills on ${uniqueDates.size} day(s).`;
    }
    return "No bills found for the selected filter.";
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Summary</h2>
      <div className="mb-4 flex items-center gap-4">
        <label htmlFor="filter-type" className="font-medium">Show bills from:</label>
        <select
          id="filter-type"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            if (e.target.value !== 'custom') {
              setCustomDate('');
            }
          }}
          className="p-2 border rounded"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="lastWeek">Last Week</option>
          <option value="lastMonth">Last Month</option>
          <option value="custom">Specific Date</option>
        </select>
        
        {filterType === 'custom' && (
          <div className="flex space-x-2">
            <label htmlFor="custom-date-select" className="sr-only">Select a date</label>
            <select
              id="custom-date-select"
              value={customDate}
              onChange={(e) => {
                setFilterType("custom");
                setCustomDate(e.target.value);
              }}
              className="p-2 border rounded"
            >
              <option value="">Select a date</option>
              {allDays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        {renderFoundMessage()}
      </div>

      <button
        onClick={downloadAllPDF}
        className="px-4 py-2 bg-purple-600 text-white rounded mb-4"
        disabled={downloading || filteredBills.length === 0}
      >
        {downloading ? "Generating PDF..." : "Download All as PDF"}
      </button>
      <div className="space-y-4 mt-4">
        {sortedDailySummaries.map((summary: DailySummary) => (
          <div key={summary.day} className="p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{summary.day}</h3>
              <button
                onClick={() => setExpandedDays(prev => ({...prev, [summary.day]: !prev[summary.day]}))}
                className="px-3 py-1 bg-gray-200 rounded mb-2"
              >
                {expandedDays[summary.day] ? "Collapse" : "Expand"}
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <p>Total Bills: {summary.billCount}</p>
              <p>Number of Items: {summary.itemCount}</p>
              <p>Total Amount (w/o tax): ₹{summary.total.toFixed(2)}</p>
              <p>Total GST: ₹{summary.gstTotal.toFixed(2)}</p>
              <p>Net Total: ₹{summary.netTotal.toFixed(2)}</p>
            </div>
            {expandedDays[summary.day] && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Daily Item Summary</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (w/o tax)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total GST</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount (w/ tax)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summary.itemSummary.map((item: any) => (
                        <tr key={item.item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{item.item.nameEn}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.totalQuantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{item.preTaxAmount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{item.gstAmount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{item.totalWithTax.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 className="font-semibold mt-4 mb-2">Bills</h4>
                <ul className="space-y-2">
                  {summary.bills.map((bill: Bill) => {
                    const vendor = vendorMap[bill.vendorId];
                    return (
                      <li key={bill.id} className="border p-2 rounded relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <p><strong>Bill ID:</strong> {bill.id}</p>
                            <p><strong>Vendor:</strong> {vendor?.name || 'N/A'} ({vendor?.route.name || 'N/A'})</p>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete bill ${bill.id}?`)) {
                                deleteBillMutation.mutate({ id: bill.id });
                              }
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                            disabled={deleteBillMutation.isPending}
                          >
                            Delete
                          </button>
                        </div>
                        <table className="w-full text-sm mt-2 border-collapse">
                          <thead>
                            <tr>
                              <th className="border p-1">Item</th>
                              <th className="border p-1">Qty</th>
                              <th className="border p-1">Rate</th>
                              <th className="border p-1">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(bill.items || []).map((item: any) => {
                              const itemObj = itemMap[item.itemId];
                              return (
                                <tr key={item.itemId}>
                                  <td className="border p-1">{itemObj?.nameEn || 'Item not found'}</td>
                                  <td className="border p-1">{item.quantity}</td>
                                  <td className="border p-1">₹{item.rate.toFixed(2)}</td>
                                  <td className="border p-1">₹{(item.quantity * item.rate).toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <p className="mt-2"><strong>Total:</strong> ₹{(bill.total + bill.gstTotal).toFixed(2)}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 