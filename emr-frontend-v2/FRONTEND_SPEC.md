Phần mềm Quản lý Thiết bị Y tế (EMR) - Frontend Specification

I. Mục tiêu
- Quản lý toàn bộ vòng đời thiết bị y tế.
- Chuẩn hóa dữ liệu, tránh trùng lặp.
- Theo dõi lịch sử sử dụng, bảo trì, sửa chữa.
- Hỗ trợ ra quyết định (báo cáo, cảnh báo).

II. Kiến trúc & Công nghệ
- React + TypeScript (Vite)
- Ant Design UI
- Axios (api wrapper), react-router-dom
- File structure: /src/pages, /src/components, /src/services, /src/models, /src/utils
- API-first: backend .NET Core Web API (ở dev: http://localhost:5000, endpoints /api/v1/...)

III. Nguyên tắc thiết kế (luôn tuân theo)
- Chuẩn hóa dữ liệu: 3NF, no duplication, FK cho liên kết.
- Không cập nhật đè dữ liệu lịch sử; mọi thay đổi phải có log.
- Phân quyền RBAC: ẩn/khóa UI theo role.
- API-first & module hóa: components tái sử dụng, services cho mọi call HTTP.
- Performance: server-side pagination, lazy-load lists lớn.
- Accessibility & responsivity cơ bản.

IV. Chức năng ưu tiên
1. Authentication (login/logout/token) — token lưu localStorage (dev token khi dev).
2. Dashboard: KPI cards, charts, alerts.
3. Devices: list, search, pagination, view, edit, import/export.
4. Maintenance & Repairs: plans, execution, history.
5. Calibrations, Transfers, Documents, Reports.

V. Acceptance Criteria (frontend)
- CRUD thiết bị hoạt động chính xác.
- Lịch sử thay đổi được lưu và hiển thị.
- Không trùng dữ liệu khi import (basic validation).
- Báo cáo / cảnh báo hoạt động và hiển thị đúng.
- Hiệu năng: load page phổ biến < 2s (khi backend đáp ứng).

VI. Dev conventions
- Model used when complex tasks start: openai/gpt-5-mini.
- Environment variables: VITE_API_BASE, VITE_DEV_TOKEN, VITE_AUTO_LOGIN.
- Dev shortcut: dev token auto-inject only in dev index.html or via login button.

VII. Notes
- This spec is the canonical frontend design and should be followed for UI/UX, data handling and acceptance tests.

