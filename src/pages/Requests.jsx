import React, { useEffect, useState } from "react";
import { Siren, Sparkles, CheckCircle2, MapPin, Send, X, Building2, ShieldAlert } from "lucide-react";
import { requestsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BloodGroupBadge from "../components/BloodGroupBadge";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", "Faisalabad", "Peshawar"];

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

export default function Requests() {
  const { profile } = useAuth();
  const role = profile?.role || "donor";
  const canManage = ["admin", "hospital", "ngo"].includes(role);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    hospital_name: role === "hospital" ? profile?.full_name || "" : "",
    city: profile?.city || "Lahore",
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
    try {
      const data = await requestsApi.list();
      setRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    try {
      await requestsApi.create({
        hospital_name: form.hospital_name,
        city: form.city,
        blood_group: form.blood_group,
        units: Number(form.units),
        urgency: form.urgency,
      });
      setForm({
        hospital_name: role === "hospital" ? profile?.full_name || "" : "",
        city: profile?.city || "Lahore",
        blood_group: "O-",
        units: "",
        urgency: "high",
      });
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const openSmartMatch = async (req) => {
    setMatchModal(req);
    try {
      const data = await requestsApi.match(req.id);
      setMatchedStock(data.matchedStock || []);
      setMatchedDonors(data.matchedDonors || []);
    } catch (err) {
      alert(err.message);
    }
  };

  const matchWithStock = async (stock) => {
    if (!matchModal) return;
    try {
      await requestsApi.allocate(matchModal.id, stock.id);
      setMatchModal(null);
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const sendAlertsToDonors = async () => {
    if (!matchModal || matchedDonors.length === 0) return;
    setSendingAlert(true);
    try {
      const data = await requestsApi.alertDonors(matchModal.id);
      setMatchModal(null);
      fetchRequests();
      alert(`Email alerts sent and logged for ${data.count} eligible donor(s)!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingAlert(false);
    }
  };

  const markFulfilled = async (id) => {
    try {
      await requestsApi.update(id, { status: "fulfilled" });
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-crimson">Emergency Coordination</div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Emergency Blood Requests</h1>
        <p className="text-sm text-slate-500">Create urgent requests, run smart stock/location matching, and dispatch email alerts.</p>
      </div>

      {!canManage && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-brand/20 text-amber-brand text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Donor accounts can view city requests. Hospital, NGO, or Admin can create and match requests.</span>
        </div>
      )}

      {canManage && (
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
              {CITIES.map((c) => <option key={c}>{c}</option>)}
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
      )}

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
                {canManage && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-5 py-8 text-center text-slate-400">Loading requests...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="7" className="px-5 py-8 text-center text-slate-400">No requests yet.</td></tr>
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
                  {canManage && (
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
                  )}
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
                    {sendingAlert ? "Sending..." : "Send Email Alerts"}
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
                          <div className="text-xs text-slate-500">{d.city} • {d.email || d.phone}</div>
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
