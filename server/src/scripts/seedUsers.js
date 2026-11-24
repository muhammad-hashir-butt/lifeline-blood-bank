require("dotenv").config();
const connectDB = require("../config/db");
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

async function upsertAccount(acc) {
  let user = await User.findOne({ email: acc.email.toLowerCase() });
  if (user) {
    user.full_name = acc.full_name;
    user.role = acc.role;
    user.city = acc.city;
    user.phone = acc.phone;
    user.blood_group = acc.blood_group || null;
    user.password = acc.password;
    await user.save();
  } else {
    user = await User.create({
      full_name: acc.full_name,
      email: acc.email,
      password: acc.password,
      role: acc.role,
      city: acc.city,
      phone: acc.phone,
      blood_group: acc.blood_group || null,
    });
  }

  if (acc.role === "donor") {
    const coords = CITY_COORDS[acc.city] || CITY_COORDS.Lahore;
    const existing = await Donor.findOne({ user_id: user._id });
    if (!existing) {
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
    } else {
      existing.name = acc.full_name;
      existing.email = acc.email.toLowerCase();
      existing.blood_group = acc.blood_group || "O+";
      existing.phone = acc.phone;
      existing.city = acc.city;
      existing.latitude = coords.lat;
      existing.longitude = coords.lng;
      await existing.save();
    }
  }

  return {
    role: acc.role,
    email: acc.email,
    password: acc.password,
    name: acc.full_name,
    id: String(user._id),
  };
}

async function run() {
  await connectDB();
  const created = [];
  for (const acc of ACCOUNTS) {
    created.push(await upsertAccount(acc));
  }
  console.log(JSON.stringify(created, null, 2));
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
