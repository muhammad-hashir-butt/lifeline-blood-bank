import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", "Faisalabad", "Peshawar"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "donor",
    city: "Lahore",
    phone: "",
    bloodGroup: "O+",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Please fill name, email, and password.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      setSubmitting(true);
      await signUp(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 text-white p-12">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-crimson flex items-center justify-center font-bold text-2xl">+</span>
          <span className="text-xl font-bold tracking-tight">lifeline</span>
        </div>

        <div className="max-w-md">
          <span className="text-xs font-semibold uppercase tracking-widest text-crimson-soft/90">
            Strength in every connection
          </span>
          <h1 className="text-4xl font-bold leading-tight mt-3">
            Join a network that saves lives.
          </h1>
          <p className="text-slate-300 text-sm mt-4 leading-relaxed">
            Bring donors, hospitals, NGOs, and blood banks together with real-time visibility and emergency alerts.
          </p>
        </div>

        <div className="text-xs text-slate-400">Role-based access for Donors, Hospitals, NGOs & Admins</div>
      </div>

      <main className="flex flex-col items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-crimson">Get started</div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Create your account</h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">Set up your profile to join the operations portal.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-crimson-soft border border-crimson/20 text-crimson text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3.5">
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Full name / Organization</span>
              <input
                placeholder="e.g. Hashir Butt or Jinnah Hospital"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/30 focus:border-crimson"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Account role</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-crimson/30"
                >
                  <option value="donor">Donor</option>
                  <option value="hospital">Hospital</option>
                  <option value="ngo">NGO</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-700">City</span>
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-crimson/30"
                >
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>

            {form.role === "donor" && (
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Blood Group</span>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-crimson/30"
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-medium text-slate-700">Phone number</span>
              <input
                placeholder="0300-1234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/30"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-700">Email address</span>
              <input
                type="email"
                placeholder="you@hospital.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/30"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-700">Password</span>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/30"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-crimson hover:bg-crimson-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {submitting ? "Creating account..." : "Create account"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-slate-500 text-center mt-5">
            Already registered?{" "}
            <Link to="/" className="text-crimson font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}