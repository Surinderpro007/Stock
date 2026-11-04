import LoginRequired from '../components/auth/LoginRequired';

export default function LoginRequiredPage() {
  return (
    <div className="min-h-screen bg-[#F7F5EF]">
      <LoginRequired open />
    </div>
  );
}
