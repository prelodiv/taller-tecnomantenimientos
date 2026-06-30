export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center rounded-md bg-black border border-brand/40 font-black text-brand"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        TM
      </div>
      <div className="leading-tight">
        <div className="font-black tracking-tight text-[15px]">
          TECNO <span className="text-brand">MANTENIMIENTOS</span>
        </div>
        <div className="text-[10px] text-muted -mt-0.5">P.R. S.A.S</div>
      </div>
    </div>
  );
}
