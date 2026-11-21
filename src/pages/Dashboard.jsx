import React, { useEffect, useState } from "react";
import { Droplets, Users, Siren, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import BloodGroupBadge from "../components/BloodGroupBadge";

const statusStyle = {
  pending: "bg-amber-50 text-amber-brand border-amber-brand/20",
  matched: "bg-indigo-50 text-indigo-brand border-indigo-brand/20",
  fulfilled: "bg-emerald-50 text-emerald-brand border-emerald-brand/20",
  cancelled: "bg-crimson-soft text-crimson border-crimson/20",
};

export default function Dashboard() {
  const { profile } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [donorsCount, setDonorsCount] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      const [invRes, donorRes, reqRes] = await Promise.all([
        supabase.from("inventory").select("*").order("units", { ascending: true }),
        supabase.from("donors").select("id", { count: "exact", head: true }),
        supabase.from("requests").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      if (invRes.data) setInventory(invRes.data);
      if (typeof donorRes.count === "number") setDonorsCount(donorRes.count);
      if (reqRes.data) setRequests(reqRes.data);
      setLoading(false);
    }
    loadOverview();
  }, []);

  const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0);
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const lowStockCount = inventory.filter((i) => i.units <= 5).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-crimson">
            Operations Overview
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Welcome, {profile?.full_name || "Team"}
          </h1>
          <p className="text-sm text-slate-500">Live status of blood stock, donors, and emergency requests.</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-brand bg-emerald-50 border border-emerald-brand/20 px-3 py-1.5 rounded-full self-start">
          <span className="w-2 h-2 rounded-full bg-emerald-brand animate-pulse" />
          Live Supabase Sync
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Available Units" value={totalUnits} note="Across all hospitals" icon={Droplets} accent="crimson" />
        <StatCard title="Registered Donors" value={donorsCount} note="Active donor directory" icon={Users} accent="emerald" />
        <StatCard title="Pending Requests" value={pendingCount} note="Awaiting fulfillment" icon={Siren} accent="amber" />
        <StatCard title="Low Stock Alerts" value={lowStockCount} note="5 units or below" icon={AlertTriangle} accent="indigo" />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading live data from database...
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Inventory Snapshot</h2>
              <span className="text-xs text-slate-500">Sorted by lowest stock</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Group</th>
                    <th className="px-5 py-3">Units</th>
                    <th className="px-5 py-3">Hospital</th>
                    <th className="px-5 py-3">City</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3"><BloodGroupBadge group={item.blood_group} /></td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{item.units} units</td>
                      <td className="px-5 py-3 text-slate-600">{item.hospital_name}</td>
                      <td className="px-5 py-3 text-slate-500">{item.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent Requests</h2>
              <span className="text-xs text-slate-500">Emergency queue</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Hospital</th>
                    <th className="px-5 py-3">Group</th>
                    <th className="px-5 py-3">Units</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-medium text-slate-800">{req.hospital_name}</td>
                      <td className="px-5 py-3"><BloodGroupBadge group={req.blood_group} /></td>
                      <td className="px-5 py-3 text-slate-600">{req.units}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusStyle[req.status] || ""}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}