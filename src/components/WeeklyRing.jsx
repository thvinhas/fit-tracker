const WeeklyRing = ({ completed, goal }) => {
  const percent = goal > 0 ? Math.min(1, completed / goal) : 0;
  const deg = Math.round(percent * 360);
  const gradient = `conic-gradient(#f2b134 0deg ${deg}deg, rgba(255,255,255,0.08) ${deg}deg 360deg)`;

  return (
    <div className="shrink-0 w-[104px] h-[104px] rounded-[20px] bg-surface2 border border-border-subtle flex items-center justify-center">
      <div
        className="w-[76px] h-[76px] rounded-full flex items-center justify-center"
        style={{ background: gradient }}
      >
        <div className="w-[58px] h-[58px] rounded-full bg-surface2 flex flex-col items-center justify-center">
          <span className="text-base font-extrabold text-text-primary tabular-nums">
            {completed}/{goal}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyRing;
