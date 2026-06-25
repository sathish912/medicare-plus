import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../api/endpoints";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const load = () => {
    getNotifications().then((res) => setNotifications(res.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleRead = async (id) => {
    await markNotificationRead(id);
    load();
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button onClick={handleReadAll} className="btn-secondary text-sm flex items-center gap-1">
          <CheckCheck className="w-4 h-4" /> Mark all read
        </button>
      </div>
      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.is_read && handleRead(n.id)}
            className={`card flex gap-3 cursor-pointer ${!n.is_read ? "border-primary-300 bg-primary-50/40" : ""}`}
          >
            <Bell className={`w-5 h-5 mt-0.5 ${!n.is_read ? "text-primary-600" : "text-slate-400"}`} />
            <div>
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-sm text-slate-500">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-slate-400">No notifications.</p>}
      </div>
    </div>
  );
}
