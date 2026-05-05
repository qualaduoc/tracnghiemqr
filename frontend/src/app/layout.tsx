import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ 
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"]
});

export const metadata: Metadata = {
  title: "QR Quiz Mầm Non",
  description: "Ứng dụng tương tác lớp học bằng mã thẻ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${nunito.className} antialiased bg-[#e1f4d9] text-[#5c4a3d] min-h-screen relative overflow-x-hidden`}>
        {/* Background clouds layer */}
        <div className="fixed top-0 left-0 w-full h-32 bg-sky-200 opacity-50 z-[-2] pointer-events-none" style={{ borderBottomLeftRadius: '50%', borderBottomRightRadius: '50%', height: '150px' }}></div>
        <div className="fixed top-[-50px] left-[-50px] w-[300px] h-[300px] bg-white rounded-full opacity-40 z-[-1] pointer-events-none blur-2xl"></div>
        <div className="fixed top-[-50px] right-[-50px] w-[300px] h-[300px] bg-white rounded-full opacity-40 z-[-1] pointer-events-none blur-2xl"></div>
        
        {/* Main Content */}
        <main className="relative z-10 w-full min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
