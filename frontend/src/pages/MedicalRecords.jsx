import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { getMyRecords } from "../api/endpoints";

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    getMyRecords().then((res) => setRecords(res.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Medical Records</h1>
      <div className="space-y-4">
        {records.map((r) => (
          <div key={r.id} className="card flex gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold">{r.title}</p>
              <p className="text-xs text-slate-400 mb-1 capitalize">{r.record_type} • {new Date(r.created_at).toLocaleDateString()}</p>
              {r.description && <p className="text-sm text-slate-600">{r.description}</p>}
              {r.file_url && (
                <a href={r.file_url} target="_blank" rel="noreferrer" className="text-primary-600 text-sm font-medium hover:underline">
                  View Attachment
                </a>
              )}
            </div>
          </div>
        ))}
        {records.length === 0 && <p className="text-slate-400">No medical records found.</p>}
      </div>
    </div>
  );
}
