"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";

type StudentData = { id: string, class_id: string, name: string, avatar_url: string, aruco_id: number };

// Tách logic dùng useSearchParams ra một component con và bọc trong Suspense
// để tránh lỗi Deopt của Next.js khi build.
function PrintContent() {
  const printRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const classIdParam = searchParams.get("classId");
  
  const [displayStudents, setDisplayStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [studentIdParam, classIdParam]);

  const fetchStudents = async () => {
    setLoading(true);
    let query = supabase.from('students').select('*').order('aruco_id', { ascending: true });
    
    if (studentIdParam) {
      query = query.eq('id', studentIdParam);
    } else if (classIdParam) {
      query = query.eq('class_id', classIdParam);
    }
    
    const { data, error } = await query;
    if (!error && data) {
      setDisplayStudents(data);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-[#5c4a3d] mb-4" size={48} />
        <h2 className="text-xl font-bold text-[#5c4a3d]">Đang tải dữ liệu thẻ...</h2>
      </div>
    );
  }

  return (
    <>
      {/* Top navigation - hidden when printing */}
      <div className="print:hidden flex justify-between items-center mb-6 max-w-4xl mx-auto w-full">
        <Link href="/classes">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-ac-orange flex items-center gap-2"
          >
            <ArrowLeft size={20} /> Quay Lại
          </motion.button>
        </Link>
        <h1 className="text-3xl font-extrabold text-[#5c4a3d]">
          {studentIdParam ? `In Thẻ: ${displayStudents[0]?.name || ''}` : "In Thẻ Học Sinh"}
        </h1>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrint}
          className="btn-ac-blue flex items-center gap-2"
        >
          <Printer size={20} /> In Ngay!
        </motion.button>
      </div>

      {/* Print Area */}
      <div ref={printRef} className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print:max-w-none">
        {displayStudents.map((student) => (
          <div key={student.id} className="aspect-square bg-white border-8 border-black p-4 relative flex flex-col items-center justify-center break-inside-avoid shadow-lg print:shadow-none print:border-4">
            
            {/* The 4 Corners (A, B, C, D) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-6xl font-black">A</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-6xl font-black rotate-180">C</div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-6xl font-black -rotate-90">D</div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl font-black rotate-90">B</div>

            {/* Marker */}
            <div className="w-1/2 h-1/2 flex items-center justify-center relative z-0">
              <QRCodeSVG value={`{"arucoId":${student.aruco_id},"studentId":"${student.id}"}`} size={200} level="H" />
            </div>

            {/* Student Info Footer - Compact design to avoid overlapping C */}
            <div className="absolute bottom-4 left-4 flex flex-col items-center gap-1 bg-white px-2 py-2 border-4 border-black rounded-xl shadow-[4px_4px_0_0_#000] print:shadow-none max-w-[35%] z-10">
              <div className="flex items-center gap-1">
                <span className="text-2xl">{student.avatar_url}</span>
                <span className="text-sm font-black text-white bg-black px-2 py-0.5 rounded-full">Mã: {student.aruco_id}</span>
              </div>
              <span className="text-sm sm:text-base font-bold text-center leading-tight line-clamp-2 w-full">{student.name}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function PrintCards() {
  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-8 bg-[#e1f4d9]">
      <Suspense fallback={<div className="text-center font-bold text-2xl mt-20">Đang tải thẻ...</div>}>
        <PrintContent />
      </Suspense>

      {/* Custom print styles to ensure colors and layout print correctly */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .aspect-square { width: 100%; height: auto; aspect-ratio: 1/1; margin-bottom: 2rem; }
          @page { size: A4; margin: 1cm; }
        }
      `}} />
    </div>
  );
}
