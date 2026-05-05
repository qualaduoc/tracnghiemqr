# Project Plan: QR Quiz App cho Mầm Non

## 1. Overview (Tổng quan)
- **Mục tiêu:** Xây dựng ứng dụng trắc nghiệm lớp học bằng cách quét mã thẻ (Plickers-style).
- **Đối tượng sử dụng:** Giáo viên (quản lý, quét mã) và Học sinh mầm non (cầm thẻ vật lý).
- **Project Type:** WEB (Next.js/React) hoặc Hybrid Mobile.
- **Core Value:** Tăng tương tác lớp học không cần trang bị thiết bị cho học sinh.

## 2. Success Criteria (Tiêu chí thành công)
- Giáo viên có thể tạo danh sách học sinh và sinh mã thẻ tự động.
- Camera quét được đồng thời ít nhất 10-20 mã trong lớp, nhận diện được góc xoay (A, B, C, D) với độ trễ thấp (<1s).
- Lưu kết quả tức thì vào Supabase, có bảng xếp hạng.
- Giao diện mầm non: To, rõ, màu sắc sinh động, âm thanh vui nhộn.

## 3. Tech Stack (Công nghệ đề xuất)
- **Frontend/UI:** Next.js (Web), Tailwind CSS (ưu tiên màu tươi sáng). Framer Motion (Animation động).
- **Backend/DB:** Supabase (PostgreSQL) - Auth & Database. Realtime cho việc bắn tín hiệu từ Mobile lên Màn hình lớn.
- **Computer Vision (Quét mã):** JS-ArUco hoặc OpenCV.js để quét ArUco markers (tốt hơn QR truyền thống).
- **Hosting:** Vercel (Frontend).

## 4. File Structure (Cấu trúc dự kiến)
```text
project-root/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Đăng nhập giáo viên
│   │   ├── dashboard/          # Quản lý lớp, câu hỏi
│   │   ├── presenter/          # Chế độ trình chiếu màn hình lớn
│   │   └── scanner/            # Giao diện camera quét cho mobile
│   ├── components/
│   │   ├── common/
│   │   ├── quiz/
│   │   └── scanner/
│   ├── hooks/
│   │   └── useArUcoScanner.ts  # Logic quét camera
│   ├── services/
│   │   └── supabaseClient.ts
│   └── utils/
│       └── markerGenerator.ts  # Logic sinh mã thẻ in
```

## 5. Task Breakdown (Chi tiết công việc)

| Task ID | Tên Task | Agent | Skills | Dependencies | Priority | Verify |
|---------|----------|-------|--------|--------------|----------|--------|
| T1 | Khởi tạo Supabase Schema (Users, Classes, Students, Questions, Sessions, Answers) | database-architect | database-design | None | P0 | Schema tạo thành công trên Supabase |
| T2 | Xây dựng UI Quản lý (CRUD Lớp, Học sinh, Bộ câu hỏi) | frontend-specialist | frontend-design | T1 | P1 | Có thể thêm/sửa/xóa câu hỏi và học sinh |
| T3 | Logic Sinh mã thẻ (ArUco/Custom QR) & Chức năng In (Print View) | frontend-specialist | clean-code | T2 | P1 | Xuất file PDF/in ra khổ A4 chứa mã thẻ |
| T4 | Chế độ Presenter (Màn hình chiếu): Hiển thị câu hỏi, kết nối Realtime | frontend-specialist | web-design-guidelines | T2 | P2 | Nhận tín hiệu chuyển câu hỏi, hiện giao diện cute |
| T5 | Tính năng Scanner (Camera Mobile): Quét ArUco, nhận diện góc xoay, chấm điểm | frontend-specialist | webapp-testing | T3, T4 | P2 | Quét thẻ qua webcam ra kết quả A/B/C/D chính xác |
| T6 | Xử lý âm thanh & UI/UX Polish (Animation, Màu sắc mầm non) | frontend-specialist | ui-ux-pro-max | T4, T5 | P3 | Giao diện thu hút, có âm thanh tương tác |

## 6. Phase X: Verification
- [ ] Logic Realtime đồng bộ giữa Scanner và Presenter.
- [ ] Độ chính xác của Camera Scanner khi ánh sáng kém.
- [ ] Lighthouse Performance / SEO.
- [ ] Code tuân thủ Rule 14 nguyên tắc Code Architecture.
