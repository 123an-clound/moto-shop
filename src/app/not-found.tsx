import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container section">
      <div className="empty-state">
        <h1>Không tìm thấy trang</h1>
        <p>Trang hoặc sản phẩm này đã được chuyển hoặc không còn hiển thị.</p>
        <Link className="btn" href="/xe">
          Khám phá các mẫu xe
        </Link>
      </div>
    </main>
  );
}
