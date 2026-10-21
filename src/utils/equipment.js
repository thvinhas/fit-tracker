const EQUIPMENT_ABBREVIATIONS = {
  dumbbell: "DB",
  barbell: "BB",
  "ez barbell": "Barra EZ",
  "smith machine": "Smith",
  machine: "Máq.",
  cable: "Cabo",
  kettlebell: "KB",
  "body weight": "Peso corp.",
  band: "Elástico",
  "medicine ball": "Med. ball",
  "resistance band": "Elástico",
};

export const getEquipmentAbbreviation = (equipment) => {
  if (!equipment) return null;
  const key = String(equipment).trim().toLowerCase();
  return EQUIPMENT_ABBREVIATIONS[key] || equipment;
};

// Progression increment per equipment kind — dumbbells step 2kg at a time,
// machines/cable stacks step 5kg, barbells step 2.5kg (plate pairs).
// "Equipamento" is a free-text optional field, so we match loosely against
// it and the station field together instead of requiring an exact value.
const DEFAULT_INCREMENT_KG = 2.5;
const INCREMENT_RULES = [
  { match: /halter|dumbbell|\bdb\b/i, incrementKg: 2 },
  {
    match: /m[aá]quina|machine|\bm[aá]q\b|smith|cabo|cable|pol[ei]a/i,
    incrementKg: 5,
  },
  { match: /barra|barbell|\bbb\b/i, incrementKg: 2.5 },
];

export const getProgressionIncrementKg = (equipment, device) => {
  const text = `${equipment || ""} ${device || ""}`;
  const found = INCREMENT_RULES.find(({ match }) => match.test(text));
  return found ? found.incrementKg : DEFAULT_INCREMENT_KG;
};
