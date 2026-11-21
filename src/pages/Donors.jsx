import React, { useEffect, useState } from "react";
import { Search, UserPlus, History, Droplet, MapPin, Phone, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import BloodGroupBadge from "../components/BloodGroupBadge";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CITY_COORDS = {
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Faisalabad: { lat: 31.4504, lng: 73.135 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
};

function getEligibility(lastDate) {
  if (!lastDate) return { eligible: true, daysLeft: 0 };
  const days = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
  return { eligible: days >= 90, daysLeft: Math.max(0, 90 - days) };
}

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    blood_group: "O+",
    phone: "",
    city: "Lahore",
    last_donation_date: "",
  });

  const [historyModal, setHistoryModal] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);

  async function fetchDonors() {
    setLoading(true);
    const { data } = await supabase.from("donors").select("*").order("created_at", { ascending: false });
    if (data) setDonors(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchDonors();
  }, []);

  const addDonor = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert("Name and phone are required.");
      return;
    }
    const coords = CITY_COORDS[form.city] || CITY_COORDS.Lahore;
    const { error } = await supabase.from("donors").insert({
      name: form.name,
      blood_group: form.blood_group,
      phone: form.phone,
      city: form.city,
      latitude: coords.lat,
      longitude: coords.lng,
      last_donation_date: form.last_donation_date || null,
    });
    if (error) {
      alert(error.message);
      return;
    }
    setForm({ name: "", blood_group: "O+", phone: "", city: "Lahore", last_donation_date: "" });
    setShowAdd(false);
    fetchDonors();
  };

  const recordDonation = async (donor) => {
    const hospital = prompt(`Record blood donation for ${donor.name}.\nEnter Hospital Name:`, "Jinnah Hospital");
    if (!hospital) return;
    const today = new Date().toISOString().slice(0, 10);

    await supabase.from("donation_history").insert({
      donor_id: donor.id,
      hospital_name: hospital,
      blood_group: donor.blood_group,
      units: 1,
      donated_at: today,
      notes: "Recorded via Lifeline Portal",
    });

    await supabase.from("donors").update({ last_donation_date: today }).eq("id", donor.id);
    fetchDonors();
  };

  const openHistory = async (donor) => {
    setHistoryModal(donor);
    const { data } = await supabase
      .from("donation_history")
      .select("*")
      .eq("donor_id", donor.id)
      .order("donated_at", { ascending: false });
    setHistoryRows(data || []);
  };

  const filtered = donors.filter((d) => {
    const { eligible } = getEligibility(d.last_donation_date);
    if (onlyEligible && !eligible) return false;
    return (
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.blood_group.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-crimson">People & Eligibility</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Registered Donors</h1>
          <p className="text-sm text-slate-500">Automatic 90-day donation eligibility check & history tracking.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 bg-crimson hover:bg-crimson-dark text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer self-start"
        >
          <UserPlus className="w-4 h-4" /> {showAdd ? "Close Form" : "Register Donor"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addDonor} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">Add New Donor</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <select
              value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
            <input
              placeholder="Phone (0300-1234567)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {Object.keys(CITY_COORDS).map((c) => <option key={c}>{c}</option>)}
            </select>
            <input
              type="date"
              title="Last Donation Date (optional)"
              value={form.last_donation_date}
              onChange={(e) => setForm({ ...form, last_donation_date: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <button type="submit" className="bg-crimson text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer">
            Save Donor
          </button>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            placeholder="Search by name, blood group, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
          />
        </div>
        <label className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyEligible}
            onChange={(e) => setOnlyEligible(e.target.checked)}
            className="accent-crimson"
          />
          Eligible Donors Only
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Donor Name</th>
                <th className="px-5 py-3">Blood Group</th>
                <th className="px-5 py-3">Contact & City</th>
                <th className="px-5 py-3">Last Donation</th>
                <th className="px-5 py-3">90-Day Eligibility</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-5 py-8 text-center text-slate-400">Loading donors...</td></tr>
              ) : filtered.map((d) => {
                const { eligible, daysLeft } = getEligibility(d.last_donation_date);
                return (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{d.name}</td>
                    <td className="px-5 py-3.5"><BloodGroupBadge group={d.blood_group} /></td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 space-y-0.5">
                      <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {d.phone}</div>
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-crimson" /> {d.city}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{d.last_donation_date || "Never donated"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        eligible
                          ? "bg-emerald-50 text-emerald-brand border-emerald-brand/20"
                          : "bg-crimson-soft text-crimson border-crimson/20"
                      }`}>
                        {eligible ? "Eligible" : `Wait ${daysLeft} days`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        disabled={!eligible}
                        onClick={() => recordDonation(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-crimson-soft text-crimson hover:bg-crimson hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
                      >
                        <Droplet className="w-3.5 h-3.5" /> Donate
                      </button>
                      <button
                        onClick={() => openHistory(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" /> History
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {historyModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900">{historyModal.name}</h3>
                <p className="text-xs text-slate-500">Donation History ({historyModal.blood_group})</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {historyRows.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center bg-slate-50 rounded-xl">
                No recorded donations yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {historyRows.map((h) => (
                  <div key={h.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-slate-800">{h.hospital_name}</div>
                      <div className="text-xs text-slate-500">{h.donated_at}</div>
                    </div>
                    <span className="text-xs font-bold text-crimson">{h.units} unit(s)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}