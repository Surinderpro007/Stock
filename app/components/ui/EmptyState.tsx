export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white px-6 py-10 text-center">
      <p className="text-sm text-[#6B6858]">{message}</p>
    </div>
  );
}
