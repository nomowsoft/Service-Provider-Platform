"use test";
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/lib/zodSchemas";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate using Zod client-side
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "حدث خطأ أثناء تسجيل الدخول");
      }

      toast.success(`أهلاً بك، تم تسجيل الدخول بنجاح!`);
      
      // Redirect to portal dashboard
      router.push("/portal");
      router.refresh();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "فشل الاتصال بالخادم");
      toast.error(error.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type: "admin" | "charity" | "provider") => {
    if (type === "admin") {
      setEmail("admin@central.gov.sa");
      setPassword("password123");
    } else if (type === "charity") {
      setEmail("charity1@bisha.org.sa");
      setPassword("password123");
    } else if (type === "provider") {
      setEmail("provider1@medical.com");
      setPassword("password123");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#022c22] via-[#043e2f] to-[#064e3b] px-4 py-12 sm:px-6 lg:px-8">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#10b981]/10 via-transparent to-transparent opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
      
      <div className="w-full max-w-md z-10 animate-float-in">
        {/* Logo / Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#022c22] text-2xl font-bold text-white">
              S
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            البوابة المركزية
          </h2>
          <p className="mt-2 text-sm text-emerald-300/80">
            منصة إدارة طلبات الجمعيات ومزودي الخدمات
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl shadow-black/40 border border-emerald-500/10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300 text-center font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">كلمة المرور</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-emerald-600/50 hover:text-emerald-500 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="relative flex w-full justify-center rounded-xl py-3.5 px-4 text-sm font-semibold text-white gradient-btn focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري التحقق...
                  </span>
                ) : (
                  "تسجيل الدخول"
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <span className="text-xs text-emerald-400 font-medium">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="font-bold text-white hover:text-emerald-300 underline transition-all">
                سجل حساباً جديداً الآن
              </Link>
            </span>
          </div>

          {/* Quick Mock Login Accounts */}
          <div className="mt-8 pt-6 border-t border-emerald-500/10">
            <span className="text-xs text-emerald-400 font-bold block mb-3 text-center">
              بيانات الدخول السريع للتجربة
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("admin")}
                className="px-2 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/10 text-emerald-300 text-xs font-semibold transition"
              >
                المدير العام
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("charity")}
                className="px-2 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/10 text-emerald-300 text-xs font-semibold transition"
              >
                ممثل جمعية
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("provider")}
                className="px-2 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/10 text-emerald-300 text-xs font-semibold transition"
              >
                مزود خدمة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
