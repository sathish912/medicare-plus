import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, Stethoscope, LogOut, Menu, X, ShoppingCart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getNotifications } from "../api/endpoints";
import { useCart } from "../context/CartContext";
import CartDrawer from "./CartDrawer";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();

  useEffect(() => {
    if (!user) return;
    const fetchCount = () => {
      getNotifications()
        .then((res) => setUnread(res.data.filter((n) => !n.is_read).length))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        ...(user.role === "patient"
          ? [
              { to: "/doctors", label: "Find a Doctor" },
              { to: "/appointments", label: "Appointments" },
              { to: "/records", label: "Medical Records" },
              { to: "/lab-tests", label: "Lab Tests" },
              { to: "/prescriptions", label: "Prescriptions" },
              { to: "/billing", label: "Billing" },
              { to: "/insurance", label: "Insurance" },
              { to: "/symptom-checker", label: "Symptom Checker" },
              { to: "/assistant", label: "AI Assistant" },
              { to: "/pharmacy", label: "Pharmacy" },
              { to: "/my-orders", label: "My Orders" },
              { to: "/reminders", label: "Reminders" },
              { to: "/analytics", label: "Health Analytics" },
              { to: "/emergency", label: "Emergency" },
              { to: "/feedback", label: "Give Feedback" },
            ]
          : []),
        ...(user.role === "doctor"
          ? [
              { to: "/appointments", label: "Appointments" },
              { to: "/lab-tests", label: "Lab Tests" },
              { to: "/doctor-profile", label: "My Profile" },
              { to: "/bed-management", label: "Bed Management" },
              { to: "/admissions", label: "Admissions" },
              { to: "/admin/emergencies", label: "Emergencies" },
              { to: "/revenue", label: "Revenue" },
            ]
          : []),
        ...(user.role === "admin" 
          ? [
              { to: "/admin", label: "Admin Panel" },
              { to: "/lab-tests", label: "Lab Tests" },
              { to: "/bed-management", label: "Bed Management" },
              { to: "/admissions", label: "Admissions" },
              { to: "/admin/emergencies", label: "Emergencies" },
              { to: "/admin/feedback", label: "Feedback Stats" },
              { to: "/revenue", label: "Revenue" },
            ] 
          : []),
      ]
    : [];

  const location = useLocation();
  const topLinkLabels = ["Dashboard", "Appointments", "Medical Records", "Lab Tests", "Emergency", "Give Feedback", "Emergencies", "Feedback Stats", "Revenue"];
  const topLinks = navLinks.filter(link => topLinkLabels.includes(link.label));
  const bottomLinks = navLinks.filter(link => !topLinkLabels.includes(link.label));

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary-700 text-xl tracking-tight mr-6">
            <Stethoscope className="w-6 h-6" />
            MediCare Plus
          </Link>

          <div className="hidden md:flex items-center gap-1 flex-1">
            {topLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive(link.to) 
                    ? "bg-primary-50 text-primary-700 font-semibold" 
                    : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user?.role === 'patient' && (
              <button 
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-primary-700 rounded-full transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-white">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {user && (
              <Link to="/notifications" className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-primary-700 rounded-full transition-all">
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-white">
                    {unread}
                  </span>
                )}
              </Link>
            )}
            
            {user ? (
              <div className="flex items-center pl-4 ml-2 border-l border-slate-200 gap-4">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Welcome</span>
                  <span className="text-sm font-bold text-slate-700 leading-tight">{user.full_name}</span>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-all" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-4 ml-2 border-l border-slate-200">
                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2 rounded-full shadow-sm hover:shadow">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-3">
            {user?.role === 'patient' && (
              <button 
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-slate-600 hover:text-primary-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </button>
            )}
            {user && (
              <Link to="/notifications" className="relative p-2 text-slate-600 hover:text-primary-700 transition-colors">
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unread}
                  </span>
                )}
              </Link>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Secondary Navigation (Links) */}
        {user && bottomLinks.length > 0 && (
          <div className="hidden md:flex bg-slate-50/80 border-t border-slate-200 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
              {bottomLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 ${
                    isActive(link.to)
                      ? "bg-white text-primary-700 font-semibold shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 font-medium"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 px-4 py-3 space-y-2 max-h-[60vh] overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-slate-600 hover:text-primary-700 py-2 border-b border-slate-100 last:border-0"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <button onClick={handleLogout} className="btn-secondary w-full text-sm mt-4">
                Logout
              </button>
            ) : (
              <div className="flex gap-2 mt-4">
                <Link to="/login" className="btn-secondary text-sm flex-1 text-center">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm flex-1 text-center">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
      
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
