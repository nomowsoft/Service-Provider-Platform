"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@/lib/zodSchemas";
import toast from "react-hot-toast";
import { User, Mail, Lock, Building, Phone, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const role = "SERVICE_PROVIDER";
  const [entityName, setEntityName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getInputClass = (fieldName: string) => {
    if (errorField === fieldName) {
      return "!border-rose-500/80 focus:!border-rose-500 focus:!shadow-[0_0_0_4px_rgba(244,63,94,0.15)] dark:!border-rose-500/60 dark:focus:!border-rose-400 dark:focus:!shadow-[0_0_0_4px_rgba(244,63,94,0.25)]";
    }
    return "";
  };

  const handleFieldChange = (setter: (val: string) => void, fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (errorField === fieldName) {
      setError("");
      setErrorField("");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrorField("");

    // Validate using Zod client-side
    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      role,
      entityName,
      phone: phone || null,
    });

    if (!result.success) {
      setError(result.error.issues[0].message);
      setErrorField(result.error.issues[0].path[0] as string);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message.includes("البريد") || data.message.includes("email")) {
          setErrorField("email");
        }
        throw new Error(data.message || "حدث خطأ أثناء تسجيل الحساب");
      }

      toast.success(`تم إنشاء الحساب بنجاح! مرحباً بك.`);
      
      // Redirect to portal dashboard
      router.push("/portal");
      router.refresh();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "فشل الاتصال بالخادم");
      toast.error(error.message || "فشل تسجيل الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#022c22] via-[#043e2f] to-[#064e3b] px-4 py-8 sm:px-6 lg:px-8">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#10b981]/10 via-transparent to-transparent opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
      
      <div className="w-full max-w-lg z-10 animate-float-in my-6">
        {/* Logo / Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#022c22] text-xl font-bold text-white">
              S
            </div>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            إنشاء حساب جديد
          </h2>
          <p className="mt-1 text-xs text-emerald-300/80">
            سجل كشريك أو مزود خدمة للبدء في استخدام البوابة المركزية الموحدة
          </p>
        </div>

        {/* Register Form Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 border border-emerald-500/10">
          <form className="space-y-4" onSubmit={handleRegister} noValidate>
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-500 text-center font-medium animate-shake">
                {error}
              </div>
            )}

            {/* Main Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Row 1: Entity Name & Email */}
              <div className="input-group">
                <label htmlFor="entityName">اسم المنشأة الطبية/الخدمية</label>
                <div className="relative">
                  <input
                    id="entityName"
                    type="text"
                    placeholder="مستشفى الأمل الطبي"
                    value={entityName}
                    onChange={handleFieldChange(setEntityName, "entityName")}
                    className={getInputClass("entityName")}
                    required
                  />
                  <Building className="absolute left-3 top-3.5 text-emerald-600/50 h-4 w-4" />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="email">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="partner@example.com"
                    value={email}
                    onChange={handleFieldChange(setEmail, "email")}
                    className={getInputClass("email")}
                    required
                  />
                  <Mail className="absolute left-3 top-3.5 text-emerald-600/50 h-4 w-4" />
                </div>
              </div>

              {/* Row 2: Representative Name & Phone */}
              <div className="input-group">
                <label htmlFor="name">الاسم الكامل للممثل</label>
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    placeholder="عبدالله الحربي"
                    value={name}
                    onChange={handleFieldChange(setName, "name")}
                    className={getInputClass("name")}
                    required
                  />
                  <User className="absolute left-3 top-3.5 text-emerald-600/50 h-4 w-4" />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="phone">رقم الهاتف (اختياري)</label>
                <div className="relative">
                  <input
                    id="phone"
                    type="text"
                    placeholder="05XXXXXXXX"
                    value={phone}
                    onChange={handleFieldChange(setPhone, "phone")}
                    className={getInputClass("phone")}
                  />
                  <Phone className="absolute left-3 top-3.5 text-emerald-600/50 h-4 w-4" />
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="input-group">
                <label htmlFor="password">كلمة المرور</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={handleFieldChange(setPassword, "password")}
                    className={`${getInputClass("password")} pr-10 pl-10`}
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

              <div className="input-group">
                <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={handleFieldChange(setConfirmPassword, "confirmPassword")}
                    className={`${getInputClass("confirmPassword")} pr-10 pl-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-3.5 text-emerald-600/50 hover:text-emerald-500 transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="relative flex w-full justify-center rounded-xl py-3.5 px-4 text-xs font-semibold text-white gradient-btn focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "جاري إنشاء الحساب..." : "تسجيل الحساب والانضمام"}
              </button>
            </div>
          </form>

          {/* Already have an account? */}
          <div className="mt-6 pt-5 border-t border-emerald-500/10 text-center">
            <span className="text-xs text-emerald-400">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="font-bold text-white hover:text-emerald-300 underline transition-all">
                تسجيل الدخول
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
