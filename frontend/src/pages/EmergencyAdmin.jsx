import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Ambulance, CheckCircle, Phone, MapPin } from "lucide-react";
import { getEmergencies, updateEmergencyStatus } from "../api/endpoints";
import toast from "react-hot-toast";

export default function EmergencyAdmin() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmergencies = async () => {
    try {
      const res = await getEmergencies();
      setEmergencies(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 10000); // Live updates
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateEmergencyStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchEmergencies();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading emergency dashboard...</div>;

  const pending = emergencies.filter(e => e.status === "Pending");
  const active = emergencies.filter(e => e.status === "Dispatched");
  const resolved = emergencies.filter(e => e.status === "Resolved");

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="text-red-600 w-8 h-8" /> Emergency Dispatch Center
        </h1>
        <p className="text-slate-500 mt-1">Live queue of patient emergency requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Requests */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-sm">{pending.length}</span> Critical / Pending
          </h2>
          
          {pending.length === 0 && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500">
              No pending emergency requests.
            </div>
          )}

          {pending.map(req => (
            <div key={req.id} className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden flex flex-col sm:flex-row">
              <div className="bg-red-50 p-4 sm:w-48 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-red-100">
                <span className="font-bold text-red-700 text-lg">{req.emergency_type}</span>
                <span className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(req.created_at).toLocaleTimeString()}</span>
              </div>
              <div className="p-4 flex-1">
                <p className="text-lg font-bold text-slate-800">{req.patient?.full_name || "Patient #" + req.patient_id}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-slate-600 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> <span>{req.location}</span>
                  </p>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" /> <span className="font-semibold">{req.contact_number}</span>
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 flex items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-100">
                <button
                  onClick={() => handleStatusUpdate(req.id, "Dispatched")}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  DISPATCH NOW
                </button>
              </div>
            </div>
          ))}

          {/* Active/Dispatched */}
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-8 pt-4 border-t border-slate-200">
            <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-sm">{active.length}</span> Active / Dispatched
          </h2>
          {active.map(req => (
            <div key={req.id} className="bg-white border border-blue-200 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-sm font-bold text-blue-700">{req.emergency_type}</span> - <span className="font-semibold text-slate-800">{req.patient?.full_name || "Patient #" + req.patient_id}</span>
                <p className="text-sm text-slate-600 mt-1">{req.location}</p>
              </div>
              <button
                onClick={() => handleStatusUpdate(req.id, "Resolved")}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition-colors border border-blue-200"
              >
                Mark Resolved
              </button>
            </div>
          ))}
        </div>

        {/* Resolved History Panel */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-500 w-5 h-5" /> Recently Resolved
          </h2>
          <div className="space-y-3">
            {resolved.slice(0, 5).map(req => (
              <div key={req.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-700">{req.emergency_type}</span>
                  <span className="text-[10px] text-slate-500">{new Date(req.resolved_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-slate-800 mt-1">{req.patient?.full_name || "Patient #" + req.patient_id}</p>
              </div>
            ))}
            {resolved.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No resolved emergencies today.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
