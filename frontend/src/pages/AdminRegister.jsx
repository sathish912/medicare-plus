import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminRegister() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    role: "admin",
  });
  const [adminSecret, setAdminSecret] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form, adminSecret);
      toast.success("Admin Account created successfully!");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md border-t-4 border-t-red-600 shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-6 text-red-600">
          <ShieldCheck className="w-8 h-8" />
          <span className="text-xl font-bold">Admin Setup</span>
        </div>
        <h1 className="text-2xl font-bold mb-1 text-center">System Administrator</h1>
        <p className="text-slate-500 text-sm text-center mb-6">Restricted access registration</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Admin Secret Key</label>
            <input 
              type="password"
              name="adminSecret" 
              required 
              className="input-field mt-1 border-red-200 focus:border-red-500 focus:ring-red-500" 
              value={adminSecret} 
              onChange={(e) => setAdminSecret(e.target.value)} 
              placeholder="Enter the system secret"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input name="full_name" required className="input-field mt-1" value={form.full_name} onChange={handleChange} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input type="email" name="email" required className="input-field mt-1" value={form.email} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input name="phone" className="input-field mt-1" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input type="password" name="password" required minLength={6} className="input-field mt-1" value={form.password} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors mt-2">
            {loading ? "Authorizing..." : "Create Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
