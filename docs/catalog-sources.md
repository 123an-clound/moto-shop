# Nguồn dữ liệu sản phẩm MotoShop Việt Nam

Dữ liệu ban đầu được kiểm tra ngày 06/10/2026 từ trang chính thức của Honda, Yamaha, VinFast, Dat Bike và YADEA. Đây là danh mục tham khảo để chủ cửa hàng chỉnh sửa trong admin.

Giá là mức hãng công bố tại trang nguồn của phiên bản tương ứng, chưa bao gồm chi phí lăn bánh trừ khi ghi rõ. Không tạo giá khuyến mãi, đánh giá khách hàng hoặc số liệu bán hàng. Các thông số thiếu ở nguồn được để trống.

**Giả định dữ liệu chạy thử:** mỗi màu có 10 xe trong tồn kho, sản phẩm được xuất bản và có trạng thái còn hàng để kiểm thử quy trình đặt xe. Đây không phải tồn kho thực của nhà sản xuất hoặc MotoShop. Chủ cửa hàng cần cập nhật tồn kho, giá bán và thông tin hoạt động trước khi nhận đơn thật.

Ảnh sản phẩm được tải từ các URL chính thức, giữ nguyên màu và nội dung, cắt khoảng trống ở viền khi có thể và chuyển sang WebP tối đa 1000 px. URL ảnh gốc và chứng cứ thông số được giữ trong `research-gasoline.json` và `research-electric.json`. Chấm màu xe điện là biểu diễn gần đúng theo tên màu, không phải mã sơn hãng. Quyền đối với hình ảnh và nhãn hiệu thuộc chủ sở hữu tương ứng.

Dat Bike Quantum S1/S2/S3 có màu trắng giá cao hơn 1.000.000 đồng so với màu cơ sở. Vì mô hình hiện tại dùng một giá cho mỗi sản phẩm, danh mục khởi tạo chỉ nhập các màu cùng giá cơ sở; dữ liệu màu trắng vẫn được giữ nguyên trong file nghiên cứu. Quãng đường công bố của một số VinFast yêu cầu pin phụ tùy chọn; điều kiện này được ghi rõ trong mô tả và thông số, không có nghĩa pin phụ nằm trong giá cơ sở.

