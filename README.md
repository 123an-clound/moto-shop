# MotoShop Vietnam

Website bán xe máy và xe điện theo `plan.md`, dùng Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui và Supabase.

## Chạy trên máy

Yêu cầu Node.js 22.9 trở lên (khuyến nghị Node.js 24 LTS).

```powershell
npm ci
npm run setup:local
npm run dev
```

- Website: http://localhost:3000
- Quản trị: http://localhost:3000/admin
- Tài khoản được tạo ngẫu nhiên trong `.local/ADMIN-ACCESS.txt`. Có thể đổi email/mật khẩu trong `.env.local`, sau đó khởi động lại dev server.
- `setup:local` giữ nguyên `.env.local` nếu file đã tồn tại.

Khi chưa cấu hình Supabase, chế độ **development** lưu thay đổi thật vào `.local/store.json`, ảnh tải lên vào `public/uploads`. Dữ liệu vẫn còn sau khi tải lại trang hoặc khởi động lại máy. Các file này và thông tin đăng nhập được loại khỏi Git. Sao lưu cả hai thư mục nếu cần giữ dữ liệu chỉnh sửa.

**Production yêu cầu Supabase để đăng nhập admin, nhận đơn và lịch hẹn.** Khi thiếu cấu hình, các thao tác ghi trả lỗi rõ ràng; website không báo đặt hàng thành công giả. Thay đổi trong dữ liệu local không tự chuyển sang Supabase.

## Những phần có thể chỉnh trong admin

1. **Sản phẩm:** tên, mô tả, hãng, loại xe/phụ kiện, giá gốc/khuyến mãi, trạng thái xuất bản, xe nổi bật, màu, ảnh và tồn kho theo màu.
2. **Thông số:** thêm/xóa từng thuộc tính và nhóm thông số. Các trường số riêng phục vụ bộ lọc cc, kW, kWh, quãng đường và chiều cao yên.
3. **Giao diện & cấu hình:** tên cửa hàng, màu, logo/favicon, top-bar, popup, thứ tự banner, các khối trang chủ, showroom/bản đồ, đánh giá khách hàng, thông tin nhận chuyển khoản, tỷ lệ cọc và lãi suất minh họa.
4. **Lịch lái thử:** xem thông tin khách và cập nhật trạng thái đến đã trải nghiệm/đã mua xe.
5. **Đơn đặt xe:** xác nhận, hoàn tất, hủy; xác nhận tiền đã nhận sau khi đối soát. Hủy đơn hoàn tồn kho đúng một lần. Không mở lại đơn đã hủy hoặc xóa dấu đã thanh toán.
6. **Tổng quan:** số đơn/lịch hẹn và biểu đồ giá trị đơn hoàn tất hoặc khoản cọc đã nhận, chia theo xe xăng/xe điện. Biểu đồ phân nhóm theo ngày tạo đơn, không thay thế sổ kế toán.

Ảnh tải lên: JPG, PNG, WebP hoặc AVIF, tối đa 5 MB/tệp. Có thể nhập nhiều URL ảnh, mỗi dòng một URL. Ảnh tải lên dùng Supabase Storage khi đã kết nối cloud; URL HTTPS bên ngoài được trình duyệt tải trực tiếp. Khối đánh giá chỉ hiện khi có nội dung và đã bật.

## Dữ liệu ban đầu

- 30 sản phẩm: 18 xe xăng và 12 xe điện thuộc Honda, Yamaha, VinFast, YADEA, Dat Bike.
- 71 biến thể màu, 98 ảnh WebP cục bộ, tổng khoảng 7,54 MiB. Mỗi sản phẩm có nguồn và ngày kiểm tra giá/thông số.
- Banner đầu trang có thêm bản AVIF cho desktop/mobile, tạo lại bằng `node scripts/build-hero-images.mjs` sau khi cập nhật ảnh gốc.
- Xem [danh sách nguồn và điều kiện giá](docs/catalog-sources.md). Chứng cứ gốc nằm trong `docs/research-*.json`.
- Giá theo đúng phiên bản được ghi trong tên; không phải giá bán đã được cửa hàng cam kết. Tồn kho **10 xe/màu là dữ liệu chạy thử**. Lãi suất 12%/năm và cọc 10% là giá trị khởi tạo, sửa được trong admin.
- Hotline, địa chỉ, tài khoản ngân hàng và đánh giá khách hàng để trống; showroom mặc định chỉ nhận yêu cầu tư vấn xác nhận địa điểm. Không tạo nhận xét hoặc số liệu doanh thu giả.
- Phụ kiện được hỗ trợ trong admin/catalog, chưa nhập phụ kiện mẫu.

## Kết nối Supabase để vận hành

Chọn một project Supabase riêng cho website. Không áp migration vào database đang dùng cho ứng dụng khác nếu chưa kiểm tra xung đột tên bảng.

1. Chạy file `supabase/migrations/20261006160152_initial_motoshop.sql` bằng SQL Editor của project, hoặc dùng Supabase CLI:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

2. Điền `.env.local` (trên hosting, dùng Environment Variables):

   ```dotenv
   NEXT_PUBLIC_SITE_URL=https://ten-mien-cua-ban.vn
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SECRET
   ```

   Hỗ trợ cả `NEXT_PUBLIC_SUPABASE_ANON_KEY` và `SUPABASE_SECRET_KEY`. Khóa service/secret chỉ được sử dụng phía máy chủ, không đặt tiền tố `NEXT_PUBLIC_`.

