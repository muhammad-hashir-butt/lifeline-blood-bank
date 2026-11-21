import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const roleBadgeStyles = {
  admin: "bg-crimson-soft text-crimson border-crimson/20",
  hospital: "bg-indigo-50 text-indigo-brand border-indigo-brand/20",
  donor: "bg-emerald-50 text-emerald-brand border-emerald-brand/20",
  ngo: "bg-amber-50 text-amber-brand border-amber-brand/20",
};

export default function Navbar() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email || "User";
  const role = profile?.role || "donor";
  const city = profile?.city || "Lahore";
  const initials = displayName.slice(0, 1).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <Link to="/dashboard" className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-crimson text-white flex items-center justify-center font-bold text-xl shadow-xs">
          +
        </span>
        <span className="text-lg font-bold text-slate-900 tracking-tight">
          lifeline <span className="font-normal text-slate-500 hidden sm:inline">blood services</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <MapPin className="w-3.5 h-3.5 text-crimson" />
          <span>{city}</span>
        </div>

        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleBadgeStyles[role] || roleBadgeStyles.donor}`}>
          {role}
        </span>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <span className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
            {initials}
          </span>
          <span className="text-sm font-medium text-slate-700 hidden sm:inline">{displayName}</span>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-crimson bg-slate-100 hover:bg-crimson-soft px-3 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}