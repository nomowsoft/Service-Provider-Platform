import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "البوابة المركزية الموحدة | الجمعيات الأهلية ومزودي الخدمة",
  description: "منصة موحدة لإدارة طلبات الخدمات وعروض الأسعار والمطالبات المالية للجمعيات الأهلية ومزودي الخدمات.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#064e3b',
              color: '#fff',
              fontFamily: 'var(--font-cairo)',
            },
          }}
        />
      </body>
    </html>
  );
}
