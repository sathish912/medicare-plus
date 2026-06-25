import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";
import AdminDepartments from "./AdminDepartments";
import AdminInsurance from "./AdminInsurance";
import AdminLogs from "./AdminLogs";
import { getDoctor, adminUpdateDoctorProfile, getDepartments, createRecord } from "../api/endpoints";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  
  const [editDoctor, setEditDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [savingDoctor, setSavingDoctor] = useState(false);

  const [uploadPatient, setUploadPatient] = useState(null);
  const [docForm, setDocForm] = useState({ title: "", record_type: "report", description: "", file_url: "" });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const load = (role) => {
    api.get("/api/users", { params: role ? { role } : {} }).then((res) => setUsers(res.data)).catch(() => {});
  };

  const loadStats = () => {
    api.get("/api/admin/stats").then((res) => setStats(res.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    loadStats();
    getDepartments().then(res => setDepartments(res.data)).catch(() => {});
  }, []);

  const openEditDoctor = async (u) => {
    try {
      const res = await getDoctor(u.id);
      const p = res.data.doctor_profile || {};
      setDoctorForm({
        department_id: p.department_id || "",
        specialization: p.specialization || "",
        qualification: p.qualification || "",
        experience_years: p.experience_years || "",
        consultation_fee: p.consultation_fee || "",
        bio: p.bio || ""
      });
      setEditDoctor(u);
    } catch (err) {
      toast.error("Failed to load doctor profile");
    }
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    setSavingDoctor(true);
    try {
      await adminUpdateDoctorProfile(editDoctor.id, doctorForm);
      toast.success("Doctor profile updated");
      setEditDoctor(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docForm.title) return toast.error("Please enter a title");
    setUploadingDoc(true);
    try {
      await createRecord({
        patient_id: uploadPatient.id,
        title: docForm.title,
        record_type: docForm.record_type,
        description: docForm.description,
        file_url: docForm.file_url || "https://example.com/mock-lab-report.pdf"
      });
      toast.success("Document uploaded to patient records!");
      setUploadPatient(null);
      setDocForm({ title: "", record_type: "report", description: "", file_url: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.delete(`/api/users/${id}`);
      toast.success("User deactivated");
      load(filter);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-primary-50 to-white border border-primary-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-semibold text-primary-600 mb-1">Total Patients</h3>
            <p className="text-3xl font-bold text-slate-800">{stats.total_patients}</p>
          </div>
          <div className="card bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-semibold text-indigo-600 mb-1">Total Doctors</h3>
            <p className="text-3xl font-bold text-slate-800">{stats.total_doctors}</p>
          </div>
          <div className="card bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-semibold text-emerald-600 mb-1">Total Appointments</h3>
            <p className="text-3xl font-bold text-slate-800">{stats.total_appointments}</p>
          </div>
          <div className="card bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-semibold text-amber-600 mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-slate-800">₹{stats.total_revenue?.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab("users")} 
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === "users" ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveTab("departments")} 
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === "departments" ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Department Management
        </button>
        <button 
          onClick={() => setActiveTab("insurance")} 
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === "insurance" ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Insurance & Claims
        </button>
        <button 
          onClick={() => setActiveTab("logs")} 
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === "logs" ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Audit Logs
        </button>
      </div>

      {activeTab === "users" ? (
        <>
          <div className="flex gap-2 mb-6">
            {["", "patient", "doctor", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => {
                  setFilter(r);
                  load(r);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                  filter === r ? "bg-primary-600 text-white border-primary-600" : "border-slate-300 text-slate-600"
                }`}
              >
                {r === "" ? "All" : r}
              </button>
            ))}
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Status</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2">{u.full_name}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2 capitalize">{u.role}</td>
                    <td className="py-2">
                      <span className={`badge ${u.is_active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 flex gap-3">
                      {u.is_active && u.role === "doctor" && (
                        <button onClick={() => openEditDoctor(u)} className="text-blue-600 text-sm font-medium hover:underline">
                          Edit Profile
                        </button>
                      )}
                      {u.is_active && u.role === "patient" && (
                        <button onClick={() => setUploadPatient(u)} className="text-emerald-600 text-sm font-medium hover:underline">
                          Upload Doc
                        </button>
                      )}
                      {u.is_active && u.role !== "admin" && (
                        <button onClick={() => handleDeactivate(u.id)} className="text-red-600 text-sm font-medium hover:underline">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-slate-400 mt-4">No users found.</p>}
          </div>
        </>
      ) : activeTab === "departments" ? (
        <AdminDepartments />
      ) : activeTab === "insurance" ? (
        <AdminInsurance />
      ) : (
        <AdminLogs />
      )}

      {editDoctor && doctorForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Profile - {editDoctor.full_name}</h3>
            <form onSubmit={handleSaveDoctor} className="space-y-4">
              <div>
                <label className="label">Department</label>
                <select 
                  className="input-field" 
                  value={doctorForm.department_id} 
                  onChange={e => setDoctorForm({...doctorForm, department_id: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Specialization</label>
                <input className="input-field" value={doctorForm.specialization} onChange={e => setDoctorForm({...doctorForm, specialization: e.target.value})} />
              </div>
              <div>
                <label className="label">Qualification</label>
                <input className="input-field" value={doctorForm.qualification} onChange={e => setDoctorForm({...doctorForm, qualification: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Exp. Years</label>
                  <input type="number" className="input-field" value={doctorForm.experience_years} onChange={e => setDoctorForm({...doctorForm, experience_years: e.target.value})} />
                </div>
                <div>
                  <label className="label">Fee (₹)</label>
                  <input type="number" className="input-field" value={doctorForm.consultation_fee} onChange={e => setDoctorForm({...doctorForm, consultation_fee: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea className="input-field min-h-[80px]" value={doctorForm.bio} onChange={e => setDoctorForm({...doctorForm, bio: e.target.value})}></textarea>
              </div>
              
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setEditDoctor(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={savingDoctor} className="btn-primary">
                  {savingDoctor ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploadPatient && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-1">Upload Patient Document</h3>
            <p className="text-xs text-slate-500 mb-4">Patient: <span className="font-semibold text-slate-700">{uploadPatient.full_name}</span></p>
            <form onSubmit={handleUploadDoc} className="space-y-4">
              <div>
                <label className="label">Document Title</label>
                <input 
                  className="input-field" 
                  placeholder="e.g., Blood Test Report" 
                  value={docForm.title} 
                  onChange={e => setDocForm({...docForm, title: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select 
                  className="input-field" 
                  value={docForm.record_type} 
                  onChange={e => setDocForm({...docForm, record_type: e.target.value})}
                >
                  <option value="report">Lab Report / Blood Test</option>
                  <option value="prescription">Prescription / Advice</option>
                  <option value="scan">Scan / X-Ray / MRI</option>
                </select>
              </div>
              <div>
                <label className="label">Attachment File / PDF</label>
                <input type="file" className="input-field text-sm" onChange={e => setDocForm({...docForm, file_url: "https://example.com/mock-uploaded-report.pdf"})} />
              </div>
              <div>
                <label className="label">Result Notes / Summary</label>
                <textarea 
                  className="input-field min-h-[80px]" 
                  placeholder="Doctor / Lab technician notes..."
                  value={docForm.description} 
                  onChange={e => setDocForm({...docForm, description: e.target.value})}
                ></textarea>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setUploadPatient(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={uploadingDoc} className="btn-primary">
                  {uploadingDoc ? "Uploading..." : "Upload & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
