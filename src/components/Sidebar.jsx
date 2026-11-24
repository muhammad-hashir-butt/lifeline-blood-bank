import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Droplets,
  Users,
  Siren,
  TrendingUp,
  BellRing,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const allLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["admin", "donor", "hospital", "ngo"] },
  { to: "/inventory", label: "Blood Inventory", icon: Droplets, roles: ["admin", "donor", "hospital", "ngo"] },
  { to: "/donors", label: "Donors", icon: Users, roles: ["admin", "donor", "hospital", "ngo"] },
  { to: "/requests", label: "Emergency Requests", icon: Siren, roles: ["admin", "donor", "hospital", "ngo"] },
  { to: "/prediction", label: "Shortage Forecast", icon: TrendingUp, roles: ["admin", "hospital", "ngo"] },
  { to: "/alerts", label: "Email & Alerts", icon: BellRing, roles: ["admin", "donor", "hospital", "ngo"] },
];

export default function Sidebar() {
  const { profile } = useAuth();
  const role = profile?.role || "donor";
  const links = allLinks.filter((l) => l.roles.includes(role));

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Workspace · {role}
        </div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-crimson text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="hidden md:flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 mt-6">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-brand animate-pulse shrink-0" />
        <div>
          <div className="text-xs font-semibold text-slate-800">MongoDB Live</div>
          <div className="text-[11px] text-slate-500">All services operational</div>
        </div>
      </div>
    </aside>
  );
}
