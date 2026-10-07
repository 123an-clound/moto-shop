# Master Instruction Blueprint for Codex / AI Coding Agent
**Project:** Website Bán Xe Máy & Xe Máy Điện (MotoShop Vietnam)  
**Repository target:** `https://github.com/123an-clound/moto-shop`  
**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Auth, Postgres, Storage, Realtime) + Shadcn UI + Lucide Icons.

---

## 🚨 NGUYÊN TẮC HOẠT ĐỘNG BẮT BUỘC (CRITICAL MANDATES)

1. **KHÔNG ĐƯỢC ĐOÁN MÒ (ZERO ASSUMPTION POLICY):**
   - Nếu có bất kỳ điểm nào chưa rõ về logic nghiệp vụ, UI/UX đặc thù, hoặc cấu trúc database ngoài tài liệu này, Codex **PHẢI** đặt câu hỏi trực tiếp cho người dùng trước khi tiến hành viết code.

2. **VÒNG LẶP TỰ KIỂM TRA & TỰ SỬA LỖI (SELF-TESTING & AUTO-REMEDIATION):**
   - Sau khi hoàn thành từng module hoặc toàn bộ dự án, Codex phải chạy các câu lệnh:
     - `npm run lint` (hoặc `pnpm lint`)
     - `npx tsc --noEmit` (Kiểm tra lỗi TypeScript)
     - `npm run build` (Xác nhận không lỗi khi Build Production)
   - Nếu xảy ra bất kỳ lỗi nào (Type mismatch, missing exports, CSS broken, Hydration mismatch, RLS violation), Codex **phải tự đọc log lỗi, sửa code và chạy lại kiểm tra** cho đến khi 100% không còn lỗi.

3. **TỰ ĐỘNG COMMIT VÀ PUSH LÊN GITHUB:**
   - Khởi tạo repository local, liên kết tới `https://github.com/123an-clound/moto-shop`.
   - Commit code lần đầu với commit message chuyên nghiệp (ví dụ: `feat: initial project setup with Supabase, store front, and advanced admin panel`).
   - Push toàn bộ code chuẩn chỉnh lên nhánh `main`.

---

## 🌐 QUY CHUẨN THIẾT KẾ VÀ TRẢI NGHIỆM NGHỆ THUẬT (UI/UX)

- **Định hướng giao diện:** Hiện đại, sang trọng, thể hiện tính cơ khí và công nghệ (Dark/Light mode linh hoạt, tông màu chủ đạo Accent Red / Neon Electric Blue tùy theo xe xăng hay xe điện).
- **Đáp ứng đa thiết bị (Responsive Design):** 
  - Tối ưu hoàn hảo 100% cho Mobile (touch targets > 48px, bottom navigation bar cho mobile view), Tablet, Laptop và màn hình Ultrawide Desktop.
  - Sử dụng layout Grid/Flexbox linh hoạt, ngăn chặn hiện tượng vỡ khung, tràn ngang (horizontal overflow) trên điện thoại.
- **Tối ưu hóa thị trường Việt Nam:**
  - Định dạng tiền tệ VND (`120.000.000 đ`).
  - Tùy chọn xe theo phân khối (cc) cho xe xăng và công suất motor (kW) / dung lượng pin (kWh) cho xe máy điện.
  - Tích hợp công cụ **Tính chi phí trả góp (Installment Calculator)** và **Đăng ký lái thử (Test Ride Booking)**.

---

## 🛠 HỆ THỐNG TÍNH NĂNG CHI TIẾT (SYSTEM REQUIREMENTS)

### 1. Trang Bán Hàng (Storefront / Client Side)
- **Trang chủ (Homepage):**
  - Banner Slider (được quản lý động từ Supabase).
  - Phân loại nhanh: Xe Xăng vs. Xe Máy Điện.
  - Danh sách Xe Nổi Bật / Khuyến Mãi HOT.
  - Hệ thống Showroom & Bản đồ hỗ trợ mua hàng.
  - Khối tin tức & Đánh giá từ khách hàng.
- **Trang Danh Mục & Lọc Sản Phẩm (Catalog & Filter):**
  - Bộ lọc đa chiều: Hãng xe, Mức giá, Dung tích xi-lanh (cc), Công suất pin (kW), Tầm hoạt động (Km/lần sạc), Chiều cao yên, Phanh ABS/CBS.
  - Sắp xếp: Giá tăng/giảm, Mới nhất, Bán chạy nhất.
- **Trang Chi Tiết Sản Phẩm (Product Detail Page):**
  - Bộ sưu tập ảnh & Màu sắc (Color variants Changer - đổi màu xe đổi hình ảnh tương ứng).
  - Bảng thông số kỹ thuật chuyên sâu (Specs Sheet) dạng Accordion/Tabs.
  - Công cụ tính tiền trả góp linh hoạt (Số tiền trả trước, Kỳ hạn 6/12/24 tháng, Lãi suất dự kiến).
  - Form **Đăng ký lái thử** chọn Showroom & Ngày giờ.
  - Xe tương tự & Phụ kiện đi kèm.
- **Giỏ hàng & Đặt hàng (Cart & Checkout):**
  - Đặt xe trực tuyến / Đặt cọc giữ xe.
  - Tích hợp phương thức thanh toán chuyển khoản ngân hàng qua VietQR / SePay tự động sinh mã QR + Ship COD.
  - Tra cứu đơn hàng theo Số điện thoại / Mã đơn hàng.

