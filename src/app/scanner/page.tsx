"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, XCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import jsQR from "jsqr";
import { supabase } from "../../utils/supabaseClient";

type SessionData = { id: string, class_id: string, current_question_id: string };
type QuestionData = { id: string, options: any[] };

export default function ScannerScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<{ studentId: string, answer: string, isCorrect: boolean } | null>(null);

  // Dùng ref để lưu trữ kết quả đã quét nhằm tránh quét liên tục cùng 1 bé
  const scannedStudentsRef = useRef<Set<string>>(new Set());

  // 1. Lắng nghe Session đang active/waiting
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (data) {
        setSession(data);
        fetchQuestion(data.current_question_id);
      } else {
        setSession(null);
      }
    };

    fetchSession();

    // Lắng nghe thay đổi session (khi giáo viên chuyển câu)
    const channel = supabase.channel('scanner_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, (payload) => {
        fetchSession();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Xóa cache quét khi đổi câu hỏi (chỉ khi question id thực sự thay đổi)
  useEffect(() => {
    scannedStudentsRef.current.clear();
  }, [session?.current_question_id]);

  const fetchQuestion = async (qId: string) => {
    const { data } = await supabase.from('questions').select('*').eq('id', qId).single();
    if (data) {
      setQuestion(data);
    }
  };

  // 2. Khởi động Camera
  useEffect(() => {
    if (!session || !question) return;

    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
          videoRef.current.play();
          setHasCamera(true);
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Camera access denied or error", err);
        setHasCamera(false);
      }
    };

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) return;
          
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            handleScannedCode(code);
            
            // Vẽ viền QR code
            context.beginPath();
            context.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
            context.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
            context.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
            context.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
            context.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
            context.lineWidth = 4;
            context.strokeStyle = "#8bd256";
            context.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      cancelAnimationFrame(animationFrameId);
    };
  }, [session, question]); // Re-run if session or question changes


  const handleScannedCode = async (code: any) => {
    try {
      // 1. Parse JSON từ QR
      const payload = JSON.parse(code.data);
      if (!payload.studentId) return; // Không phải QR hợp lệ của hệ thống

      const studentId = payload.studentId;
      
      // Nếu bé này đã được quét ở câu này, bỏ qua để tránh spam API
      if (scannedStudentsRef.current.has(studentId)) return;

      // 2. Tính toán góc quay của QR code
      const tl = code.location.topLeftCorner;
      const tr = code.location.topRightCorner;
      const bl = code.location.bottomLeftCorner;

      // Tâm C của QR
      const centerX = (tl.x + code.location.bottomRightCorner.x) / 2;
      const centerY = (tl.y + code.location.bottomRightCorner.y) / 2;

      // Vector chỉ thiên (upVector) từ tâm đến trung điểm cạnh trên của QR
      const topMidX = (tl.x + tr.x) / 2;
      const topMidY = (tl.y + tr.y) / 2;
      
      const upVectorX = topMidX - centerX;
      const upVectorY = topMidY - centerY;

      const angle = Math.atan2(upVectorY, upVectorX);
      const angleDeg = angle * 180 / Math.PI;

      // Ánh xạ góc sang Đáp án (Dựa trên thiết kế Card)
      // Card chuẩn: A trên, B phải, C dưới, D trái
      let answer = 'A';
      if (angleDeg > -135 && angleDeg <= -45) {
        answer = 'A'; // Vector hướng lên
      } else if (angleDeg > -45 && angleDeg <= 45) {
        answer = 'D'; // Vector hướng sang phải -> D ở trên
      } else if (angleDeg > 45 && angleDeg <= 135) {
        answer = 'C'; // Vector hướng xuống -> C ở trên
      } else {
        answer = 'B'; // Vector hướng sang trái -> B ở trên
      }

      // 3. Kiểm tra đáp án đúng sai
      const correctOpt = question?.options.find((o: any) => o.is_correct)?.id || 'A';
      const isCorrect = answer === correctOpt;

      // 4. Cập nhật state UI
      setScanResult({ studentId, answer, isCorrect });
      scannedStudentsRef.current.add(studentId);

      // Xoá hiển thị sau 2 giây
      setTimeout(() => setScanResult(null), 2000);

      // 5. Bắn lên Supabase (Dùng UPSERT để ghi đè nếu quét lại)
      if (session) {
        await supabase.from('answers').upsert({
          session_id: session.id,
          question_id: session.current_question_id,
          student_id: studentId,
          selected_option: answer,
          is_correct: isCorrect
        }, { onConflict: 'session_id, question_id, student_id' });
      }

    } catch (e) {
      // Bỏ qua các QR code không phải JSON của mình
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffdf8] p-4 text-center">
        <Loader2 className="animate-spin text-[#a87233] mb-4" size={48} />
        <h2 className="text-2xl font-bold text-[#5c4a3d] mb-2">Đang chờ câu hỏi...</h2>
        <p className="text-[#a87233] font-medium">Cô giáo hãy mở một bộ câu hỏi trên màn hình máy chiếu nhé!</p>
        <Link href="/">
          <button className="btn-ac-orange mt-8 flex items-center gap-2"><ArrowLeft size={20}/> Về Trang Chủ</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black relative">
      {/* Header Camera */}
      <div className="absolute top-0 left-0 w-full p-4 z-20 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
        <Link href="/">
          <button className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md">
            <ArrowLeft size={24} />
          </button>
        </Link>
        <div className="bg-[#8bd256] text-white px-4 py-1 rounded-full font-bold shadow-lg border-2 border-[#5c4a3d]">
          Máy Quét
        </div>
        <div className="w-10"></div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-900">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
        
        {/* Lưới nhắm */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-4 border-dashed border-white/50 rounded-3xl relative">
            {/* Corners */}
            <div className="absolute top-[-4px] left-[-4px] w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-3xl"></div>
            <div className="absolute top-[-4px] right-[-4px] w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-3xl"></div>
            <div className="absolute bottom-[-4px] left-[-4px] w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-3xl"></div>
            <div className="absolute bottom-[-4px] right-[-4px] w-8 h-8 border-b-4 border-r-4 border-white rounded-br-3xl"></div>
          </div>
        </div>

        {/* Thông báo quyền truy cập */}
        {hasCamera === false && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center text-white z-30">
            <XCircle size={64} className="text-[#f46255] mb-4" />
            <h2 className="text-2xl font-bold mb-2">Không Thể Mở Camera</h2>
            <p className="text-white/70">Vui lòng cấp quyền truy cập camera trong cài đặt trình duyệt để sử dụng tính năng này.</p>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="bg-white p-6 rounded-t-3xl border-t-4 border-[#5c4a3d] z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#a87233] uppercase">Đang quét câu hỏi</h3>
            <h2 className="text-xl font-bold text-[#5c4a3d] line-clamp-1">
              {question?.options ? "Câu hỏi hiện tại" : "Đang lấy nội dung..."}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-[#3bb2e8]">{scannedStudentsRef.current.size}</div>
            <div className="text-xs font-bold text-[#a87233]">ĐÃ QUÉT</div>
          </div>
        </div>

        {/* Scan Result Popup */}
        <AnimatePresence>
          {scanResult && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full p-4 rounded-2xl border-4 flex items-center justify-between text-white font-bold text-xl shadow-lg
                ${scanResult.isCorrect ? 'bg-[#8bd256] border-[#5c4a3d]' : 'bg-[#f46255] border-[#5c4a3d]'}`}
            >
              <div className="flex items-center gap-3">
                {scanResult.isCorrect ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                <span>Đã chọn: {scanResult.answer}</span>
              </div>
              <span className="text-sm bg-black/20 px-3 py-1 rounded-full">Đã nộp bài</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!scanResult && (
          <div className="w-full p-4 rounded-2xl border-4 border-dashed border-[#a87233] bg-[#fdf5d3] text-center text-[#a87233] font-bold">
            Hãy hướng camera vào thẻ của học sinh
          </div>
        )}
      </div>
    </div>
  );
}