| Sản phẩm / phiên bản | Giá tham khảo (VNĐ) | Nguồn |
| --- | ---: | --- |
| Honda Vision Phiên bản Thể thao | 36.808.363 | [Honda](https://www.honda.com.vn/xe-may/san-pham/vision?version=103) |
| Honda Air Blade 160 phiên bản Thể Thao | 58.790.000 | [Honda](https://www.honda.com.vn/xe-may/san-pham/air-blade-160125?version=85) |
| Honda LEAD ABS Phiên bản Đặc biệt | 45.841.091 | [Honda](https://www.honda.com.vn/xe-may/san-pham/lead-abs?version=91) |
| Honda Sh mode 125 Phiên bản Thể thao | 66.361.091 | [Honda](https://www.honda.com.vn/xe-may/san-pham/sh-mode-125?version=115) |
| Honda SH160i Phiên bản Thể Thao | 104.490.000 | [Honda](https://www.honda.com.vn/xe-may/san-pham/sh160i125i?version=95) |
| Honda Vario 160 Thể Thao | 56.690.000 | [Honda](https://www.honda.com.vn/xe-may/san-pham/vario-160?version=46) |
| Honda Vario 125 Đặc Biệt | 41.913.818 | [Honda](https://www.honda.com.vn/xe-may/san-pham/vario-125?version=19) |
| Honda SH350i Phiên Bản Thể Thao | 152.890.000 | [Honda](https://www.honda.com.vn/xe-may/san-pham/sh350i?version=76) |
| Honda Future 125 FI Phiên bản Đặc biệt | 32.292.000 | [Honda](https://www.honda.com.vn/xe-may/san-pham/future-125-fi?version=62) |
| Honda Blade Phiên bản Thể Thao | 21.943.637 | [Honda](https://www.honda.com.vn/xe-may/san-pham/blade?version=22) |
| Honda Wave Alpha 110 Phiên bản đặc biệt | 18.841.091 | [Honda](https://www.honda.com.vn/xe-may/san-pham/wave-alpha-110?version=5) |
| Honda Wave RSX Phiên bản Thể thao | 25.664.727 | [Honda](https://www.honda.com.vn/xe-may/san-pham/wave-rsx?version=81) |
| Honda CBR150R Phiên bản Thể Thao | 73.790.000 | [Honda](https://www.honda.com.vn/xe-may/san-pham/cbr150r?version=61) |
| Honda WINNER R Phiên bản Thể Thao | 50.760.000 | [Honda](https://www.honda.com.vn/xe-may/san-pham/winner-r?version=37) |
| Yamaha Grande phiên bản tiêu chuẩn màu mới nhất 2025 | 46.637.000 | [Yamaha](https://yamaha-motor.com.vn/xe/grande-phien-ban-tieu-chuan-mau-moi-nhat-2025-bjjd/) |
| Yamaha Janus phiên bản đặc biệt màu mới 2025 | 33.382.000 | [Yamaha](https://yamaha-motor.com.vn/xe/janus-phien-ban-dac-biet-mau-moi-2025-bj7x-2/) |
| Yamaha Freego S ABS phiên bản đặc biệt màu mới | 34.855.000 | [Yamaha](https://yamaha-motor.com.vn/xe/freego-s-abs-phien-ban-dac-biet-mau-moi-b4uc/) |
| Yamaha PG-1 ABS mới phiên bản giới hạn | 35.837.000 | [Yamaha](https://yamaha-motor.com.vn/xe/pg-1-abs-moi-phien-ban-gioi-han-dg12-2/) |
| VinFast Feliz 2025 | 26.000.000 | [VinFast](https://vinfastauto.com/vn_vi/xe-may-dien-feliz) |
| VinFast Evo Grand | 22.500.000 | [VinFast](https://vinfastauto.com/vn_vi/xe-may-dien-evo-grand) |
| VinFast Evo Grand Lite | 16.500.000 | [VinFast](https://vinfastauto.com/vn_vi/xe-may-dien-evo-grand-lite) |
| VinFast Flazz | 14.200.000 | [VinFast](https://vinfastauto.com/vn_vi/xe-may-dien-flazz) |
| VinFast ZGoo | 13.300.000 | [VinFast](https://vinfastauto.com/vn_vi/xe-may-dien-zgoo) |
| YADEA OVA | 18.190.000 | [YADEA](https://www.yadea.com.vn/thong-tin-san-pham/yadea-ova/) |
| YADEA VOLTGUARD U50 | 38.990.000 | [YADEA](https://www.yadea.com.vn/thong-tin-san-pham/yadea-voltguard-u50/) |
| YADEA VELAX U | 52.990.000 | [YADEA](https://www.yadea.com.vn/thong-tin-san-pham/yadea-velax-u-2026/) |
| YADEA ORLA P | 21.690.000 | [YADEA](https://www.yadea.com.vn/thong-tin-san-pham/yadea-orla-2024/) |
| Dat Bike Quantum S1 | 49.900.000 | [Dat Bike](https://dat.bike/xe-may-dien-quantum-s1/) |
| Dat Bike Quantum S2 | 42.900.000 | [Dat Bike](https://dat.bike/xe-may-dien-quantum-s2/) |
| Dat Bike Quantum S3 | 34.900.000 | [Dat Bike](https://dat.bike/xe-may-dien-quantum-s3/) |

## Tạo lại danh mục

Chạy `node scripts/build-catalog.mjs --require-complete` sau khi cập nhật hai file nghiên cứu. Lệnh sẽ tải lại ảnh, xác nhận ảnh giải mã được, chuẩn hóa Product DTO và giữ UUID ổn định theo slug/màu. Nếu nguồn ảnh lỗi, lệnh dừng với thông báo lỗi; danh mục đã có không bị ghi đè bằng ảnh thiếu.

Chạy `node scripts/build-catalog.mjs --metadata-only` chỉ để chuẩn hóa dữ liệu trong lúc phát triển. Chế độ này giữ URL ảnh nguồn và không được dùng làm danh mục phát hành.
