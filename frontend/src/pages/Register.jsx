import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Stethoscope } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    role: "patient",
    specialization: "",
    qualification: "",
    experience_years: 0,
    consultation_fee: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6 text-primary-700">
          <Stethoscope className="w-7 h-7" />
          <span className="text-xl font-bold">MediCare Plus</span>
        </div>
        <h1 className="text-2xl font-bold mb-1 text-center">Create Your Account</h1>
        <p className="text-slate-500 text-sm text-center mb-6">Join as a patient or a doctor</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            {["patient", "doctor"].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize ${
                  form.role === r
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input name="full_name" required className="input-field mt-1" value={form.full_name} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input type="email" name="email" required className="input-field mt-1" value={form.email} onChange={handleChange} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input name="phone" className="input-field mt-1" value={form.phone} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input type="password" name="password" required minLength={6} className="input-field mt-1" value={form.password} onChange={handleChange} />
          </div>

          {form.role === "doctor" && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Specialization</label>
                <input name="specialization" required className="input-field mt-1" value={form.specialization} onChange={handleChange} placeholder="e.g. Cardiologist" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Qualification</label>
                  <input name="qualification" className="input-field mt-1" value={form.qualification} onChange={handleChange} placeholder="MBBS, MD" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Experience (yrs)</label>
                  <input type="number" min="0" name="experience_years" className="input-field mt-1" value={form.experience_years} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Consultation Fee (₹)</label>
                <input type="number" min="0" name="consultation_fee" className="input-field mt-1" value={form.consultation_fee} onChange={handleChange} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-center text-slate-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
