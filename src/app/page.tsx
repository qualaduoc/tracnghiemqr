"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Play, Users, Settings, LogOut, Lock, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";

export default function Home() {
  const router = useRouter();

  const [appSettings, setAppSettings] = useState({
    app_name: "Lớp Học Vui Vẻ!",
    app_subtitle: "Chào cô giáo, hôm nay chúng ta chơi trò gì nào?",
    copyright_gv: "Nguyễn Thị Lan Hương",
    copyright_class: "MGL A2",
    copyright_school: "Trường mầm non Long Biên"
  });

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchSettings();

    // Check login status
    const auth = localStorage.getItem("app_is_logged_in");
    if (auth === "true") {
      setIsLoggedIn(true);
    }

    // Check query params for redirect request
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect) {
      setRedirectPath(redirect);
      setIsLoginModalOpen(true);
      // Clean up URL query parameters without reloading the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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

  const handleFeatureClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (localStorage.getItem("app_is_logged_in") === "true") {
      router.push(path);
    } else {
      setRedirectPath(path);
      setIsLoginModalOpen(true);
      setErrorMsg("");
      setUsername("");
      setPassword("");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === "Admin" && password === "Phuonghanh@2026") {
      localStorage.setItem("app_is_logged_in", "true");
      setIsLoggedIn(true);
      setIsLoginModalOpen(false);
      setErrorMsg("");
      
      // Redirect to target path or just stay on home
      if (redirectPath) {
        router.push(redirectPath);
        setRedirectPath(null);
      }
    } else {
      setErrorMsg("Tên đăng nhập hoặc mật khẩu chưa đúng rồi cô ơi! 🐻😢");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Cô có chắc chắn muốn đăng xuất không?")) {
      localStorage.removeItem("app_is_logged_in");
      setIsLoggedIn(false);
      router.push("/");
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
        
        {/* Settings button & LogOut button in the corner */}
        <div className="absolute top-3 right-3 flex gap-2 z-20">
          {isLoggedIn && (
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              className="text-white bg-[#f46255] p-2 rounded-full border-2 border-[#5c4a3d] hover:bg-[#d54e42] shadow-[0_3px_0_0_#5c4a3d] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#5c4a3d] transition-all"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </motion.button>
          )}
          <button 
            onClick={(e) => handleFeatureClick(e, "/settings")}
            className="text-[#5c4a3d] bg-white/50 p-2 rounded-full border-2 border-[#5c4a3d] hover:bg-[#f8ce3c] transition-colors"
            title="Cài đặt App"
          >
            <Settings size={20} />
          </button>
        </div>

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
          <div onClick={(e) => handleFeatureClick(e, "/classes")} className="w-full cursor-pointer">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-ac-blue w-full h-24 flex flex-col items-center justify-center gap-2 text-lg pointer-events-none"
            >
              <Users size={28} />
              <span>Quản Lý Lớp</span>
            </motion.button>
          </div>

          <div onClick={(e) => handleFeatureClick(e, "/questions")} className="w-full cursor-pointer">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-ac-orange w-full h-24 flex flex-col items-center justify-center gap-2 text-lg pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              <span>Quản Lý Câu Hỏi</span>
            </motion.button>
          </div>

          <div onClick={(e) => handleFeatureClick(e, "/print")} className="w-full cursor-pointer">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-ac-yellow w-full h-24 flex flex-col items-center justify-center gap-2 text-lg pointer-events-none"
            >
              <QrCode size={28} />
              <span>In Thẻ Học Sinh</span>
            </motion.button>
          </div>

          <div onClick={(e) => handleFeatureClick(e, "/scanner")} className="w-full cursor-pointer">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#3bb2e8] text-white border-4 border-[#5c4a3d] rounded-2xl w-full h-24 flex flex-col items-center justify-center gap-2 text-lg font-bold shadow-[0_6px_0_0_#2b82aa] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#2b82aa] transition-all pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.9 4.9 14.2 14.2"/><path d="m4.9 19.1 14.2-14.2"/></svg>
              <span>Quét Đáp Án</span>
            </motion.button>
          </div>

          <div onClick={(e) => handleFeatureClick(e, "/presenter")} className="w-full sm:col-span-2 mt-2 cursor-pointer">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-ac-green w-full h-20 flex flex-col items-center justify-center gap-2 text-2xl shadow-[0_6px_0_0_#3e751d] pointer-events-none"
            >
              <div className="flex items-center gap-2">
                <Play size={28} fill="currentColor" />
                <span>Bắt Đầu Trò Chơi Trên Máy Chiếu!</span>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-[#5c4a3d]/40 backdrop-blur-sm z-40" 
              onClick={() => setIsLoginModalOpen(false)} 
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 50 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 50 }} 
                className="ac-card w-full max-w-md pointer-events-auto relative bg-[#fff9f0] p-8 shadow-[10px_10px_0_0_#5c4a3d]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button 
                  onClick={() => setIsLoginModalOpen(false)} 
                  className="absolute -top-4 -right-4 bg-[#f46255] w-10 h-10 rounded-full border-4 border-[#5c4a3d] flex items-center justify-center text-white hover:scale-110 transition-transform z-50 shadow-[0_4px_0_0_#5c4a3d] active:translate-y-[2px] active:shadow-[0_2px_0_0_#5c4a3d]"
                >
                  <X size={20} strokeWidth={4} />
                </button>
                
                <div className="text-center mb-6">
                  <span className="text-6xl mb-2 block">🔐</span>
                  <h2 className="text-3xl font-black text-[#5c4a3d]">Đăng Nhập Cô Giáo</h2>
                  <p className="text-[#a87233] font-bold text-sm">Vui lòng đăng nhập để mở khóa các tính năng</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  {/* Username field */}
                  <div>
                    <label className="block text-sm font-bold text-[#a87233] mb-1">Tên đăng nhập</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-[#a87233]/70"><User size={20} /></span>
                      <input 
                        type="text" 
                        placeholder="Nhập tên đăng nhập..." 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white border-4 border-[#5c4a3d] rounded-2xl pl-12 pr-4 py-3 text-lg font-bold text-[#5c4a3d] placeholder:text-[#a87233]/50 focus:outline-none focus:border-[#3bb2e8] transition-colors" 
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div>
                    <label className="block text-sm font-bold text-[#a87233] mb-1">Mật khẩu</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-[#a87233]/70"><Lock size={20} /></span>
                      <input 
                        type="password" 
                        placeholder="Nhập mật khẩu..." 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border-4 border-[#5c4a3d] rounded-2xl pl-12 pr-4 py-3 text-lg font-bold text-[#5c4a3d] placeholder:text-[#a87233]/50 focus:outline-none focus:border-[#3bb2e8] transition-colors" 
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMsg && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[#f46255] font-bold text-sm text-center bg-[#fce4e4] p-3 rounded-xl border-2 border-[#f46255]"
                    >
                      {errorMsg}
                    </motion.p>
                  )}

                  {/* Submit Button */}
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="btn-ac-blue w-full text-lg py-4 mt-2 shadow-[0_6px_0_0_#2b82aa]"
                  >
                    Đăng Nhập 🐾
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

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
