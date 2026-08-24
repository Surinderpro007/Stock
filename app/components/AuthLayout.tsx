export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Form side */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-[#F7F5EF] px-8 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* Right: Visual side */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-[#122A22] items-center justify-center overflow-hidden">
        <div  
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #B8935F 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 max-w-md px-12 text-center">
          <div className="flex justify-center mb-8">
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              className="animate-pulse"
            >
              <circle
                cx="22"
                cy="22"
                r="14"
                stroke="#B8935F"
                strokeWidth="2"
              />
              <circle cx="22" cy="22" r="4" fill="#B8935F" />
              <line
                x1="32"
                y1="32"
                x2="50"
                y2="50"
                stroke="#B8935F"
                strokeWidth="2"
              />
              <line
                x1="42"
                y1="42"
                x2="48"
                y2="36"
                stroke="#B8935F"
                strokeWidth="2"
              />
            </svg>
          </div>

          <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-4 uppercase">
            Auth App // Secure Access
          </p>
          <h1 className="font-serif text-4xl text-[#F7F5EF] leading-tight">
            Secure Your Digital World with Confidence
          </h1>
          <p className="mt-4 text-[#9CA3AF] text-sm leading-relaxed">
            Experience the power of secure authentication and seamless access to your digital assets. Our app ensures your data remains protected while providing a user-friendly interface for effortless navigation. Join us in safeguarding your online presence today.
          </p>
        </div>
      </div>
    </div>
  );
}