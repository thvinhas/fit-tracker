const GEMINI_MODEL = "gemini-2.5-flash-lite";

function buildFallback(exerciseName, targetWeight) {
  const weight = Number(targetWeight) || 0;
  const warmupWeight = weight > 0 ? Math.round(weight * 0.4) : null;
  const name = exerciseName || "o primeiro exercício";
  return warmupWeight
    ? `2 séries leves de ${name} a ${warmupWeight}kg antes de começar`
    : `2 séries leves de ${name} antes de começar`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { exerciseName, equipment, targetWeight } = req.body || {};
  const fallback = buildFallback(exerciseName, targetWeight);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !exerciseName) {
    res.status(200).json({ suggestion: fallback });
    return;
  }

  try {
    const prompt = `Sugira, em português do Brasil, uma única frase curta (máximo 20 palavras) de aquecimento antes do exercício "${exerciseName}"${
      equipment ? ` (equipamento: ${equipment})` : ""
    }${
      targetWeight ? `, carga alvo ${targetWeight}kg` : ""
    }. Tom direto, estilo app de treino. Responda só com a frase, sem aspas nem markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 80, temperature: 0.8 },
        }),
      },
    );

    if (!response.ok) {
      res.status(200).json({ suggestion: fallback });
      return;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    res.status(200).json({ suggestion: text || fallback });
  } catch {
    res.status(200).json({ suggestion: fallback });
  }
}
