# Programas de treino (histórico de planos) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** deixar o usuário criar um novo "Programa" de treino sem apagar os planos antigos — o programa anterior vira histórico (só consulta), a Home e a Biblioteca passam a mostrar só o programa ativo.

**Architecture:** nova coleção Firestore `programs` (status `active`/`archived`), campo opcional `workouts.programId`. Sem migração eager — planos sem `programId` pertencem a um "programa implícito" até o usuário clicar em "Novo programa" pela primeira vez, momento em que o implícito é materializado como arquivado e o novo programa nasce ativo. Filtro ativo/arquivado é sempre client-side (sem query nova no Firestore, sem índice composto).

**Tech Stack:** React 19 + Vite, Firestore (firebase v10 SDK), Tailwind. Sem framework de teste automatizado no repo (confirmado: sem vitest/jest, sem arquivos `*.test.*`).

**Spec:** `docs/superpowers/specs/2026-10-21-workout-programs-design.md`

## Global Constraints

- Tema escuro/âmbar não muda — toda UI nova reusa classes/padrões já existentes no arquivo que está sendo editado (`Card`, `Button`, `buttonSecondaryLinkClass`, `motion`/`AnimatePresence`, mesma paleta `surface2`/`border-subtle`/`danger`/`primary`).
- Sem framework de teste: cada task troca "escrever teste" por "lint limpo" (`npx eslint <arquivo>`) e, quando fizer sentido, um sanity check descartável via `node -e "..."` (não vira arquivo de teste, só verificação pontual, como já foi feito nesta mesma sessão pro regex de equipamento).
- `firestore.rules` só é commitado neste plano — o deploy (`firebase deploy --only firestore:rules`) fica fora do escopo de qualquer task e só roda depois de confirmação explícita fora deste plano.
- Nunca escrever campo `undefined` num `addDoc`/`updateDoc` do Firestore (lança erro) — todo `programId` opcional entra via spread condicional: `...(programId ? { programId } : {})`.
- Nomes/strings de UI em PT-BR, seguindo o vocabulário já usado no app ("Programa", "Histórico", "Arquivado").

---

## Task 1: Firestore rules — coleção `programs`

**Files:**
- Modify: `firestore.rules`

**Interfaces:**
- Produces: regra Firestore pra coleção `programs`, mesmo padrão de `workouts`/`sessions` (campo `userId` no doc, `request.auth.uid` precisa bater).

- [ ] **Step 1: Adicionar o bloco de regra**

Em `firestore.rules`, logo depois do bloco `match /sessions/{sessionId} { ... }` (antes do fechamento do `match /databases/{database}/documents {`), adicionar:

```
    // Programs: Users can only read/write their own programs
    match /programs/{programId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
```

- [ ] **Step 2: Conferir sintaxe**

Rode: `cat firestore.rules` e confirme visualmente que chaves fecham certo (sem rodar deploy — isso é decisão à parte, fora deste plano).

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: regra do Firestore pra nova coleção programs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `firestore.js` — CRUD e orquestração de programas

**Files:**
- Modify: `src/services/firestore.js`

**Interfaces:**
- Consumes: padrão existente de `getWorkouts`/`getWorkout`/`addWorkout`/`updateWorkout` (mesmas funções `collection`, `addDoc`, `getDoc`, `getDocs`, `doc`, `updateDoc`, `query`, `where`, `orderBy` já importadas no topo do arquivo).
- Produces (usadas pelas tasks seguintes):
  - `getPrograms(userId): Promise<Array<{id, userId, name, status, createdAt}>>`
  - `getProgram(id): Promise<{id, userId, name, status, createdAt} | null>`
  - `createProgram({userId, name, status}): Promise<DocumentReference>`
  - `archiveProgram(id): Promise<void>`
  - `startNewProgram(userId, newName): Promise<{id, name, status}>` — devolve o novo programa ativo já criado.

