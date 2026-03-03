"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * useAuth — manages authentication state using JWT stored in localStorage.
 * Provides login, register, logout helpers and the current user object.
 */
export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    /** Fetch the current user from /api/auth/me using the stored token */
    const fetchMe = useCallback(async () => {
        const token = localStorage.getItem("ccl_token");
        if (!token) { setLoading(false); return; }

        try {
            const res = await fetch("/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                localStorage.removeItem("ccl_token");
            }
        } catch {
            localStorage.removeItem("ccl_token");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMe(); }, [fetchMe]);

    /** Login with email + password — returns { success, error } */
    const login = async (email, password) => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || "Login failed" };
            localStorage.setItem("ccl_token", data.token);
            setUser(data.user);
            return { success: true };
        } catch {
            return { success: false, error: "Network error" };
        }
    };

    /** Register — accepts { username, displayName, email, password } — returns { success, error } */
    const register = async ({ username, displayName, email, password } = {}) => {
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, displayName }),
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || "Registration failed" };
            localStorage.setItem("ccl_token", data.token);
            setUser(data.user);
            return { success: true };
        } catch {
            return { success: false, error: "Network error" };
        }
    };

    /** Clears token and redirects to login */
    const logout = () => {
        localStorage.removeItem("ccl_token");
        setUser(null);
        router.push("/auth/login");
    };

    /** Returns the stored token (for API calls) — stable reference via useCallback */
    const getToken = useCallback(() => localStorage.getItem("ccl_token"), []);

    /** Refreshes user profile from server */
    const refreshUser = fetchMe;

    return { user, loading, login, register, logout, getToken, refreshUser };
}

export default useAuth;
