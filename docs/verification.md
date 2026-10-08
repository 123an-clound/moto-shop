# Kết quả kiểm tra MotoShop

Ngày kiểm tra ban đầu: **07/10/2026**; cập nhật kết nối cloud **08/10/2026**. Môi trường ban đầu: Windows, Node.js 24.15.0, Chromium, Next.js production build và Supabase Docker riêng cho MotoShop. Kết quả triển khai Vercel và cloud bổ sung ở phần cuối.

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
- **SEO:** đã kiểm tra metadata/canonical, OpenGraph/Twitter, Product JSON-LD, alt ảnh, sitemap và robots. Local chủ động `noindex` và chặn crawl; Lighthouse SEO 69 ở bản local. Đã kiểm tra lại SEO trên bản Vercel trước khi promote, chi tiết ở phần cuối.
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
2. Vercel và Supabase cloud đã được kết nối; chi tiết kiểm tra ở phần cuối. Thông tin showroom/ngân hàng và tài khoản SePay thật chưa được cấu hình. Chưa kiểm thử thanh toán thật, email Auth hoặc webhook từ nhà cung cấp qua Internet. Hướng dẫn kích hoạt có trong [README](../README.md).
3. Admin làm mới dữ liệu bằng nút bấm, chưa đăng ký Supabase Realtime. Snapshot giới hạn 1.000 sản phẩm và 500 đơn/lịch hẹn mới nhất; quy mô lớn hơn cần phân trang và thống kê database.
4. Kiểm thử trình duyệt tự động dùng Chromium. Chưa xác minh Safari/iOS trên thiết bị thật hoặc kiểm thử tải nhiều người dùng đồng thời trên hosting.
5. Audit toàn bộ dependency ghi nhận 5 cảnh báo mức cao cùng chuỗi công cụ lint dẫn đến `braces@3.0.3` (GHSA-vfj7-8cjw-p6xm). Tại thời điểm kiểm tra chưa có bản vá mới của `braces`; không ép hạ Next.js/ESLint để làm sạch báo cáo. Đây là dependency phát triển, không nằm trong audit runtime. Cần theo dõi bản vá upstream.

Không phát hiện lỗi chức năng còn tồn tại trong các luồng đã kiểm thử. Các giới hạn trên được giữ rõ ràng, không thay bằng dữ liệu doanh thu, đánh giá hay xác nhận thanh toán giả.

## Triển khai Vercel ngày 07/10/2026

- URL công khai: **https://moto-shop-xi.vercel.app**.
- Project: `123an-clounds-projects/moto-shop`, ID `prj_qITaSJrXBy6Vah6u9feLkPSjy8Hs`.
- Bản phát hành đầu tiên: commit `1d5505d`, deployment `dpl_1NoK7az3UsUFwoQY8YEKE6XC5Dci`; production build hoàn tất trên Vercel. Đã kiểm tra bản staged qua cơ chế bảo vệ deployment trước khi promote.
- GitHub đã kết nối với Vercel; các lần push tiếp theo lên `main` sẽ tự triển khai. URL canonical được cấu hình bằng `NEXT_PUBLIC_SITE_URL` cho Production/Preview.
- Kiểm tra public: trang chủ, danh mục, Honda Vision, trang đăng nhập admin, robots, sitemap, hero AVIF và OpenGraph image đều trả HTTP 200. HTTP chuyển hướng 308 sang HTTPS.
- SEO bản staged: canonical đúng domain, mỗi trang một H1, có OG/Twitter, ảnh có alt, Product JSON-LD hợp lệ với giá VND. Sitemap chứa 38 URL; robots cho phép trang public và chặn admin/API/giỏ hàng/tra cứu. Có CSP, HSTS, X-Content-Type-Options và X-Frame-Options.
- Chromium trên website công khai: trang chủ rộng 1440/390 px và trang Honda Vision rộng 390 px không tràn ngang, không ảnh lỗi trong viewport, không lỗi JavaScript; axe không phát hiện vi phạm WCAG A/AA trong phạm vi kiểm tra.
- **Chưa kết nối Supabase cloud:** catalog trả đủ 30 sản phẩm mẫu, nhưng API quản trị trả 503 theo thiết kế khi thiếu database. Chưa kích hoạt đăng nhập admin, ghi đơn/lịch hẹn hoặc thanh toán thật trên Vercel. Admin local vẫn hoạt động riêng trên máy.
- Không chạy lại toàn bộ luồng ghi E2E trên production vì chưa có database cloud. Các phép đo Lighthouse phía trên là bản production local, không phải kết quả hiệu năng trên Vercel; chưa có dữ liệu Core Web Vitals thực tế.

