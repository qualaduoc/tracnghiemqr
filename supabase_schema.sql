-- Supabase Schema for QR Quiz App

-- Bật extension pgcrypto để sinh UUID nếu cần (Supabase đã bật sẵn thường xuyên)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Bảng lưu trữ Lớp học
CREATE TABLE public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng lưu trữ Học sinh
CREATE TABLE public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    aruco_id INTEGER NOT NULL, -- Số ID của mã ArUco được in trên thẻ của bé
    avatar_url TEXT, -- Ảnh đại diện con vật/chibi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(class_id, aruco_id) -- Mỗi lớp chỉ có 1 ID aruco duy nhất cho 1 học sinh
);

-- Bảng lưu trữ Bộ câu hỏi (Question Sets)
CREATE TABLE public.question_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng lưu trữ các Câu hỏi trong Bộ câu hỏi
CREATE TABLE public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    set_id UUID REFERENCES public.question_sets(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    image_url TEXT, -- Ảnh minh hoạ câu hỏi
    audio_url TEXT, -- Âm thanh đọc câu hỏi
    options JSONB NOT NULL, -- [{ "id": "A", "text": "Cat", "is_correct": true }, { "id": "B", ... }]
    time_limit INTEGER DEFAULT 30, -- Số giây đếm ngược
    order_idx INTEGER NOT NULL, -- Thứ tự hiển thị
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng Quản lý Phiên kiểm tra (Live Sessions)
CREATE TABLE public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    set_id UUID REFERENCES public.question_sets(id) ON DELETE CASCADE,
    current_question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng lưu trữ Câu trả lời của Học sinh (chấm điểm)
CREATE TABLE public.answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    selected_option TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, question_id, student_id) -- Mỗi bé chỉ trả lời 1 lần cho 1 câu trong 1 phiên
);

-- ==========================================
-- Bật Row Level Security (RLS) để bảo mật
-- Vì yêu cầu là mầm non, không quan tâm nhiều bảo mật, tạm cho public thao tác
-- ==========================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Cấp quyền ẩn danh (anon) đọc/ghi cho tất cả (chỉ dùng cho mục đích dễ phát triển ban đầu)
CREATE POLICY "Cho phép tất cả trên classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép tất cả trên students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép tất cả trên question_sets" ON public.question_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép tất cả trên questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép tất cả trên sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép tất cả trên answers" ON public.answers FOR ALL USING (true) WITH CHECK (true);

-- Cho phép Realtime cho bảng sessions (để presenter cập nhật theo scanner) và answers (để hiện điểm)
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.answers;
-- Bảng Quản lý Cài đặt (Settings chung cho App)
CREATE TABLE public.app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    app_name TEXT NOT NULL,
    app_subtitle TEXT NOT NULL,
    copyright_gv TEXT NOT NULL,
    copyright_class TEXT NOT NULL,
    copyright_school TEXT NOT NULL
);

-- Khởi tạo dữ liệu mặc định ban đầu
INSERT INTO public.app_settings (id, app_name, app_subtitle, copyright_gv, copyright_class, copyright_school)
VALUES (1, 'Lớp Học Vui Vẻ!', 'Chào cô giáo, hôm nay chúng ta chơi trò gì nào?', 'Nguyễn Thị Lan Hương', 'MGL A2', 'Trường mầm non Long Biên');

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép tất cả trên app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
