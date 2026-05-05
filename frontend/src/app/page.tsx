"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Play, Users, Settings } from "lucide-react";
import Link from "next/link";
import { supabase } from "../utils/supabaseClient";

export default function Home() {
  const [appSettings, setAppSettings] = useState({
    app_name: "Lớp Học Vui Vẻ!",
    app_subtitle: "Chào cô giáo, hôm nay chúng ta chơi trò gì nào?",
    copyright_gv: "Nguyễn Thị Lan Hương",
    copyright_class: "MGL A2",
    copyright_school: "Trường mầm non Long Biên"
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (!error && data) {
      setAppSettings(data);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      {/* Sun Decoration */}
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[#f8ce3c] rounded-full z-[-1] blur-md opacity-80"
      />

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="ac-card max-w-2xl w-full text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-8 bg-[#8bd256] border-b-4 border-[#5c4a3d] opacity-80"></div>
        
        {/* Settings button in the corner */}
        <Link href="/settings">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-3 right-3 text-[#5c4a3d] bg-white/50 p-2 rounded-full border-2 border-[#5c4a3d] z-20 hover:bg-[#f8ce3c] transition-colors"
            title="Cài đặt App"
          >
            <Settings size={20} />
          </motion.button>
        </Link>

        <div className="mt-6 mb-8 relative">
          {/* A cute cloud logo placeholder */}
          <div className="mx-auto w-32 h-24 bg-[#a7e0f9] border-4 border-[#5c4a3d] rounded-full flex items-center justify-center mb-4 shadow-[0_4px_0_0_#5c4a3d] relative">
            <div className="absolute -left-2 top-4 w-12 h-12 bg-[#a7e0f9] border-4 border-[#5c4a3d] rounded-full border-r-0 border-b-0 z-0"></div>
            <div className="absolute -right-2 top-2 w-14 h-14 bg-[#a7e0f9] border-4 border-[#5c4a3d] rounded-full border-l-0 border-b-0 z-0"></div>
            <span className="text-4xl relative z-10">🐻</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-[#5c4a3d] drop-shadow-sm mb-2 px-8">
            {appSettings.app_name}
          </h1>
          <p className="text-lg text-[#a87233] font-medium px-4">
            {appSettings.app_subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/classes" className="w-full">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-ac-blue w-full h-24 flex flex-col items-center justify-center gap-2 text-lg"
            >
              <Users size={28} />
              <span>Quản Lý Lớp</span>
            </motion.button>
          </Link>

          <Link href="/questions" className="w-full">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-ac-orange w-full h-24 flex flex-col items-center justify-center gap-2 text-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              <span>Quản Lý Câu Hỏi</span>
            </motion.button>
          </Link>

          <Link href="/print" className="w-full">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-ac-yellow w-full h-24 flex flex-col items-center justify-center gap-2 text-lg"
            >
              <QrCode size={28} />
              <span>In Thẻ Học Sinh</span>
            </motion.button>
          </Link>

          <Link href="/scanner" className="w-full">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#3bb2e8] text-white border-4 border-[#5c4a3d] rounded-2xl w-full h-24 flex flex-col items-center justify-center gap-2 text-lg font-bold shadow-[0_6px_0_0_#2b82aa] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#2b82aa] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.9 4.9 14.2 14.2"/><path d="m4.9 19.1 14.2-14.2"/></svg>
              <span>Quét Đáp Án</span>
            </motion.button>
          </Link>

          <Link href="/presenter" className="w-full sm:col-span-2 mt-2">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-ac-green w-full h-20 flex flex-col items-center justify-center gap-2 text-2xl shadow-[0_6px_0_0_#3e751d]"
            >
              <div className="flex items-center gap-2">
                <Play size={28} fill="currentColor" />
                <span>Bắt Đầu Trò Chơi Trên Máy Chiếu!</span>
              </div>
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Footer / Copyright */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center text-[#5c4a3d] font-bold z-10 relative bg-white/80 backdrop-blur-md px-8 py-4 rounded-3xl border-4 border-[#5c4a3d] shadow-[4px_4px_0_0_#5c4a3d]"
      >
        <p className="text-xl mb-2 text-[#f4a255] uppercase tracking-wider">🌟 Ứng Dụng Thuộc Về 🌟</p>
        <p className="text-xl">👩‍🏫 GV: {appSettings.copyright_gv}</p>
        <p className="text-xl my-1">🎈 Lớp: {appSettings.copyright_class}</p>
        <p className="text-xl">🏫 {appSettings.copyright_school}</p>
      </motion.div>

      {/* Decorative grass footer elements */}
      <div className="fixed bottom-0 left-0 w-full h-16 bg-[#6ab237] border-t-4 border-[#5c4a3d] flex justify-around items-end overflow-hidden z-[-1]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-16 h-12 bg-[#8bd256] rounded-t-full border-t-4 border-l-4 border-r-4 border-[#5c4a3d] translate-y-2"></div>
        ))}
      </div>
    </div>
  );
}
