# EMR Backend (Scaffold)

This folder contains the scaffold for the EMR backend using Clean Architecture.

Projects:
- Api/ (ASP.NET Core Web API entry)
- Application/ (use cases, DTOs, interfaces)
- Domain/ (entities, enums, value objects)
- Infrastructure/ (EF Core DbContext, repositories, migrations)

How to run (dev):
1. Open solution in Visual Studio or use dotnet CLI.
2. From Infrastructure run: dotnet ef migrations add InitialCreate && dotnet ef database update
3. Run Api project (dotnet run)

Notes:
- This scaffold includes sample entities and a minimal DbContext.
- Add secrets/config for JWT, connection string, and file storage path.

## 1. Tổng quan
Hệ thống: Medical Equipment Management System (EMR)  
Backend: .NET Core Web API  
Kiến trúc: Clean Architecture + API-first  
Database: SQLite  

Mục tiêu:
- Quản lý vòng đời thiết bị y tế
- Chuẩn hóa dữ liệu (3NF)
- Theo dõi lịch sử & audit
- Hỗ trợ báo cáo & cảnh báo

---

## 2. Nguyên tắc thiết kế

### Dữ liệu
- Không lưu dữ liệu lặp
- Không lưu dữ liệu suy diễn
- Không update đè dữ liệu lịch sử
- Soft delete (IsDeleted)
- Mọi thay đổi phải có Audit Log

### Phân loại dữ liệu
- Master Data: danh mục
- Transaction Data: nghiệp vụ
- Audit Data: log thay đổi

---

## 3. Kiến trúc code

### Layers
- Domain
- Application
- Infrastructure
- API

### Quy tắc
- Business logic nằm ở Application
- Không để logic trong Controller
- Repository pattern + Unit of Work
- DTO riêng, không expose entity

---

## 4. Module chính

- Device Management
- Maintenance & Repair
- Calibration
- Transfer
- Document
- Report
- Alert
- Category
- User & RBAC

---

## 5. Nguyên tắc API

- RESTful
- Versioning: /api/v1/
- Response chuẩn:
{
"success": true,
"data": {},
"message": "",
"errors": []
}


- Validate input bắt buộc
- Không trả về dữ liệu dư thừa

---

## 6. Quy tắc nghiệp vụ

- Không xóa vật lý
- Không sửa lịch sử
- Trạng thái thiết bị = suy ra từ transaction
- Đang sửa → không cho điều chuyển
- Không xóa điều chuyển khi đã hoàn tất

---

## 7. WORKFLOW NGHIỆP VỤ

### 1. Lifecycle thiết bị
- IN_STOCK → ALLOCATED → IN_USE → INACTIVE → DISPOSED

### 2. Event phát sinh
- Maintenance (lặp)
- Repair (khi hỏng)
- Calibration (định kỳ)
- Transfer (thay đổi vị trí)

---

### 3. Quy trình điều chuyển
REQUESTED → APPROVED → TECHNICAL_CHECKED → IN_PROGRESS → RECEIVED → COMPLETED

---

### 4. Quy trình sửa chữa
CREATED → ACCEPTED → ASSIGNED → IN_PROGRESS → COMPLETED

---

### 5. Quy trình bảo trì
PLANNED → IN_PROGRESS → COMPLETED

---

## 8. Bảo mật

- RBAC (Role-based access control)
- Phân quyền theo API
- Log user actions

---

## 9. Hiệu năng

- Response < 2s
- Hỗ trợ ≥ 10.000 thiết bị
- Pagination bắt buộc

---

## 10. Logging & Audit

- Log tất cả CRUD
- Lưu:
  - UserId
  - Action
  - Timestamp
  - Old/New data

---

## 11. Coding Convention

- SOLID
- Async/await
- Clean code
- Naming rõ ràng
- Không hardcode

---

## 12. Khi generate code

Claude cần:
- Tuân thủ Clean Architecture
- Viết service + interface
- Có validation
- Có logging
- Không viết logic trong controller