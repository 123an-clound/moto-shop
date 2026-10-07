export default function Loading() {
  return (
    <div
      className="container section"
      aria-busy="true"
      aria-label="Đang tải trang"
    >
      <div className="loading-skeleton" />
      <p className="helper">Đang tải thông tin xe…</p>
    </div>
  );
}
