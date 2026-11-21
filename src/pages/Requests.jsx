import React, { useEffect, useState } from "react";
import { Siren, Sparkles, CheckCircle2, MapPin, Send, X, Building2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
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

const urgencyStyles = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-amber-50 text-amber-brand border-amber-brand/20",
  high: "bg-crimson-soft text-crimson border-crimson/20",
  critical: "bg-crimson text-white border-crimson",
};

const statusStyles = {
  pending: "bg-amber-50 text-amber-brand border-amber-brand/20",
  matched: "bg-indigo-50 text-indigo-brand border-indigo-brand/20",
  fulfilled: "bg-emerald-50 text-emerald-brand border-emerald-brand/20",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

function distanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function isEligible(lastDate) {
  if (!lastDate) return true;
  const days = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
  return days >= 90;
}

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    hospital_name: "",
    city: "Lahore",
    blood_group: "O-",
    units: "",
    urgency: "high",
  });

  const [matchModal, setMatchModal] = useState(null);
  const [matchedStock, setMatchedStock] = useState([]);
  const [matchedDonors, setMatchedDonors] = useState([]);
  const [sendingAlert, setSendingAlert] = useState(false);

  async function fetchRequests() {
    setLoading(true);
    const { data } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRequests(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const createRequest = async (e) => {
    e.preventDefault();
    if (!form.hospital_name || !form.units) {
      alert("Please enter hospital name and units needed.");
      return;
    }
    const { error } = await supabase.from("requests").insert({
      hospital_name: form.hospital_name,
      city: form.city,
      blood_group: form.blood_group,
      units: Number(form.units),
      urgency: form.urgency,
      status: "pending",
      created_by: user?.id,
    });
    if (error) {
      alert(error.message);
      return;
    }
    setForm({ hospital_name: "", city: "Lahore", blood_group: "O-", units: "", urgency: "high" });
    fetchRequests();
  };

  const openSmartMatch = async (req) => {
    setMatchModal(req);
    const reqCoords = CITY_COORDS[req.city] || CITY_COORDS.Lahore;

    const [invRes, donorRes] = await Promise.all([
      supabase.from("inventory").select("*").gt("units", 0),
      supabase.from("donors").select("*"),
    ]);

    const stocks = (invRes.data || [])
      .filter((i) => i.blood_group === req.blood_group || i.blood_group === "O-")
      .sort((a, b) => (a.city === req.city ? -1 : b.city === req.city ? 1 : b.units - a.units));

    const donors = (donorRes.data || [])
      .filter((d) => isEligible(d.last_donation_date) && (d.blood_group === req.blood_group || d.blood_group === "O-"))
      .map((d) => {
        const dCoords = d.latitude && d.longitude ? { lat: d.latitude, lng: d.longitude } : CITY_COORDS[d.city] || CITY_COORDS.Lahore;
        return {
          ...d,
          distance: distanceKm(reqCoords.lat, reqCoords.lng, dCoords.lat, dCoords.lng),
        };
      })
      .sort((a, b) => a.distance - b.distance);

    setMatchedStock(stocks);
    setMatchedDonors(donors);
  };

  const matchWithStock = async (stock) => {
    if (!matchModal) return;
    await supabase
      .from("requests")
      .update({
        status: "matched",
        matched_source: `${stock.hospital_name} (${stock.city})`,
      })
      .eq("id", matchModal.id);

    const remaining = Math.max(0, stock.units - matchModal.units);
    await supabase.from("inventory").update({ units: remaining }).eq("id", stock.id);

    setMatchModal(null);
    fetchRequests();
  };

  const sendAlertsToDonors = async () => {
    if (!matchModal || matchedDonors.length === 0) return;
    setSendingAlert(true);

    const topDonors = matchedDonors.slice(0, 5);
    const alertRows = topDonors.map((d) => ({
      request_id: matchModal.id,
      recipient_name: d.name,
      recipient_phone: d.phone,
      city: d.city,
      blood_group: matchModal.blood_group,
      message: `URGENT: ${matchModal.hospital_name} (${matchModal.city}) needs ${matchModal.units} unit(s) of ${matchModal.blood_group} blood (${d.distance} km away).`,
      channel: "SMS",
      status: "sent",
    }));

    await supabase.from("alerts").insert(alertRows);
    await supabase
      .from("requests")
      .update({
        status: "matched",
        matched_source: `SMS Alerted ${topDonors.length} nearby donor(s)`,
      })
      .eq("id", matchModal.id);

    setSendingAlert(false);
    setMatchModal(null);
    fetchRequests();
    alert(`SMS alerts sent and logged for ${topDonors.length} eligible donor(s)!`);
  };

  const markFulfilled = async (id) => {
    await supabase.from("requests").update({ status: "fulfilled" }).eq("id", id);
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-crimson">Emergency Coordination</div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Emergency Blood Requests</h1>
        <p className="text-sm text-slate-500">Create urgent requests, run smart stock/location matching, and dispatch SMS alerts.</p>
      </div>

      <form onSubmit={createRequest} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Siren className="w-4 h-4 text-crimson" /> Create Emergency Request
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            placeholder="Requesting Hospital Name"
            value={form.hospital_name}
            onChange={(e) => setForm({ ...form, hospital_name: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            {Object.keys(CITY_COORDS).map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={form.blood_group}
            onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Units Needed"
            value={form.units}
            onChange={(e) => setForm({ ...form, units: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <select
            value={form.urgency}
            onChange={(e) => setForm({ ...form, urgency: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="low">Low Urgency</option>
            <option value="medium">Medium Urgency</option>
            <option value="high">High Urgency</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-3 bg-crimson hover:bg-crimson-dark text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
        >
          + Submit Request
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Hospital & City</th>
                <th className="px-5 py-3">Blood</th>
                <th className="px-5 py-3">Units</th>
                <th className="px-5 py-3">Urgency</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Matched Source</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-5 py-8 text-center text-slate-400">Loading requests...</td></tr>
              ) : requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{r.hospital_name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-crimson" /> {r.city}
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><BloodGroupBadge group={r.blood_group} /></td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{r.units}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${urgencyStyles[r.urgency]}`}>
                      {r.urgency}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusStyles[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{r.matched_source || "Not matched yet"}</td>
                  <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                    {r.status === "pending" && (
                      <button
                        onClick={() => openSmartMatch(r)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-crimson text-white hover:bg-crimson-dark cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Smart Match
                      </button>
                    )}
                    {r.status === "matched" && (
                      <button
                        onClick={() => markFulfilled(r.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-brand border border-emerald-brand/20 hover:bg-emerald-brand hover:text-white cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Fulfilled
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {matchModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-crimson">Smart Matching Engine</div>
                <h3 className="text-lg font-bold text-slate-900">
                  {matchModal.hospital_name} ({matchModal.city}) — Needs {matchModal.units} unit(s) of {matchModal.blood_group}
                </h3>
              </div>
              <button onClick={() => setMatchModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-brand" /> Available Compatible Hospital Stock
              </h4>
              {matchedStock.length === 0 ? (
                <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl">No compatible stock currently in inventory.</p>
              ) : (
                <div className="space-y-2">
                  {matchedStock.map((s) => (
                    <div key={s.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <BloodGroupBadge group={s.blood_group} />
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{s.hospital_name} ({s.city})</div>
                          <div className="text-xs text-slate-500">{s.units} unit(s) available</div>
                        </div>
                      </div>
                      <button
                        onClick={() => matchWithStock(s)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-brand hover:bg-indigo-brand hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Allocate Stock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-crimson" /> Nearest Eligible Donors (Sorted by Distance)
                </h4>
                {matchedDonors.length > 0 && (
                  <button
                    disabled={sendingAlert}
                    onClick={sendAlertsToDonors}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-crimson hover:bg-crimson-dark text-white text-xs font-semibold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingAlert ? "Sending..." : "Send SMS Alerts"}
                  </button>
                )}
              </div>
              {matchedDonors.length === 0 ? (
                <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl">No eligible compatible donors found.</p>
              ) : (
                <div className="space-y-2">
                  {matchedDonors.map((d) => (
                    <div key={d.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BloodGroupBadge group={d.blood_group} />
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{d.name}</div>
                          <div className="text-xs text-slate-500">{d.city} • {d.phone}</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-brand border border-emerald-brand/20">
                        {d.distance === 0 ? "Same City (0 km)" : `${d.distance} km away`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}