import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, CheckCircle2, Receipt, Download } from "lucide-react";
import { getMyInvoices, payInvoice, downloadInvoicePdf } from "../api/endpoints";

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = () => {
    getMyInvoices().then((res) => setInvoices(res.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handlePay = async (id) => {
    setLoadingId(id);
    try {
      await new Promise(r => setTimeout(r, 1000));
      await payInvoice(id);
      toast.success("Payment successful! Thank you.");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Payment failed");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDownload = async (id) => {
    try {
      setDownloadingId(id);
      const res = await downloadInvoicePdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
          <Receipt className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Billing & Invoices</h1>
          <p className="text-sm text-slate-500">Manage and pay your medical bills</p>
        </div>
      </div>

      <div className="grid gap-4">
        {invoices.map((inv) => (
          <div key={inv.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 hover:shadow-md transition-all border-l-primary-500 relative">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg text-slate-800">Invoice #{inv.id}</span>
                <span className={`badge ${inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {inv.status}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Generated: {new Date(inv.created_at).toLocaleDateString()}
              </p>
              {inv.transaction_id && (
                <p className="text-xs text-slate-400 mt-1">TxID: {inv.transaction_id}</p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Amount Due</p>
                <p className="text-2xl font-bold text-slate-800">₹{inv.amount.toFixed(2)}</p>
              </div>
              
              <div className="flex flex-col gap-2 min-w-[120px] justify-center">
                {inv.status === "pending" ? (
                  <button 
                    onClick={() => handlePay(inv.id)} 
                    disabled={loadingId === inv.id}
                    className="btn-primary flex items-center gap-2 justify-center shadow-lg shadow-primary-500/30 w-full"
                  >
                    {loadingId === inv.id ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Pay Now
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-green-600 font-semibold w-full">
                    <CheckCircle2 className="w-5 h-5" /> Paid
                  </div>
                )}
                
                <button
                  onClick={() => handleDownload(inv.id)}
                  disabled={downloadingId === inv.id}
                  className="btn-secondary flex items-center gap-2 justify-center w-full"
                >
                  <Download className={`w-4 h-4 ${downloadingId === inv.id ? 'animate-pulse' : ''}`} />
                  Receipt
                </button>
              </div>
            </div>
          </div>
        ))}

        {invoices.length === 0 && (
          <div className="text-center py-12 card border-dashed border-2">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">You have no invoices yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
