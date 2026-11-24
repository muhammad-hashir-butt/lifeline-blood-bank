import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lifeline_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((data) => {
        setUser(data.user);
        setProfile(data.profile);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function signUp(form) {
    const data = await authApi.register({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      city: form.city,
      phone: form.phone,
      bloodGroup: form.bloodGroup,
    });
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    return data;
  }

  async function signIn({ email, password }) {
    const data = await authApi.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    return data;
  }

  async function signOut() {
    setToken(null);
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
