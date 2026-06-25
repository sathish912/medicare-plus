import { Link } from "react-router-dom";
import { CalendarCheck, FileText, MessageCircle, Bell, Stethoscope, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Book Appointments",
    desc: "Find the right specialist and book an online or in-person consultation in seconds.",
  },
  {
    icon: Stethoscope,
    title: "Consult Doctors Online",
    desc: "Connect with verified doctors and manage your consultations from one dashboard.",
  },
  {
    icon: FileText,
    title: "Medical Records & Prescriptions",
    desc: "Access your reports, diagnoses, and prescriptions anytime, anywhere.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Get notified instantly about appointment updates and new records.",
  },
  {
    icon: MessageCircle,
    title: "AI Healthcare Assistant",
    desc: "Get instant guidance on symptoms and health questions, day or night.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    desc: "Your health data is protected with industry-standard encryption and JWT security.",
  },
];

export default function Landing() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary-700 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Your Health, Digitally Managed
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto mb-8">
            MediCare Plus connects patients and doctors on one platform — book appointments,
            consult online, manage records, and get AI-powered healthcare guidance.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="bg-white text-primary-700 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50">
              Get Started Free
            </Link>
            <Link to="/login" className="border border-white/60 font-semibold px-6 py-3 rounded-lg hover:bg-white/10">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Everything You Need In One Place</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card">
              <f.icon className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-slate-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
