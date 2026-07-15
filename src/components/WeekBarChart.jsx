import { getLocalDayKey, getLogTimestampMs } from "../utils/dateHelpers";

const DAY_LETTERS = ["D", "S", "T", "Q", "Q", "S", "S"];

const WeekBarChart = ({ sessions }) => {
  const sessionDayKeys = new Set(
    sessions.map((session) => getLocalDayKey(getLogTimestampMs(session))),
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = getLocalDayKey(date.getTime());
    return {
      key,
      label: DAY_LETTERS[date.getDay()],
      active: sessionDayKeys.has(key),
    };
  });

  return (
    <div className="flex items-end justify-between gap-2 h-24 px-1">
      {days.map((day) => (
        <div
          key={day.key}
          className="flex-1 flex flex-col items-center gap-2 h-full"
        >
          <div className="w-full flex-1 flex items-end">
            <div
              className={`w-full rounded-t-md ${day.active ? "bg-primary" : "bg-white/10"}`}
              style={{ height: day.active ? "80%" : "20%" }}
            />
          </div>
          <span className="text-[10px] font-bold uppercase text-text-muted">
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default WeekBarChart;
