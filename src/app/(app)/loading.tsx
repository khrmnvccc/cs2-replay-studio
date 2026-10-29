// Sahifa ochilguncha darhol ko'rinadigan skelet (bosilgan zahoti javob beradi)
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy>
      <div className="panel h-40" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="panel h-24" />
        ))}
      </div>
      <div className="panel h-64" />
    </div>
  );
}
