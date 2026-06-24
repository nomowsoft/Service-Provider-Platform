"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  Building,
  Wrench,
  Coins
} from "lucide-react";
import toast from "react-hot-toast";

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  charity?: { name: string; id: number } | null;
  provider?: { name: string; id: number } | null;
}

interface SidebarProps {
  user: UserProfile;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    {
      name: "لوحة المعلومات",
      href: "/portal",
      icon: LayoutDashboard,
    },
    {
      name: "طلبات عروض الأسعار",
      href: "/portal/requests",
      icon: FileText,
    },
    {
      name: "طلبات المطالبة المالية",
      href: "/portal/claims",
      icon: Coins,
    },
    ...(user.role === "SUPER_ADMIN" ? [
      {
        name: "مزودي الخدمة",
        href: "/portal/providers",
        icon: Wrench,
      }
    ] : []),
    {
      name: "الإعدادات",
      href: "/portal/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        toast.success("تم تسجيل الخروج بنجاح");
        router.push("/login");
        router.refresh();
      } else {
        toast.error("فشل تسجيل الخروج");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case "SUPER_ADMIN":
        return { label: "المدير العام", bg: "bg-emerald-500/20 text-emerald-300", icon: ShieldCheck };
      case "CHARITY_STAFF":
        return { label: user.charity?.name || "جمعية أهلية", bg: "bg-teal-500/20 text-teal-300", icon: Building };
      case "SERVICE_PROVIDER":
        return { label: user.provider?.name || "مزود الخدمة", bg: "bg-amber-500/20 text-amber-300", icon: Wrench };
      default:
        return { label: "مستخدم", bg: "bg-gray-500/20 text-gray-300", icon: ShieldCheck };
    }
  };

  const roleInfo = getRoleLabel();
  const RoleIcon = roleInfo.icon;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex h-16 items-center justify-between bg-[#022c22] px-4 text-white lg:hidden border-b border-emerald-950">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold">
            S
          </div>
          <span className="font-bold text-lg">البوابة المركزية</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-1 text-emerald-300 hover:bg-emerald-900 focus:outline-none"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Wrapper */}
      <div
        className={`fixed inset-y-0 right-0 z-40 flex w-72 flex-col bg-[#022c22] border-l border-emerald-900/40 text-[#a7f3d0] transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand / Logo */}
        <div className="hidden lg:flex h-20 items-center gap-3 px-6 border-b border-emerald-950">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-[#022c22] text-xl font-bold text-white">
              S
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-lg tracking-tight">البوابة المركزية</span>
            <span className="text-[10px] text-emerald-400 font-medium">نظام المتابعة الموحد</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-6 border-b border-emerald-950 bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#064e3b] border border-emerald-500/20 text-white font-semibold shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">{user.name}</span>
              <span className="text-[11px] text-emerald-400/80 truncate mt-0.5">{user.email}</span>
            </div>
          </div>

          <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${roleInfo.bg}`}>
            <RoleIcon size={14} className="flex-shrink-0" />
            <span className="truncate">{roleInfo.label}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-all duration-200 group ${
                  isActive
                    ? "nav-item-active text-white shadow-lg shadow-emerald-900/35"
                    : "text-[#a7f3d0]/80 hover:bg-[#064e3b] hover:text-white"
                }`}
              >
                <Icon
                  size={19}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-white" : "text-[#a7f3d0]/60 group-hover:text-white"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="p-4 border-t border-emerald-950">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-[15px] font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-all duration-200"
          >
            <LogOut size={19} className="text-rose-400" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
