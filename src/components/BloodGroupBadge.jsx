import React from "react";

export default function BloodGroupBadge({ group }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-lg text-xs font-bold bg-crimson-soft text-crimson border border-crimson/20">
      {group}
    </span>
  );
}