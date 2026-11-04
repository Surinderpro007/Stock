export default function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white px-6 py-12 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase">{label}</p>
    </div>
  );
}
