/*
 * Downsampling de station_measurements: conserva 1 medida por bucket de N minutos
 * (por estacion) y borra el resto. Pensado para limpiar datos historicos densos.
 *
 * SEGURIDAD:
 *   - Por defecto DRY_RUN=true: solo informa, NO borra.
 *   - Haz SIEMPRE un mongodump antes de ejecutarlo con DRY_RUN=false.
 *   - Procesa dia a dia para no cargar millones de documentos en memoria.
 *
 * Uso:
 *   node scripts/downsample-measurements.js                 # simulacion (no borra)
 *   DRY_RUN=false node scripts/downsample-measurements.js   # borra de verdad
 *
 * Variables opcionales:
 *   MONGO_URI    (default: mongodb://127.0.0.1:27017/?directConnection=true)
 *   DB_NAME      (default: mongo-kairos)
 *   BUCKET_MIN   (default: 5)      minutos por bucket a conservar
 *   STATION_ID   (default: todas)  limitar a una estacion concreta
 */
const { MongoClient } = require('mongodb');

const DRY_RUN = process.env.DRY_RUN !== 'false';
const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/?directConnection=true';
const DB_NAME = process.env.DB_NAME || 'mongo-kairos';
const BUCKET_MS = (parseInt(process.env.BUCKET_MIN || '5', 10)) * 60 * 1000;
const STATION_ID = process.env.STATION_ID || null;

(async () => {
  const client = new MongoClient(URI);
  await client.connect();
  const col = client.db(DB_NAME).collection('station_measurements');

  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN (no borra)' : 'BORRADO REAL'} | bucket=${BUCKET_MS / 60000} min` +
              (STATION_ID ? ` | estacion=${STATION_ID}` : ' | todas las estaciones'));

  const match = STATION_ID ? { stationId: STATION_ID } : {};
  const range = await col.aggregate([
    { $match: match },
    { $group: { _id: null, min: { $min: '$date' }, max: { $max: '$date' } } },
  ]).toArray();
  if (!range.length) { console.log('Sin datos.'); await client.close(); return; }

  const start = new Date(range[0].min); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(range[0].max);
  let totalKept = 0, totalDeleted = 0;

  for (let day = new Date(start); day < end; day.setUTCDate(day.getUTCDate() + 1)) {
    const dayStart = new Date(day);
    const dayEnd = new Date(day); dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const docs = await col.find(
      { ...match, date: { $gte: dayStart, $lt: dayEnd } },
      { projection: { _id: 1, date: 1, stationId: 1 }, sort: { date: 1 } },
    ).toArray();
    if (!docs.length) continue;

    const seen = new Set();
    const toDelete = [];
    for (const d of docs) {
      const key = d.stationId + '|' + Math.floor(new Date(d.date).getTime() / BUCKET_MS);
      if (seen.has(key)) toDelete.push(d._id); // ya hay uno en este bucket -> sobra
      else seen.add(key);
    }

    totalKept += seen.size;
    totalDeleted += toDelete.length;

    if (!DRY_RUN && toDelete.length) {
      // borrar por lotes para no mandar arrays gigantes
      for (let i = 0; i < toDelete.length; i += 5000) {
        await col.deleteMany({ _id: { $in: toDelete.slice(i, i + 5000) } });
      }
    }
    console.log(`  ${dayStart.toISOString().slice(0, 10)}: ${docs.length} -> conservar ${seen.size}, borrar ${toDelete.length}`);
  }

  console.log(`\nTOTAL: conservar ${totalKept}, borrar ${totalDeleted}` + (DRY_RUN ? '  (DRY-RUN: no se borro nada)' : '  (BORRADO REALIZADO)'));
  await client.close();
})().catch(e => { console.error('❌', e); process.exit(1); });
