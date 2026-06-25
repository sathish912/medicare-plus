import { useState, useEffect } from "react";
import { BedDouble, Plus, Users, User, X, LayoutGrid } from "lucide-react";
import { createWard, getWards, getWardBeds } from "../api/endpoints";
import toast from "react-hot-toast";

export default function BedManagement() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", capacity: 10 });
  const [selectedWard, setSelectedWard] = useState(null);
  const [beds, setBeds] = useState([]);

  const fetchWards = async () => {
    try {
      const res = await getWards();
      setWards(res.data);
    } catch (error) {
      toast.error("Failed to fetch wards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  const handleCreateWard = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.capacity < 1) {
      toast.error("Please enter valid ward details");
      return;
    }
    try {
      await createWard(formData);
      toast.success("Ward created successfully");
      setShowModal(false);
      setFormData({ name: "", capacity: 10 });
      fetchWards();
    } catch (error) {
      toast.error("Failed to create ward");
    }
  };

  const handleViewBeds = async (ward) => {
    setSelectedWard(ward);
    try {
      const res = await getWardBeds(ward.id);
      setBeds(res.data);
    } catch (error) {
      toast.error("Failed to load beds for this ward");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading wards...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BedDouble className="text-primary-600 w-6 h-6" /> Hospital Bed Management
          </h1>
          <p className="text-slate-500 mt-1">Manage hospital wards and monitor bed availability.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Ward
        </button>
      </div>

      {/* Ward Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wards.map((ward) => (
          <div key={ward.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{ward.name}</h3>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full mt-1 inline-block">
                    {ward.capacity} Beds Total
                  </span>
                </div>
                <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                  <LayoutGrid className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Available</p>
                  <p className="text-2xl font-bold text-green-600">{ward.available_beds}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Occupied</p>
                  <p className="text-2xl font-bold text-red-500">{ward.occupied_beds}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden">
                <div
                  className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(ward.occupied_beds / ward.capacity) * 100}%` }}
                ></div>
              </div>

              <button
                onClick={() => handleViewBeds(ward)}
                className="w-full mt-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                View Bed Map
              </button>
            </div>
          </div>
        ))}
        {wards.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <BedDouble className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500">No wards have been created yet.</p>
            <button onClick={() => setShowModal(true)} className="mt-4 text-primary-600 font-medium hover:underline">
              Create the first ward
            </button>
          </div>
        )}
      </div>

      {/* Visual Bed Map */}
      {selectedWard && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-slate-500" /> {selectedWard.name} - Bed Layout
            </h2>
            <button onClick={() => setSelectedWard(null)} className="text-slate-400 hover:text-slate-600">
              Close Map
            </button>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Available</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Occupied</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {beds.map((bed) => (
                <div
                  key={bed.id}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    bed.is_occupied
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 cursor-pointer"
                  }`}
                >
                  <BedDouble className="w-8 h-8" />
                  <span className="font-bold text-sm">{bed.bed_number}</span>
                  {bed.is_occupied ? (
                    <span className="text-[10px] font-semibold bg-red-200 text-red-800 px-2 py-0.5 rounded-full mt-1">Occupied</span>
                  ) : (
                    <span className="text-[10px] font-semibold bg-green-200 text-green-800 px-2 py-0.5 rounded-full mt-1">Available</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Ward Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Create New Ward</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWard} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ward Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Intensive Care Unit (ICU)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Bed Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  className="input-field"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  The system will automatically generate {formData.capacity || 0} trackable beds for this ward.
                </p>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Ward & Generate Beds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
