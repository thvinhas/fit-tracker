# Programas de treino (histórico de planos) — Design

**Status:** aprovado em conversa, pronto pra virar plano de implementação.

**Contexto:** usuário quer poder criar um novo plano de treino sem ser
obrigado a apagar os planos antigos, e ter esses planos antigos
agrupados como "histórico" em vez de misturados com os ativos na Home.
Hoje (confirmado por exploração do código) não existe nenhum limite
técnico que obrigue a apagar planos — o problema real é que
`Dashboard.jsx` e a Biblioteca tratam TODO plano salvo como ativo
(rotação "treino do dia", "Seus planos", contagem de feito/por fazer).

Esta é a primeira de duas sub-features pedidas pelo usuário na mesma
conversa. A segunda (sugestão de peso inicial baseada em grupo
muscular, pra exercícios novos sem histórico próprio) é um
sub-projeto separado, com seu próprio spec, e não está incluída aqui.

## Modelo de dado

Nova coleção Firestore `programs`:

```
{
  id: string (doc id)
  userId: string
  name: string
  status: "active" | "archived"
  createdAt: Timestamp
}
```

`workouts` ganha campo opcional `programId: string | undefined`.

**Sem migração eager.** Planos existentes sem `programId` pertencem a
um "programa implícito" que não tem doc algum em `programs` — ele só
é materializado na primeira vez que o usuário clica em "Novo
programa":
1. Cria um doc `programs` com `status: "archived"`, nome padrão
   "Programa anterior" (editável depois).
2. Faz `updateWorkout(id, { programId: <id do doc acima> })` em todo
   plano do usuário que ainda não tinha `programId`.
3. Cria o novo doc `programs` com `status: "active"` e o nome que o
   usuário digitou.
4. Novos planos criados a partir daí (`WorkoutForm.jsx`, caminho
   `!isEdit`) recebem `programId` = id do programa ativo atual.

Se já existe um programa ativo explícito (não é mais o implícito) e o
usuário cria outro "Novo programa": simplesmente `updateDoc` o
programa ativo atual pra `status: "archived"` e cria o novo como
`active` — sem precisar re-backfillar nada nos planos (eles já têm
`programId` correto).

Só um programa `active` por usuário por vez (invariante mantida pela
lógica acima, não por regra do Firestore).

## Funções novas em `src/services/firestore.js`

- `getPrograms(userId)` — todos os programas do usuário.
- `createProgram({ userId, name, status })`
- `archiveProgram(id)` — `updateDoc(..., { status: "archived" })`
- `startNewProgram(userId, newName)` — orquestra o fluxo acima
  (materializa implícito se necessário, arquiva o ativo atual, cria o
  novo). Única função que a UI chama; mantém a lógica de "só 1 ativo"
  num lugar só.

`getWorkouts(userId)` **não muda de assinatura** — continua
retornando todos os planos do usuário (outras telas, como duplicar
plano, podem precisar da lista inteira). Em vez disso, nova função
pura em `src/utils/programs.js`:

```js
// programs: resultado de getPrograms(userId)
// workouts: resultado de getWorkouts(userId)
export const getActiveProgramWorkouts = (workouts, programs) => {
  const active = programs.find((p) => p.status === "active");
  if (!active) {
    // ainda no programa implícito: planos sem programId nenhum
    return workouts.filter((w) => !w.programId);
  }
  return workouts.filter((w) => w.programId === active.id);
};
```

`Dashboard.jsx` e `Workouts.jsx` passam a buscar `getPrograms(userId)`
junto de `getWorkouts(userId)` e aplicar esse filtro antes de usar a
lista pra rotação/"Seus planos"/lista principal da Biblioteca.

## UI / comportamento por tela

**`Workouts.jsx` (Biblioteca):**
- Barra no topo: `Programa: {nome do ativo} · Novo programa`.
- "Novo programa" abre modal simples (reaproveita padrão de modal já
  usado em outras confirmações) com um campo: nome do programa novo.
  Confirmar chama `startNewProgram`.
- Lista de planos abaixo = só os do programa ativo (comportamento
  atual, sem mudança visual).
- Nova seção "Histórico", recolhida por padrão, abaixo da lista
  ativa. Ao expandir, lista os programas arquivados (nome + nº de
  planos). Cada programa arquivado expande pra mostrar seus planos
  como cards (mesmo componente de card, sem o link "Começar treino").
- Menu "⋯" (Excluir) continua funcionando igual em planos ativos e
  arquivados.
- Modo reordenar (↑/↓) só opera sobre a lista ativa (já é assim
  naturalmente, pois só ela é renderizada como lista reordenável).

**`WorkoutView.jsx` (página do plano):**
- Busca o `program` do plano (via `workout.programId`). Se
  `status === "archived"`: esconde o botão "Começar treino", mostra
  badge discreto "Arquivado" perto do título. Histórico, PR, 1RM
  estimado etc. continuam normais (consulta plena).

**`Dashboard.jsx`:**
- `getWorkouts` chamado já filtrado pro programa ativo (ou todos os
  planos sem `programId`, se o implícito ainda não foi materializado)
  antes de alimentar `workoutOfTheDay` e a seção "Seus planos".

## Fora de escopo (decisão explícita)

- Reativar um programa arquivado (virar ativo de novo). Se quiser
  repetir um ciclo antigo, duplica o plano manualmente (recurso já
  existe) pro programa ativo.
- Excluir um programa inteiro de uma vez (só exclusão de plano
  individual, como já existe).
- Qualquer campo de data em `programs` (pedido explícito do usuário:
  "sem data").

## Firestore rules

Adicionar bloco pra nova coleção, mesmo padrão de `workouts`:

Mesmo padrão exato de `workouts`/`sessions` em `firestore.rules`:

```
match /programs/{programId} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
}
```

Deploy (`firebase deploy --only firestore:rules`) só acontece depois
de eu mostrar o diff e o usuário confirmar explicitamente — não faz
parte do "implementar direto".

## Teste / rollout

Sem framework de teste automatizado no repo. Validação por commit:
`npm run lint` + `npm run build` limpos. Roteiro manual (o ambiente
atual não tem browser pra eu dirigir sozinho) pro usuário rodar em
`localhost:5174`:
1. Criar segundo programa, nomeando os dois.
2. Conferir que os planos do programa anterior saem da Home
   (rotação + "Seus planos") mas aparecem em Histórico.
3. Abrir um plano arquivado: sem botão "Começar treino", com badge,
   histórico/PR normais.
4. Reordenar planos ativos: não mexe nos arquivados.
5. Excluir um plano arquivado: funciona igual a um ativo.
