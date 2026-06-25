import { useState, useEffect } from "react";
import { AlertCircle, Ambulance, Stethoscope, Clock, CheckCircle } from "lucide-react";
import { requestEmergency, getEmergencies } from "../api/endpoints";
import toast from "react-hot-toast";

export default function EmergencyPatient() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    emergency_type: "Ambulance",
    location: "",
    contact_number: ""
  });

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
    // Poll every 10 seconds for status updates
    const interval = setInterval(fetchEmergencies, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location || !formData.contact_number) {
      toast.error("Please provide location and contact details");
      return;
    }
    try {
      await requestEmergency(formData);
      toast.success("Emergency request sent immediately!");
      setFormData({ ...formData, location: "", contact_number: "" });
      fetchEmergencies();
    } catch (error) {
      toast.error("Failed to send request");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-700 flex items-center gap-3">
            <AlertCircle className="w-8 h-8" /> Emergency Service Request
          </h1>
          <p className="text-red-600 mt-2 font-medium">If you are experiencing a life-threatening medical emergency, call the emergency hotline immediately.</p>
        </div>
        <a href="tel:108" className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shrink-0 text-lg transition-all">
          📞 Call 108
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Request Immediate Assistance</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.emergency_type === 'Ambulance' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-red-200'}`}
                onClick={() => setFormData({...formData, emergency_type: 'Ambulance'})}
              >
                <Ambulance className={`w-8 h-8 mb-2 ${formData.emergency_type === 'Ambulance' ? 'text-red-500' : 'text-slate-400'}`} />
                <h3 className={`font-bold ${formData.emergency_type === 'Ambulance' ? 'text-red-700' : 'text-slate-700'}`}>Ambulance Request</h3>
                <p className="text-xs text-slate-500 mt-1">Dispatch an ambulance to your location</p>
              </div>
              <div 
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.emergency_type === 'Doctor on Call' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}
                onClick={() => setFormData({...formData, emergency_type: 'Doctor on Call'})}
              >
                <Stethoscope className={`w-8 h-8 mb-2 ${formData.emergency_type === 'Doctor on Call' ? 'text-blue-500' : 'text-slate-400'}`} />
                <h3 className={`font-bold ${formData.emergency_type === 'Doctor on Call' ? 'text-blue-700' : 'text-slate-700'}`}>Urgent Doctor Consult</h3>
                <p className="text-xs text-slate-500 mt-1">Immediate telemedicine/on-call doctor response</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Current Location (Be Specific)</label>
              <textarea
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                rows="2"
                placeholder="e.g. 123 Main St, Apt 4B, City"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
              <input
                type="tel"
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                placeholder="Phone number for immediate contact"
                value={formData.contact_number}
                onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
            >
              SEND EMERGENCY REQUEST
            </button>
          </form>
        </div>
      </div>

      {emergencies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Your Recent Requests</h2>
          {emergencies.map(req => (
            <div key={req.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-800">{req.emergency_type}</span>
                  <span className="text-xs text-slate-500">• {new Date(req.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-600"><strong>Loc:</strong> {req.location}</p>
              </div>
              <div>
                {req.status === 'Pending' && <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm font-semibold border border-orange-200"><Clock className="w-4 h-4" /> Pending Dispatch</span>}
                {req.status === 'Dispatched' && <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200"><Ambulance className="w-4 h-4" /> Dispatched</span>}
                {req.status === 'Resolved' && <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-semibold border border-green-200"><CheckCircle className="w-4 h-4" /> Resolved</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
