<div align="center">

# 🏨 NoWayHome

**Nền tảng đặt phòng khách sạn đa nền tảng (Web & Mobile) — Đồ án môn học.**

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18%20%2F%2019-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey?style=flat-square)](LICENSE)

**[✨ Tính năng](#-tính-năng) • [🚀 Quick Start](#-quick-start) • [🧪 Kiểm thử & E2E](#-kiểm-thử--xác-thực-chất-lượng) • [❓ FAQ](#-faq)**

</div>

---

## ✨ Tính năng

| Phân hệ | Vai trò | Chức năng chính |
| ------- | ------- | --------------- |
| **Mobile App (Expo)** | Khách hàng | Khám phá chỗ ở, lọc theo tiêu chí, xem chi tiết phòng, áp dụng mã voucher, đặt phòng & thanh toán demo, quản lý chuyến đi, đánh giá chỗ ở. |
| **Web Customer** | Khách hàng | Đăng ký, đăng nhập, tìm kiếm khách sạn theo khu vực, xem bảng giá và đặt phòng trực tuyến. |
| **Web Partner** | Đối tác | Đăng ký chỗ nghỉ, quản lý loại phòng, cấu hình bảng giá `DailyRate`, quản lý đơn đặt phòng, tạo mã khuyến mãi & voucher. |
| **Web Admin** | Quản trị viên | Dashboard thống kê doanh thu, duyệt/từ chối đối tác, quản lý người dùng, quản lý voucher hệ thống, kiểm duyệt đánh giá. |
| **Backend API** | Hệ thống lõi | NestJS 11 + Prisma ORM, phân quyền RBAC, JWT session revocation, inventory locking chống đặt trùng phòng, E2E database testing. |

> [!NOTE]
> Tính năng thanh toán được thiết kế dưới dạng **Demo Simulation** phục vụ bảo vệ đồ án môn học. Hệ thống không lưu trữ thẻ thật, không kết nối cổng thanh toán thương mại thật và không phát sinh chi phí giao dịch.

---

## 🚀 Quick Start

### 1. Yêu cầu môi trường

- **Node.js**: >= 20.x (khuyên dùng 22.x)
- **pnpm**: >= 10.x (khuyên dùng 11.x)
- **Docker Desktop**: Cần bật sẵn để chạy PostgreSQL container

```powershell
node --version
pnpm --version
docker --version
```

### 2. Thiết lập cấu hình

Cài đặt package và sao chép cấu hình môi trường:

```powershell
pnpm install
copy backend\.env.example backend\.env
```

Nội dung tối thiểu tại `backend/.env`:

```env
DATABASE_URL="postgresql://nowayhome:nowayhome@127.0.0.1:5433/nowayhome?schema=public"
JWT_ACCESS_SECRET="nowayhome_super_secure_access_secret_demo_key_2026"
JWT_REFRESH_SECRET="nowayhome_super_secure_refresh_secret_demo_key_2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
DEMO_PAYMENTS_ENABLED=true
CORS_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost:5175"
```

---

### 3. Khởi tạo Database & Dữ liệu mẫu

> [!TIP]
> Bạn có thể chạy tự động toàn bộ quy trình: Khởi động Docker, migrate schema, nạp dữ liệu seed và chạy kiểm thử tự động chỉ với **1 lệnh duy nhất**:
> ```powershell
> .\setup-and-verify.bat
> ```

Hoặc thực hiện thủ công từng bước:

```powershell
# Khởi động PostgreSQL Docker container (port 5433)
docker compose -f backend/docker-compose.yml up -d postgres

# Sinh Prisma Client
pnpm --filter backend exec prisma generate --schema prisma/schema.prisma

# Triển khai schema lên database
pnpm --filter backend exec prisma migrate deploy --schema prisma/schema.prisma

# Nạp dữ liệu mẫu
pnpm --filter backend run seed
```

#### 🔑 Tài khoản Demo sẵn có (Mật khẩu: `Password123!`):

| Vai trò | Email đăng nhập | Quyền hạn |
| ------- | --------------- | --------- |
| **Quản trị viên (Admin)** | `admin@nowayhome.local` | Toàn quyền quản trị hệ thống, duyệt đối tác, xem doanh thu |
| **Đối tác (Partner)** | `partner@nowayhome.local` | Quản lý khách sạn, cấu hình phòng, giá và voucher |
| **Khách hàng (Customer)** | `customer@nowayhome.local` | Tìm kiếm phòng, đặt phòng, áp mã voucher, đánh giá |

---

### 4. Khởi chạy Ứng dụng

> [!TIP]
> Để mở toàn bộ các ứng dụng (Backend + 3 Web Portals + Expo Mobile) cùng lúc, hãy chạy script:
> ```powershell
> .\start-all.bat
> ```

Hoặc khởi chạy từng ứng dụng trên các cửa sổ terminal riêng biệt:

```powershell
# 1. Backend API (Port 3001)
pnpm --filter backend run start:dev

# 2. Web Admin (Port 5173)
pnpm --filter webadmin run dev

# 3. Web Partner (Port 5174)
pnpm --filter webpartner run dev

# 4. Web Customer (Port 5175)
pnpm --filter fe-web-user run dev

# 5. Mobile App (Port 8081)
cd mobile-app
npx expo start
```

#### 🌐 Danh sách địa chỉ truy cập:

| Ứng dụng | Địa chỉ URL | Mô tả |
| -------- | ----------- | ----- |
| **Web Admin** | http://localhost:5173 | Cổng quản trị hệ thống |
| **Web Partner** | http://localhost:5174 | Cổng đối tác khách sạn |
| **Web Customer** | http://localhost:5175 | Cổng web khách hàng |
| **Backend API Docs** | http://localhost:3001/api-docs | Swagger API Documentation |
| **Health Check** | http://localhost:3001/api/healthz | API kiểm tra trạng thái máy chủ & DB |
| **Mobile Expo** | http://localhost:8081 | Giao diện phát triển Expo Metro |

---

## 🧪 Kiểm thử & Xác thực chất lượng

Dự án trang bị bộ kiểm thử tự động toàn diện từ Unit Test đến E2E Database Test:

```powershell
# 1. Chạy Backend Unit Tests (12 tests)
pnpm --filter backend run test

# 2. Chạy E2E Tests trên PostgreSQL thật (Database test riêng biệt)
$env:TEST_DATABASE_URL="postgresql://nowayhome:nowayhome@127.0.0.1:5433/nowayhome_test?schema=public"
pnpm --filter backend run test:e2e:prepare
pnpm --filter backend run test:e2e

# 3. Kiểm tra TypeScript & Linting
pnpm --filter backend run typecheck
pnpm --filter nowayhome-web run typecheck
npm --prefix mobile-app run lint
npm --prefix mobile-app run typecheck

# 4. Kiểm tra Build Production toàn bộ Web Apps
pnpm run build:web
```

---

## 🧱 Cấu trúc Dự án

```text
pj-appR/NoWayHomee/
├── backend/                  # NestJS 11 REST API
│   ├── prisma/               # Schema Prisma, migrations, seed data
│   ├── src/                  # Modules: auth, bookings, properties, payments, vouchers, ...
│   ├── test/e2e/             # Bộ kiểm thử E2E tích hợp PostgreSQL thật
│   └── docker-compose.yml    # Docker cấu hình PostgreSQL 16
├── web/
│   └── apps/
│       ├── admin/            # React + Vite (Cổng Admin)
│       ├── partner/          # React + Vite (Cổng Partner)
│       └── customer/         # React + Vite (Cổng Customer)
├── mobile-app/               # React Native + Expo SDK 54 (Mobile Khách hàng)
├── setup-and-verify.bat      # Script 1-click kiểm tra toàn diện hệ thống
├── start-all.bat             # Script khởi động tự động toàn bộ ứng dụng
└── stop-all.bat              # Script dừng an toàn mọi tiến trình
```

---

## 🛡️ Quy tắc Kiến trúc & An toàn Dữ liệu

- **Kiểm soát Tồn kho Nghiêm ngặt (Concurrency Safety)**: Đặt phòng áp dụng cơ chế khóa bi quan (`FOR UPDATE`) trên bảng `daily_rates` và cập nhật có điều kiện trên bảng khuyến mãi để ngăn chặn 100% tình trạng over-booking và vượt giới hạn voucher khi nhiều người bấm cùng lúc.
- **Cô lập Database Kiểm thử (Database Isolation)**: E2E Tests sử dụng database riêng `nowayhome_test`. Script kiểm tra an toàn sẽ lập tức từ chối chạy nếu URL không chứa đúng hậu tố `nowayhome_test`, đảm bảo không bao giờ ảnh hưởng dữ liệu demo `nowayhome`.
- **Bảo mật Phiên làm việc (Session Revocation)**: JWT access token được liên kết với `sessionId`. Khi người dùng đăng xuất, session bị thu hồi và token tương ứng lập tức vô hiệu hóa trên toàn hệ thống.
- **CORS & Whitelist**: Chỉ các origin được khai báo rõ ràng trong `CORS_ORIGINS` mới được phép gửi cookie và thông tin chứng thực.

---

## 🔒 Báo cáo An toàn & Phụ thuộc (Security & Dependency Audit)

- **Backend & Web**: Cây phụ thuộc dùng `pnpm`; kiểm tra chất lượng chạy trong CI.
- **Mobile Expo**: `npm audit --omit=dev` ngày 2026-10-18 báo 49 cảnh báo transitive (1 critical, 31 high, 16 moderate, 1 low), chủ yếu qua Expo CLI/Metro/Babel. `npm audit fix --force` đề xuất hạ `expo` xuống `44.0.6`, không tương thích Expo SDK 54 nên không áp dụng.
- **Kiểm tra hiện tại**: `npm run lint` và `npm run typecheck` trong `mobile-app` đều pass. Cập nhật Expo SDK chỉ thực hiện theo lộ trình tương thích chính thức, rồi chạy lại `npm audit --omit=dev`.

---

## ❓ FAQ

<details>
<summary><b>1. Làm thế nào để reset lại toàn bộ dữ liệu về trạng thái ban đầu?</b></summary>
<br>
Chỉ cần chạy lệnh:
<code>pnpm --filter backend run seed</code>
Script sẽ làm mới và tái tạo lại các tài khoản mẫu, khách sạn, phòng và voucher mặc định.
</details>

<details>
<summary><b>2. Tại sao Docker PostgreSQL sử dụng cổng 5433 thay vì 5432?</b></summary>
<br>
Cổng 5433 được sử dụng để tránh xung đột với các dịch vụ PostgreSQL cục bộ đã được cài đặt sẵn trên máy tính của người chấm/thành viên khác, đảm bảo dự án chạy ổn định mà không yêu cầu gỡ cài đặt phần mềm có sẵn.
</details>

<details>
<summary><b>3. Làm sao để kiểm tra nhanh luồng đặt phòng và thanh toán?</b></summary>
<br>
Đăng nhập tài khoản Customer (<code>customer@nowayhome.local</code>), chọn khách sạn <i>Khách sạn Hà Nội Luxury & Spa</i>, chọn ngày, nhập voucher <code>SUMMER2026</code> và bấm <i>Xác nhận thanh toán demo</i>. Đơn đặt phòng sẽ lập tức chuyển sang trạng thái <b>Confirmed (Đã thanh toán)</b>.
</details>

---

## 🛠️ Công nghệ sử dụng

- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL 16, Jest, Supertest, Swagger.
- **Web Applications**: React, Vite, Tailwind CSS, TanStack Query, Lucide Icons, Recharts.
- **Mobile Application**: React Native, Expo Router, Zustand, Axios, Expo SecureStore.
- **DevOps & Tooling**: Docker, pnpm workspace, GitHub Actions CI.

---

## 📄 License

`UNLICENSED` — Dự án được phát triển phục vụ mục đích học tập và bảo vệ đồ án môn học.
