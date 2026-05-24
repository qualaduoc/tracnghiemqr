"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Users, QrCode, Trash2, X, Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";

type ClassData = { id: string, name: string };
type StudentData = { id: string, class_id: string, name: string, avatar_url: string, aruco_id: number };

export default function ClassesManagement() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("app_is_logged_in") !== "true") {
      window.location.href = `/?redirect=${window.location.pathname}`;
    } else {
      setAuthorized(true);
    }
  }, []);

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{isOpen: boolean, type: 'class' | 'student' | 'edit_class', value: string, id?: string}>({
    isOpen: false,
    type: 'class',
    value: ''
  });

  const fetchData = async () => {
    setLoading(true);
    
    // Lấy danh sách lớp
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .order('created_at', { ascending: true });
      
    if (!classError && classData) {
      setClasses(classData);
      if (classData.length > 0 && !selectedClass) {
        setSelectedClass(classData[0].id);
      }
    }

    // Lấy danh sách học sinh
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, class_id, name, avatar_url, aruco_id')
      .order('aruco_id', { ascending: true });
      
    if (!studentError && studentData) {
      setStudents(studentData);
    }
    
    setLoading(false);
  };

  // 1. Lấy dữ liệu từ Supabase khi mở trang
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStudents = students.filter(s => s.class_id === selectedClass);

  const openAddClassModal = () => {
    setModal({ isOpen: true, type: 'class', value: '' });
  };

  const openEditClassModal = (c: ClassData) => {
    setModal({ isOpen: true, type: 'edit_class', value: c.name, id: c.id });
  };

  const handleDeleteClass = async (id: string) => {
    if (window.confirm("Khầy có chắc muốn xóa lớp này không? Tất cả học sinh trong lớp cũng sẽ bị xoá!")) {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (!error) {
        setClasses(classes.filter(c => c.id !== id));
        if (selectedClass === id) {
          const remaining = classes.filter(c => c.id !== id);
          setSelectedClass(remaining.length > 0 ? remaining[0].id : null);
        }
      } else {
        alert("Lỗi khi xoá: " + error.message);
      }
    }
  };

  const openAddStudentModal = () => {
    setModal({ isOpen: true, type: 'student', value: '' });
  };

  const handleModalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!modal.value.trim()) return;

    if (modal.type === 'class') {
      // Gọi API thêm Lớp vào Supabase
      const { data, error } = await supabase
        .from('classes')
        .insert([{ name: modal.value.trim() }])
        .select()
        .single();
        
      if (!error && data) {
        setClasses([...classes, data]);
        setSelectedClass(data.id);
      }
    } else if (modal.type === 'edit_class' && modal.id) {
      // Gọi API sửa Lớp
      const { data, error } = await supabase
        .from('classes')
        .update({ name: modal.value.trim() })
        .eq('id', modal.id)
        .select()
        .single();
        
      if (!error && data) {
        setClasses(classes.map(c => c.id === modal.id ? data : c));
      } else {
        alert("Lỗi khi sửa: " + error?.message);
      }
    } else {
      if (!selectedClass) {
        alert("Khầy phải chọn hoặc tạo 1 lớp trước khi thêm bé nhé!");
        return;
      }
      const avatars = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐧", "🐥", "🐢", "🐳", "🐙"];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      
      const usedArucoIds = students.map(s => s.aruco_id);
      let newArucoId = 1;
      while (usedArucoIds.includes(newArucoId)) {
        newArucoId++;
      }

      // Gọi API thêm Bé vào Supabase
      const { data, error } = await supabase
        .from('students')
        .insert([{ 
          class_id: selectedClass, 
          name: modal.value.trim(), 
          avatar_url: randomAvatar, 
          aruco_id: newArucoId 
        }])
        .select()
        .single();

      if (!error && data) {
        setStudents([...students, data]);
      } else {
        alert("Lỗi khi thêm bé: " + error?.message);
      }
    }
    setModal({ ...modal, isOpen: false });
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm("Khầy có chắc muốn xóa bé này khỏi lớp không?")) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (!error) {
        setStudents(students.filter(s => s.id !== id));
      } else {
        alert("Lỗi khi xoá: " + error.message);
      }
    }
  };

  if (!authorized || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#e1f4d9]">
        <Loader2 className="animate-spin text-[#5c4a3d] mb-4" size={48} />
        <h2 className="text-2xl font-bold text-[#5c4a3d]">
          {!authorized ? "Đang kiểm tra quyền truy cập..." : "Đang lấy dữ liệu từ Supabase..."}
        </h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-8 bg-[#e1f4d9]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto w-full">
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
          <Users size={32} className="text-[#6ab237]" /> Quản Lý Lớp Học
        </h1>
        <div className="w-[120px]"></div> {/* Spacer */}
      </div>

      <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-6">
        {/* Left Sidebar: Classes */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="ac-card bg-white p-4">
            <h2 className="text-xl font-bold mb-4 border-b-2 border-dashed border-[#5c4a3d] pb-2">Danh sách Lớp</h2>
            <div className="flex flex-col gap-2">
              {classes.map(c => (
                <div 
                  key={c.id}
                  onClick={() => setSelectedClass(c.id)}
                  className={`group relative flex items-center p-3 rounded-xl border-2 font-bold text-left transition-all cursor-pointer ${
                    selectedClass === c.id 
                    ? "bg-[#6ab237] border-[#5c4a3d] text-white shadow-[0_4px_0_0_#5c4a3d] translate-y-[-2px]" 
                    : "bg-[#f8ce3c] border-[#5c4a3d] text-[#5c4a3d] hover:bg-[#f4a255] hover:text-white"
                  }`}
                >
                  <span className="truncate flex-1 pr-20">{c.name}</span>
                  
                  <div className={`absolute right-2 flex gap-1 items-center transition-opacity ${selectedClass === c.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditClassModal(c); }}
                      className="w-8 h-8 bg-white border-2 border-[#5c4a3d] rounded-lg flex items-center justify-center text-[#3bb2e8] hover:bg-[#3bb2e8] hover:text-white shadow-[0_2px_0_0_#5c4a3d] active:translate-y-[2px] active:shadow-none transition-all"
                      title="Sửa lớp"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }}
                      className="w-8 h-8 bg-white border-2 border-[#5c4a3d] rounded-lg flex items-center justify-center text-[#f46255] hover:bg-[#f46255] hover:text-white shadow-[0_2px_0_0_#5c4a3d] active:translate-y-[2px] active:shadow-none transition-all"
                      title="Xoá lớp"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {classes.length === 0 && <p className="text-sm text-center text-[#a87233] italic py-2">Chưa có lớp nào.</p>}
              <button 
                onClick={openAddClassModal}
                className="p-3 mt-2 rounded-xl border-2 border-dashed border-[#5c4a3d] text-[#5c4a3d] font-bold flex items-center justify-center gap-2 hover:bg-[#d6f2fe]"
              >
                <Plus size={20} /> Thêm Lớp Mới
              </button>
            </div>
          </div>
        </div>

        {/* Right Content: Students */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className="ac-card bg-white flex-1 p-6">
            <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-[#5c4a3d] pb-4">
              <h2 className="text-2xl font-bold text-[#3bb2e8]">
                Học sinh ({currentStudents.length})
              </h2>
              <div className="flex gap-2">
                {selectedClass && currentStudents.length > 0 && (
                  <Link href={`/print?classId=${selectedClass}`}>
                    <button className="btn-ac-yellow px-4 py-2 text-sm flex items-center gap-2">
                      <QrCode size={16} /> In Tất Cả
                    </button>
                  </Link>
                )}
                {selectedClass && (
                  <button onClick={openAddStudentModal} className="btn-ac-blue px-4 py-2 text-sm flex items-center gap-2">
                    <Plus size={16} /> Thêm Bé
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentStudents.map(student => (
                <motion.div 
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#e1f4d9] border-2 border-[#5c4a3d] rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full border-2 border-[#5c4a3d] flex items-center justify-center text-2xl shadow-[0_2px_0_0_#5c4a3d]">
                      {student.avatar_url}
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight">{student.name}</p>
                      <p className="text-sm text-[#a87233] font-medium">Mã số: {student.aruco_id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* Nút in thẻ cá nhân */}
                    <Link href={`/print?studentId=${student.id}`}>
                      <button className="w-10 h-10 bg-[#f8ce3c] border-2 border-[#5c4a3d] rounded-xl flex items-center justify-center text-[#5c4a3d] hover:bg-white shadow-[0_2px_0_0_#5c4a3d] active:translate-y-[2px] active:shadow-none transition-all" title="In thẻ bé này">
                        <QrCode size={18} />
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleDeleteStudent(student.id)}
                      className="w-10 h-10 bg-[#f46255] border-2 border-[#5c4a3d] rounded-xl flex items-center justify-center text-white hover:bg-white hover:text-[#f46255] shadow-[0_2px_0_0_#5c4a3d] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {currentStudents.length === 0 && selectedClass && (
              <div className="text-center py-10 text-[#a87233] font-medium">
                <p className="text-4xl mb-2">🌱</p>
                <p>Lớp này chưa có bé nào cả.</p>
              </div>
            )}
            {!selectedClass && (
              <div className="text-center py-10 text-[#a87233] font-medium">
                <p className="text-4xl mb-2">👈</p>
                <p>Khầy hãy chọn một lớp bên trái hoặc tạo lớp mới nhé.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Modal */}
      <AnimatePresence>
        {modal.isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#5c4a3d]/40 backdrop-blur-sm z-40"
              onClick={() => setModal({...modal, isOpen: false})}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="ac-card w-full max-w-md pointer-events-auto relative"
              >
                <button 
                  onClick={() => setModal({...modal, isOpen: false})}
                  className="absolute -top-4 -right-4 bg-[#f46255] w-10 h-10 rounded-full border-4 border-[#5c4a3d] flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <X size={20} strokeWidth={4} />
                </button>
                
                <h2 className="text-2xl font-bold text-[#5c4a3d] mb-4 text-center">
                  {modal.type === 'class' ? '✨ Thêm Lớp Mới ✨' : modal.type === 'edit_class' ? '✨ Sửa Tên Lớp ✨' : '✨ Thêm Bé Mới ✨'}
                </h2>
                
                <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder={modal.type === 'class' || modal.type === 'edit_class' ? "Ví dụ: Lớp Lá 1" : "Ví dụ: Bé Mập"}
                    value={modal.value}
                    onChange={(e) => setModal({...modal, value: e.target.value})}
                    className="w-full bg-[#e1f4d9] border-4 border-[#5c4a3d] rounded-2xl px-4 py-3 text-lg font-bold text-[#5c4a3d] placeholder:text-[#a87233]/60 focus:outline-none focus:border-[#6ab237] transition-colors"
                  />
                  <button type="submit" className="btn-ac-green w-full text-lg mt-2 py-4">
                    Xác nhận
                  </button>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
