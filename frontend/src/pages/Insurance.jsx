import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Shield, ShieldAlert, ShieldCheck, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { 
  getMyInsuranceDetails, 
  createOrUpdateInsurance, 
  getMyClaims, 
  submitClaim,
  getMyInvoices
} from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

export default function Insurance() {
  const { user } = useAuth();
  const [details, setDetails] = useState(null);
  const [claims, setClaims] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [detailsForm, setDetailsForm] = useState({ provider_name: "", policy_number: "", group_number: "" });
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [claimModal, setClaimModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const detRes = await getMyInsuranceDetails();
        setDetails(detRes.data);
      } catch (e) {
        if (e.response?.status !== 404) throw e;
      }
      
      const claimsRes = await getMyClaims();
      setClaims(claimsRes.data);
      
      const invRes = await getMyInvoices();
      setInvoices(invRes.data);
      
    } catch (err) {
      toast.error("Failed to load insurance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createOrUpdateInsurance(detailsForm);
      toast.success("Insurance details updated");
      setIsEditingDetails(false);
      loadData();
    } catch (err) {
      toast.error("Failed to update details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return toast.error("Select an invoice");
    
    const invoice = invoices.find(i => i.id === parseInt(selectedInvoice));
    if (!invoice) return;

    setSubmitting(true);
    try {
      await submitClaim({ invoice_id: invoice.id, claim_amount: invoice.amount });
      toast.success("Claim submitted successfully");
      setClaimModal(false);
      setSelectedInvoice("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case "verified":
      case "approved":
        return <span className="badge bg-green-100 text-green-700 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> {status}</span>;
      case "rejected":
        return <span className="badge bg-red-100 text-red-700 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/> {status}</span>;
      case "processing":
      case "unverified":
      case "submitted":
      default:
        return <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> {status}</span>;
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" /> My Insurance
          </h1>
          <p className="text-slate-500">Manage your insurance provider details and track claims.</p>
        </div>
      </div>

      {/* Insurance Details Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Insurance Details</h2>
          {!isEditingDetails && (
            <button 
              onClick={() => {
                setDetailsForm({
                  provider_name: details?.provider_name || "",
                  policy_number: details?.policy_number || "",
                  group_number: details?.group_number || ""
                });
                setIsEditingDetails(true);
              }}
              className="btn-secondary text-sm"
            >
              {details ? "Update Details" : "Add Details"}
            </button>
          )}
        </div>

        {isEditingDetails ? (
          <form onSubmit={handleDetailsSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="text-sm font-medium text-slate-700">Provider Name</label>
              <input type="text" required className="input-field mt-1" value={detailsForm.provider_name} onChange={e => setDetailsForm({...detailsForm, provider_name: e.target.value})} placeholder="e.g. BlueCross BlueShield" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Policy Number</label>
              <input type="text" required className="input-field mt-1" value={detailsForm.policy_number} onChange={e => setDetailsForm({...detailsForm, policy_number: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Group Number (Optional)</label>
              <input type="text" className="input-field mt-1" value={detailsForm.group_number} onChange={e => setDetailsForm({...detailsForm, group_number: e.target.value})} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">Save Details</button>
              <button type="button" onClick={() => setIsEditingDetails(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        ) : details ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Provider</p>
              <p className="font-semibold text-lg">{details.provider_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              {statusBadge(details.status)}
            </div>
            <div>
              <p className="text-sm text-slate-500">Policy Number</p>
              <p className="font-mono">{details.policy_number}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Group Number</p>
              <p className="font-mono">{details.group_number || "N/A"}</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">No insurance details added yet.</p>
          </div>
        )}
      </div>

      {/* Claims Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">My Claims</h2>
          <button 
            onClick={() => setClaimModal(true)} 
            disabled={!details || details.status !== "verified"}
            className="btn-primary text-sm flex items-center gap-1"
            title={(!details || details.status !== "verified") ? "You need verified insurance details to file a claim" : ""}
          >
            <Plus className="w-4 h-4"/> File New Claim
          </button>
        </div>

        {claims.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="py-3 px-4 font-medium">Claim ID</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Invoice ID</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-sm">#{claim.id}</td>
                    <td className="py-3 px-4 text-sm">{new Date(claim.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm">#{claim.invoice_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">₹{claim.claim_amount.toFixed(2)}</td>
                    <td className="py-3 px-4">{statusBadge(claim.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-6">You haven't submitted any claims yet.</p>
        )}
      </div>

      {claimModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md relative">
            <h2 className="font-bold text-lg mb-4">File Insurance Claim</h2>
            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Select Invoice to Claim</label>
                <select 
                  className="input-field mt-1" 
                  value={selectedInvoice} 
                  onChange={(e) => setSelectedInvoice(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select Invoice --</option>
                  {invoices.filter(i => !claims.find(c => c.invoice_id === i.id)).map(inv => (
                    <option key={inv.id} value={inv.id}>
                      Invoice #{inv.id} - ₹{inv.amount.toFixed(2)} ({inv.status})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">Only invoices that haven't been claimed yet are shown.</p>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={() => setClaimModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
