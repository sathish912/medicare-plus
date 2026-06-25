import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, Users, Activity, IndianRupee } from "lucide-react";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getDepartmentStats } from "../api/endpoints";

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [deptRes, statsRes] = await Promise.all([
        getDepartments(),
        getDepartmentStats()
      ]);
      setDepartments(deptRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (dept = null) => {
    if (dept) {
      setEditId(dept.id);
      setForm({ name: dept.name, description: dept.description || "" });
    } else {
      setEditId(null);
      setForm({ name: "", description: "" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await updateDepartment(editId, form);
        toast.success("Department updated");
      } else {
        await createDepartment(form);
        toast.success("Department created");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await deleteDepartment(id);
      toast.success("Department deleted");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete department");
    }
  };

  const getDeptStats = (id) => stats.find(s => s.department_id === id) || { total_doctors: 0, total_appointments: 0, total_revenue: 0 };

  if (loading) return <p className="text-slate-500 text-center py-10">Loading departments...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Department Management</h2>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const s = getDeptStats(dept.id);
          return (
            <div key={dept.id} className="card hover:shadow-md transition-shadow relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => handleOpenModal(dept)} className="text-slate-400 hover:text-primary-600 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(dept.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-lg text-slate-800 pr-12">{dept.name}</h3>
              <p className="text-sm text-slate-500 mt-1 min-h-[40px]">{dept.description || "No description provided."}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <Users className="w-4 h-4 mx-auto text-primary-500 mb-1" />
                  <p className="text-xs text-slate-500">Doctors</p>
                  <p className="font-semibold text-slate-700">{s.total_doctors}</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <Activity className="w-4 h-4 mx-auto text-teal-500 mb-1" />
                  <p className="text-xs text-slate-500">Appts</p>
                  <p className="font-semibold text-slate-700">{s.total_appointments}</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <IndianRupee className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                  <p className="text-xs text-slate-500">Revenue</p>
                  <p className="font-semibold text-slate-700">₹{s.total_revenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          );
        })}
        {departments.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400">
            No departments found. Create one to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editId ? "Edit Department" : "Create Department"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Department Name</label>
                <input 
                  required 
                  className="input-field mt-1" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="e.g. Cardiology"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  className="input-field mt-1" 
                  rows={3}
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="Brief description about the department..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
