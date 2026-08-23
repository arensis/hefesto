/*
 * Backfill de daily_rollups a partir de las medidas historicas.
 * Recorre en streaming (por propietario, ordenado por fecha) las colecciones
 * station_measurements (ownerType=station) y station_group_measurements
 * (ownerType=group), agrupa por dia UTC y upserta el rollup {sum,count,min,max}.
 *
 * Idempotente: recalcula desde los datos crudos (fuente de verdad). Ejecutar
 * EN la Pi (Mongo escucha en localhost) o por tunel SSH.
 *
 * Uso:
 *   node scripts/backfill-daily-rollups.js
 *   MONGO_URI=... DB_NAME=mongo-kairos node scripts/backfill-daily-rollups.js
 */
const { MongoClient } = require('mongodb');

const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/?directConnection=true';
const DB_NAME = process.env.DB_NAME || 'mongo-kairos';
const METRICS = ['temperature', 'humidity', 'airPressure'];

function startOfUTCDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function freshAcc() {
  const acc = {};
  for (const m of METRICS) acc[m] = { sum: 0, count: 0, min: null, max: null };
  return acc;
}

function accumulate(acc, doc) {
  for (const m of METRICS) {
    const value = doc[m];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const a = acc[m];
    a.sum += value;
    a.count += 1;
    if (!a.min || value < a.min.value) a.min = { value, date: doc.date };
    if (!a.max || value > a.max.value) a.max = { value, date: doc.date };
  }
}

// Construye el $set del rollup solo con las metricas que tienen datos.
function buildSet(acc) {
  const set = {};
  for (const m of METRICS) {
    if (acc[m].count > 0) set[m] = acc[m];
  }
  return set;
}

async function backfill(coll, rollups, ownerField, ownerType) {
  const owners = await coll.distinct(ownerField);
  console.log(`\n[${ownerType}] ${owners.length} propietario(s)`);

  for (const ownerId of owners) {
    const cursor = coll
      .find({ [ownerField]: ownerId })
      .project({ date: 1, temperature: 1, humidity: 1, airPressure: 1 })
      .sort({ date: 1 });

    let currentDay = null;
    let acc = freshAcc();
    let days = 0;

    const flush = async () => {
      const set = buildSet(acc);
      if (Object.keys(set).length > 0) {
        await rollups.updateOne(
          { ownerType, ownerId, day: currentDay },
          { $set: set },
          { upsert: true },
        );
        days += 1;
      }
    };

    for await (const doc of cursor) {
      if (!doc.date) continue;
      const day = startOfUTCDay(doc.date);
      if (currentDay && day.getTime() !== currentDay.getTime()) {
        await flush();
        acc = freshAcc();
      }
      currentDay = day;
      accumulate(acc, doc);
    }
    if (currentDay) await flush();

    console.log(`  - ${ownerId}: ${days} dia(s) de rollup`);
  }
}

(async () => {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const rollups = db.collection('daily_rollups');

  // Asegura el indice unico (por si la app no lo creo aun)
  await rollups.createIndex(
    { ownerType: 1, ownerId: 1, day: 1 },
    { unique: true },
  );

  await backfill(
    db.collection('station_measurements'),
    rollups,
    'stationId',
    'station',
  );
  await backfill(
    db.collection('station_group_measurements'),
    rollups,
    'stationGroupId',
    'group',
  );

  console.log('\n✔ Backfill completado.');
  await client.close();
})().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
