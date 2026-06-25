import { useState, useEffect } from "react";
import { UserPlus, UserMinus, FileText, BedDouble, Plus, X } from "lucide-react";
import { getAdmissions, admitPatient, dischargePatient, getWards, getWardBeds, generateDirectBill } from "../api/endpoints";
import api from "../api/client"; // For getting patients
import toast from "react-hot-toast";

export default function Admissions() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [billAmount, setBillAmount] = useState("");
  const [patients, setPatients] = useState([]);
  const [wards, setWards] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  
  const [formData, setFormData] = useState({
    patient_id: "",
    ward_id: "",
    bed_id: "",
    reason_for_admission: ""
  });

  const fetchData = async () => {
    try {
      const [admRes, wardsRes, patRes] = await Promise.all([
        getAdmissions(),
        getWards(),
        api.get("/api/users?role=patient")
      ]);
      setAdmissions(admRes.data);
      setWards(wardsRes.data);
      setPatients(patRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWardChange = async (e) => {
    const w_id = e.target.value;
    setFormData({ ...formData, ward_id: w_id, bed_id: "" });
    if (!w_id) {
      setAvailableBeds([]);
      return;
    }
    try {
      const res = await getWardBeds(w_id);
      setAvailableBeds(res.data.filter(b => !b.is_occupied));
    } catch (error) {
      toast.error("Failed to fetch beds");
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.bed_id || !formData.reason_for_admission) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await admitPatient({
        patient_id: parseInt(formData.patient_id),
        bed_id: parseInt(formData.bed_id),
        reason_for_admission: formData.reason_for_admission
      });
      toast.success("Patient admitted successfully");
      setShowAdmitModal(false);
      setFormData({ patient_id: "", ward_id: "", bed_id: "", reason_for_admission: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Admission failed");
    }
  };

  const handleDischarge = async (id) => {
    if (!window.confirm("Are you sure you want to discharge this patient?")) return;
    try {
      await dischargePatient(id);
      toast.success("Patient discharged successfully");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Discharge failed");
    }
  };

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    try {
      await generateDirectBill({
        patient_id: selectedAdmission.patient_id,
        amount: parseFloat(billAmount),
        description: `Hospital Stay Charges (${selectedAdmission.reason_for_admission})`
      });
      toast.success("Bill generated successfully!");
      setShowBillModal(false);
      setBillAmount("");
    } catch (error) {
      toast.error("Failed to generate bill");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading admissions...</div>;

  const filteredAdmissions = admissions.filter(a => a.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="text-primary-600 w-6 h-6" /> Admissions
          </h1>
          <p className="text-slate-500 mt-1">Manage patient admissions and discharges.</p>
        </div>
        <button onClick={() => setShowAdmitModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Admit Patient
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 font-medium transition-colors ${
            activeTab === "active" ? "text-primary-600 border-b-2 border-primary-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Active Admissions
        </button>
        <button
          onClick={() => setActiveTab("discharged")}
          className={`pb-3 font-medium transition-colors ${
            activeTab === "discharged" ? "text-primary-600 border-b-2 border-primary-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Discharge History
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700">Patient</th>
              <th className="p-4 font-semibold text-slate-700">Bed Info</th>
              <th className="p-4 font-semibold text-slate-700">Reason</th>
              <th className="p-4 font-semibold text-slate-700">Admitted Date</th>
              {activeTab === "discharged" && <th className="p-4 font-semibold text-slate-700">Discharged Date</th>}
              <th className="p-4 font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmissions.map((adm) => (
              <tr key={adm.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-slate-800">{adm.patient?.full_name || "Patient #" + adm.patient_id}</div>
                  <div className="text-sm text-slate-500">{adm.patient?.email}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-primary-500" />
                    <span className="font-medium text-slate-700">{adm.bed?.bed_number}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm text-slate-600 line-clamp-2">{adm.reason_for_admission}</span>
                </td>
                <td className="p-4 text-sm text-slate-600">
                  {new Date(adm.admission_date).toLocaleString()}
                </td>
                {activeTab === "discharged" && (
                  <td className="p-4 text-sm text-slate-600">
                    {new Date(adm.discharge_date).toLocaleString()}
                  </td>
                )}
                <td className="p-4 flex flex-wrap items-center gap-2">
                  {adm.status === "active" ? (
                    <button
                      onClick={() => handleDischarge(adm.id)}
                      className="text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserMinus className="w-4 h-4" /> Discharge
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Record
                    </span>
                  )}
                  <button
                    onClick={() => { setSelectedAdmission(adm); setShowBillModal(true); }}
                    className="text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" /> Bill
                  </button>
                </td>
              </tr>
            ))}
            {filteredAdmissions.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  No {activeTab} admissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Admit Patient</h2>
              <button onClick={() => setShowAdmitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Patient</label>
                <select
                  className="input-field"
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name || "Patient #" + p.id} ({p.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Ward</label>
                <select
                  className="input-field"
                  value={formData.ward_id}
                  onChange={handleWardChange}
                  required
                >
                  <option value="">-- Choose Ward --</option>
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.available_beds} beds available)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Available Bed</label>
                <select
                  className="input-field"
                  value={formData.bed_id}
                  onChange={(e) => setFormData({ ...formData, bed_id: e.target.value })}
                  required
                  disabled={!formData.ward_id || availableBeds.length === 0}
                >
                  <option value="">-- Choose Bed --</option>
                  {availableBeds.map(b => (
                    <option key={b.id} value={b.id}>{b.bed_number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Admission</label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={formData.reason_for_admission}
                  onChange={(e) => setFormData({ ...formData, reason_for_admission: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Admit Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBillModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Generate Admission Bill</h2>
              <button onClick={() => setShowBillModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerateBill} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl text-sm space-y-1">
                <p><span className="font-semibold text-slate-700">Patient:</span> {selectedAdmission.patient?.full_name}</p>
                <p><span className="font-semibold text-slate-700">Reason:</span> {selectedAdmission.reason_for_admission}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Stay Charges ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  placeholder="e.g. 1500.00"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                  Generate Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