### 2. Trang Quản Trị Chuyên Sâu (Advanced Admin Dashboard)
Trang Admin kết nối trực tiếp với Supabase, cho phép can thiệp sâu:
- **Quản lý Giao diện & Nội dung (Site Config & Visual Builder):**
  - Đổi màu chủ đạo trang web (Primary Theme Color), logo, favicon.
  - Quản lý Banner Quảng cáo, Pop-up khuyến mãi, Thanh thông báo top-bar.
  - Bật/Tắt các block hiển thị trên Trang chủ.
- **Quản lý Sản phẩm & Thông số Kỹ thuật (Product & Dynamic Specs):**
  - Thêm/Sửa/Xóa xe máy & xe điện.
  - Tùy chỉnh danh mục thông số kỹ thuật động (Thêm thuộc tính như: Loại Động Cơ, Công Suất Tối Đa, Dung Tích Bình Xăng, Dung Lượng Pin, Thời Gian Sạc, Độ Rộng Cốp, Trọng Lượng...).
  - Upload ảnh nhiều biến thể màu sắc trực tiếp lên **Supabase Storage Bucket** (`product-images`).
- **Quản lý Lịch Đăng Ký Lái Thử & Dẫn Khách (Leads & Test Drive):**
  - Bảng Kanban / Table quản lý danh sách khách đăng ký lái thử, cập nhật trạng thái (Chờ xác nhận, Đã trải nghiệm, Đã mua xe, Hủy).
- **Quản lý Đơn Hàng & Doanh Thu:**
  - Biểu đồ thống kê doanh số theo ngày/tần suất bán xe điện vs xe xăng.
  - Xử lý trạng thái đặt cọc / đơn hàng.

---

## 🗄 MÔ HÌNH DỮ LIỆU SUPABASE (DATABASE SCHEMA)

Codex hãy tạo file migration hoặc thực thi SQL trên Supabase theo cấu trúc cơ sở dữ liệu mẫu sau:

```sql
-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES (Xe Xăng, Xe Điện, Phụ Kiện, v.v.)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('gasoline', 'electric', 'accessory')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  price_original NUMERIC NOT NULL,
  price_sale NUMERIC,
  is_electric BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  in_stock BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCT VARIANTS (Màu sắc, hình ảnh cụ thể)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  image_urls TEXT[] NOT NULL,
  stock_quantity INT DEFAULT 10
);

-- 4. SPECIFICATIONS (Thông số kỹ thuật động)
CREATE TABLE specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  spec_key TEXT NOT NULL,   -- e.g., "Dung tích xi-lanh", "Dung lượng Pin", "Quãng đường/sạc"
  spec_value TEXT NOT NULL, -- e.g., "155 cc", "72V - 22Ah", "198 km"
  group_name TEXT DEFAULT 'Thông số chung' -- e.g., 'Động cơ', 'Kích thước', 'Pin & Sạc'
);

-- 5. TEST DRIVES (Đăng ký lái thử)
CREATE TABLE test_drives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  preferred_date DATE NOT NULL,
  preferred_location TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SITE SETTINGS (Quản lý giao diện động từ Admin)
CREATE TABLE site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'MotoShop Việt Nam',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#EF4444',
  hero_banners JSONB DEFAULT '[]'::jsonb,
  contact_phone TEXT,
  address TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- POLICIES (Ví dụ cơ bản: Public Read, Auth Admin Write)
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Public Read Specs" ON specifications FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public Insert Test Drive" ON test_drives FOR INSERT WITH CHECK (true);
```

---

## ⚡ YÊU CẦU KỸ THUẬT VÀ HIỆU NĂNG (TECHNICAL & QUALITY STANDARDS)

1. **Hiệu năng & Core Web Vitals:**
   - Dùng `<Image>` từ `next/image` kết hợp Supabase Image Loader/CDN.
   - Sử dụng React Server Components (RSC) mặc định cho các trang hiển thị dữ liệu tĩnh/SEO.
   - Code-splitting và dynamic imports cho các thành phần nặng (như Modal, Charts ở Admin).
2. **Bảo mật & RLS:**
   - Supabase Service Role Key KHÔNG ĐƯỢC để lộ ở Client Side. Chỉ dùng Anon Key trên frontend.
   - Toàn bộ form submit phải sử dụng Zod Schema Validation.
   - Phân quyền Admin kỹ lưỡng qua Supabase Auth + Metadata / RLS Policy.
3. **SEO & Metadata:**
   - Dynamic Metadata cho từng trang chi tiết sản phẩm (Title, Description, OpenGraph Image cho Zalo/Facebook sharing).
   - Tích hợp JSON-LD Structured Data cho Sản phẩm (`Product` schema) để hiển thị đẹp trên Google Search.

---

## 📋 NGUYÊN TẮC THỰC THI CHO CODEX (STEP-BY-STEP WORKFLOW)

- **Bước 1:** Khai báo và cài đặt môi trường Next.js, Tailwind CSS, Shadcn UI, và `@supabase/supabase-js`, `@supabase/ssr`.
- **Bước 2:** Cấu hình Client Supabase (`utils/supabase/client.ts` và `server.ts`).
- **Bước 3:** Tạo Cấu trúc thư mục dự án chuẩn hóa (`/app`, `/components/ui`, `/components/storefront`, `/components/admin`, `/types`, `/lib`).
- **Bước 4:** Xây dựng Storefront UI (Homepage, Product Catalog, Product Detail với bộ chọn màu sắc và tính trả góp).
- **Bước 5:** Xây dựng Admin Panel (CRUD Sản phẩm, CRUD Banners, Cấu hình giao diện, Quản lý lịch hẹn lái thử).
- **Bước 6:** Chạy Vòng lặp Kiểm tra lỗi (`lint`, `tsc`, `build`).
- **Bước 7:** Khởi tạo Git repository, kết nối remote `https://github.com/123an-clound/moto-shop`, thực hiện commit và push lên nhánh `main`.