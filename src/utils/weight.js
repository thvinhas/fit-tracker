const KG_TO_LB = 2.2046226218;

export const kgToLb = (kg) => Math.round((Number(kg) || 0) * KG_TO_LB);