- [ ] **Step 1: Implementar `getPrograms`, `getProgram`, `createProgram`, `archiveProgram`**

Adicionar no fim de `src/services/firestore.js` (depois do bloco `// Sessions`):

```js
// Programs — groups workouts into "active" vs "archived" so creating a
// new training cycle doesn't force deleting the old one.
export const getPrograms = async (userId) => {
  const q = query(collection(db, "programs"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getProgram = async (id) => {
  const snapshot = await getDoc(doc(db, "programs", id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const createProgram = async ({ userId, name, status }) => {
  return await addDoc(collection(db, "programs"), {
    userId,
    name,
    status,
    createdAt: new Date(),
  });
};

export const archiveProgram = async (id) => {
  return await updateDoc(doc(db, "programs", id), { status: "archived" });
};
```

- [ ] **Step 2: Implementar `startNewProgram`**

Logo abaixo, no mesmo arquivo:

```js
// Orchestrates "start a new training cycle": materializes the implicit
// program (workouts with no programId yet) as archived on first use,
// archives whatever is currently active, and creates the new active one.
// Single place that enforces "only one active program at a time".
export const startNewProgram = async (userId, newName) => {
  const [programs, workouts] = await Promise.all([
    getPrograms(userId),
    getWorkouts(userId),
  ]);

  const currentActive = programs.find((p) => p.status === "active");

  if (currentActive) {
    await archiveProgram(currentActive.id);
  } else {
    const unassigned = workouts.filter((w) => !w.programId);
    if (unassigned.length > 0) {
      const implicitRef = await createProgram({
        userId,
        name: "Programa anterior",
        status: "archived",
      });
      await Promise.all(
        unassigned.map((w) =>
          updateWorkout(w.id, { programId: implicitRef.id }),
        ),
      );
    }
  }

  const newProgramRef = await createProgram({
    userId,
    name: newName,
    status: "active",
  });
  return { id: newProgramRef.id, name: newName, status: "active" };
};
```

- [ ] **Step 3: Lint**

Rode: `npx eslint src/services/firestore.js`
Esperado: sem erros novos (arquivo não tinha nenhum erro antes desta task).

- [ ] **Step 4: Sanity check manual (sem Firestore real)**

Rode pra conferir que a lógica de "qual é o ativo" está certa antes de plugar em qualquer UI:

```bash
node -e "
const programs = [{id:'p1', status:'archived'}, {id:'p2', status:'active'}];
const active = programs.find(p => p.status === 'active');
console.log(active?.id === 'p2' ? 'OK' : 'FAIL');
"
```

- [ ] **Step 5: Commit**

```bash
git add src/services/firestore.js
git commit -m "feat: funções de Programas (getPrograms, startNewProgram, ...) no firestore.js

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: `utils/programs.js` — filtro puro do programa ativo

**Files:**
- Create: `src/utils/programs.js`

**Interfaces:**
- Consumes: array de `workouts` (de `getWorkouts`) e array de `programs` (de `getPrograms`), ambos já carregados pelo chamador.
- Produces: `getActiveProgramWorkouts(workouts, programs): Array<workout>` e `getArchivedPrograms(programs): Array<program>` (ordenado, mais recente primeiro) — usados pelas Tasks 5, 6 e 7.

- [ ] **Step 1: Implementar**

```js
// Pure helpers — no Firestore calls here. Caller fetches workouts/programs
// once and reuses these across renders without refetching.

export const getActiveProgram = (programs) =>
  programs.find((p) => p.status === "active") || null;

export const getActiveProgramWorkouts = (workouts, programs) => {
  const active = getActiveProgram(programs);
  if (!active) {
    // Still on the implicit program: every workout with no programId.
    return workouts.filter((w) => !w.programId);
  }
  return workouts.filter((w) => w.programId === active.id);
};

export const getArchivedPrograms = (programs) =>
  [...programs]
    .filter((p) => p.status === "archived")
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

