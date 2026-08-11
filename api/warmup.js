const GEMINI_MODEL = "gemini-3.5-flash-lite";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { exercises } = req.body || {};
  const list = Array.isArray(exercises) ? exercises.filter((e) => e?.name) : [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[warmup] GEMINI_API_KEY não configurada no ambiente");
    res.status(503).json({ error: "GEMINI_API_KEY não configurada" });
    return;
  }
  if (list.length === 0) {
    console.error("[warmup] Nenhum exercício recebido no corpo da requisição", req.body);
    res.status(400).json({ error: "Nenhum exercício informado" });
    return;
  }

  try {
    const exerciseList = list
      .map((e) => {
        const weight = Number(e.currentWeight) || 0;
        const parts = [e.name];
        if (e.device) parts.push(`(${e.device}${weight > 0 ? `, ${weight}kg` : ""})`);
        else if (weight > 0) parts.push(`(${weight}kg)`);
        return parts.join(" ");
      })
      .join(", ");

    const prompt = `Este é o treino de hoje, nesta ordem, com o peso atual de cada exercício: ${exerciseList}. Sugira, em português do Brasil, uma única frase curta (máximo 30 palavras) de aquecimento mensurável e específico para os grupos musculares desses exercícios: use números concretos (séries, repetições e peso em kg ou tempo em minutos), calculando pesos de aquecimento como 40-50% do peso informado do exercício correspondente. Tom direto, estilo app de treino. Responda só com a frase, sem aspas nem markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 120, temperature: 0.8 },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(
        `[warmup] Gemini respondeu ${response.status} ${response.statusText}: ${errorBody}`,
      );
      res.status(502).json({ error: "Falha ao gerar sugestão de aquecimento" });
      return;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      console.error(
        "[warmup] Gemini retornou sem texto de sugestão",
        JSON.stringify(data),
      );
      res.status(502).json({ error: "Resposta vazia da IA" });
      return;
    }

    res.status(200).json({ suggestion: text });
  } catch (error) {
    console.error("[warmup] Erro inesperado ao chamar Gemini:", error);
    res.status(500).json({ error: "Erro ao gerar sugestão de aquecimento" });
  }
}
