// One-off import of hasaneyldrm/exercises-dataset into Firestore.
// Images are NOT uploaded anywhere — docs just point at the dataset's
// GitHub raw URLs, avoiding the need for a paid Firebase Storage bucket.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=./scripts/serviceAccountKey.json \
//     node scripts/import-exercise-library.js /path/to/exercises-dataset [--dry-run]
//
// The service account JSON comes from Firebase Console > Project settings > Service accounts.
// The dataset path points to a local clone of https://github.com/hasaneyldrm/exercises-dataset.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const datasetDir = args.find((a) => !a.startsWith("--"));

if (!datasetDir) {
  console.error(
    "Usage: node scripts/import-exercise-library.js <path-to-exercises-dataset-clone> [--dry-run]",
  );
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Missing GOOGLE_APPLICATION_CREDENTIALS env var (path to the Firebase service account JSON).",
  );
  process.exit(1);
}
console.log(`Using credentials from ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
const credential = cert(
  JSON.parse(await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf-8")),
);

initializeApp({ credential });

const db = getFirestore();

const exercisesPath = path.join(datasetDir, "data", "exercises.json");
const exercises = JSON.parse(await readFile(exercisesPath, "utf-8"));

console.log(
  `${dryRun ? "[dry-run] " : ""}Importing ${exercises.length} exercises from ${exercisesPath}`,
);

let written = 0;

for (const batchStart of range(0, exercises.length, 400)) {
  const batch = db.batch();
  const chunk = exercises.slice(batchStart, batchStart + 400);

  for (const exercise of chunk) {
    const doc = {
      name: exercise.name,
      category: exercise.category,
      bodyPart: exercise.body_part,
      equipment: exercise.equipment,
      muscleGroup: exercise.muscle_group,
      target: exercise.target,
      secondaryMuscles: exercise.secondary_muscles,
      sourceId: exercise.id,
      attribution: exercise.attribution,
      imageUrl: `${GITHUB_RAW_BASE}/${exercise.image}`,
      gifUrl: `${GITHUB_RAW_BASE}/${exercise.gif_url}`,
    };

    if (dryRun) {
      if (batchStart === 0 && chunk.indexOf(exercise) < 3) {
        console.log("[dry-run] sample doc:", doc);
      }
      continue;
    }

    batch.set(db.collection("exerciseLibrary").doc(exercise.id), doc);
  }

  if (!dryRun) {
    await batch.commit();
    written += chunk.length;
    console.log(`Wrote ${written}/${exercises.length} docs`);
  }
}

console.log(dryRun ? "[dry-run] done, nothing written." : "Import complete.");

function* range(start, end, step) {
  for (let i = start; i < end; i += step) yield i;
}