export const getProgramWorkouts = (workouts, programId) =>
  workouts.filter((w) => w.programId === programId);
```

- [ ] **Step 2: Lint**

Rode: `npx eslint src/utils/programs.js`
Esperado: sem erros.

- [ ] **Step 3: Sanity check manual**

```bash
node -e "
const workouts = [{id:'w1'}, {id:'w2', programId:'p1'}, {id:'w3', programId:'p2'}];
const programs = [{id:'p1', status:'archived'}, {id:'p2', status:'active'}];
const getActiveProgram = (ps) => ps.find((p) => p.status === 'active') || null;
const getActiveProgramWorkouts = (ws, ps) => {
  const active = getActiveProgram(ps);
  if (!active) return ws.filter((w) => !w.programId);
  return ws.filter((w) => w.programId === active.id);
};
const result = getActiveProgramWorkouts(workouts, programs);
console.log(result.length === 1 && result[0].id === 'w3' ? 'OK' : 'FAIL ' + JSON.stringify(result));
"
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/programs.js
git commit -m "feat: utils/programs.js — filtro puro de workouts do programa ativo

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: `WorkoutForm.jsx` — novo plano entra no programa ativo

**Files:**
- Modify: `src/pages/WorkoutForm.jsx:1-20` (imports), `:103-137` (`handleDuplicate`), `:139-153` (`handleSubmit`, caminho `!isEdit`)

**Interfaces:**
- Consumes: `getPrograms(userId)` e `getActiveProgram(programs)` (Task 2 e 3).

- [ ] **Step 1: Importar e buscar o programa ativo**

Em `src/pages/WorkoutForm.jsx`, no import de `../services/firestore` (linha 4-12), adicionar `getPrograms`. Adicionar import:

```js
import { getActiveProgram } from "../utils/programs";
```

Adicionar um state e um effect (perto da declaração de `originalExerciseIdsRef`, linha 31):

```js
const [activeProgramId, setActiveProgramId] = useState(null);

useEffect(() => {
  if (!user) return;
  getPrograms(user.uid).then((programs) => {
    setActiveProgramId(getActiveProgram(programs)?.id || null);
  });
}, [user]);
```

- [ ] **Step 2: Aplicar `programId` nos dois pontos de criação**

Em `handleDuplicate` (linha 107-112), trocar:

```js
      const workoutRef = await addWorkout({
        name: duplicateName,
        userId: user.uid,
        order: Date.now(),
        createdAt: new Date(),
      });
```

por:

```js
      const workoutRef = await addWorkout({
        name: duplicateName,
        userId: user.uid,
        order: Date.now(),
        createdAt: new Date(),
        ...(activeProgramId ? { programId: activeProgramId } : {}),
      });
```

Em `handleSubmit` (linha 146-151), trocar:

```js
        const workoutRef = await addWorkout({
          name,
          userId: user.uid,
          order: Date.now(), // Simple order
          createdAt: new Date(),
        });
```

por:

```js
        const workoutRef = await addWorkout({
          name,
          userId: user.uid,
          order: Date.now(), // Simple order
          createdAt: new Date(),
          ...(activeProgramId ? { programId: activeProgramId } : {}),
        });
```

- [ ] **Step 3: Lint**

Rode: `npx eslint src/pages/WorkoutForm.jsx`
Esperado: sem erros novos.

- [ ] **Step 4: Build**

Rode: `npm run build`
Esperado: build limpo (pega erro de import/sintaxe que o lint não pegasse).

- [ ] **Step 5: Commit**

