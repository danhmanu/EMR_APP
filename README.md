# EMR GIADINH

Phan mem benh an dien tu EMR GIADINH duoc dung tren core EMR, giu lai cac chuc nang nen tang cua he thong:

- Dang nhap, JWT auth
- Tai khoan nguoi dung
- Vai tro, menu va phan quyen
- Backend .NET 8 + MySQL
- Frontend Vite, React, Ant Design
- Database local: `giadinhemr`

Mac dinh backend se migrate/seed core tables de login va phan quyen hoat dong, dong thoi tao/seed cac bang EMR: `emr_patients`, `emr_encounters`, `emr_orders`, `emr_documents`.

Background jobs nghiep vu thiet bi cua EMR duoc tat mac dinh bang `Application:EnableEmrBackgroundJobs=false`.

## Chay backend

API co the tu tao database `giadinhemr` neu user MySQL co quyen. Neu can tao thu cong:

```sql
CREATE DATABASE IF NOT EXISTS giadinhemr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Chay API:

```powershell
cd "F:\2026 WORK\EMR_APP\EMR-backend\src\API"
dotnet run --environment Development --urls http://localhost:5000
```

Tai khoan seed mac dinh:

```text
Username: admin
Password: admin
```

## Chay frontend

```powershell
cd "F:\2026 WORK\EMR_APP\emr-frontend-v2"
npm run dev
```

Mo `http://localhost:5173`.

Co the reset rieng du lieu EMR mau bang [database/reset-giadinh-emr.sql](</F:/2026 WORK/EMR_APP/database/reset-giadinh-emr.sql>). Script nay chi reset cac bang `emr_*`; cac bang tai khoan, vai tro va phan quyen se duoc backend migrate/seed khi khoi dong.
