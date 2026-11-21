import React, { useEffect, useState } from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import BloodGroupBadge from "../components/BloodGroupBadge";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Prediction() {
  const [demandRows, setDemandRows] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMonth, setNewMonth] = useState({ month_label: "", actual_units: "" });

  async function loadPredictionData() {
    setLoading(true);
    const [demRes, invRes, reqRes] = await Promise.all([
      supabase.from("monthly_demand").select("*").order("month_order", { ascending: true }),
      supabase.from("inventory").select("*"),
      supabase.from("requests").select("*").eq("status", "pending"),
    ]);
    if (demRes.data) setDemandRows(demRes.data);
    if (invRes.data) setInventory(invRes.data);
    if (reqRes.data) setRequests(reqRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadPredictionData();
  }, []);

  // Weighted Moving Average Forecast for next month
  const last3 = demandRows.slice(-3);
  const nextMonthForecast =
    last3.length === 3
      ? Math.round((last3[0].actual_units * 1 + last3[1].actual_units * 2 + last3[2].actual_units * 3) / 6 + 3)
      : 82;

  const maxChart = Math.max(
    1,
    ...demandRows.map((d) => Math.max(d.predicted_units, d.actual_units)),
    nextMonthForecast
  );

  // Per-blood-group Shortage Risk Analysis
  const riskReport = BLOOD_GROUPS.map((group) => {
    const stockUnits = inventory
      .filter((i) => i.blood_group === group)
      .reduce((sum, i) => sum + i.units, 0);
    const pendingUnits = requests
      .filter((r) => r.blood_group === group)
      .reduce((sum, r) => sum + r.units, 0);
    const projectedNeed = Math.max(8, Math.round(nextMonthForecast * 0.14) + pendingUnits);
    const gap = stockUnits - projectedNeed;

    let risk = "Healthy";
    let recommendation = "Stock levels sufficient for projected demand.";
    if (stockUnits === 0 || gap <= -6) {
      risk = "Critical Shortage";
      recommendation = `Urgent: Launch donor campaign for ${group} (${Math.abs(gap)} units deficit).`;
    } else if (gap < 0 || stockUnits <= 5) {
      risk = "Moderate Risk";
      recommendation = `Replenish ${group} supply soon to maintain safety buffer.`;
    }
    return { group, stockUnits, pendingUnits, projectedNeed, risk, recommendation };
  });

  const addMonthRecord = async (e) => {
    e.preventDefault();
    if (!newMonth.month_label || !newMonth.actual_units) return;
    await supabase.from("monthly_demand").insert({
      month_label: newMonth.month_label,
      month_order: demandRows.length + 1,
      actual_units: Number(newMonth.actual_units),
      predicted_units: nextMonthForecast,
    });
    setNewMonth({ month_label: "", actual_units: "" });
    loadPredictionData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-crimson">Shortage Prediction Service</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Demand Forecast & Shortage Risk</h1>
          <p className="text-sm text-slate-500">Weighted moving-average forecast paired with live hospital stock analysis.</p>
        </div>
        <div className="bg-white border border-crimson/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-crimson" />
          <div>
            <div className="text-[11px] uppercase font-semibold text-slate-500">Next Month Forecast</div>
            <div className="text-lg font-bold text-crimson">{nextMonthForecast} units projected</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h2 className="font-semibold text-slate-900">Monthly Demand vs. Forecast</h2>
            <p className="text-xs text-slate-500">Historical accuracy and upcoming projected demand</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-crimson inline-block" /> Predicted
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-brand inline-block" /> Actual
            </span>
          </div>
        </div>

        {loading ? (
          <div className="h-56 flex items-center justify-center text-sm text-slate-400">Loading forecast chart...</div>
        ) : (
          <div className="flex items-end gap-4 h-56 pt-4 border-b border-slate-200 px-2 overflow-x-auto">
            {demandRows.map((item) => (
              <div key={item.id} className="flex-1 min-w-[3.5rem] h-full flex flex-col items-center justify-end gap-2">
                <div className="w-full h-full flex items-end justify-center gap-1.5">
                  <div
                    title={`Predicted: ${item.predicted_units}`}
                    style={{ height: `${(item.predicted_units / maxChart) * 100}%` }}
                    className="w-5 bg-crimson/85 rounded-t-md transition-all"
                  />
                  <div
                    title={`Actual: ${item.actual_units}`}
                    style={{ height: `${(item.actual_units / maxChart) * 100}%` }}
                    className="w-5 bg-emerald-brand rounded-t-md transition-all"
                  />
                </div>
                <span className="text-xs font-medium text-slate-600">{item.month_label}</span>
              </div>
            ))}
            <div className="flex-1 min-w-[4rem] h-full flex flex-col items-center justify-end gap-2">
              <div className="w-full h-full flex items-end justify-center">
                <div
                  title={`Next Month Forecast: ${nextMonthForecast}`}
                  style={{ height: `${(nextMonthForecast / maxChart) * 100}%` }}
                  className="w-7 bg-crimson/35 border-2 border-dashed border-crimson rounded-t-md"
                />
              </div>
              <span className="text-xs font-bold text-crimson">Next</span>
            </div>
          </div>
        )}

        <form onSubmit={addMonthRecord} className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">Log Monthly Usage:</span>
          <input
            placeholder="Month (e.g. Dec)"
            value={newMonth.month_label}
            onChange={(e) => setNewMonth({ ...newMonth, month_label: e.target.value })}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs w-32"
          />
          <input
            type="number"
            min="1"
            placeholder="Actual Units"
            value={newMonth.actual_units}
            onChange={(e) => setNewMonth({ ...newMonth, actual_units: e.target.value })}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs w-32"
          />
          <button type="submit" className="inline-flex items-center gap-1 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add Month
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Blood Group Shortage Risk Analysis</h2>
          <p className="text-xs text-slate-500">Live comparison of current inventory against projected 30-day demand</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Blood Group</th>
                <th className="px-5 py-3">Current Stock</th>
                <th className="px-5 py-3">Pending Requests</th>
                <th className="px-5 py-3">Projected Need</th>
                <th className="px-5 py-3">Risk Level</th>
                <th className="px-5 py-3">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riskReport.map((row) => (
                <tr key={row.group} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5"><BloodGroupBadge group={row.group} /></td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{row.stockUnits} units</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.pendingUnits} units</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.projectedNeed} units</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                      row.risk === "Critical Shortage"
                        ? "bg-crimson-soft text-crimson border-crimson/20"
                        : row.risk === "Moderate Risk"
                        ? "bg-amber-50 text-amber-brand border-amber-brand/20"
                        : "bg-emerald-50 text-emerald-brand border-emerald-brand/20"
                    }`}>
                      {row.risk === "Healthy" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {row.risk}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{row.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}