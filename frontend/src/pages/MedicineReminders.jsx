import { useState, useEffect } from "react";
import { Pill, Clock, CheckCircle, Plus, Calendar } from "lucide-react";
import { createReminder, getReminders, logReminder, getReminderLogs } from "../api/endpoints";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export default function MedicineReminders() {
  const [reminders, setReminders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    medicine_name: "",
    dosage: "",
    time: "",
  });

  const fetchData = async () => {
    try {
      const [resReminders, resLogs] = await Promise.all([
        getReminders(),
        getReminderLogs(),
      ]);
      setReminders(resReminders.data);
      setLogs(resLogs.data);
    } catch (error) {
      toast.error("Failed to fetch reminders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!formData.medicine_name || !formData.dosage || !formData.time) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      await createReminder(formData);
      toast.success("Reminder added!");
      setFormData({ medicine_name: "", dosage: "", time: "" });
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to create reminder.");
    }
  };

  const handleMarkTaken = async (id) => {
    try {
      await logReminder(id);
      toast.success("Marked as taken!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to mark as taken.");
    }
  };

  // Check if a reminder has been taken today
  const isTakenToday = (reminderId) => {
    const today = dayjs().format("YYYY-MM-DD");
    return logs.some(
      (log) => log.reminder_id === reminderId && dayjs(log.taken_at).format("YYYY-MM-DD") === today
    );
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading reminders...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="text-primary-600 w-6 h-6" /> Medicine Reminders
          </h1>
          <p className="text-slate-500 mt-1">Keep track of your daily medication schedule.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Reminder
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">New Medicine Reminder</h2>
          <form onSubmit={handleAddReminder} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Aspirin"
                value={formData.medicine_name}
                onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosage</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 1 Tablet"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
              <input
                type="time"
                className="input-field"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <div className="md:col-span-4 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Reminder
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" /> Today's Schedule
            </h2>
          </div>
          <div className="p-6">
            {reminders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No reminders scheduled.</p>
            ) : (
              <div className="space-y-4">
                {reminders.map((reminder) => {
                  const taken = isTakenToday(reminder.id);
                  return (
                    <div
                      key={reminder.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        taken ? "bg-green-50 border-green-200" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${taken ? "bg-green-100 text-green-600" : "bg-primary-50 text-primary-600"}`}>
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${taken ? "text-green-800" : "text-slate-900"}`}>
                            {reminder.medicine_name}
                          </h3>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
                            <span>{reminder.dosage}</span>
                            <span>•</span>
                            <span className="font-medium">{dayjs(`2000-01-01 ${reminder.time}`).format("hh:mm A")}</span>
                          </div>
                        </div>
                      </div>
                      
                      {taken ? (
                        <div className="flex items-center gap-1 text-green-600 font-medium bg-green-100 px-3 py-1.5 rounded-full text-sm">
                          <CheckCircle className="w-4 h-4" /> Taken
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkTaken(reminder.id)}
                          className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-semibold rounded-lg transition-colors border border-primary-100 hover:border-primary-200"
                        >
                          Mark Taken
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Log History */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" /> History Log
            </h2>
          </div>
          <div className="p-0">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No history logs yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-slate-900">{log.reminder.medicine_name}</p>
                      <p className="text-sm text-slate-500">{log.reminder.dosage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        {dayjs(log.taken_at).format("MMM D, YYYY")}
                      </p>
                      <p className="text-xs text-slate-500">
                        Taken at {dayjs(log.taken_at).format("hh:mm A")}
                      </p>
                    </div>
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
