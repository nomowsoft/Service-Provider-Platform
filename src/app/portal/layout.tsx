import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import Sidebar from "@/components/portal/Sidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch full user details with relations to pass down
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      charity: true,
      provider: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const userProfile = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    charity: user.charity ? { id: user.charity.id, name: user.charity.name } : null,
    provider: user.provider ? { id: user.provider.id, name: user.provider.name } : null,
  };

  return (
    <div className="flex h-screen w-full flex-col lg:flex-row overflow-hidden bg-slate-50 dark:bg-[#022c22]">
      {/* Sidebar - responsive */}
      <Sidebar user={userProfile} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="hidden lg:flex h-20 items-center justify-between border-b border-emerald-100 dark:border-emerald-950 bg-white dark:bg-[#042f1f] px-8 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-emerald-950 dark:text-white">
              مرحباً بك في البوابة المركزية الموحدة
            </h1>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400">
              تابع وأدر الطلبات وعروض الأسعار مع شركائك بكل سهولة
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-emerald-950 dark:text-white">{user.name}</span>
              <span className="text-[11px] text-emerald-500 font-medium">
                {user.role === "SUPER_ADMIN" ? "مدير النظام" : user.role === "CHARITY_STAFF" ? "ممثل جمعية" : "ممثل مزود خدمة"}
              </span>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800 font-bold">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
