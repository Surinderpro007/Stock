export default function ErrorState({ message }: { message: string }) {
  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white px-6 py-10 text-center">
      <p className="text-sm text-[#9B3A32]">{message}</p>
    </div>
  );
}
