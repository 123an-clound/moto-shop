import type { Metadata } from "next";
export const metadata: Metadata = {
  alternates: { canonical: "/chinh-sach" },
  title: "Thông tin đặt xe & bảo mật",
  description:
    "Thông tin về yêu cầu đặt xe, xác nhận giá và thanh toán, sử dụng thông tin liên hệ tại MotoShop.",
};
export default function PolicyPage() {
  return (
    <div className="container section">
      <article className="content-prose">
        <h1>Thông tin đặt xe & bảo mật</h1>
        <h2>Yêu cầu đặt xe</h2>
        <p>
          Khi gửi đơn trên website, bạn yêu cầu cửa hàng liên hệ xác nhận mẫu
          xe, màu, tồn kho và phương án nhận xe. Đơn chưa phải xác nhận giao xe.
          Giá hiển thị là giá tham khảo theo phiên bản, chưa gồm chi phí đăng
          ký, biển số, bảo hiểm hoặc giao xe trừ khi được xác nhận rõ.
        </p>
        <h2>Thanh toán và đặt cọc</h2>
        <p>
          Bạn có thể chọn thanh toán khi nhận xe hoặc tại showroom. Nếu cửa hàng
          đã mở chuyển khoản, hệ thống hiển thị mã VietQR và khoản cọc trên đơn.
          Hãy kiểm tra tên chủ tài khoản, số tiền và mã đơn trước khi chuyển.
          Việc tạo hoặc mở QR không đồng nghĩa thanh toán thành công.
        </p>
        <p>
          Điều kiện giao xe, hủy đơn, hoàn cọc và bảo hành cần được nhân viên
          cung cấp và bạn xác nhận trước khi thanh toán. Nếu cần thay đổi đơn,
          liên hệ cửa hàng với mã đơn và số điện thoại đã đăng ký.
        </p>
        <h2>Giá, thông số và hình ảnh</h2>
        <p>
          Dữ liệu ban đầu được tham khảo từ các website Honda Việt Nam, Yamaha
          Việt Nam, VinFast, YADEA và Dat Bike. Nguồn và ngày thu thập được ghi
          trên từng trang xe. Hình ảnh, màu sắc và thông số có thể khác theo
          phiên bản, điều kiện đo hoặc thiết bị hiển thị. Cửa hàng có thể cập
          nhật lại danh mục.
        </p>
        <h2>Lịch lái thử</h2>
        <p>
          Đăng ký trên website là thời gian mong muốn của bạn. Nhân viên sẽ xác
          nhận địa điểm, xe có sẵn, giấy tờ và điều kiện tham gia. Chỉ đến theo
          lịch đã được xác nhận.
        </p>
        <h2 id="bao-mat">Thông tin cá nhân</h2>
        <p>
          Website thu thập thông tin bạn nhập trong form đặt xe và đăng ký lái
          thử, gồm tên, điện thoại, email nếu cung cấp, địa chỉ và ghi chú. Cửa
          hàng dùng thông tin để xử lý yêu cầu, xác nhận lịch và liên hệ về đơn
          hàng. Chỉ tài khoản quản trị được cấp quyền mới có thể truy cập danh
          sách khách hàng.
        </p>
        <p>
          Tra cứu đơn yêu cầu cả mã đơn và số điện thoại. Website lưu giỏ hàng
          và tùy chọn giao diện trong trình duyệt; phiên đăng nhập quản trị sử
          dụng cookie. Nếu muốn cập nhật hoặc yêu cầu xử lý thông tin đã gửi,
          liên hệ cửa hàng qua thông tin được công bố tại trang showroom.
        </p>
      </article>
    </div>
  );
}
