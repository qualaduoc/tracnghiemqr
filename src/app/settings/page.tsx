"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Settings as SettingsIcon, Save, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";

export default function SettingsManagement() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("app_is_logged_in") !== "true") {
      window.location.href = `/?redirect=${window.location.pathname}`;
    } else {
      setAuthorized(true);
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
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
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (!error && data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Thử update, nếu lỗi (chưa có row id=1) thì insert
    const { error: updateError } = await supabase
      .from('app_settings')
      .update(settings)
      .eq('id', 1);

    if (updateError) {
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert([{ id: 1, ...settings }]);
        
      if (insertError) {
        alert("Lỗi khi lưu cài đặt: " + insertError.message);
      } else {
        alert("Đã lưu cài đặt thành công!");
      }
    } else {
      alert("Đã lưu cài đặt thành công!");
    }
    
    setSaving(false);
  };

  if (!authorized || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#e1f4d9]">
        <Loader2 className="animate-spin text-[#5c4a3d] mb-4" size={48} />
        <h2 className="text-2xl font-bold text-[#5c4a3d]">
          {!authorized ? "Đang kiểm tra quyền truy cập..." : "Đang tải cài đặt..."}
        </h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-8 bg-[#e1f4d9]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 max-w-3xl mx-auto w-full">
        <Link href="/">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-ac-orange flex items-center gap-2"
          >
            <ArrowLeft size={20} /> Về Trang Chủ
          </motion.button>
        </Link>
        <h1 className="text-3xl font-extrabold text-[#5c4a3d] flex items-center gap-2">
          <SettingsIcon size={32} className="text-[#a87233]" /> Cài Đặt Chung
        </h1>
        <div className="w-[120px]"></div> {/* Spacer */}
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="ac-card bg-white p-6 md:p-8 relative"
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-[#8bd256] border-b-4 border-[#5c4a3d] opacity-80"></div>
          
          <form onSubmit={handleSave} className="flex flex-col gap-8 mt-4">
            
            {/* Tên App & Lời chào */}
            <div className="bg-[#fce4e4] p-6 rounded-2xl border-4 border-[#5c4a3d]">
              <h2 className="text-xl font-bold text-[#5c4a3d] mb-4 flex items-center gap-2">
                <Sparkles className="text-[#f4a255]"/> Thông Tin Ứng Dụng
              </h2>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#a87233] mb-1">Tên App (Tiêu đề chính)</label>
                  <input 
                    type="text" 
                    value={settings.app_name}
                    onChange={(e) => setSettings({...settings, app_name: e.target.value})}
                    className="w-full bg-white border-4 border-[#5c4a3d] rounded-xl px-4 py-3 font-bold text-[#5c4a3d] focus:outline-none focus:border-[#3bb2e8] transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#a87233] mb-1">Lời chào (Tiêu đề phụ)</label>
                  <input 
                    type="text" 
                    value={settings.app_subtitle}
                    onChange={(e) => setSettings({...settings, app_subtitle: e.target.value})}
                    className="w-full bg-white border-4 border-[#5c4a3d] rounded-xl px-4 py-3 font-medium text-[#5c4a3d] focus:outline-none focus:border-[#3bb2e8] transition-colors" 
                  />
                </div>
              </div>
            </div>

            {/* Bản quyền */}
            <div className="bg-[#e1f4d9] p-6 rounded-2xl border-4 border-[#5c4a3d]">
              <h2 className="text-xl font-bold text-[#5c4a3d] mb-4 flex items-center gap-2">
                🌟 Thông Tin Bản Quyền
              </h2>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#a87233] mb-1">Tên Giáo Viên</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👩‍🏫 GV:</span>
                    <input 
                      type="text" 
                      value={settings.copyright_gv}
                      onChange={(e) => setSettings({...settings, copyright_gv: e.target.value})}
                      className="w-full bg-white border-4 border-[#5c4a3d] rounded-xl px-4 py-2 font-bold text-[#5c4a3d] focus:outline-none focus:border-[#6ab237] transition-colors" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#a87233] mb-1">Tên Lớp</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎈 Lớp:</span>
                    <input 
                      type="text" 
                      value={settings.copyright_class}
                      onChange={(e) => setSettings({...settings, copyright_class: e.target.value})}
                      className="w-full bg-white border-4 border-[#5c4a3d] rounded-xl px-4 py-2 font-bold text-[#5c4a3d] focus:outline-none focus:border-[#6ab237] transition-colors" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#a87233] mb-1">Tên Trường</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏫 Trường:</span>
                    <input 
                      type="text" 
                      value={settings.copyright_school}
                      onChange={(e) => setSettings({...settings, copyright_school: e.target.value})}
                      className="w-full bg-white border-4 border-[#5c4a3d] rounded-xl px-4 py-2 font-bold text-[#5c4a3d] focus:outline-none focus:border-[#6ab237] transition-colors" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="btn-ac-blue w-full text-xl py-4 flex justify-center items-center gap-2 mt-4"
            >
              {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
              {saving ? "Đang lưu..." : "Lưu Cài Đặt"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