## Kết nối Supabase cloud ngày 08/10/2026

- Project được chủ cửa hàng chọn: **Web-project** (`jtizooyjnllostamffpp`), vùng Seoul (`ap-northeast-2`). Production Vercel dùng publishable key và server secret; Preview không được cấp khóa database production. Admin local và dữ liệu JSON vẫn dùng riêng trên máy.
- Đã áp hai migration `20261007152611_isolate_motoshop_cloud` và `20261007153618_refine_motoshop_policies`. 10 bảng có tiền tố `moto_` đều bật RLS; 7 RPC chỉ cho server role thực thi; Storage dùng bucket riêng `moto-product-images`. Không thay bảng, bucket, quyền hay Auth Site URL của ứng dụng khác.
- Quyền admin dựa trên `app_metadata.motoshop_role = admin`. Kiểm thử local xác minh quyền `app_metadata.role` của ứng dụng khác và quyền giả trong `user_metadata` không truy cập được dữ liệu quản trị MotoShop.
- Đã sửa định dạng thời gian Postgres sang UTC ISO khi đọc sản phẩm để form admin lưu lại được dữ liệu cloud. Có bài kiểm thử hồi quy cho chu trình đọc sản phẩm và xác thực dữ liệu gửi lưu.
- Lint, TypeScript và **18 bài Vitest đạt**. Kiểm thử tích hợp Postgres/Auth/Storage local đạt với schema mới; production build đạt trên Vercel. Bản cloud đã kiểm tra: `dpl_6e6xy4AxdsE9xHepuCAap9ASWUft`.
- Trên tên miền chính, đã đăng nhập admin, tạo/sửa/xóa sản phẩm nháp, xác minh sản phẩm chưa xuất bản bị ẩn, tải/đọc ảnh Storage, lưu/đọc lại cấu hình, tạo đơn COD, gửi lại cùng mã chống trùng, tra cứu đúng/sai số điện thoại, hủy đơn và xác minh hoàn kho. Đăng ký lịch lái thử và cập nhật trạng thái trong admin cũng đạt.
- Kiểm tra cloud từ client công khai: không đọc được đơn hàng và không gọi được RPC đặt đơn trực tiếp. Security Advisor không có cảnh báo cho các bảng MotoShop. Performance Advisor chỉ ghi nhận index mới chưa được sử dụng; giữ index phục vụ khóa ngoại và truy vấn vận hành ([giải thích của Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)). Cảnh báo sẵn có của các ứng dụng khác được giữ nguyên, ngoài phạm vi công việc.
- Sau khi dọn đúng dữ liệu kiểm thử: **30 sản phẩm, 71 biến thể màu, 0 đơn, 0 lịch hẹn, 0 sản phẩm/ảnh kiểm thử**. Không dùng thao tác reset database hoặc xóa dữ liệu ứng dụng khác.
- SEO trên bản staged: trang chủ và sản phẩm trả 200, canonical đúng domain, một H1, OG/Twitter và Product JSON-LD hợp lệ. Sau promote, kiểm tra admin qua Chrome xác nhận chế độ **Supabase** và đủ 30 sản phẩm. Truy vấn log bản sửa không thấy phản hồi 5xx trong thời gian kiểm tra.
- Giao diện, animation và asset không thay đổi trong đợt kết nối cloud, nên không chạy lại toàn bộ ma trận responsive/axe/Lighthouse đã ghi ở trên. Kiểm tra giao diện admin thực tế đã thực hiện. Chưa có phép đo Core Web Vitals thực tế sau khi nối cloud; không coi thời gian build hoặc phản hồi API là kết quả LCP/INP/CLS.
- Thông tin admin cloud nằm trong `.local/ADMIN-CLOUD-ACCESS.txt` trên máy bàn giao. Khóa, cookie, payload đăng nhập và báo cáo kiểm thử riêng được loại khỏi Git/Vercel. Thanh toán ngân hàng/SePay thật vẫn chưa được cấu hình hoặc kiểm thử.
