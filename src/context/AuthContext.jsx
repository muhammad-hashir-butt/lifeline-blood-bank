import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

const CITY_COORDS = {
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Faisalabad: { lat: 31.4504, lng: 73.135 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(currentUser) {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    } else {
      setProfile({
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || currentUser.email.split("@")[0],
        email: currentUser.email,
        role: currentUser.user_metadata?.role || "donor",
        city: currentUser.user_metadata?.city || "Lahore",
        phone: currentUser.user_metadata?.phone || "",
      });
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadProfile(currentUser).finally(() => setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadProfile(currentUser);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp({ name, email, password, role, city, phone, bloodGroup }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role, city, phone },
      },
    });
    if (error) throw error;

    if (role === "donor" && data.user) {
      const coords = CITY_COORDS[city] || CITY_COORDS.Lahore;
      await supabase.from("donors").insert({
        user_id: data.user.id,
        name,
        blood_group: bloodGroup || "O+",
        phone: phone || "0300-0000000",
        city: city || "Lahore",
        latitude: coords.lat,
        longitude: coords.lng,
        last_donation_date: null,
      });
    }
    return data;
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}