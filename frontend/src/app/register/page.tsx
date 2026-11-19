"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.register({
        full_name: fullName,
        email,
        password,
      });
      router.push("/dashboard");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setError(detail[0]?.msg || "Validation error");
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError("Registration failed. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
        <p className="text-sm text-slate-500">Start discovering high-match opportunities with AI</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Sarah Jenkins"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@domain.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
            Password (min 6 characters)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Free Account"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign In
        </Link>
      </p>
    </div>
  );
}
