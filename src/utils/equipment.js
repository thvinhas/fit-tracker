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
