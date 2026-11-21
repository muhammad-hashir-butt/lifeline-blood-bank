import React, { useEffect, useState } from "react";
import { BellRing, Send, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import BloodGroupBadge from "../components/BloodGroupBadge";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", "Faisalabad", "Peshawar"];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcast, setBroadcast] = useState({
    blood_group: "O-",
    city: "Lahore",
    hospital_name: "Jinnah Hospital",
  });
  const [sending, setSending] = useState(false);

  async function fetchAlerts() {
    setLoading(true);
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAlerts(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  const sendCityBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    const { data: donors } = await supabase
      .from("donors")
      .select("*")
      .eq("city", broadcast.city);

    const matching = (donors || []).filter(
      (d) => d.blood_group === broadcast.blood_group || d.blood_group === "O-"
    );

    if (matching.length === 0) {
      alert(`No donors with ${broadcast.blood_group} or O- found in ${broadcast.city}.`);
      setSending(false);
      return;
    }

    const rows = matching.map((d) => ({
      recipient_name: d.name,
      recipient_phone: d.phone,
      city: d.city,
      blood_group: broadcast.blood_group,
      message: `EMERGENCY ALERT: ${broadcast.hospital_name} in ${broadcast.city} urgently needs ${broadcast.blood_group} blood donors.`,
      channel: "SMS",
      status: "sent",
    }));

    await supabase.from("alerts").insert(rows);
    setSending(false);
    fetchAlerts();
    alert(`Broadcast SMS dispatched to ${rows.length} donor(s) in ${broadcast.city}!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-crimson">Notifications & Location</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">SMS & Location Alerts</h1>
          <p className="text-sm text-slate-500">Dispatch location-targeted SMS alerts to nearby compatible donors.</p>
        </div>
        <div className="text-xs font-medium text-emerald-brand bg-emerald-50 border border-emerald-brand/20 px-3 py-1.5 rounded-full self-start">
          SMS Gateway Log Active
        </div>
      </div>

      <form onSubmit={sendCityBroadcast} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <BellRing className="w-4 h-4 text-crimson" /> Broadcast Location-Based SMS Alert
        </h2>
        <div className="grid sm:grid-cols-4 gap-3">
          <select
            value={broadcast.blood_group}
            onChange={(e) => setBroadcast({ ...broadcast, blood_group: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select
            value={broadcast.city}
            onChange={(e) => setBroadcast({ ...broadcast, city: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input
            placeholder="Hospital Name"
            value={broadcast.hospital_name}
            onChange={(e) => setBroadcast({ ...broadcast, hospital_name: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 bg-crimson hover:bg-crimson-dark text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? "Sending..." : "Send City SMS"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Dispatched SMS Log</h2>
          <span className="text-xs text-slate-500">{alerts.length} total alert(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Blood</th>
                <th className="px-5 py-3">SMS Message</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-400">Loading alerts...</td></tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                    No SMS alerts sent yet. Use Smart Match on Emergency Requests or send a City Broadcast above!
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{a.recipient_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {a.recipient_phone}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3 text-crimson" /> {a.city}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {a.blood_group && <BloodGroupBadge group={a.blood_group} />}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 max-w-md">{a.message}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-brand border border-emerald-brand/20">
                        <CheckCircle2 className="w-3 h-3" /> {a.status} ({a.channel})
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}