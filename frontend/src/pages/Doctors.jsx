import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Stethoscope, Star, X, MessageSquareText } from "lucide-react";
import { listDoctors, bookAppointment, getDoctorSlots, getDoctorReviews } from "../api/endpoints";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ appointment_date: "", appointment_time: "", reason: "", consultation_type: "online" });
  const [booking, setBooking] = useState(false);
  const [slots, setSlots] = useState([]);
  const [reviewsModal, setReviewsModal] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (selected && form.appointment_date) {
      getDoctorSlots(selected.id, form.appointment_date).then(res => {
        setSlots(res.data.filter(s => !s.is_booked));
      }).catch(() => setSlots([]));
    } else {
      setSlots([]);
      setForm(f => ({...f, appointment_time: ""}));
    }
  }, [selected, form.appointment_date]);

  const loadDoctors = (spec) => {
    listDoctors(spec).then((res) => setDoctors(res.data)).catch(() => {});
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadDoctors(search);
  };

  const openBooking = (doctor) => {
    setSelected(doctor);
    setForm({ appointment_date: "", appointment_time: "", reason: "", consultation_type: "online" });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setBooking(true);
    try {
      await bookAppointment({ doctor_id: selected.id, ...form });
      toast.success("Appointment requested successfully!");
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Find a Doctor</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-md">
        <input
          className="input-field"
          placeholder="Search by specialization (e.g. Cardiologist)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-primary">Search</button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {doctors.map((d) => (
          <div key={d.id} className="card flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold">Dr. {d.full_name}</p>
                <p className="text-xs text-slate-500">
                  {d.doctor_profile?.department?.name ? (
                    <span className="font-medium text-primary-600">{d.doctor_profile.department.name} • </span>
                  ) : null}
                  {d.doctor_profile?.specialization}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-2">
              {d.doctor_profile?.qualification} • {d.doctor_profile?.experience_years} yrs experience
            </p>
            <div className="flex items-center gap-1 text-amber-500 text-sm mb-3">
              <Star className="w-4 h-4 fill-amber-500" /> {d.doctor_profile?.rating?.toFixed(1) || "New"}
            </div>
            <p className="text-sm font-medium mb-4">Fee: ₹{d.doctor_profile?.consultation_fee}</p>
            <div className="mt-auto flex gap-2">
              <button onClick={() => {
                setReviewsModal(d);
                getDoctorReviews(d.id).then(res => setReviews(res.data));
              }} className="btn-secondary flex-1 flex items-center justify-center gap-1 text-sm py-2">
                <MessageSquareText className="w-4 h-4"/> Reviews
              </button>
              <button onClick={() => openBooking(d)} className="btn-primary flex-1 py-2 text-sm">
                Book
              </button>
            </div>
          </div>
        ))}
        {doctors.length === 0 && <p className="text-slate-400">No doctors found.</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md relative">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg mb-1">Book with Dr. {selected.full_name}</h2>
            <p className="text-sm text-slate-500 mb-4">{selected.doctor_profile?.specialization}</p>

            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  className="input-field mt-1"
                  value={form.appointment_date}
                  onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Time</label>
                {slots.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {slots.map(s => (
                      <button 
                        type="button" 
                        key={s.id}
                        onClick={() => setForm({...form, appointment_time: s.start_time})}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${form.appointment_time === s.start_time ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400'}`}
                      >
                        {s.start_time.slice(0,5)}
                      </button>
                    ))}
                  </div>
                ) : form.appointment_date ? (
                  <p className="text-sm text-slate-500 mt-1 italic">No slots available on this date.</p>
                ) : (
                  <p className="text-sm text-slate-500 mt-1 italic">Select a date first to see slots.</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Consultation Type</label>
                <select
                  className="input-field mt-1"
                  value={form.consultation_type}
                  onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}
                >
                  <option value="online">Online</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Reason for Visit</label>
                <textarea
                  className="input-field mt-1"
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Briefly describe your symptoms or reason for the visit"
                />
              </div>
              <button type="submit" disabled={booking} className="btn-primary w-full">
                {booking ? "Booking..." : "Confirm Booking"}
              </button>
            </form>
          </div>
        </div>
      )}

      {reviewsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-lg relative max-h-[80vh] flex flex-col">
            <button onClick={() => setReviewsModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg mb-1">Reviews for Dr. {reviewsModal.full_name}</h2>
            <div className="flex items-center gap-1 text-amber-500 text-sm mb-6 pb-4 border-b border-slate-100">
              <Star className="w-5 h-5 fill-amber-500" /> 
              <span className="font-bold text-lg text-slate-800">{reviewsModal.doctor_profile?.rating?.toFixed(1) || "New"}</span>
              <span className="text-slate-500 ml-1">({reviews.length} reviews)</span>
            </div>

            <div className="overflow-y-auto pr-2 space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.comment ? (
                    <p className="text-sm text-slate-700">{r.comment}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No comment provided.</p>
                  )}
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-slate-500 text-center py-6">No reviews yet for this doctor.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
