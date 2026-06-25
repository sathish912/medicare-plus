import { useEffect, useState } from "react";
import { Pill, Download } from "lucide-react";
import { getMyPrescriptions, downloadPrescriptionPdf } from "../api/endpoints";
import toast from "react-hot-toast";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    getMyPrescriptions().then((res) => setPrescriptions(res.data)).catch(() => {});
  }, []);

  const handleDownload = async (id) => {
    try {
      setDownloading(id);
      const res = await downloadPrescriptionPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">My Prescriptions</h1>
      <div className="space-y-4">
        {prescriptions.map((p) => {
          let meds = [];
          try {
            meds = JSON.parse(p.medicines);
          } catch {
            meds = [];
          }
          return (
            <div key={p.id} className="card relative">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-5 h-5 text-orange-600" />
                <p className="font-semibold">Prescription #{p.id}</p>
                <span className="text-xs text-slate-400 ml-auto mr-12">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
              
              <button 
                onClick={() => handleDownload(p.id)}
                disabled={downloading === p.id}
                className="absolute top-4 right-4 text-slate-400 hover:text-primary-600 transition-colors"
                title="Download PDF"
              >
                <Download className={`w-5 h-5 ${downloading === p.id ? 'animate-pulse' : ''}`} />
              </button>

              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="py-1">Medicine</th>
                    <th className="py-1">Dosage</th>
                    <th className="py-1">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {meds.map((m, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-0">
                      <td className="py-1">{m.name}</td>
                      <td className="py-1">{m.dosage}</td>
                      <td className="py-1">{m.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {p.instructions && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Instructions: </span>
                  {p.instructions}
                </p>
              )}
            </div>
          );
        })}
        {prescriptions.length === 0 && <p className="text-slate-400">No prescriptions yet.</p>}
      </div>
    </div>
  );
}
