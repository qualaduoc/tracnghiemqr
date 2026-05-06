"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ArrowLeft, Loader2, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { supabase } from "../../utils/supabaseClient";

type ClassData = { id: string, name: string };
type QuestionSet = { id: string, name: string };
type StudentData = { id: string, name: string, avatar_url: string, aruco_id: number };
type QuestionData = {
  id: string,
  question_text: string,
  image_url: string | null,
  time_limit: number,
  options: { id: string, text: string, is_correct: boolean }[],
  order_idx: number
};

export default function PresenterScreen() {
  const [appState, setAppState] = useState<'select' | 'presenting' | 'finished'>('select');
  const [loading, setLoading] = useState(true);

  // Dữ liệu lựa chọn
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSet, setSelectedSet] = useState<string>("");

  // Dữ liệu phiên chạy
  const [sessionData, setSessionData] = useState<any>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { isCorrect: boolean }>>({}); // studentId -> status

  const currentQIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (questions.length > 0) {
      currentQIdRef.current = questions[currentQIndex]?.id || null;
    }
  }, [currentQIndex, questions]);

  // Timer
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: cData } = await supabase.from('classes').select('*').order('created_at', { ascending: true });
    if (cData) setClasses(cData);
    if (cData && cData.length > 0) setSelectedClass(cData[0].id);

    const { data: sData } = await supabase.from('question_sets').select('*').order('created_at', { ascending: true });
    if (sData) setQuestionSets(sData);
    if (sData && sData.length > 0) setSelectedSet(sData[0].id);

    setLoading(false);
  };

  const handleStartSession = async () => {
    if (!selectedClass || !selectedSet) return;
    setLoading(true);

    // 1. Lấy danh sách học sinh
    const { data: stdData } = await supabase.from('students').select('*').eq('class_id', selectedClass);
    if (stdData) setStudents(stdData);

    // 2. Lấy danh sách câu hỏi
    const { data: qData } = await supabase.from('questions').select('*').eq('set_id', selectedSet).order('order_idx', { ascending: true });
    if (!qData || qData.length === 0) {
      alert("Bộ câu hỏi này chưa có câu hỏi nào!");
      setLoading(false);
      return;
    }
    setQuestions(qData as any);

    // 3. Tạo session
    const { data: sessData, error } = await supabase.from('sessions').insert([{
      class_id: selectedClass,
      set_id: selectedSet,
      current_question_id: qData[0].id,
      status: 'waiting'
    }]).select().single();

    if (!error && sessData) {
      setSessionData(sessData);
      setCurrentQIndex(0);
      setTimeLeft(qData[0].time_limit || 30);
      setAppState('presenting');
      subscribeToAnswers(sessData.id);
    } else {
      alert("Lỗi khi tạo phiên: " + error?.message);
    }
    setLoading(false);
  };

  const subscribeToAnswers = (sessionId: string) => {
    supabase.channel(`answers_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers', filter: `session_id=eq.${sessionId}` }, payload => {
        const newAnswer = payload.new as any;
        
        if (newAnswer && newAnswer.student_id) {
          setAnswers(prev => {
            // Chỉ cập nhật nếu đáp án thuộc về câu hỏi hiện tại đang hiển thị
            if (currentQIdRef.current && newAnswer.question_id !== currentQIdRef.current) {
              return prev;
            }
            return {
              ...prev,
              [newAnswer.student_id]: { isCorrect: newAnswer.is_correct }
            };
          });
        }
      })
      .subscribe();
  };

  const fireConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#8bd256', '#f4a255', '#3bb2e8', '#f8ce3c'] });
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isPlaying && timeLeft === 0) {
      // Hết giờ
      setIsPlaying(false);
      setShowAnswer(true);
      fireConfetti(); // Bắn pháo hoa báo hiệu hết giờ / hiện đáp án
    }
  }, [timeLeft, isPlaying]);

  const handleNextQuestion = async () => {
    if (currentQIndex + 1 < questions.length) {
      const nextIndex = currentQIndex + 1;
      const nextQ = questions[nextIndex];
      setCurrentQIndex(nextIndex);
      setTimeLeft(nextQ.time_limit || 30);
      setIsPlaying(false);
      setShowAnswer(false);
      setAnswers({});
      
      // Update session
      await supabase.from('sessions').update({ current_question_id: nextQ.id }).eq('id', sessionData.id);
    } else {
      setAppState('finished');
      await supabase.from('sessions').update({ status: 'finished' }).eq('id', sessionData.id);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#e1f4d9]">
        <Loader2 className="animate-spin text-[#5c4a3d] mb-4" size={48} />
        <h2 className="text-2xl font-bold text-[#5c4a3d]">Đang tải dữ liệu...</h2>
      </div>
    );
  }

  if (appState === 'select') {
    return (
      <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-[#e1f4d9]">
        <div className="w-full flex justify-between items-center mb-8 max-w-3xl">
          <Link href="/">
            <motion.button className="btn-ac-orange flex items-center gap-2"><ArrowLeft size={24} /> Trở về</motion.button>
          </Link>
          <h1 className="text-3xl font-extrabold text-[#5c4a3d]">Bắt Đầu Trò Chơi</h1>
          <div className="w-[100px]"></div>
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="ac-card bg-white p-8 w-full max-w-xl">
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-lg font-bold text-[#a87233] mb-2">Chọn Lớp Học</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full border-4 border-[#5c4a3d] rounded-2xl p-4 font-bold text-xl text-[#5c4a3d] focus:outline-none focus:border-[#3bb2e8]">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                {classes.length === 0 && <option value="">(Chưa có lớp nào)</option>}
              </select>
            </div>
            <div>
              <label className="block text-lg font-bold text-[#a87233] mb-2">Chọn Bộ Câu Hỏi</label>
              <select value={selectedSet} onChange={e => setSelectedSet(e.target.value)} className="w-full border-4 border-[#5c4a3d] rounded-2xl p-4 font-bold text-xl text-[#5c4a3d] focus:outline-none focus:border-[#f4a255]">
                {questionSets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                {questionSets.length === 0 && <option value="">(Chưa có bộ câu hỏi nào)</option>}
              </select>
            </div>
            <button 
              onClick={handleStartSession} 
              disabled={!selectedClass || !selectedSet}
              className="btn-ac-green w-full py-4 text-2xl flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
            >
              <Play fill="currentColor" /> Bắt Đầu Chơi!
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (appState === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#e1f4d9]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="ac-card bg-white p-10 text-center">
          <span className="text-8xl mb-4 block">🏆</span>
          <h1 className="text-4xl font-extrabold text-[#5c4a3d] mb-6">Trò chơi kết thúc!</h1>
          <p className="text-xl font-bold text-[#a87233] mb-8">Các bé đã hoàn thành xuất sắc.</p>
          <Link href="/">
            <button className="btn-ac-blue py-4 px-8 text-xl w-full">Về Màn Hình Chính</button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  const className = classes.find(c => c.id === selectedClass)?.name;
  const setName = questionSets.find(s => s.id === selectedSet)?.name;

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 overflow-hidden bg-[#fffdf8]">
      {/* Cloud Decoration */}
      <motion.div animate={{ x: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 right-10 w-48 h-20 bg-white rounded-full z-[-1] opacity-70 blur-md" />

      {/* Header */}
      <div className="w-full max-w-[95vw] flex justify-between items-center mb-6 relative z-10">
        <button onClick={() => { if(confirm('Thoát phiên chơi?')) setAppState('select') }} className="btn-ac-orange flex items-center gap-2">
          <ArrowLeft size={24} /> Kết thúc
        </button>
        <div className="bg-white border-4 border-[#5c4a3d] rounded-full px-8 py-3 shadow-[0_4px_0_0_#5c4a3d]">
          <h2 className="text-xl font-bold text-[#5c4a3d]">Lớp {className} - Bộ: {setName}</h2>
        </div>
        <div className="w-[120px]"></div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[95vw] flex gap-6 flex-1 pb-4">
        
        {/* Left: Question Box */}
        <div className="flex-1 flex flex-col gap-4">
          <motion.div 
            key={currentQ.id}
            initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="bg-white border-4 border-[#5c4a3d] rounded-3xl p-6 flex-1 flex flex-col shadow-[8px_8px_0_0_rgba(92,74,61,0.15)] relative"
          >
            <div className="text-2xl lg:text-3xl font-extrabold text-[#3bb2e8] mb-4 flex items-center gap-4">
              <span className="bg-[#d6f2fe] p-3 rounded-full border-2 border-[#3bb2e8] whitespace-nowrap">Câu {currentQIndex + 1}/{questions.length}</span>
              <span className="text-[#5c4a3d]">{currentQ.question_text}</span>
            </div>

            {/* Image */}
            {currentQ.image_url ? (
              <div className="w-full flex-1 bg-[#f9f9f9] border-4 border-[#5c4a3d] rounded-2xl flex items-center justify-center mb-4 overflow-hidden min-h-[30vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentQ.image_url} alt="Minh họa" className="max-h-[45vh] w-auto object-contain" />
              </div>
            ) : (
              <div className="w-full flex-1 bg-[#e1f4d9] border-4 border-dashed border-[#8bd256] rounded-2xl flex items-center justify-center mb-4 min-h-[30vh]">
                <span className="text-4xl opacity-50 text-[#5c4a3d] font-bold">Chưa có ảnh minh họa</span>
              </div>
            )}

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              {currentQ.options.map((opt, i) => {
                const colorClass = i === 0 ? 'bg-[#f4a255] text-white' : i === 1 ? 'bg-[#3bb2e8] text-white' : i === 2 ? 'bg-[#8bd256] text-white' : 'bg-[#f8ce3c] text-[#5c4a3d]';
                const isCorrect = opt.is_correct;
                const dimClass = showAnswer && !isCorrect ? 'opacity-30 grayscale' : '';
                const popClass = showAnswer && isCorrect ? 'scale-[1.02] shadow-[0_0_20px_rgba(139,210,86,0.6)] border-[#8bd256]' : '';

                return (
                  <div key={opt.id} className={`p-3 lg:p-4 border-4 border-[#5c4a3d] rounded-2xl text-xl lg:text-2xl font-bold transition-all duration-500 ${colorClass} ${dimClass} ${popClass} flex items-center gap-3`}>
                    <span className="bg-white/30 px-3 py-1 rounded-full">{opt.id}</span>
                    {opt.text}
                    {showAnswer && isCorrect && <CheckCircle2 className="ml-auto" size={32} />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right: Timer & Leaderboard */}
        <div className="w-[350px] lg:w-[400px] flex flex-col gap-4">
          {/* Timer */}
          <div className="ac-card text-center bg-[#f8ce3c] relative overflow-hidden flex flex-col items-center justify-center py-6">
            <h3 className="text-xl font-bold mb-1 text-[#5c4a3d]">Thời gian</h3>
            <div className="text-7xl font-black text-white" style={{ textShadow: '0 4px 0 #5c4a3d' }}>
              {timeLeft}
            </div>
            
            <div className="mt-4 flex flex-col gap-2 w-full px-6">
              {!isPlaying && !showAnswer && (
                <button onClick={() => setIsPlaying(true)} className="btn-ac-green py-2 px-4 text-xl w-full">
                  Bắt đầu!
                </button>
              )}
              
              {/* Nút Chốt đáp án sớm */}
              {!showAnswer && (
                <button 
                  onClick={() => {
                    setIsPlaying(false);
                    setTimeLeft(0);
                    setShowAnswer(true);
                    fireConfetti();
                  }} 
                  className="btn-ac-orange py-2 px-4 text-base w-full flex items-center justify-center gap-2"
                >
                  Chốt Đáp Án Sớm
                </button>
              )}

              {showAnswer && (
                 <button onClick={handleNextQuestion} className="btn-ac-blue py-2 px-4 text-xl w-full flex items-center justify-center gap-2">
                   Câu Tiếp Theo <ChevronRight />
                 </button>
              )}
            </div>
          </div>

          {/* Gamified Live Feed */}
          <div className="ac-card flex-1 flex flex-col min-h-[300px]">
            <h3 className="text-lg font-bold mb-3 flex items-center justify-between border-b-2 border-dashed border-[#5c4a3d] pb-2 text-[#5c4a3d]">
              <span className="flex items-center gap-2">👥 Sĩ số: {students.length}</span>
              <span className="text-sm bg-[#e1f4d9] px-2 py-1 rounded-lg">Đã trả lời: {Object.keys(answers).length}</span>
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              <AnimatePresence>
                {students.map((s) => {
                  const hasAnswered = answers[s.id] !== undefined;
                  const isCorrect = answers[s.id]?.isCorrect;
                  
                  let statusUi = <span className="text-lg opacity-30">⏳</span>;
                  let bgClass = "bg-gray-100";
                  
                  if (hasAnswered && !showAnswer) {
                    statusUi = <span className="text-lg">✅</span>;
                    bgClass = "bg-[#d6f2fe]";
                  } else if (showAnswer) {
                    if (!hasAnswered) {
                      statusUi = <span className="text-lg">❌</span>;
                      bgClass = "bg-gray-200";
                    } else if (isCorrect) {
                      statusUi = <span className="text-xl">🌟</span>;
                      bgClass = "bg-[#e1f4d9]";
                    } else {
                      statusUi = <span className="text-lg">💦</span>;
                      bgClass = "bg-[#fce4e4]";
                    }
                  }

                  return (
                    <motion.div 
                      key={s.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`p-2 rounded-xl border-2 border-[#5c4a3d] flex items-center justify-between transition-colors ${bgClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{s.avatar_url}</span>
                        <span className="text-base font-bold text-[#5c4a3d]">{s.name}</span>
                      </div>
                      {statusUi}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
            
            {/* Nút giả lập học sinh quét */}
            <div className="mt-3 pt-3 border-t-2 border-dashed border-[#5c4a3d]">
              <button 
                onClick={() => {
                  if(!isPlaying) return alert("Bấm bắt đầu đếm giờ trước Khầy ơi!");
                  const randomStudent = students[Math.floor(Math.random() * students.length)];
                  const isCorrect = Math.random() > 0.5;
                  if (randomStudent && !answers[randomStudent.id]) {
                    setAnswers(prev => ({...prev, [randomStudent.id]: { isCorrect }}));
                  }
                }} 
                className="w-full text-xs font-bold text-[#a87233] bg-[#fdf5d3] p-2 rounded-xl border-2 border-[#a87233] border-dashed hover:bg-[#f8ce3c] transition-colors"
              >
                🛠️ Giả lập 1 bé quét thẻ
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
