// 1min de execução + 30s de descanso por série, usado como estimativa
// quando não há histórico de sessões reais pra calcular a média.
export const SECONDS_PER_SET = 90;

export const estimateDurationMs = (totalSets) =>
  totalSets * SECONDS_PER_SET * 1000;