3. Nạp danh mục ban đầu:

   ```powershell
   npm run seed
   ```

   Lệnh từ chối ghi đè khi database đã có sản phẩm. Chỉ đặt `SEED_ALLOW_OVERWRITE=true` khi chủ động muốn thay dữ liệu sản phẩm/cấu hình bằng bản mẫu; không dùng sau khi đã chỉnh giá và tồn kho thật.

4. Tạo người dùng quản trị trong Supabase Authentication → Users, rồi cấp `app_metadata.role = admin` bằng Admin API hoặc SQL Editor. Ví dụ, thay email bên dưới bằng email chủ cửa hàng:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
     || '{"role":"admin"}'::jsonb
   where email = 'EMAIL_QUAN_TRI_CUA_BAN';
   ```

   Đăng nhập bằng email/mật khẩu của người dùng này. `user_metadata.role` do người dùng tự sửa không cấp quyền admin. Không đưa SQL cấp quyền vào frontend.

5. Khởi động lại website và kiểm tra admin hiển thị **Supabase**. Kiểm tra tải ảnh vào bucket `product-images`, đặt thử/hủy một đơn, xác nhận lịch hẹn trước khi mở bán.

RLS cho phép khách đọc sản phẩm đã xuất bản và cấu hình công khai. Đơn hàng/lịch hẹn không được đọc công khai; mọi biểu mẫu gửi qua API có validation, hạn mức yêu cầu và kiểm tra nguồn. Thao tác đặt xe/tồn kho/thanh toán dùng transaction. Admin có nút làm mới dữ liệu; hiện không đăng ký kênh Realtime.

Bản hiện tại tải tối đa 1.000 sản phẩm và 500 đơn/lịch hẹn mới nhất trong mỗi snapshot admin. Cần bổ sung phân trang và thống kê phía database nếu vận hành vượt quy mô này.

## VietQR / SePay

1. Trong admin, nhập BIN ngân hàng, số tài khoản và tên chủ tài khoản chính thức. Khi đủ thông tin, checkout mở phương thức đặt cọc chuyển khoản và tạo VietQR với đúng số tiền/mã đơn.
2. Tạo chuỗi bí mật ngẫu nhiên ít nhất 32 ký tự, lưu trong `SEPAY_WEBHOOK_SECRET` ở hosting.
3. Cấu hình SePay gọi `POST https://ten-mien-cua-ban.vn/api/payments/sepay`, xác thực bằng header `Authorization: Apikey <SEPAY_WEBHOOK_SECRET>`.
4. Webhook chỉ xác nhận tiền vào, đúng tài khoản đã lưu trong đơn, đủ tiền cọc, đúng mã đơn và chưa xử lý ID giao dịch đó. Hủy đơn đã chuyển tiền cần hoàn tiền/đối soát thủ công; ứng dụng không tự chuyển tiền hoàn.

COD là yêu cầu đặt xe để nhân viên xác nhận giao/nhận, không thu tiền tự động. Chưa có tài khoản SePay/ngân hàng thật được kết nối trong bản bàn giao.

## Build và kiểm tra

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Kiểm thử trình duyệt cần dev server local ở `http://127.0.0.1:3000`, chưa kết nối Supabase và đã chạy `setup:local`:

```powershell
npx playwright install chromium
npm run test:e2e
```

Các bài test tạo dữ liệu có tên “Kiểm thử E2E MotoShop” rồi dọn riêng dữ liệu đó. Không chạy trên cửa hàng đang nhận đơn thật. Báo cáo và ảnh tại `docs/artifacts`, Playwright trace lỗi trong `test-results`.

Kiểm thử database dùng Docker và stack **motoshop-vietnam** riêng ở cổng 57321/57322. Script từ chối mọi địa chỉ cloud hoặc cổng khác:

```powershell
npx supabase start
$motoInfo = npx supabase status -o json | ConvertFrom-Json
$env:NEXT_PUBLIC_SUPABASE_URL = $motoInfo.API_URL
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $motoInfo.ANON_KEY
$env:SUPABASE_SERVICE_ROLE_KEY = $motoInfo.SERVICE_ROLE_KEY
npm run test:db
```

Chạy các lệnh trên trong một cửa sổ terminal riêng; biến môi trường của terminal đó không dùng để khởi động dev server local JSON. Test database tạo/thay đổi tồn kho và đơn mẫu trong stack riêng, không phải lệnh seed phục vụ mở bán.

## Đưa lên hosting

Repository: https://github.com/123an-clound/moto-shop. Import vào Vercel hoặc hosting hỗ trợ Next.js, thiết lập các biến môi trường ở trên, build bằng `npm run build`. Chưa tạo deployment cloud trong lần bàn giao này.

- Cấu hình URL HTTPS thực cho canonical, OpenGraph, sitemap và robots. Khi dùng localhost/HTTP, site chủ động `noindex` và chặn crawl.
- Đặt URL/redirect đúng trong Supabase Auth. Giữ service role key ở phía server.
- Cập nhật tồn kho, giá, hotline, showroom, điều kiện giao/nhận, chính sách và thông tin thanh toán thật trước khi mở bán.
- Kiểm thử lại trên preview: đăng nhập, ảnh Storage, đơn hàng, webhook, SEO, hiệu năng qua mạng thực. Sau đó mới chuyển tên miền production.

Chi tiết kiến trúc: [docs/architecture.md](docs/architecture.md). Kết quả và giới hạn kiểm tra: [docs/verification.md](docs/verification.md).
