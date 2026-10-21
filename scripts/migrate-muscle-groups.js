// One-off backfill: copies `muscleGroup` from exerciseLibrary onto existing
// `exercises` docs that predate the field. Users type free-form names
// ("RDL's", "Sholder Press") while the library uses verbose, formal names,
// so matching is word-subset based (either name's words fully contained in
// the other's) rather than exact string equality. Ambiguous or unmatched
// exercises are left untouched and logged for manual review.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=./scripts/serviceAccountKey.json \
//     node scripts/migrate-muscle-groups.js [--dry-run]

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from "node:fs/promises";

const dryRun = process.argv.includes("--dry-run");

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Missing GOOGLE_APPLICATION_CREDENTIALS env var (path to the Firebase service account JSON).",
  );
  process.exit(1);
}

const credential = cert(
  JSON.parse(
    await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf-8"),
  ),
);
initializeApp({ credential });
const db = getFirestore();

// Common abbreviations and pt-BR gym terms seen in free-typed exercise
// names that don't share any word with the library's (English) spelling.
const SYNONYM_EXPANSIONS = {
  rdl: ["romanian", "deadlift"],
  db: ["dumbbell"],
  bb: ["barbell"],
  supino: ["bench", "press"],
  reto: ["flat"],
  inclinado: ["incline"],
  inclinando: ["incline"],
  triceps: ["triceps"],
  biceps: ["biceps"],
  rosca: ["curl"],
  agachamento: ["squat"],
  remada: ["row"],
  terra: ["deadlift"],
  desenvolvimento: ["press"],
  elevacao: ["raise"],
  panturrilha: ["calf"],
  abdominal: ["crunch"],
  flexao: ["push", "up"],
};

const tokenize = (name) =>
  String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (í -> i, ã -> a, ...)
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .flatMap((token) => SYNONYM_EXPANSIONS[token] || [token]);

const librarySnapshot = await db.collection("exerciseLibrary").get();
const libraryEntries = [];
librarySnapshot.forEach((doc) => {
  const data = doc.data();
  if (!data.name || !data.muscleGroup) return;
  libraryEntries.push({
    name: data.name,
    muscleGroup: data.muscleGroup,
    tokens: new Set(tokenize(data.name)),
  });
});

// Manual fixes for exercises the word-subset match can't resolve (typos,
// ambiguous generic names, abbreviations with no shared words). Fill in
// after reviewing the [ambiguous]/[no match] log lines below.
// doc id -> muscleGroup
const OVERRIDES = {};

const isSubset = (small, big) => [...small].every((t) => big.has(t));

// Returns { muscleGroup } on a confident match, or { candidates } listing
// the muscleGroups/names that partially matched, for manual review.
const findMuscleGroup = (exerciseName) => {
  const exerciseTokens = new Set(tokenize(exerciseName));
  if (exerciseTokens.size === 0) return { candidates: [] };

  const fullMatches = [];
  const partialMatches = [];

  for (const entry of libraryEntries) {
    if (
      isSubset(exerciseTokens, entry.tokens) ||
      isSubset(entry.tokens, exerciseTokens)
    ) {
      fullMatches.push(entry);
      continue;
    }
    const overlap = [...exerciseTokens].filter((t) =>
      entry.tokens.has(t),
    ).length;
    if (overlap / exerciseTokens.size >= 0.5) {
      partialMatches.push({ ...entry, overlap });
    }
  }

  const fullGroups = new Set(fullMatches.map((e) => e.muscleGroup));
  if (fullGroups.size === 1) return { muscleGroup: [...fullGroups][0] };

  const pool = fullGroups.size > 1 ? fullMatches : partialMatches;
  const candidates = pool
    .sort((a, b) => (b.overlap || 0) - (a.overlap || 0))
    .slice(0, 3);

  if (pool.length === 0) return { candidates: [] };

  // Library's primary-muscle label is noisy/inconsistent across near-duplicate
  // entries (e.g. "Chest Press" variants tagged triceps on one row, shoulders
  // on another) — best-effort guess by taking the most frequent label among
  // all matches rather than leaving it unset.
  const counts = new Map();
  for (const entry of pool) {
    counts.set(entry.muscleGroup, (counts.get(entry.muscleGroup) || 0) + 1);
  }
  const [guessedGroup] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  return { muscleGroup: guessedGroup, guessed: true, candidates };
};

const exercisesSnapshot = await db.collection("exercises").get();

let matched = 0;
let guessed = 0;
let skippedHasValue = 0;
let unmatched = 0;

const batch = db.batch();

exercisesSnapshot.forEach((doc) => {
  const data = doc.data();
  if (data.muscleGroup) {
    skippedHasValue++;
    return;
  }

  if (OVERRIDES[doc.id]) {
    matched++;
    if (!dryRun) {
      batch.update(doc.ref, { muscleGroup: OVERRIDES[doc.id] });
    }
    return;
  }

  const result = findMuscleGroup(data.name);
  if (result.muscleGroup) {
    if (result.guessed) {
      guessed++;
      const options = result.candidates
        .map((c) => `${c.muscleGroup} (${c.name})`)
        .join(" | ");
      console.log(
        `[guessed] "${data.name}" (doc ${doc.id}) -> ${result.muscleGroup} (from: ${options})`,
      );
    } else {
      matched++;
    }
    if (!dryRun) {
      batch.update(doc.ref, { muscleGroup: result.muscleGroup });
    }
    return;
  }

  unmatched++;
  console.log(`[no match] "${data.name}" (doc ${doc.id})`);
});

if (!dryRun && matched + guessed > 0) {
  await batch.commit();
}

console.log(
  `${dryRun ? "[dry-run] " : ""}Matched: ${matched}, guessed: ${guessed}, already had muscleGroup: ${skippedHasValue}, unmatched: ${unmatched}`,
);
