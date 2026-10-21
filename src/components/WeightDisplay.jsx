import { formatLb } from "../utils/weight";

const KG_SIZE = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-[20px]",
};

const LB_SIZE = {
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-[11px]",
};

// Single source of truth for showing an exercise weight: kg is the
// stored/primary value, lb is derived and shown as a secondary hint.
// Never persist the lb value — it's always computed at display time.
const WeightDisplay = ({ kg, size = "md", inline = false, className = "" }) => {
  const weight = Number(kg) || 0;

  if (inline) {
    return (
      <span className={`tabular-nums ${className}`}>
        <span className="font-bold text-text-primary">{weight}kg</span>
        <span className="text-text-tertiary"> ({formatLb(weight)}lb)</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-col leading-tight tabular-nums ${className}`}>
      <span className={`font-bold text-text-primary ${KG_SIZE[size]}`}>
        {weight}kg
      </span>
      <span className={`text-text-tertiary ${LB_SIZE[size]}`}>
        {formatLb(weight)}lb
      </span>
    </span>
  );
};

export default WeightDisplay;
