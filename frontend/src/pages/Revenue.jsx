import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { 
  DollarSign, 
  IndianRupee,
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Search, 
  Plus, 
  Download, 
  Filter, 
  FileText, 
  User, 
  Stethoscope, 
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Receipt
} from "lucide-react";
import { getAllInvoices, generateDirectBill, downloadInvoicePdf, payInvoice } from "../api/endpoints";

export default function Revenue() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const res = await getAllInvoices();
      setInvoices(res.data || []);
    } catch (err) {
      toast.error("Failed to load hospital revenue records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueData();
  }, []);

  // Calculate Revenue Stats
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let collectedRevenue = 0;
    let pendingRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;

    invoices.forEach((inv) => {
      const amt = parseFloat(inv.amount) || 0;
      totalRevenue += amt;
      if (inv.status === "paid") {
        collectedRevenue += amt;
        paidCount += 1;
      } else {
        pendingRevenue += amt;
        pendingCount += 1;
      }
    });

    const avgBill = invoices.length > 0 ? totalRevenue / invoices.length : 0;
    const collectionRate = totalRevenue > 0 ? ((collectedRevenue / totalRevenue) * 100).toFixed(1) : "0.0";

    return {
      totalRevenue,
      collectedRevenue,
      pendingRevenue,
      paidCount,
      pendingCount,
      totalCount: invoices.length,
      avgBill,
      collectionRate
    };
  }, [invoices]);

  // Extract unique known patients from invoices for easy selection in modal
  const knownPatients = useMemo(() => {
    const map = new Map();
    invoices.forEach(inv => {
      if (inv.patient_id && !map.has(inv.patient_id)) {
        map.set(inv.patient_id, inv.patient_name || `Patient #${inv.patient_id}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [invoices]);

  // Filter & Sort
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          (inv.patient_name && inv.patient_name.toLowerCase().includes(q)) ||
          (inv.doctor_name && inv.doctor_name.toLowerCase().includes(q)) ||
          (inv.reason && inv.reason.toLowerCase().includes(q)) ||
          inv.id.toString().includes(q) ||
          inv.patient_id.toString().includes(q);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "highest") return b.amount - a.amount;
        if (sortBy === "oldest") return a.id - b.id;
        return b.id - a.id; // newest
      });
  }, [invoices, statusFilter, searchTerm, sortBy]);

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (!patientId || !amount) {
      toast.error("Please enter both Patient ID and Amount");
      return;
    }
    try {
      setSubmitting(true);
      await generateDirectBill({
        patient_id: parseInt(patientId),
        amount: parseFloat(amount),
        description: description.trim() || "Hospital Medical & Consultation Charge"
      });
      toast.success("New Hospital Invoice Generated!");
      setShowModal(false);
      setPatientId("");
      setAmount("");
      setDescription("");
      loadRevenueData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate bill");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async (id) => {
    try {
      setDownloadingId(id);
      const res = await downloadInvoicePdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Hospital_Invoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error("Failed to download PDF invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      setPayingId(id);
      await payInvoice(id);
      toast.success("Invoice marked as paid!");
      loadRevenueData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not mark as paid");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm tracking-wider uppercase mb-1">
              <TrendingUp className="w-4 h-4" />
              Financial & Billing Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hospital Revenue Overview
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1 max-w-2xl">
              Track doctor consultations, department billings, paid settlements, and real-time hospital earnings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Generate Direct Bill
            </button>
          </div>
        </div>

        {/* Revenue Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-primary-100 text-sm font-medium">Total Gross Revenue</span>
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-black mt-4">
                ₹{stats.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-primary-100">
              <span>{stats.totalCount} Total Invoices</span>
              <span className="flex items-center gap-0.5 text-emerald-300 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" /> 100% Billed
              </span>
            </div>
          </div>

          {/* Collected Revenue */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm font-semibold">Collected (Paid)</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-4">
                ₹{stats.collectedRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{stats.paidCount} Paid Bills</span>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {stats.collectionRate}% Rate
              </span>
            </div>
          </div>

          {/* Pending Revenue */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm font-semibold">Unpaid Balances</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-4">
                ₹{stats.pendingRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{stats.pendingCount} Pending Bills</span>
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Action Required
              </span>
            </div>
          </div>

          {/* Average Bill */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-primary-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm font-semibold">Average Bill Value</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-4">
                ₹{stats.avgBill.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Per Consultation / Stay</span>
              <span className="text-primary-600 font-semibold">Standardized</span>
            </div>
          </div>
        </div>

        {/* Filter & Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          
          {/* Controls Bar */}
          <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, doctor, reason, #ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>

            {/* Filter Pills & Sort */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({invoices.length})
                </button>
                <button
                  onClick={() => setStatusFilter("paid")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "paid" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Paid ({stats.paidCount})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "pending" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Unpaid ({stats.pendingCount})
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="highest">Sort: Highest Amount</option>
                <option value="oldest">Sort: Oldest First</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Loading hospital revenue records...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-700">No matching billing records found</h4>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Invoice & Date</th>
                    <th className="py-4 px-6">Patient</th>
                    <th className="py-4 px-6">Doctor / Issuer</th>
                    <th className="py-4 px-6">Service / Description</th>
                    <th className="py-4 px-6">Bill Value</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredInvoices.map((inv) => {
                    const isPaid = inv.status === "paid";
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md text-xs font-bold">
                              #INV-{inv.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-normal mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {inv.created_at ? new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today"}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{inv.patient_name || `Patient #${inv.patient_id}`}</div>
                              <div className="text-xs text-slate-400">ID: #{inv.patient_id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <Stethoscope className="w-4 h-4 text-primary-600 shrink-0" />
                            <span>{inv.doctor_name || "Hospital Administration"}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="text-slate-600 font-medium block max-w-xs truncate" title={inv.reason}>
                            {inv.reason || "Hospital Care & Medical Bill"}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-extrabold text-slate-900 text-base">
                            ₹{parseFloat(inv.amount).toFixed(2)}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                              <Clock className="w-3.5 h-3.5" /> Unpaid
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isPaid && (
                              <button
                                onClick={() => handleMarkPaid(inv.id)}
                                disabled={payingId === inv.id}
                                className="text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                              >
                                {payingId === inv.id ? "Saving..." : "Mark Paid"}
                              </button>
                            )}
                            <button
                              onClick={() => handleDownloadPdf(inv.id)}
                              disabled={downloadingId === inv.id}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              title="Download PDF Invoice"
                            >
                              <Download className={`w-4 h-4 ${downloadingId === inv.id ? "animate-bounce" : ""}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Generating Bill right on Revenue Page */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-600" />
                Generate Hospital Bill
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateBill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Patient ID or Selection
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {knownPatients.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) setPatientId(e.target.value);
                      }}
                      className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2 text-slate-700"
                    >
                      <option value="">Quick Select</option>
                      {knownPatients.map((kp) => (
                        <option key={kp.id} value={kp.id}>
                          #{kp.id} - {kp.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Bill Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Service / Bill Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Cardiology Checkup & Ward Fee"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 text-sm shadow-md"
                >
                  {submitting ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
