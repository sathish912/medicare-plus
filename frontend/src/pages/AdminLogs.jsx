import { useEffect, useState } from "react";
import { Shield, Activity, Key, LogIn, FileText, CreditCard } from "lucide-react";
import { getAdminAuditLogs } from "../api/endpoints";
import toast from "react-hot-toast";

const ACTION_ICONS = {
  "LOGIN": <LogIn className="w-4 h-4 text-blue-500" />,
  "REGISTER": <Key className="w-4 h-4 text-purple-500" />,
  "CREATE_APPOINTMENT": <Activity className="w-4 h-4 text-orange-500" />,
  "UPDATE_APPOINTMENT_STATUS": <Activity className="w-4 h-4 text-amber-500" />,
  "PAY_INVOICE": <CreditCard className="w-4 h-4 text-green-500" />
};

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAuditLogs()
      .then((res) => {
        setLogs(res.data);
      })
      .catch((err) => {
        toast.error("Failed to load audit logs");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">System Audit Logs</h2>
          <p className="text-sm text-slate-500">Track critical actions and security events</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {log.user_name ? (
                      <div>
                        <p className="font-medium text-slate-800">{log.user_name}</p>
                        <p className="text-xs text-slate-400 capitalize">{log.user_role}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Anonymous / System</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {ACTION_ICONS[log.action] || <FileText className="w-4 h-4 text-slate-400" />}
                      <span className="font-semibold text-slate-700">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-md truncate" title={log.details}>
                    {log.details || "-"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    No logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
