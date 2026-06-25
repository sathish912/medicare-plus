import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { 
  getAllInsuranceDetails, 
  getAllClaims, 
  updateInsuranceDetailsStatus, 
  updateClaimStatus 
} from "../api/endpoints";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminInsurance() {
  const [details, setDetails] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [detRes, claimsRes] = await Promise.all([
        getAllInsuranceDetails(),
        getAllClaims()
      ]);
      setDetails(detRes.data);
      setClaims(claimsRes.data);
    } catch (err) {
      toast.error("Failed to load insurance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyDetails = async (id, status) => {
    try {
      await updateInsuranceDetailsStatus(id, status);
      toast.success(`Insurance details ${status}`);
      loadData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleUpdateClaim = async (id, status) => {
    try {
      await updateClaimStatus(id, status);
      toast.success(`Claim ${status}`);
      loadData();
    } catch (err) {
      toast.error("Failed to update claim");
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

  if (loading) return <div className="text-center py-6 text-slate-500">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Insurance Details Verification */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">Patient Insurance Verification</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 px-4 font-medium">Patient</th>
                <th className="py-2 px-4 font-medium">Provider</th>
                <th className="py-2 px-4 font-medium">Policy No.</th>
                <th className="py-2 px-4 font-medium">Status</th>
                <th className="py-2 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">{d.patient_name}</td>
                  <td className="py-3 px-4">{d.provider_name}</td>
                  <td className="py-3 px-4 font-mono">{d.policy_number}</td>
                  <td className="py-3 px-4">{statusBadge(d.status)}</td>
                  <td className="py-3 px-4">
                    {d.status === "unverified" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleVerifyDetails(d.id, "verified")} className="text-green-600 hover:underline font-medium">Verify</button>
                        <button onClick={() => handleVerifyDetails(d.id, "rejected")} className="text-red-600 hover:underline font-medium">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {details.length === 0 && <p className="text-center text-slate-500 py-4">No insurance details found.</p>}
        </div>
      </div>

      {/* Claims Management */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">Insurance Claims Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 px-4 font-medium">ID</th>
                <th className="py-2 px-4 font-medium">Patient</th>
                <th className="py-2 px-4 font-medium">Invoice ID</th>
                <th className="py-2 px-4 font-medium">Amount</th>
                <th className="py-2 px-4 font-medium">Status</th>
                <th className="py-2 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">#{c.id}</td>
                  <td className="py-3 px-4">{c.patient_name}</td>
                  <td className="py-3 px-4">#{c.invoice_id}</td>
                  <td className="py-3 px-4 font-semibold">₹{c.claim_amount.toFixed(2)}</td>
                  <td className="py-3 px-4">{statusBadge(c.status)}</td>
                  <td className="py-3 px-4">
                    {c.status === "submitted" && (
                      <button onClick={() => handleUpdateClaim(c.id, "processing")} className="text-amber-600 hover:underline font-medium">Process</button>
                    )}
                    {c.status === "processing" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateClaim(c.id, "approved")} className="text-green-600 hover:underline font-medium">Approve</button>
                        <button onClick={() => handleUpdateClaim(c.id, "rejected")} className="text-red-600 hover:underline font-medium">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {claims.length === 0 && <p className="text-center text-slate-500 py-4">No claims found.</p>}
        </div>
      </div>
    </div>
  );
}
