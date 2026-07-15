const Sparkline = ({ values, active = false }) => {
  const clean = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (clean.length === 0) return null;

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min;

  return (
    <div className="flex items-end gap-[2px] h-[18px]" aria-hidden>
      {clean.map((value, index) => {
        const heightPct = range === 0 ? 60 : 20 + ((value - min) / range) * 80;
        return (
          <div
            key={index}
            className={`w-1 rounded-[2px] ${active ? "bg-primary" : "bg-white/10"}`}
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </div>
  );
};

export default Sparkline;
