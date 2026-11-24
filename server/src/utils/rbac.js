/**
 * Role visibility rules (Lifeline Blood Bank)
 *
 * ADMIN
 *  - Sees everything nationwide
 *  - Full CRUD on inventory, donors, requests, alerts, prediction
 *
 * HOSPITAL
 *  - Sees all inventory (network visibility for matching)
 *  - Can create stock; can edit/delete only stock they created OR named as their hospital
 *  - Sees donors in their city (for matching)
 *  - Manages requests they created + city requests
 *
 * NGO
 *  - Sees inventory in their city
 *  - Can create/edit/delete stock in their city
 *  - Sees donors in their city
 *  - Manages city requests / alerts
 *
 * DONOR
 *  - Sees all inventory (view-only) so they can find available units anywhere
 *  - Sees only their own donor profile + donation history
 *  - Sees city emergency requests (view-only)
 *  - Sees alerts sent to them
 *  - Cannot create/edit inventory, requests, or broadcast alerts
 */

function isAdmin(user) {
  return user?.role === "admin";
}

function canEditInventory(user) {
  return ["admin", "hospital", "ngo"].includes(user?.role);
}

function canManageInventoryItem(user, item) {
  if (!user || !item) return false;
  if (user.role === "admin") return true;
  if (user.role === "hospital") {
    return (
      String(item.created_by) === String(user.id) ||
      item.hospital_name === user.full_name
    );
  }
  if (user.role === "ngo") {
    return item.city === user.city;
  }
  return false;
}

function inventoryReadFilter(user) {
  if (!user) return { _id: null };
  if (user.role === "admin" || user.role === "hospital" || user.role === "donor") {
    return {}; // nationwide visibility
  }
  if (user.role === "ngo") {
    return { city: user.city };
  }
  return { city: user.city };
}

function donorReadFilter(user) {
  if (!user) return { _id: null };
  if (user.role === "admin") return {};
  if (user.role === "donor") return { user_id: user.id };
  // hospital + ngo: city donors for matching
  return { city: user.city };
}

function requestReadFilter(user) {
  if (!user) return { _id: null };
  if (user.role === "admin") return {};
  if (user.role === "donor") return { city: user.city };
  return {
    $or: [{ created_by: user.id }, { city: user.city }],
  };
}

function alertReadFilter(user) {
  if (!user) return { _id: null };
  if (user.role === "admin") return {};
  if (user.role === "donor") {
    return {
      $or: [{ recipient_email: user.email }, { created_by: user.id }],
    };
  }
  return {
    $or: [{ created_by: user.id }, { city: user.city }],
  };
}

module.exports = {
  isAdmin,
  canEditInventory,
  canManageInventoryItem,
  inventoryReadFilter,
  donorReadFilter,
  requestReadFilter,
  alertReadFilter,
};
