export default function LightGradient() {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden bg-slate-100">
      {/* Stronger Yellow Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-yellow-200/80 blur-[100px] animate-mesh" />
      
      {/* Stronger Teal Blob */}
      <div className="absolute bottom-[5%] right-[-5%] w-[50%] h-[50%] rounded-full bg-teal-200/70 blur-[100px] animate-mesh [animation-delay:2s]" />
      
      {/* Stronger Accent Blob (using your #FFDC00 color) */}
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-[#FFDC00]/40 blur-[90px] animate-mesh [animation-delay:4s]" />
    </div>
  );
}