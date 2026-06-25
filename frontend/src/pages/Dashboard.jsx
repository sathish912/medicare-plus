import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, FileText, Pill, MessageCircle, Users, Stethoscope, Building, FlaskConical } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMyAppointments } from "../api/endpoints";

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    getMyAppointments().then((res) => setAppointments(res.data)).catch(() => {});
  }, []);

  const upcoming = appointments
    .filter((a) => ["pending", "confirmed"].includes(a.status))
    .slice(0, 5);

  const patientCards = [
    { to: "/doctors", icon: Stethoscope, label: "Find a Doctor", color: "text-primary-600" },
    { to: "/appointments", icon: CalendarCheck, label: "My Appointments", color: "text-teal-600" },
    { to: "/records", icon: FileText, label: "Medical Records", color: "text-purple-600" },
    { to: "/lab-tests", icon: FlaskConical, label: "Lab Tests", color: "text-blue-500" },
    { to: "/prescriptions", icon: Pill, label: "Prescriptions", color: "text-orange-600" },
    { to: "/emergency-contacts", icon: Users, label: "Emergency Contacts", color: "text-red-500" },
    { to: "/assistant", icon: MessageCircle, label: "AI Assistant", color: "text-pink-600" },
  ];

  const doctorCards = [
    { to: "/appointments", icon: CalendarCheck, label: "Appointments", color: "text-teal-600" },
    { to: "/lab-tests", icon: FlaskConical, label: "Lab Tests", color: "text-blue-500" },
    { to: "/doctor-profile", icon: Stethoscope, label: "My Profile", color: "text-primary-600" },
  ];

  const adminCards = [
    { to: "/admin", icon: Users, label: "Manage Users", color: "text-primary-600" },
    { to: "/admin", icon: Building, label: "Manage Departments", color: "text-blue-600" },
    { to: "/appointments", icon: CalendarCheck, label: "All Appointments", color: "text-teal-600" },
  ];

  const cards = user?.role === "doctor" ? doctorCards : user?.role === "admin" ? adminCards : patientCards;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">Welcome, {user?.full_name} 👋</h1>
      <p className="text-slate-500 mb-8 capitalize">Role: {user?.role}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {cards.map((c) => (
          <Link to={c.to} key={c.label} className="card hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2 py-6">
            <c.icon className={`w-8 h-8 ${c.color}`} />
            <span className="font-medium text-sm">{c.label}</span>
          </Link>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-4">Upcoming Appointments</h2>
        {upcoming.length === 0 ? (
          <p className="text-slate-400 text-sm">No upcoming appointments.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm">
                    {user?.role === "doctor" ? a.patient_name : `Dr. ${a.doctor_name}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.appointment_date} at {a.appointment_time}
                  </p>
                </div>
                <span
                  className={`badge ${
                    a.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
