"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, BookOpen, Clock, Settings, Image as ImageIcon, X, Trash2, Loader2, Save, Upload } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";
import { getDirectImageUrl } from "../../utils/imageHelper";

type QuestionSet = { id: string, name: string };
type Option = { id: string, text: string };
type Question = { 
  id: string; 
  set_id: string; 
  question_text: string; 
  time_limit: number; 
  image_url: string | null;
  options: Option[];
  correct_option: string;
};

export default function QuestionsManagement() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("app_is_logged_in") !== "true") {
      window.location.href = `/?redirect=${window.location.pathname}`;
    } else {
      setAuthorized(true);
    }
  }, []);

  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal thêm Bộ câu hỏi
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [newSetName, setNewSetName] = useState("");

  // Modal thêm/sửa Câu hỏi
  const [questionModal, setQuestionModal] = useState({
    isOpen: false,
    isEdit: false,
    id: "",
    question_text: "",
    time_limit: 30,
    image_url: "",
    options: [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" }
    ],
    correct_option: "A"
  });

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Khầy ơi, tệp tải lên phải là hình ảnh nhé!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Khầy ơi, kích thước ảnh tối đa là 5MB thôi ạ!");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('question-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);

      setQuestionModal(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error: any) {
      alert("Lỗi tải ảnh lên: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Lấy danh sách bộ câu hỏi
    const { data: setsData, error: setsError } = await supabase
      .from('question_sets')
      .select('id, name')
      .order('created_at', { ascending: true });
      
    if (!setsError && setsData) {
      setQuestionSets(setsData);
      if (setsData.length > 0 && !selectedSet) {
        setSelectedSet(setsData[0].id);
      }
    }

    // Lấy danh sách câu hỏi
    const { data: qsData, error: qsError } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (!qsError && qsData) {
      // Ép kiểu Json thành mảng Option[] và tìm đáp án đúng
      const parsedQs = qsData.map(q => {
        const opts = q.options as any[];
        const correctOpt = opts.find(o => o.is_correct)?.id || "A";
        return {
          ...q,
          options: opts as Option[],
          correct_option: correctOpt
        };
      });
      setQuestions(parsedQs);
    }
    
    setLoading(false);
  };

  const currentQuestions = questions.filter(q => q.set_id === selectedSet);

  // --- Handlers cho Bộ Câu Hỏi ---
  const handleAddSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetName.trim()) return;

    const { data, error } = await supabase
      .from('question_sets')
      .insert([{ name: newSetName.trim() }])
      .select()
      .single();

    if (!error && data) {
      setQuestionSets([...questionSets, data]);
      setSelectedSet(data.id);
      setSetModalOpen(false);
      setNewSetName("");
    } else {
      alert("Lỗi: " + error?.message);
    }
  };

  // --- Handlers cho Câu Hỏi ---
  const openAddQuestion = () => {
    setQuestionModal({
      isOpen: true,
      isEdit: false,
      id: "",
      question_text: "",
      time_limit: 30,
      image_url: "",
      options: [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" }
      ],
      correct_option: "A"
    });
  };

  const openEditQuestion = (q: Question) => {
    // Nếu mảng options của q bị thiếu (chỉ có 2, 3 đáp án), bù thêm cho đủ 4 để form hiển thị
    const safeOptions = ["A", "B", "C", "D"].map(id => {
      const existing = q.options.find(opt => opt.id === id);
      return existing || { id, text: "" };
    });

    setQuestionModal({
      isOpen: true,
      isEdit: true,
      id: q.id,
      question_text: q.question_text,
      time_limit: q.time_limit,
      image_url: q.image_url || "",
      options: safeOptions,
      correct_option: q.correct_option
    });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSet) return;
    if (!questionModal.question_text.trim()) {
      alert("Khầy ơi, chưa nhập nội dung câu hỏi!");
      return;
    }

    // Lọc bỏ những đáp án trống
    const validOptions = questionModal.options.filter(opt => opt.text.trim() !== "");
    if (validOptions.length < 2) {
      alert("Mỗi câu hỏi cần ít nhất 2 đáp án nhé Khầy!");
      return;
    }

    // Đảm bảo đáp án đúng phải nằm trong danh sách các đáp án có nội dung
    if (!validOptions.find(opt => opt.id === questionModal.correct_option)) {
      alert(`Đáp án đúng hiện tại là ${questionModal.correct_option}, nhưng Khầy chưa nhập nội dung cho đáp án này!`);
      return;
    }

    // Map options sang định dạng JSONB chứa is_correct
    const finalOptions = validOptions.map(opt => ({
      id: opt.id,
      text: opt.text.trim(),
      is_correct: opt.id === questionModal.correct_option
    }));

    const questionData = {
      set_id: selectedSet,
      question_text: questionModal.question_text.trim(),
      time_limit: questionModal.time_limit,
      image_url: questionModal.image_url.trim() || null,
      options: finalOptions
    };

    if (questionModal.isEdit) {
      // Cập nhật
      const { data, error } = await supabase
        .from('questions')
        .update(questionData)
        .eq('id', questionModal.id)
        .select()
        .single();
        
      if (!error && data) {
        // Cập nhật lại list ở client
        setQuestions(questions.map(q => q.id === data.id ? { ...data, options: data.options as Option[], correct_option: finalOptions.find(o => o.is_correct)?.id || "A" } : q));
        setQuestionModal({ ...questionModal, isOpen: false });
      } else {
        alert("Lỗi sửa: " + error?.message);
      }
    } else {
      // Tính order_idx cho câu hỏi mới
      const newOrderIdx = currentQuestions.length > 0 
        ? Math.max(...currentQuestions.map((q: any) => q.order_idx || 0)) + 1 
        : 1;

      // Thêm mới
      const { data, error } = await supabase
        .from('questions')
        .insert([{ ...questionData, order_idx: newOrderIdx }])
        .select()
        .single();

      if (!error && data) {
        setQuestions([...questions, { ...data, options: data.options as Option[], correct_option: finalOptions.find(o => o.is_correct)?.id || "A" }]);
        setQuestionModal({ ...questionModal, isOpen: false });
      } else {
        alert("Lỗi thêm: " + error?.message);
      }
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm("Khầy có chắc muốn xóa câu hỏi này không?")) {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (!error) {
        setQuestions(questions.filter(q => q.id !== id));
      } else {
        alert("Lỗi xóa: " + error.message);
      }
    }
  };

  if (!authorized || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#e1f4d9]">
        <Loader2 className="animate-spin text-[#5c4a3d] mb-4" size={48} />
        <h2 className="text-2xl font-bold text-[#5c4a3d]">
          {!authorized ? "Đang kiểm tra quyền truy cập..." : "Đang tải bộ câu hỏi..."}
        </h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-8 bg-[#e1f4d9]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto w-full">
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
          <BookOpen size={32} className="text-[#f4a255]" /> Quản Lý Câu Hỏi
        </h1>
        <div className="w-[120px]"></div> {/* Spacer */}
      </div>

      <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-6">
        {/* Left Sidebar: Sets */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="ac-card bg-white p-4">
            <h2 className="text-xl font-bold mb-4 border-b-2 border-dashed border-[#5c4a3d] pb-2">Bộ Câu Hỏi</h2>
            <div className="flex flex-col gap-2">
              {questionSets.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedSet(s.id)}
                  className={`p-3 rounded-xl border-2 font-bold text-left transition-all ${
                    selectedSet === s.id 
                    ? "bg-[#f4a255] border-[#5c4a3d] text-white shadow-[0_4px_0_0_#5c4a3d] translate-y-[-2px]" 
                    : "bg-[#e1f4d9] border-[#5c4a3d] text-[#5c4a3d] hover:bg-[#8bd256] hover:text-white"
                  }`}
                >
                  {s.name}
                </button>
              ))}
              {questionSets.length === 0 && <p className="text-sm text-center text-[#a87233] italic py-2">Chưa có bộ nào.</p>}
              <button 
                onClick={() => setSetModalOpen(true)}
                className="p-3 mt-2 rounded-xl border-2 border-dashed border-[#5c4a3d] text-[#5c4a3d] font-bold flex items-center justify-center gap-2 hover:bg-[#f8ce3c]"
              >
                <Plus size={20} /> Tạo Bộ Mới
              </button>
            </div>
          </div>
        </div>

        {/* Right Content: Questions in the Set */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className="ac-card bg-white flex-1 p-6">
            <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-[#5c4a3d] pb-4">
              <h2 className="text-2xl font-bold text-[#3bb2e8]">
                Câu hỏi trong bộ ({currentQuestions.length})
              </h2>
              {selectedSet && (
                <button onClick={openAddQuestion} className="btn-ac-blue px-4 py-2 text-sm flex items-center gap-2">
                  <Plus size={16} /> Thêm Câu Hỏi
                </button>
              )}
            </div>

            <div className="flex flex-col gap-6">
              {currentQuestions.map((q, index) => (
                <div key={q.id} className="bg-[#fce4e4] border-4 border-[#5c4a3d] rounded-2xl p-4 relative shadow-[4px_4px_0_0_rgba(92,74,61,0.1)] hover:border-[#f4a255] transition-colors group">
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#f8ce3c] rounded-full border-4 border-[#5c4a3d] flex items-center justify-center font-black text-xl text-[#5c4a3d]">
                    {index + 1}
                  </div>
                  
                  <div className="flex justify-between items-start ml-6 mb-4">
                    <h3 className="text-xl font-bold text-[#5c4a3d] flex-1">{q.question_text}</h3>
                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <div className="bg-white px-3 py-1 rounded-full border-2 border-[#5c4a3d] flex items-center gap-1 font-bold text-sm">
                        <Clock size={14} /> {q.time_limit}s
                      </div>
                      <button onClick={() => openEditQuestion(q)} className="bg-white p-2 rounded-xl border-2 border-[#5c4a3d] text-[#3bb2e8] hover:bg-[#3bb2e8] hover:text-white transition-colors" title="Sửa câu hỏi">
                        <Settings size={18} />
                      </button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="bg-white p-2 rounded-xl border-2 border-[#5c4a3d] text-[#f46255] hover:bg-[#f46255] hover:text-white transition-colors" title="Xóa câu hỏi">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Ảnh minh hoạ */}
                  {q.image_url ? (
                    <div className="mb-4 rounded-xl overflow-hidden border-4 border-[#5c4a3d] bg-white h-48 w-full relative flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getDirectImageUrl(q.image_url)} alt="Minh hoạ" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="mb-4 h-16 bg-white/50 border-2 border-dashed border-[#5c4a3d] rounded-xl flex items-center justify-center text-[#a87233] gap-2">
                      <ImageIcon size={20} /> <span className="font-medium text-sm">Chưa có ảnh minh họa</span>
                    </div>
                  )}

                  {/* Các đáp án */}
                  <div className="grid grid-cols-2 gap-3">
                    {q.options.map(opt => (
                      <div 
                        key={opt.id} 
                        className={`p-2 border-2 border-[#5c4a3d] rounded-xl font-bold flex gap-2 items-center
                          ${opt.id === q.correct_option ? "bg-[#8bd256] text-white shadow-[0_3px_0_0_#5c4a3d] -translate-y-1" : "bg-white text-[#5c4a3d]"}`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${opt.id === q.correct_option ? "bg-white text-[#8bd256]" : "bg-[#5c4a3d] text-white"}`}>
                          {opt.id}
                        </span>
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {currentQuestions.length === 0 && selectedSet && (
              <div className="text-center py-10 text-[#a87233] font-medium">
                <p className="text-4xl mb-2">🐾</p>
                <p>Chưa có câu hỏi nào trong bộ này.</p>
              </div>
            )}
            {!selectedSet && (
              <div className="text-center py-10 text-[#a87233] font-medium">
                <p className="text-4xl mb-2">👈</p>
                <p>Khầy hãy chọn hoặc tạo một bộ câu hỏi bên trái nhé.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        {/* Modal: Thêm Bộ Câu Hỏi */}
        {setModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#5c4a3d]/40 backdrop-blur-sm z-40" onClick={() => setSetModalOpen(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="ac-card w-full max-w-md pointer-events-auto relative">
                <button onClick={() => setSetModalOpen(false)} className="absolute -top-4 -right-4 bg-[#f46255] w-10 h-10 rounded-full border-4 border-[#5c4a3d] flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <X size={20} strokeWidth={4} />
                </button>
                <h2 className="text-2xl font-bold text-[#5c4a3d] mb-4 text-center">✨ Bộ Câu Hỏi Mới ✨</h2>
                <form onSubmit={handleAddSet} className="flex flex-col gap-4">
                  <input type="text" autoFocus placeholder="Tên bộ (VD: Thế giới động vật)" value={newSetName} onChange={(e) => setNewSetName(e.target.value)} className="w-full bg-[#e1f4d9] border-4 border-[#5c4a3d] rounded-2xl px-4 py-3 text-lg font-bold text-[#5c4a3d] placeholder:text-[#a87233]/60 focus:outline-none focus:border-[#6ab237] transition-colors" />
                  <button type="submit" className="btn-ac-green w-full text-lg mt-2 py-4">Lưu Lại</button>
                </form>
              </motion.div>
            </div>
          </>
        )}

        {/* Modal: Thêm/Sửa Câu Hỏi */}
        {questionModal.isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#5c4a3d]/40 backdrop-blur-sm z-40 overflow-y-auto py-10" onClick={() => setQuestionModal({...questionModal, isOpen: false})}>
              <div className="min-h-full flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 50 }} 
                  animate={{ scale: 1, opacity: 1, y: 0 }} 
                  exit={{ scale: 0.9, opacity: 0, y: 50 }} 
                  className="ac-card w-full max-w-2xl pointer-events-auto relative bg-[#fff9f0]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => setQuestionModal({...questionModal, isOpen: false})} className="absolute -top-4 -right-4 bg-[#f46255] w-10 h-10 rounded-full border-4 border-[#5c4a3d] flex items-center justify-center text-white hover:scale-110 transition-transform z-50">
                    <X size={20} strokeWidth={4} />
                  </button>
                  <h2 className="text-2xl font-bold text-[#5c4a3d] mb-6 flex items-center gap-2">
                    {questionModal.isEdit ? 'Sửa Câu Hỏi' : '✨ Thêm Câu Hỏi Mới ✨'}
                  </h2>
                  
                  <form onSubmit={handleSaveQuestion} className="flex flex-col gap-5">
                    {/* Câu hỏi & Thời gian */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-[#a87233] mb-1">Nội dung câu hỏi</label>
                        <textarea 
                          rows={2}
                          placeholder="VD: Con vật nào kêu gâu gâu?" 
                          value={questionModal.question_text} 
                          onChange={(e) => setQuestionModal({...questionModal, question_text: e.target.value})} 
                          className="w-full bg-white border-4 border-[#5c4a3d] rounded-2xl px-4 py-3 text-lg font-bold text-[#5c4a3d] focus:outline-none focus:border-[#3bb2e8] transition-colors resize-none" 
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-sm font-bold text-[#a87233] mb-1">Thời gian (s)</label>
                        <input 
                          type="number" 
                          min={5} max={300}
                          value={questionModal.time_limit} 
                          onChange={(e) => setQuestionModal({...questionModal, time_limit: parseInt(e.target.value) || 30})} 
                          className="w-full bg-white border-4 border-[#5c4a3d] rounded-2xl px-4 py-3 text-lg font-bold text-[#5c4a3d] text-center focus:outline-none focus:border-[#3bb2e8] transition-colors" 
                        />
                      </div>
                    </div>

                    {/* Ảnh minh hoạ */}
                    <div>
                      <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 w-full">
                          <label className="block text-sm font-bold text-[#a87233] mb-1">Link ảnh minh hoạ (Hỗ trợ Google Drive)</label>
                          <input 
                            type="url" 
                            placeholder="Dán link ảnh hoặc link Google Drive vào đây..." 
                            value={questionModal.image_url} 
                            onChange={(e) => setQuestionModal({...questionModal, image_url: e.target.value})} 
                            className="w-full bg-white border-4 border-[#5c4a3d] rounded-2xl px-4 py-3 font-medium text-[#5c4a3d] focus:outline-none focus:border-[#3bb2e8] transition-colors" 
                          />
                        </div>
                        <div className="w-full sm:w-auto">
                          <label className="hidden sm:block text-sm font-bold text-transparent mb-1">Tải lên</label>
                          <input 
                            type="file" 
                            id="image-file-input" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => document.getElementById('image-file-input')?.click()}
                            className="btn-ac-yellow w-full h-[54px] px-6 text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_4px_0_0_#5c4a3d]"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>Đang tải...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={16} />
                                <span>Tải Ảnh Lên</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {questionModal.image_url && (
                        <div className="mt-3 rounded-2xl overflow-hidden border-4 border-[#5c4a3d] bg-white h-32 w-fit max-w-full relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getDirectImageUrl(questionModal.image_url)} alt="Preview" className="h-full w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          <button 
                            type="button" 
                            onClick={() => setQuestionModal({...questionModal, image_url: ""})} 
                            className="absolute top-1 right-1 bg-[#f46255] hover:bg-[#d54e42] text-white p-1 rounded-full border-2 border-[#5c4a3d] transition-colors"
                            title="Xóa ảnh"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Đáp án */}
                    <div>
                      <label className="block text-sm font-bold text-[#a87233] mb-2">Các đáp án (Nhấn vào nút tròn để chọn đáp án đúng)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {questionModal.options.map((opt, i) => (
                          <div key={opt.id} className="flex items-center gap-2 relative">
                            <button 
                              type="button"
                              onClick={() => setQuestionModal({...questionModal, correct_option: opt.id})}
                              className={`absolute left-2 w-8 h-8 rounded-full border-2 border-[#5c4a3d] flex items-center justify-center font-bold text-sm transition-colors z-10
                                ${questionModal.correct_option === opt.id ? "bg-[#8bd256] text-white scale-110" : "bg-[#e1f4d9] text-[#5c4a3d] hover:bg-white"}`}
                              title="Chọn làm đáp án đúng"
                            >
                              {opt.id}
                            </button>
                            <input 
                              type="text" 
                              placeholder={`Nhập đáp án ${opt.id}...`} 
                              value={opt.text} 
                              onChange={(e) => {
                                const newOpts = [...questionModal.options];
                                newOpts[i].text = e.target.value;
                                setQuestionModal({...questionModal, options: newOpts});
                              }} 
                              className={`w-full bg-white border-4 border-[#5c4a3d] rounded-xl pl-12 pr-4 py-2 font-bold focus:outline-none focus:border-[#f4a255] transition-colors
                                ${questionModal.correct_option === opt.id ? "bg-[#e8f7e1]" : ""}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="btn-ac-blue w-full text-lg py-4 mt-2 flex justify-center items-center gap-2">
                      <Save size={20} /> Lưu Câu Hỏi
                    </button>
                  </form>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
