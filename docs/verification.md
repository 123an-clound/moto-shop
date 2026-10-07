# Kết quả kiểm tra MotoShop

Ngày kiểm tra: **07/10/2026**. Môi trường: Windows, Node.js 24.15.0, Chromium, Next.js production build và Supabase Docker riêng cho MotoShop. Chưa triển khai cloud.

## Chức năng và dữ liệu

| Kiểm tra | Kết quả |
| --- | --- |
| ESLint, TypeScript, production build | Đạt |
| Vitest | 17 bài kiểm thử đạt |
| Playwright Chromium | 6 kịch bản đầu-cuối đạt |
| Supabase Postgres/Auth/Storage cục bộ | Kiểm thử tích hợp đạt |
| 30 trang sản phẩm và 98 ảnh danh mục | HTTP 200; trang sản phẩm có tên và JSON-LD |
| Responsive | 20 tổ hợp trang/viewport, không tràn ngang; rộng 320, 390, 768, 1440 và 1920 px |
| Dọn dữ liệu kiểm thử | Không còn đơn/lịch hẹn/sản phẩm E2E; cấu hình được khôi phục |

Playwright kiểm tra bộ lọc, đổi màu, tính trả góp, đăng ký lái thử, giỏ hàng, đặt xe COD, tra cứu đơn bằng mã và số điện thoại, xác nhận/hủy đơn trong admin, CRUD sản phẩm, thông số, tải ảnh, cấu hình thương hiệu/favicon/banner/đánh giá, chế độ tối và mobile. Kiểm thử bảo mật gồm chặn API quản trị với khách chưa đăng nhập, từ chối tệp không hợp lệ và không trả dữ liệu đơn hàng khi sai số điện thoại.

Kiểm thử database sử dụng stack `motoshop-vietnam` ở cổng 57321/57322: seed 30 sản phẩm, RLS cho khách/admin, từ chối quyền giả trong `user_metadata`, tranh chấp tồn kho, đặt đơn lặp, hoàn kho khi hủy, kiểm tra tài khoản/số tiền/giao dịch thanh toán lặp, tổng hợp bán hàng, rate limit và Storage. Không tác động đến Supabase cloud hoặc database của dự án khác.

## Các cổng chất lượng

- **Thiết kế:** đã xem giao diện storefront, chi tiết sản phẩm và admin trên desktop/mobile; ảnh chụp ở [artifacts](artifacts). Màu đỏ cho xe xăng, xanh cho xe điện; có chế độ sáng/tối.
- **Accessibility:** axe trong luồng storefront, modal, mobile và admin không phát hiện vi phạm trong phạm vi quét. Lighthouse Accessibility 100. Đã kiểm tra focus modal, thao tác bàn phím, nhãn form và reduced motion. Đây không phải chứng nhận WCAG toàn diện.
- **Motion:** chỉ dùng chuyển trạng thái CSS nhẹ, tôn trọng `prefers-reduced-motion`. Không dùng 3D, WebGL hoặc cuộn cưỡng chế; các cổng GPU/3D không áp dụng.
- **Security:** xác thực admin phía server, quyền dựa trên `app_metadata`, RLS, Zod, kiểm tra nguồn yêu cầu, rate limit, giới hạn tải lên và kiểm tra loại tệp. Giá/tồn kho được xác minh phía server. Production thiếu Supabase trả 503 khi ghi, không báo thành công giả. `npm audit --omit=dev` báo 0 lỗ hổng.
- **SEO:** đã kiểm tra metadata/canonical, OpenGraph/Twitter, Product JSON-LD, alt ảnh, sitemap và robots. Local chủ động `noindex` và chặn crawl; Lighthouse SEO 69 vì điều kiện chưa phát hành. Chưa kiểm tra URL preview Vercel do chưa có deployment.
- **Performance:** đã tối ưu ảnh WebP/AVIF, ảnh hero mobile riêng, số font tải trước và khoảng trống nội dung để tránh footer dịch chuyển khi streaming. Kết quả đo dưới đây; chưa xác nhận Core Web Vitals từ người dùng thật.

## Hiệu năng đo được

Lighthouse **13.4.1**, trang chủ production ở `127.0.0.1:3001`, không phải dev server. Các lần đo khác chế độ throttling không dùng để so sánh trực tiếp.

| Chế độ | Performance | Accessibility | Best Practices | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile, mô phỏng mặc định | 94 | 100 | 100 | 3,02 s | 0,00037 | 54,5 ms |
| Desktop, mô phỏng mặc định | 100 | 100 | 100 | 0,79 s | 0,00014 | 0 ms |
| Mobile, DevTools throttling sau sửa streaming | 91 | 100 | 100 | 2,15 s | 0,00037 | 315,4 ms |

LCP mobile mô phỏng vẫn cao hơn mục tiêu 2,5 s; TBT ở lần đo DevTools cao hơn mục tiêu 200 ms. Cần đo lại trên hosting/CDN và thiết bị thật, tối ưu thêm nếu các chỉ số này lặp lại. Chưa có dữ liệu INP/CrUX; TBT không thay thế INP. Không tuyên bố đạt toàn bộ Core Web Vitals thực tế.

Báo cáo HTML/JSON Lighthouse được giữ tại máy trong `docs/artifacts` và loại khỏi Git; bảng trên lưu kết quả bàn giao. Ảnh kiểm tra giao diện được đưa vào repository.

## Giả định và phần chưa xác minh

1. Giá/ảnh/thông số ban đầu lấy từ nguồn hãng, có ghi nguồn và ngày trong [catalog-sources.md](catalog-sources.md). Tồn kho 10 xe/màu, cọc 10% và lãi minh họa 12%/năm là cấu hình chạy thử; chủ cửa hàng cần điều chỉnh.
2. Chưa có project Supabase cloud, tên miền, thông tin showroom/ngân hàng hoặc tài khoản SePay được chọn cho cửa hàng. Chưa kiểm thử thanh toán thật, email Auth hoặc webhook từ nhà cung cấp qua Internet. Hướng dẫn kích hoạt có trong [README](../README.md).
3. Admin làm mới dữ liệu bằng nút bấm, chưa đăng ký Supabase Realtime. Snapshot giới hạn 1.000 sản phẩm và 500 đơn/lịch hẹn mới nhất; quy mô lớn hơn cần phân trang và thống kê database.
4. Kiểm thử trình duyệt tự động dùng Chromium. Chưa xác minh Safari/iOS trên thiết bị thật hoặc kiểm thử tải nhiều người dùng đồng thời trên hosting.
5. Audit toàn bộ dependency ghi nhận 5 cảnh báo mức cao cùng chuỗi công cụ lint dẫn đến `braces@3.0.3` (GHSA-vfj7-8cjw-p6xm). Tại thời điểm kiểm tra chưa có bản vá mới của `braces`; không ép hạ Next.js/ESLint để làm sạch báo cáo. Đây là dependency phát triển, không nằm trong audit runtime. Cần theo dõi bản vá upstream.

Không phát hiện lỗi chức năng còn tồn tại trong các luồng đã kiểm thử. Các giới hạn trên được giữ rõ ràng, không thay bằng dữ liệu doanh thu, đánh giá hay xác nhận thanh toán giả.
