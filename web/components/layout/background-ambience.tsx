
export function BackgroundAmbience() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#030814]">
      <div className="absolute -left-24 -top-28 h-[620px] w-[620px] rounded-full bg-blue-500/14 blur-[130px] animate-breathe" />
      <div className="absolute -right-24 top-1/4 h-[680px] w-[680px] rounded-full bg-violet-500/12 blur-[150px] animate-breathe delay-2000" />
      <div className="absolute bottom-[-12%] left-1/3 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[120px] animate-breathe delay-4000" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_24%,rgba(2,6,18,0.58)_86%)]" />
    </div>
  );
}
