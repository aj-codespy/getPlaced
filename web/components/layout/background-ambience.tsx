
export function BackgroundAmbience() {
  return (
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#030712]">
          {/* Primary indigo orb - top left */}
          <div className="absolute top-[-20%] left-[15%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[140px] animate-breathe" />
          {/* Secondary purple orb - bottom right */}
          <div className="absolute bottom-[-15%] right-[5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-breathe delay-2000" />
          {/* Subtle blue accent - center top */}
          <div className="absolute top-[30%] right-[30%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] animate-breathe delay-4000" />
          {/* Fine grain noise overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.18] brightness-100 contrast-150 mix-blend-overlay"></div>
          {/* Subtle radial vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(3,7,18,0.5)_80%)]"></div>
      </div>
  );
}