```bash
git add src/pages/WorkoutForm.jsx
git commit -m "feat: plano novo/duplicado entra no programa ativo

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: `Dashboard.jsx` — rotação e "Seus planos" só do programa ativo

**Files:**
- Modify: `src/pages/Dashboard.jsx:1-54` (imports + fetch), `:94-104` (`workoutOfTheDay`), `:~364-430` ("Seus planos" render — mesmo bloco onde já existe `const done = sessions.some(...)` de uma sessão anterior)

**Interfaces:**
- Consumes: `getPrograms` (Task 2), `getActiveProgramWorkouts` (Task 3).
- Importante: `workoutMap`/`recentSessions` (nomes de sessões passadas em "Recentes") continuam usando a lista **completa** `workouts` — só a rotação e "Seus planos" usam a lista filtrada. Não filtrar `workouts` no state geral, senão sessão de plano arquivado perde o nome na lista de recentes.

- [ ] **Step 1: Buscar programas junto dos workouts/sessions**

Adicionar import:

```js
import { getPrograms } from "../services/firestore"; // junto do import existente de getSessions/getWorkouts
import { getActiveProgramWorkouts } from "../utils/programs";
```

Adicionar state `const [programs, setPrograms] = useState([]);` perto de `sessions`/`workouts`.

Nos dois lugares que hoje fazem `Promise.all([getWorkouts(user.uid), getSessions(user.uid)])` (`loadData`, linha ~45-48, e o `useEffect` de carga inicial, linha ~62-65), trocar pra `Promise.all([getWorkouts(user.uid), getSessions(user.uid), getPrograms(user.uid)])` e adicionar `setPrograms(programsData)` ao lado de `setWorkouts`/`setSessions` nos dois lugares.

- [ ] **Step 2: Derivar lista ativa**

Logo depois do `useMemo` de `workoutMap` (linha ~128-134), adicionar:

```js
const currentProgramWorkouts = useMemo(
  () => getActiveProgramWorkouts(workouts, programs),
  [workouts, programs],
);
```

- [ ] **Step 3: Usar `currentProgramWorkouts` na rotação e em "Seus planos"**

Em `workoutOfTheDay` (linha ~94-104), trocar toda referência a `workouts` por `currentProgramWorkouts` (inclusive a dependência do `useMemo`):

```js
const workoutOfTheDay = useMemo(() => {
  if (currentProgramWorkouts.length === 0) return null;

  const lastSession = sessions[0];
  if (!lastSession) return currentProgramWorkouts[0];

  const lastIndex = currentProgramWorkouts.findIndex(
    (w) => w.id === lastSession.workoutId,
  );
  if (lastIndex === -1) return currentProgramWorkouts[0];

  return currentProgramWorkouts[(lastIndex + 1) % currentProgramWorkouts.length];
}, [currentProgramWorkouts, sessions]);
```

Na seção "Seus planos" (o bloco com `{workouts.length === 0 ? (...) : (<div>{workouts.map((workout, index) => {...}`), trocar as duas ocorrências de `workouts` (`workouts.length === 0` e `workouts.map(...)`) por `currentProgramWorkouts.length === 0` e `currentProgramWorkouts.map(...)`. Não mexer em `workoutMap`/`recentSessions`/`activeWorkout` (o banner "Retomar treino" já existente, de outra feature) — esses continuam na lista completa.

- [ ] **Step 4: Lint**

Rode: `npx eslint src/pages/Dashboard.jsx`
Esperado: sem erros novos.

- [ ] **Step 5: Build**

Rode: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: Home mostra rotação e 'Seus planos' só do programa ativo

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: `Workouts.jsx` — barra de programa + "Novo programa" + lista filtrada

**Files:**
- Modify: `src/pages/Workouts.jsx` (imports, fetch, novo state, novo modal, filtro da lista principal)

**Interfaces:**
- Consumes: `getPrograms`, `startNewProgram` (Task 2), `getActiveProgram`/`getActiveProgramWorkouts` (Task 3).
- Produces: estado `programs` e função `reloadAll` reutilizável por esta task e pela Task 7.

- [ ] **Step 1: Refatorar o fetch pra uma função reutilizável**

Trocar o corpo do `useEffect` (linhas 36-73) — hoje é uma função anônima `fetchWorkouts` só chamada no mount — por um `loadData` nomeado via `useCallback`, igual ao padrão já usado em `Dashboard.jsx`, pra poder chamar de novo depois de criar um programa:

```js
const loadData = useCallback(async () => {
  if (!user) return;
  const [workoutsData, programsData] = await Promise.all([
    getWorkouts(user.uid),
    getPrograms(user.uid),
  ]);
  const [exercisesByWorkout, sessions] = await Promise.all([
    Promise.all(workoutsData.map((w) => getExercises(w.id))),
    getSessions(user.uid),
  ]);

  const lastSessionMsByWorkout = {};
  sessions.forEach((session) => {
    const ts = getLogTimestampMs(session);
    const current = lastSessionMsByWorkout[session.workoutId];
    if (!current || ts > current) {
      lastSessionMsByWorkout[session.workoutId] = ts;
    }
  });

  const enriched = workoutsData.map((workout, index) => {
    const exercises = exercisesByWorkout[index];
    const totalSets = exercises.reduce(
      (sum, ex) => sum + (Number(ex.sets) || 1),
      0,
    );
    return {
      ...workout,
      exerciseCount: exercises.length,
      estimatedDurationMs:
        exercises.length > 0 ? estimateDurationMs(totalSets) : null,
      lastSessionMs: lastSessionMsByWorkout[workout.id] || null,
    };
  });

  setWorkouts(enriched);
  setPrograms(programsData);
  setLoading(false);
}, [user]);

useEffect(() => {
  loadData();
}, [loadData]);
```

Adicionar import `useCallback` em `import { useEffect, useState } from "react";` → `import { useCallback, useEffect, useState } from "react";`. Adicionar `getPrograms, startNewProgram` ao import de `../services/firestore`. Adicionar `const [programs, setPrograms] = useState([]);` junto dos outros states.

- [ ] **Step 2: Derivar lista ativa e nome do programa**

Adicionar import `import { getActiveProgram, getActiveProgramWorkouts } from "../utils/programs";`.

Depois dos states, adicionar:

```js
const activeProgram = getActiveProgram(programs);
const currentProgramWorkouts = getActiveProgramWorkouts(workouts, programs);
const activeProgramName = activeProgram?.name || "Treinos";
```

- [ ] **Step 3: Trocar a lista principal pra usar `currentProgramWorkouts`**

No render, trocar `workouts.length === 0` e `(isReorderMode ? draftWorkouts : workouts).map(...)` pra usar `currentProgramWorkouts` no lugar de `workouts` (linhas 189 e 209). `startReorder` (linha 75-78) também passa a fazer `setDraftWorkouts([...currentProgramWorkouts])` em vez de `[...workouts]` — assim o modo reordenar nunca inclui plano arquivado.

- [ ] **Step 4: Barra "Programa: {nome} · Novo programa" + modal**

Adicionar state `const [showNewProgramModal, setShowNewProgramModal] = useState(false);` e `const [newProgramName, setNewProgramName] = useState("");`.

Adicionar handler:

```js
const handleCreateProgram = async () => {
  if (!newProgramName.trim()) return;
  try {
    await startNewProgram(user.uid, newProgramName.trim());
    setShowNewProgramModal(false);
    setNewProgramName("");
    setLoading(true);
    await loadData();
    toast.success("Novo programa criado!");
  } catch (error) {
    toast.error("Erro ao criar programa: " + error.message);
  }
};
```

No JSX, logo acima do bloco `<h3>Biblioteca</h3>` (linha ~177-185), adicionar uma linha com o nome do programa ativo e o botão:

```jsx
<div className="flex items-center justify-between mb-4">
  <p className="text-sm font-semibold text-text-secondary">
    Programa: <span className="text-text-primary">{activeProgramName}</span>
  </p>
  <button
    type="button"
    onClick={() => setShowNewProgramModal(true)}
    className="text-xs font-bold text-primary hover:underline"
  >
    Novo programa
  </button>
</div>
```

E, perto dos outros modais do app (mesmo padrão `AnimatePresence`/`motion.div` usado em `WorkoutStart.jsx` pros modais de confirmação — reaproveitar a mesma estrutura visual: overlay `fixed inset-0 bg-black/60 backdrop-blur-sm`, card `bg-surface2 border border-border-subtle rounded-2xl p-5`), adicionar ao fim do componente, antes do `</Container>`:

```jsx
<AnimatePresence>
  {showNewProgramModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowNewProgramModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface2 border border-border-subtle rounded-2xl p-5 max-w-sm w-full shadow-surface-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-text-primary mb-2">
          Novo programa
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          "{activeProgramName}" vira histórico. Como se chama o novo programa?
        </p>
        <Input
          value={newProgramName}
          onChange={(e) => setNewProgramName(e.target.value)}
          placeholder="Ex: Bloco Hipertrofia"
        />
        <div className="flex gap-3 mt-4">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => setShowNewProgramModal(false)}
          >
            Cancelar
          </Button>
          <Button size="md" className="flex-1" onClick={handleCreateProgram}>
            Criar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

Adicionar imports: `AnimatePresence` em `import { motion } from "framer-motion";` → `import { motion, AnimatePresence } from "framer-motion";`, e `import Input from "../components/Input";`.

- [ ] **Step 5: Lint**

Rode: `npx eslint src/pages/Workouts.jsx`
Esperado: sem erros novos (atenção a imports não usados se algum nome mudar).

- [ ] **Step 6: Build**

Rode: `npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/pages/Workouts.jsx
git commit -m "feat: Biblioteca mostra programa ativo e permite criar programa novo

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: `Workouts.jsx` — seção "Histórico" (programas arquivados)

**Files:**
- Modify: `src/pages/Workouts.jsx` (novo bloco de render, depois da lista principal)

**Interfaces:**
- Consumes: `getArchivedPrograms`, `getProgramWorkouts` (Task 3), `programs`/`workouts` (state já carregado na Task 6).

- [ ] **Step 1: Importar e derivar**

Adicionar `getArchivedPrograms, getProgramWorkouts` ao import de `../utils/programs` (já criado na Task 6).

Depois de `activeProgramName` (Task 6, Step 2), adicionar:

```js
const archivedPrograms = getArchivedPrograms(programs);
const [expandedHistoryId, setExpandedHistoryId] = useState(null);
```
(o `useState` junto dos outros states, não misturado com as constantes derivadas.)

- [ ] **Step 2: Renderizar a seção**

Depois do bloco que fecha a lista principal (`</div>` que fecha `{(isReorderMode ? draftWorkouts : currentProgramWorkouts).map(...)}`, antes do `</Container>` final), adicionar, só quando `archivedPrograms.length > 0`:

```jsx
{archivedPrograms.length > 0 && (
  <div className="mt-8">
    <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">
      Histórico
    </h3>
    <div className="flex flex-col gap-2">
      {archivedPrograms.map((program) => {
        const programWorkouts = getProgramWorkouts(workouts, program.id);
        const isExpanded = expandedHistoryId === program.id;
        return (
          <div key={program.id}>
            <button
              type="button"
              onClick={() =>
                setExpandedHistoryId(isExpanded ? null : program.id)
              }
              className="w-full flex items-center justify-between rounded-xl bg-surface2 border border-border-subtle px-4 py-3 text-left"
            >
              <span className="text-sm font-bold text-text-primary">
                {program.name}
              </span>
              <span className="text-xs text-text-muted">
                {programWorkouts.length}{" "}
                {pluralize(programWorkouts.length, "plano", "planos")}
              </span>
            </button>
            {isExpanded && (
              <div className="flex flex-col gap-2 mt-2 pl-2">
                {programWorkouts.map((workout) => (
                  <Card key={workout.id} className="p-4">
                    <h4 className="text-sm font-bold text-text-primary mb-2">
                      {workout.name}
                    </h4>
                    <Link
                      to={`/workout/${workout.id}`}
                      className={buttonSecondaryLinkClass}
                    >
                      Abrir
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
```

(Cards de histórico mostram só "Abrir" — sem "Editar" nem metadados de duração, já que é consulta; quem decide esconder "Começar treino" é a página do plano, Task 8.)

- [ ] **Step 3: Lint**

Rode: `npx eslint src/pages/Workouts.jsx`

- [ ] **Step 4: Build**

Rode: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/pages/Workouts.jsx
git commit -m "feat: seção Histórico com programas arquivados na Biblioteca

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: `WorkoutView.jsx` — esconder "Começar treino" em plano arquivado

**Files:**
- Modify: `src/pages/WorkoutView.jsx:1-20` (imports), `:43-80` (fetch), `:135-159` (header + botão "Começar treino")

**Interfaces:**
- Consumes: `getProgram` (Task 2).

- [ ] **Step 1: Buscar o programa do plano**

Adicionar `getProgram` ao import de `../services/firestore` (linha 4-9).

Adicionar state `const [program, setProgram] = useState(null);` perto de `workout`.

No `fetchData` (linha 44-80), depois de `setWorkout(workoutData)`, adicionar:

```js
if (workoutData?.programId) {
  const programData = await getProgram(workoutData.programId);
  setProgram(programData);
}
```

- [ ] **Step 2: Esconder o botão e mostrar o badge**

O botão "Começar treino" hoje é (linha ~153-158):

```jsx
<Link
  to={`/workout/${id}/start`}
  className={`${buttonPrimaryLinkClass} mb-8 touch-feedback min-h-[48px] flex items-center justify-center`}
>
  Começar treino
</Link>
```

Envolver com a condição `program?.status !== "archived"`, e adicionar um badge "Arquivado" no título do `Container` quando arquivado. `Container` é usado assim hoje (linha 136-139):

```jsx
<Container
  title={workout?.name || "Plano"}
  subtitle="Revisão rápida antes da sessão."
>
```

Trocar `subtitle` condicionalmente:

```jsx
<Container
  title={workout?.name || "Plano"}
  subtitle={
    program?.status === "archived"
      ? "Programa arquivado · só consulta"
      : "Revisão rápida antes da sessão."
  }
>
```

E envolver o `<motion.div>` que contém o Link "Começar treino" (linha ~147-159) com `{program?.status !== "archived" && ( ... )}`.

- [ ] **Step 3: Lint**

Rode: `npx eslint src/pages/WorkoutView.jsx`

- [ ] **Step 4: Build**

Rode: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/pages/WorkoutView.jsx
git commit -m "feat: plano de programa arquivado vira só consulta (sem Começar treino)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Verificação manual final (pós Task 8)

Sem browser disponível neste ambiente pra rodar sozinho — roteiro pro usuário testar em `localhost:5174`:
1. Biblioteca mostra "Programa: Treinos" (ou nome já existente) e planos de sempre.
2. Clicar "Novo programa", nomear, confirmar.
3. Biblioteca atualiza: planos antigos somem da lista principal, aparecem em "Histórico" (expandir mostra os cards).
4. Home: rotação "treino do dia" e "Seus planos" não mostram mais os planos antigos; "Recentes"/sessões passadas continuam com nome certo.
5. Abrir um plano do histórico: sem botão "Começar treino", subtítulo "Programa arquivado · só consulta", histórico/PR normais.
6. Criar um plano novo: aparece na lista ativa, não no histórico.
7. "Organizar treinos" (reordenar): só mexe nos planos ativos.
8. Excluir um plano de dentro do histórico: continua funcionando.
