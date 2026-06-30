import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PhoneOff, Save, FilePlus, ShieldAlert, MessageSquare } from "lucide-react";
import { getAppointment, updateAppointmentNotes, updateAppointmentStatus, getPatientEmergencyContacts } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import ChatBox from "../components/ChatBox";
import VideoCall from "../components/VideoCall";

export default function ConsultationRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [notes, setNotes] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(user?.role === "doctor" ? "notes" : "chat");

  useEffect(() => {
    getAppointment(id)
      .then((res) => {
        setAppointment(res.data);
        if (res.data.notes) setNotes(res.data.notes);
        if (res.data.patient_id) {
          getPatientEmergencyContacts(res.data.patient_id)
            .then(contactRes => setEmergencyContacts(contactRes.data))
            .catch(() => {});
        }
      })
      .catch((err) => {
        toast.error("Failed to load consultation room");
        navigate("/appointments");
      });
  }, [id, navigate]);

  const handleSaveNotes = async () => {
    if (!appointment) return;
    setSaving(true);
    try {
      await updateAppointmentNotes(id, notes);
      toast.success("Notes saved successfully");
    } catch (err) {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  const handleEndSession = async () => {
    await handleSaveNotes();
    toast.success("Saved draft notes.");
    navigate("/appointments");
  };

  const handleCompleteConsultation = async () => {
    setSaving(true);
    try {
      await handleSaveNotes();
      await updateAppointmentStatus(id, { status: "completed" });
      toast.success("Consultation completed successfully!");
      navigate("/appointments");
    } catch (err) {
      toast.error("Failed to complete consultation");
    } finally {
      setSaving(false);
    }
  };

  if (!appointment) return <div className="p-10 text-center text-slate-500">Loading consultation room...</div>;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-100">
      {/* Video Call Area */}
      <div className="flex-1 flex flex-col p-4">
        <VideoCall 
          roomName={`MedicarePlus_Room_${appointment.id}`} 
          userName={user?.full_name} 
          isClosed={appointment.status === "completed" || appointment.status === "cancelled"} 
        />
      </div>

      {/* Right Sidebar: Notes & Details */}
      <div className="w-full lg:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-10">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-800">Consultation Room</h2>
          {user?.role === "doctor" ? (
            <p className="text-sm text-slate-500">Patient: <span className="font-medium text-slate-700">{appointment.patient_name}</span></p>
          ) : (
            <p className="text-sm text-slate-500">Doctor: <span className="font-medium text-slate-700">Dr. {appointment.doctor_name}</span></p>
          )}
          
          {user?.role === "doctor" && emergencyContacts.length > 0 && (
            <div className="mt-3 text-xs bg-red-50 text-red-700 p-2 rounded flex flex-col gap-1 border border-red-100">
              <span className="font-semibold flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Emergency Contact:</span>
              {emergencyContacts.map(c => (
                <div key={c.id}>
                  {c.name} ({c.relation}) - <a href={`tel:${c.phone}`} className="underline">{c.phone}</a>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-sm">
            <p><strong>Reason for visit:</strong></p>
            <p className="text-slate-600">{appointment.reason || "Not specified"}</p>
          </div>
        </div>

        <div className="flex border-b border-slate-100 bg-slate-50">
          {user?.role === "doctor" && (
            <button 
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 ${activeTab === "notes" ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <FilePlus className="w-4 h-4" /> Notes
            </button>
          )}
          <button 
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 ${activeTab === "chat" ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
        </div>

        {activeTab === "notes" ? (
          <div className="flex-1 p-5 flex flex-col">
            <textarea 
              className="flex-1 input-field resize-none bg-yellow-50/50" 
              placeholder="Type your diagnosis and observations here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden p-2">
            <ChatBox 
              appointmentId={id} 
              currentUserId={user?.id} 
              status={appointment.status} 
            />
          </div>
        )}

        {user?.role === "doctor" && (
          <div className="p-5 border-t border-slate-100 space-y-2.5 bg-slate-50">
            <button 
              onClick={handleSaveNotes} 
              disabled={saving}
              className="btn-secondary w-full flex justify-center items-center gap-2 text-sm py-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Draft Notes"}
            </button>
            <button 
              onClick={handleEndSession} 
              className="btn-secondary w-full border-primary-500 text-primary-600 hover:bg-primary-50 text-sm py-2 font-semibold"
            >
              Leave Session & Issue Prescription
            </button>
            <button 
              onClick={handleCompleteConsultation} 
              disabled={saving}
              className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2.5 font-bold flex justify-center items-center gap-2 shadow-sm"
            >
              End & Mark Completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
