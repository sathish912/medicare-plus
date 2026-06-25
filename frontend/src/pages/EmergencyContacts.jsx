import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PhoneCall, UserPlus, Trash2 } from "lucide-react";
import { getMyEmergencyContacts, createEmergencyContact, deleteEmergencyContact } from "../api/endpoints";

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", relation: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMyEmergencyContacts();
      setContacts(res.data);
    } catch (err) {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createEmergencyContact(formData);
      toast.success("Contact added successfully");
      setModalOpen(false);
      setFormData({ name: "", relation: "", phone: "", email: "" });
      loadData();
    } catch (err) {
      toast.error("Failed to add contact");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this contact?")) return;
    try {
      await deleteEmergencyContact(id);
      toast.success("Contact removed");
      loadData();
    } catch (err) {
      toast.error("Failed to remove contact");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-red-500" /> Emergency Contacts
          </h1>
          <p className="text-slate-500">Manage people to contact in case of a medical emergency.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1">
          <UserPlus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {loading ? (
        <div className="text-center p-10">Loading...</div>
      ) : contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map(c => (
            <div key={c.id} className="card relative flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg">{c.name}</h3>
                <span className="badge bg-slate-100 text-slate-700 mt-1 inline-block">{c.relation}</span>
                <div className="mt-4 space-y-1 text-sm">
                  <p><span className="text-slate-500">Phone:</span> {c.phone}</p>
                  {c.email && <p><span className="text-slate-500">Email:</span> {c.email}</p>}
                </div>
              </div>
              <button 
                onClick={() => handleDelete(c.id)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                title="Remove Contact"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 border-dashed bg-slate-50">
          <PhoneCall className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No emergency contacts added yet.</p>
          <p className="text-sm text-slate-400 mt-1">Add a trusted friend or family member.</p>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <h2 className="font-bold text-lg mb-4">Add Emergency Contact</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input required type="text" className="input-field mt-1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Relationship</label>
                <input required type="text" className="input-field mt-1" placeholder="e.g. Spouse, Sibling" value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <input required type="tel" className="input-field mt-1" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email Address (Optional)</label>
                <input type="email" className="input-field mt-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
