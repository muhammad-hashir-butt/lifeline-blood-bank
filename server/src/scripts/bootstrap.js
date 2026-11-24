const User = require("../models/User");
const Donor = require("../models/Donor");
const { CITY_COORDS } = require("../utils/cityCoords");

const ACCOUNTS = [
  {
    full_name: "Lifeline Admin",
    email: "admin@lifeline.com",
    password: "admin123",
    role: "admin",
    city: "Lahore",
    phone: "0300-1111111",
  },
  {
    full_name: "Ali Donor",
    email: "donor@lifeline.com",
    password: "donor123",
    role: "donor",
    city: "Lahore",
    phone: "0300-2222222",
    blood_group: "O+",
  },
  {
    full_name: "Jinnah Hospital",
    email: "hospital@lifeline.com",
    password: "hospital123",
    role: "hospital",
    city: "Lahore",
    phone: "0300-3333333",
  },
  {
    full_name: "Hope NGO",
    email: "ngo@lifeline.com",
    password: "ngo123",
    role: "ngo",
    city: "Lahore",
    phone: "0300-4444444",
  },
];

/**
 * Ensure demo role accounts exist (safe to call on every cold start).
 */
async function ensureSeedUsers() {
  const count = await User.countDocuments();
  if (count > 0) return { seeded: false, count };

  for (const acc of ACCOUNTS) {
    const user = await User.create({
      full_name: acc.full_name,
      email: acc.email,
      password: acc.password,
      role: acc.role,
      city: acc.city,
      phone: acc.phone,
      blood_group: acc.blood_group || null,
    });

    if (acc.role === "donor") {
      const coords = CITY_COORDS[acc.city] || CITY_COORDS.Lahore;
      await Donor.create({
        user_id: user._id,
        name: acc.full_name,
        email: acc.email.toLowerCase(),
        blood_group: acc.blood_group || "O+",
        phone: acc.phone,
        city: acc.city,
        latitude: coords.lat,
        longitude: coords.lng,
        last_donation_date: null,
      });
    }
  }

  console.log("Seeded default role accounts");
  return { seeded: true, count: ACCOUNTS.length };
}

module.exports = { ensureSeedUsers, ACCOUNTS };
