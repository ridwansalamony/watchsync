export default function Loading() {
  return (
    <div
      className="page-width min-h-[70dvh] py-20"
      role="status"
      aria-label="Memuat halaman"
    >
      <div className="skeleton h-10 w-2/3 rounded-lg" />
      <div className="skeleton mt-6 h-5 w-1/2 rounded-lg" />
      <div className="skeleton mt-10 h-72 rounded-xl" />
    </div>
  );
}
