import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Download, FileText, FlaskConical, Clock, CheckCircle2, XCircle } from "lucide-react";
import { getLabTests, updateLabTest } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

export default function LabTests() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  
  const [status, setStatus] = useState("completed");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const loadTests = () => {
    setLoading(true);
    getLabTests()
      .then((res) => {
        setTests(res.data);
      })
      .catch(() => toast.error("Failed to load lab tests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;

    const formData = new FormData();
    formData.append("status", status);
    if (notes) formData.append("result_notes", notes);
    if (file) formData.append("file", file);

    try {
      await updateLabTest(selectedTest.id, formData);
      toast.success("Lab test updated successfully");
      setSelectedTest(null);
      setFile(null);
      setNotes("");
      loadTests();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update lab test");
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case "pending":
        return <span className="badge bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case "completed":
        return <span className="badge bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</span>;
      case "cancelled":
        return <span className="badge bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" /> Cancelled</span>;
      default:
        return <span className="badge">{s}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="text-primary-600" /> Lab Tests
          </h1>
          <p className="text-slate-500 mt-1">Manage and view laboratory test results</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : tests.length === 0 ? (
        <div className="card text-center py-12">
          <FlaskConical className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700">No lab tests found</h3>
          <p className="text-slate-500">There are currently no lab tests requested.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((t) => (
            <div key={t.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-800">{t.test_name}</h3>
                {getStatusBadge(t.status)}
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="text-slate-500">Patient: </span>
                  <span className="font-medium text-slate-700">{t.patient_name}</span>
                </p>
                <p className="text-sm">
                  <span className="text-slate-500">Doctor: </span>
                  <span className="font-medium text-slate-700">Dr. {t.doctor_name}</span>
                </p>
                <p className="text-sm">
                  <span className="text-slate-500">Requested: </span>
                  <span className="font-medium text-slate-700">{new Date(t.created_at).toLocaleDateString()}</span>
                </p>
              </div>

              {t.result_notes && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Result Notes</p>
                  <p className="text-sm text-slate-700">{t.result_notes}</p>
                </div>
              )}

              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                {t.file_url && (
                  <a href={t.file_url} target="_blank" rel="noreferrer" className="btn-secondary flex-1 flex justify-center items-center gap-2">
                    <FileText className="w-4 h-4" /> View Report
                  </a>
                )}
                
                {["doctor", "admin"].includes(user?.role) && t.status === "pending" && (
                  <button 
                    onClick={() => {
                      setSelectedTest(t);
                      setStatus("completed");
                    }}
                    className="btn-primary flex-1 flex justify-center items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Upload Result
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold">Update Lab Result</h2>
              <p className="text-sm text-slate-500 mt-1">Upload reports for {selectedTest.test_name}</p>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select className="input-field mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700">Notes / Diagnosis</label>
                <textarea 
                  className="input-field mt-1" 
                  rows="3"
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter specific metrics or diagnosis notes..."
                ></textarea>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Upload Report (PDF/Image)</label>
                <input 
                  type="file" 
                  className="input-field mt-1" 
                  accept=".pdf,image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setSelectedTest(null)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
