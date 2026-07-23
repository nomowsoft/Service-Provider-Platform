"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordSchema } from "@/utils/validation";
import toast from "react-hot-toast";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation with Zod
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "حدث خطأ أثناء إرسال طلب إعادة التعيين");
        toast.error(data.message || "فشل إرسال البريد الإلكتروني");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success(data.message || "تم إرسال رابط إعادة التعيين بنجاح!");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "فشل الاتصال بالخادم");
      toast.error("فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
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
            استعادة كلمة المرور
          </h2>
          <p className="mt-2 text-sm text-emerald-300/80">
            أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl shadow-black/40 border border-emerald-500/10">
          {success ? (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">تم إرسال البريد الإلكتروني!</h3>
                <p className="text-xs font-bold text-emerald-600/90 leading-relaxed">
                  تفقّد صندوق الوارد لبريدك الإلكتروني <strong className="text-white dir-ltr inline-block">{email}</strong> والضغط على رابط إعادة تعيين كلمة المرور.
                </p>
              </div>

              <div className="pt-4 border-t border-emerald-500/10">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>العودة لشاشة تسجيل الدخول</span>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-500 text-center font-medium animate-shake">
                  {error}
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">البريد الإلكتروني المسجل</label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="partner@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    className="pr-10"
                    required
                  />
                  <Mail className="absolute left-3 top-3.5 text-emerald-600/50 h-4 w-4" />
                </div>
              </div>

              <div>
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
                      جاري إرسال البريد...
                    </span>
                  ) : (
                    "إرسال رابط إعادة التعيين"
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>تسجيل الدخول</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
