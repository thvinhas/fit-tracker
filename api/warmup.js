const GEMINI_MODEL = "gemini-2.5-flash-lite";

function buildFallback(exercises) {
  const first = exercises?.[0];
  if (!first) return "2 séries leves antes de começar";
  const weight = Number(first.currentWeight) || 0;
  const warmupWeight = weight > 0 ? Math.round(weight * 0.4) : null;
  const name = first.name || "o primeiro exercício";
  return warmupWeight
    ? `2 séries leves de ${name} a ${warmupWeight}kg antes de começar`
    : `2 séries leves de ${name} antes de começar`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { exercises } = req.body || {};
  const list = Array.isArray(exercises) ? exercises.filter((e) => e?.name) : [];
  const fallback = buildFallback(list);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || list.length === 0) {
    res.status(200).json({ suggestion: fallback });
    return;
  }

  try {
    const exerciseList = list
      .map((e) => (e.device ? `${e.name} (${e.device})` : e.name))
      .join(", ");

    const prompt = `Este é o treino de hoje, nesta ordem: ${exerciseList}. Sugira, em português do Brasil, uma única frase curta (máximo 25 palavras) de aquecimento geral antes de começar o treino, considerando os grupos musculares envolvidos nesses exercícios. Tom direto, estilo app de treino. Responda só com a frase, sem aspas nem markdown.`;

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
