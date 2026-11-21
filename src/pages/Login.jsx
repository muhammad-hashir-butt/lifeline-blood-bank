import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      return;
    }
    try {
      setSubmitting(true);
      await signIn(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid login credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="flex items-center gap-3 z-10">
          <span className="w-10 h-10 rounded-xl bg-crimson flex items-center justify-center font-bold text-2xl">+</span>
          <span className="text-xl font-bold tracking-tight">lifeline</span>
        </div>

        <div className="z-10 max-w-md">
          <span className="text-xs font-semibold uppercase tracking-widest text-crimson-soft/90">
            Connected care starts here
          </span>
          <h1 className="text-4xl font-bold leading-tight mt-3">
            Every donation makes a difference.
          </h1>
          <p className="text-slate-300 text-sm mt-4 leading-relaxed">
            Real-time blood inventory tracking, smart donor matching, and AI-assisted shortage forecasting in one platform.
          </p>
          <div className="flex gap-2.5 mt-8">
            {["O−", "A+", "B+", "AB−"].map((g) => (
              <span key={g} className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-sm font-bold">
                {g}
              </span>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 z-10">Blood bank operations & shortage prediction platform</div>
      </div>

      <main className="flex flex-col items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-2 lg:hidden mb-6">
            <span className="w-8 h-8 rounded-lg bg-crimson text-white flex items-center justify-center font-bold">+</span>
            <span className="font-bold text-slate-900">lifeline</span>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-crimson">Welcome back</div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Sign in to your account</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Enter your details to access the operations portal.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-crimson-soft border border-crimson/20 text-crimson text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Email address</span>
              <input
                type="email"
                placeholder="you@hospital.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/30 focus:border-crimson"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-700">Password</span>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/30 focus:border-crimson"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-crimson hover:bg-crimson-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {submitting ? "Signing in..." : "Sign in"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-slate-500 text-center mt-6">
            New to Lifeline?{" "}
            <Link to="/register" className="text-crimson font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </form>
        <div className="text-xs text-slate-400 mt-6">© 2026 Lifeline Blood Services</div>
      </main>
    </div>
  );
}