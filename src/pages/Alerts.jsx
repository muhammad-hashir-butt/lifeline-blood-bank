import React, { useEffect, useState } from "react";
import { BellRing, Send, MapPin, Mail, CheckCircle2, ShieldAlert } from "lucide-react";
import { alertsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BloodGroupBadge from "../components/BloodGroupBadge";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", "Faisalabad", "Peshawar"];

export default function Alerts() {
  const { profile } = useAuth();
  const canBroadcast = ["admin", "hospital", "ngo"].includes(profile?.role || "");

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcast, setBroadcast] = useState({
    blood_group: "O-",
    city: profile?.city || "Lahore",
    hospital_name: profile?.role === "hospital" ? profile?.full_name || "Jinnah Hospital" : "Jinnah Hospital",
  });
  const [sending, setSending] = useState(false);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const data = await alertsApi.list();
      setAlerts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  const sendCityBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const data = await alertsApi.broadcast(broadcast);
      fetchAlerts();
      alert(`Broadcast email dispatched to ${data.count} donor(s) in ${broadcast.city}!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-crimson">Notifications & Location</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Email & Location Alerts</h1>
          <p className="text-sm text-slate-500">Dispatch location-targeted email alerts to nearby compatible donors.</p>
        </div>
        <div className="text-xs font-medium text-emerald-brand bg-emerald-50 border border-emerald-brand/20 px-3 py-1.5 rounded-full self-start">
          Nodemailer Gateway Active
        </div>
      </div>

      {!canBroadcast && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-brand/20 text-amber-brand text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>You can view alerts sent to you. Only Hospital, NGO, or Admin can broadcast new alerts.</span>
        </div>
      )}

      {canBroadcast && (
        <form onSubmit={sendCityBroadcast} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-crimson" /> Broadcast Location-Based Email Alert
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
              {sending ? "Sending..." : "Send City Email"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Dispatched Email Log</h2>
          <span className="text-xs text-slate-500">{alerts.length} total alert(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Blood</th>
                <th className="px-5 py-3">Email Message</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-400">Loading alerts...</td></tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                    No email alerts sent yet. Use Smart Match on Emergency Requests or send a City Broadcast above!
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{a.recipient_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {a.recipient_email || a.recipient_phone || "—"}
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
