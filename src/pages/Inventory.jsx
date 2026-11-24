import React, { useEffect, useState } from "react";
import { Plus, Trash2, Search, AlertTriangle, ShieldAlert } from "lucide-react";
import { inventoryApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BloodGroupBadge from "../components/BloodGroupBadge";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", "Faisalabad", "Peshawar"];

export default function Inventory() {
  const { profile } = useAuth();
  const role = profile?.role || "donor";
  const canEdit = ["admin", "hospital", "ngo"].includes(role);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [form, setForm] = useState({
    blood_group: "A+",
    units: "",
    hospital_name: profile?.role === "hospital" ? profile?.full_name || "" : "",
    city: profile?.city || "Lahore",
    expiry_date: "",
  });

  async function fetchInventory() {
    setLoading(true);
    try {
      const data = await inventoryApi.list();
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.units || !form.hospital_name || !form.expiry_date) {
      alert("Please fill hospital name, units, and expiry date.");
      return;
    }
    try {
      await inventoryApi.create({
        blood_group: form.blood_group,
        units: Number(form.units),
        hospital_name: form.hospital_name,
        city: form.city,
        expiry_date: form.expiry_date,
      });
      setForm({
        blood_group: "A+",
        units: "",
        hospital_name: role === "hospital" ? profile?.full_name || "" : "",
        city: profile?.city || "Lahore",
        expiry_date: "",
      });
      fetchInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateUnits = async (id, newUnits) => {
    if (newUnits < 0) return;
    try {
      await inventoryApi.update(id, { units: newUnits });
      fetchInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this inventory record?")) return;
    try {
      await inventoryApi.remove(id);
      fetchInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  const getExpiryBadge = (expiryDate) => {
    if (!expiryDate) return { label: "N/A", cls: "bg-slate-100 text-slate-500 border-slate-200" };
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Expired", cls: "bg-crimson-soft text-crimson border-crimson/20" };
    if (days <= 14) return { label: `Expiring (${days}d)`, cls: "bg-amber-50 text-amber-brand border-amber-brand/20" };
    return { label: expiryDate, cls: "bg-slate-50 text-slate-600 border-slate-200" };
  };

  const filtered = items.filter((i) => {
    const matchGroup = groupFilter === "ALL" || i.blood_group === groupFilter;
    const matchSearch =
      i.hospital_name.toLowerCase().includes(search.toLowerCase()) ||
      i.city.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-crimson">Stock Management</div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Blood Inventory</h1>
        <p className="text-sm text-slate-500">Track available units, expiry dates, and low stock levels across hospitals.</p>
      </div>

      {!canEdit && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-brand/20 text-amber-brand text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            <strong>View-Only Mode (Donor Role):</strong> You can see nationwide stock. Only <strong>Hospital, NGO, or Admin</strong> can add or edit units.
          </span>
        </div>
      )}
      {canEdit && role === "hospital" && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-brand/20 text-indigo-brand text-xs">
          Hospital scope: you can view all network stock, but edit/delete only stock belonging to <strong>{profile?.full_name}</strong>.
        </div>
      )}
      {canEdit && role === "ngo" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-brand/20 text-amber-brand text-xs">
          NGO scope: you can manage stock only in <strong>{profile?.city}</strong>.
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-crimson" /> Add New Blood Stock
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <select
              value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
            <input
              type="number"
              min="0"
              placeholder="Units"
              value={form.units}
              onChange={(e) => setForm({ ...form, units: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <input
              placeholder="Hospital Name"
              value={form.hospital_name}
              onChange={(e) => setForm({ ...form, hospital_name: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm lg:col-span-2"
            />
            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <button
            type="submit"
            className="mt-3 bg-crimson hover:bg-crimson-dark text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            + Save to Inventory
          </button>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            placeholder="Search by hospital or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
          />
        </div>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
        >
          <option value="ALL">All Blood Groups</option>
          {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Blood Group</th>
                <th className="px-5 py-3">Units</th>
                <th className="px-5 py-3">Hospital</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Expiry</th>
                <th className="px-5 py-3">Status</th>
                {canEdit && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-5 py-8 text-center text-slate-400">Loading inventory...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="px-5 py-8 text-center text-slate-400">No inventory found.</td></tr>
              ) : (
                filtered.map((item) => {
                  const exp = getExpiryBadge(item.expiry_date);
                  const low = item.units <= 5;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5"><BloodGroupBadge group={item.blood_group} /></td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{item.units}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{item.hospital_name}</td>
                      <td className="px-5 py-3.5 text-slate-500">{item.city}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${exp.cls}`}>{exp.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                          item.units === 0
                            ? "bg-crimson-soft text-crimson border-crimson/20"
                            : low
                            ? "bg-amber-50 text-amber-brand border-amber-brand/20"
                            : "bg-emerald-50 text-emerald-brand border-emerald-brand/20"
                        }`}>
                          {low && <AlertTriangle className="w-3 h-3" />}
                          {item.units === 0 ? "Out of Stock" : low ? "Low Stock" : "Available"}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => updateUnits(item.id, item.units + 1)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-brand text-xs font-bold cursor-pointer"
                          >+1</button>
                          <button
                            onClick={() => updateUnits(item.id, item.units - 1)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-brand text-xs font-bold cursor-pointer"
                          >-1</button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-crimson hover:bg-crimson-soft cursor-pointer inline-flex align-middle"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
