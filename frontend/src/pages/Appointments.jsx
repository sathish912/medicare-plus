import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMyAppointments, updateAppointmentStatus, createPrescription, createReview, generateInvoice, requestLabTest } from "../api/endpoints";
import { Star, FlaskConical } from "lucide-react";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-slate-200 text-slate-600",
  rejected: "bg-red-100 text-red-700",
};

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [presModal, setPresModal] = useState(null);
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", duration: "" }]);
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  const [billModal, setBillModal] = useState(null);
  const [billAmount, setBillAmount] = useState("");

  const [testModal, setTestModal] = useState(null);
  const [testName, setTestName] = useState("");

  const load = () => {
    getMyAppointments().then((res) => setAppointments(res.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await updateAppointmentStatus(id, { status });
      toast.success(`Appointment ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    }
  };

  const openPrescriptionModal = (appt) => {
    setPresModal(appt);
    setMedicines([{ name: "", dosage: "", duration: "" }]);
    setInstructions("");
  };

  const addMedicineRow = () => setMedicines([...medicines, { name: "", dosage: "", duration: "" }]);
  const updateMedicine = (idx, field, value) => {
    const copy = [...medicines];
    copy[idx][field] = value;
    setMedicines(copy);
  };
  const removeMedicine = (idx) => setMedicines(medicines.filter((_, i) => i !== idx));

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPrescription({
        appointment_id: presModal.id,
        medicines: medicines.filter((m) => m.name),
        instructions,
      });
      toast.success("Prescription issued & appointment marked completed");
      setPresModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to issue prescription");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createReview({ appointment_id: reviewModal.id, ...reviewForm });
      toast.success("Review submitted! Thank you.");
      setReviewModal(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBillSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await generateInvoice({ appointment_id: billModal.id, amount: parseFloat(billAmount) });
      toast.success("Bill generated successfully");
      setBillModal(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate bill");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestLabTest({
        patient_id: testModal.patient_id,
        appointment_id: testModal.id,
        test_name: testName,
      });
      toast.success("Lab test requested successfully");
      setTestModal(null);
      setTestName("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to request test");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">My Appointments</h1>

      <div className="space-y-4">
        {appointments.map((a) => (
          <div key={a.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold">
                {user.role === "doctor" ? `Patient: ${a.patient_name}` : `Dr. ${a.doctor_name}`}
              </p>
              <p className="text-sm text-slate-500">
                {a.appointment_date} at {a.appointment_time} • {a.consultation_type}
              </p>
              {a.reason && <p className="text-sm text-slate-500 mt-1">Reason: {a.reason}</p>}
              <span className={`badge mt-2 ${statusColors[a.status]}`}>{a.status}</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {user.role === "doctor" && a.status === "pending" && (
                <>
                  <button onClick={() => handleStatusChange(a.id, "confirmed")} className="btn-primary text-sm">
                    Confirm
                  </button>
                  <button onClick={() => handleStatusChange(a.id, "rejected")} className="btn-danger text-sm">
                    Reject
                  </button>
                </>
              )}
              {user.role === "doctor" && a.status === "confirmed" && (
                <>
                  <button onClick={() => setTestModal(a)} className="btn-secondary text-sm flex items-center gap-1">
                    <FlaskConical className="w-4 h-4"/> Request Test
                  </button>
                  {a.consultation_type === "online" && (
                    <a href={`/consultation/${a.id}`} className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-sm flex items-center gap-1 text-white no-underline">
                      Start Consultation
                    </a>
                  )}
                  <button onClick={() => openPrescriptionModal(a)} className="btn-primary text-sm">
                    Add Prescription & Complete
                  </button>
                </>
              )}
              {user.role === "doctor" && a.status === "completed" && (
                <button onClick={() => setBillModal(a)} className="btn-secondary text-sm">
                  Generate Bill
                </button>
              )}
              {user.role === "patient" && ["pending", "confirmed"].includes(a.status) && (
                <>
                  {a.status === "confirmed" && a.consultation_type === "online" && (
                    <a href={`/consultation/${a.id}`} className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-sm flex items-center gap-1 text-white no-underline">
                      Join Consultation
                    </a>
                  )}
                  <button onClick={() => handleStatusChange(a.id, "cancelled")} className="btn-secondary text-sm">
                    Cancel
                  </button>
                </>
              )}
              {user.role === "patient" && a.status === "completed" && (
                <button onClick={() => setReviewModal(a)} className="btn-secondary text-sm flex items-center gap-1">
                  <Star className="w-3 h-3"/> Leave Review
                </button>
              )}
            </div>
          </div>
        ))}
        {appointments.length === 0 && <p className="text-slate-400">No appointments yet.</p>}
      </div>

      {presModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setPresModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg mb-4">Issue Prescription</h2>
            <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
              {medicines.map((m, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500">Medicine</label>
                    <input className="input-field mt-1" value={m.name} onChange={(e) => updateMedicine(idx, "name", e.target.value)} required />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500">Dosage</label>
                    <input className="input-field mt-1" value={m.dosage} onChange={(e) => updateMedicine(idx, "dosage", e.target.value)} placeholder="500mg" required />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500">Duration</label>
                    <input className="input-field mt-1" value={m.duration} onChange={(e) => updateMedicine(idx, "duration", e.target.value)} placeholder="5 days" required />
                  </div>
                  {medicines.length > 1 && (
                    <button type="button" onClick={() => removeMedicine(idx)} className="text-red-500 mb-1">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addMedicineRow} className="text-primary-600 text-sm font-medium">
                + Add Another Medicine
              </button>
              <div>
                <label className="text-sm font-medium text-slate-700">Instructions</label>
                <textarea className="input-field mt-1" rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? "Submitting..." : "Issue Prescription"}
              </button>
            </form>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-sm relative">
            <button onClick={() => setReviewModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg mb-4">Rate your Experience</h2>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                      className="focus:outline-none"
                    >
                      <Star className={`w-8 h-8 ${num <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"} hover:scale-110 transition-transform`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Comment (Optional)</label>
                <textarea className="input-field mt-1" rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Tell us about your visit..." />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}

      {billModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-sm relative">
            <button onClick={() => setBillModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg mb-4">Generate Bill</h2>
            <form onSubmit={handleBillSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Amount (₹)</label>
                <input type="number" step="0.01" min="0" required className="input-field mt-1" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? "Generating..." : "Generate Bill"}
              </button>
            </form>
          </div>
        </div>
      )}

      {testModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-sm relative">
            <button onClick={() => setTestModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg mb-4">Request Lab Test</h2>
            <form onSubmit={handleTestSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Test Name</label>
                <input type="text" required className="input-field mt-1" value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="e.g. Complete Blood Count (CBC)" />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? "Requesting..." : "Request Test"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
