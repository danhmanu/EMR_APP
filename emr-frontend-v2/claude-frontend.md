# Frontend Specification (EMR)

## 1. Tổng quan
Frontend: ReactJS , Typescript
Mục tiêu:
- UI rõ ràng, dễ sử dụng
- Quản lý thiết bị và nghiệp vụ
- Hiển thị báo cáo & cảnh báo

---

## 2. Nguyên tắc thiết kế

- Component-based
- Tách logic & UI
- Reusable components
- Không gọi API trực tiếp trong UI component

---

## 3. Cấu trúc

- pages/
- components/
- services/ (API)
- hooks/
- utils/
- constants/

---

## 4. Module UI

- Dashboard
- Device Management
- Maintenance 
- Repair
- Calibration
- Transfer
- Document
- Report
- Alert
- Category (Compamy, Country, Department, DeviceType, DeviceStatus)
- User Management

---

## 5. State Management

- Ưu tiên:
  - React Query / TanStack Query (API state)
  - useState/useReducer (local state)

---

## 6. API Integration

- Tách file service
- Không gọi API trực tiếp trong component
- Handle:
  - loading
  - error
  - empty state

---

## 7. UI/UX Rules

- Form validate đầy đủ
- Hiển thị trạng thái rõ ràng:
  - Đang sửa
  - Đang điều chuyển
  - Hỏng
- Confirm trước khi hành động quan trọng
- Table có:
  - search
  - filter
  - pagination

---

## 8. Quy tắc nghiệp vụ UI

- Không cho thao tác sai rule:
  - Đang sửa → disable điều chuyển
- Không hiển thị action không hợp lệ
- Trạng thái lấy từ backend, không tự tính

---

## 9. Bảo mật

- Ẩn UI theo role
- Không hardcode quyền
- Token-based auth

---

## 10. Hiệu năng

- Lazy loading
- Memoization khi cần
- Tránh re-render không cần thiết

---

## 11. Coding Convention

- Functional component
- Custom hooks cho logic dùng lại
- Không viết logic phức tạp trong JSX
- Tên biến rõ ràng

---

## 12. Khi generate code

Claude cần:
- Tạo component rõ ràng
- Tách API service riêng
- Có loading + error state
- Viết code dễ maintain
- Không viết code rối trong JSX