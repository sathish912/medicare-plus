import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Calendar, Clock, Trash2, Building } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateDoctorProfile, getDoctorSlots, createTimeSlot, deleteTimeSlot, getDepartments } from "../api/endpoints";

export default function DoctorProfile() {
  const { user } = useAuth();
  const p = user?.doctor_profile || {};
  const [form, setForm] = useState({
    department_id: p.department_id || "",
    specialization: p.specialization || "",
    qualification: p.qualification || "",
    experience_years: p.experience_years || "",
    consultation_fee: p.consultation_fee || "",
    bio: p.bio || "",
    available_days: p.available_days || "",
  });
  const [saving, setSaving] = useState(false);
  
  const [slots, setSlots] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [slotForm, setSlotForm] = useState({ slot_date: "", start_time: "", end_time: "" });
  const [slotLoading, setSlotLoading] = useState(false);

  const loadData = async () => {
    try {
      const [deptRes] = await Promise.all([
        getDepartments()
      ]);
      setDepartments(deptRes.data);
    } catch (err) {}
  };

  useEffect(() => {
    if (user?.id) {
      loadSlots();
      loadData();
    }
  }, [user]);

  const loadSlots = async () => {
    try {
      const res = await getDoctorSlots(user.id);
      setSlots(res.data);
    } catch (err) {
      // Ignore initial load errors silently
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!slotForm.slot_date || !slotForm.start_time || !slotForm.end_time) return;
    
    setSlotLoading(true);
    try {
      await createTimeSlot({
        slot_date: slotForm.slot_date,
        start_time: slotForm.start_time + ":00", // Format correctly
        end_time: slotForm.end_time + ":00"
      });
      toast.success("Time slot added!");
      setSlotForm({ slot_date: "", start_time: "", end_time: "" });
      loadSlots();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add slot");
    } finally {
      setSlotLoading(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await deleteTimeSlot(id);
      toast.success("Time slot removed");
      loadSlots();
    } catch (err) {
      toast.error("Failed to remove slot");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== "")
      );
      await updateDoctorProfile(payload);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">My Doctor Profile</h1>
      <p className="text-slate-500 text-sm mb-6">Keep your professional details up to date for patients.</p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Department</label>
          <select className="input-field mt-1" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
            <option value="">Select Department</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Specialization</label>
          <input className="input-field mt-1" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Cardiologist" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Qualification</label>
            <input className="input-field mt-1" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Experience (yrs)</label>
            <input type="number" className="input-field mt-1" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Consultation Fee (₹)</label>
          <input type="number" className="input-field mt-1" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Available Days</label>
          <input className="input-field mt-1" placeholder="Mon,Tue,Wed" value={form.available_days} onChange={(e) => setForm({ ...form, available_days: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Bio</label>
          <textarea className="input-field mt-1" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-1">Manage Schedule</h2>
            {user?.doctor_profile?.department && (
              <div className="mb-4 flex items-center gap-2 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Building className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-slate-700">{user.doctor_profile.department.name}</span>
                <span className="text-sm">Department</span>
              </div>
            )}
            <p className="text-slate-600 leading-relaxed mb-6">Set specific dates and times when you are available for appointments.</p>

        <div className="card space-y-6">
          <form onSubmit={handleAddSlot} className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1"><Calendar className="w-3 h-3"/> Date</label>
              <input type="date" required className="input-field" value={slotForm.slot_date} onChange={e => setSlotForm({...slotForm, slot_date: e.target.value})} />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1"><Clock className="w-3 h-3"/> Start</label>
              <input type="time" required className="input-field" value={slotForm.start_time} onChange={e => setSlotForm({...slotForm, start_time: e.target.value})} />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1"><Clock className="w-3 h-3"/> End</label>
              <input type="time" required className="input-field" value={slotForm.end_time} onChange={e => setSlotForm({...slotForm, end_time: e.target.value})} />
            </div>
            <button type="submit" disabled={slotLoading} className="btn-primary py-2 px-6">
              {slotLoading ? "Adding..." : "Add Slot"}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-semibold text-slate-700 mb-3">Your Availability Slots</h3>
            {slots.length === 0 ? (
              <p className="text-sm text-slate-400">You haven't added any time slots yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {slots.map(slot => (
                  <div key={slot.id} className={`flex items-center justify-between p-3 rounded-lg border ${slot.is_booked ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-primary-50 border-primary-100 text-primary-900'}`}>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5"/> {slot.slot_date}
                      </div>
                      <div className="text-xs mt-1 opacity-80 flex items-center gap-1">
                        <Clock className="w-3 h-3"/> {slot.start_time.slice(0,5)} - {slot.end_time.slice(0,5)}
                      </div>
                    </div>
                    {slot.is_booked ? (
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Booked</span>
                    ) : (
                      <button type="button" onClick={() => handleDeleteSlot(slot.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
