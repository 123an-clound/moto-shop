"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container section">
      <div className="empty-state">
        <h1>Chưa thể tải nội dung</h1>
        <p>Vui lòng tải lại trang. Nếu lỗi tiếp tục, hãy thử lại sau.</p>
        <button className="btn" onClick={reset}>
          Thử lại
        </button>
      </div>
    </main>
  );
}
