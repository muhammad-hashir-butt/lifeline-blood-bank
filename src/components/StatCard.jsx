import React from "react";

export default function StatCard({ title, value, note, icon: Icon, accent = "crimson" }) {
  const styles = {
    crimson: "text-crimson bg-crimson-soft border-crimson/20",
    emerald: "text-emerald-brand bg-emerald-50 border-emerald-brand/20",
    amber: "text-amber-brand bg-amber-50 border-amber-brand/20",
    indigo: "text-indigo-brand bg-indigo-50 border-indigo-brand/20",
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <span className={`w-9 h-9 rounded-xl border flex items-center justify-center ${styles[accent]}`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="text-xs text-slate-500 mt-1.5">{note}</div>
    </article>
  );
}