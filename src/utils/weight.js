const KG_TO_LB = 2.20462;

export const kgToLb = (kg) => (Number(kg) || 0) * KG_TO_LB;

export const formatLb = (kg) => kgToLb(kg).toFixed(1);
