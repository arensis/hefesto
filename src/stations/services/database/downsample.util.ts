// Downsampling de una serie de medidas ordenada por fecha: conserva una medida
// por cada bucket de N minutos (la primera de cada bucket). Aligera el payload
// y el render del grafico sin borrar datos crudos en la base de datos.
// bucketMinutes <= 0 => sin downsampling (devuelve todo).
export function downsampleByBucket<T extends { date: Date | string }>(
  measurements: T[],
  bucketMinutes: number,
): T[] {
  if (!bucketMinutes || bucketMinutes <= 0) {
    return measurements;
  }

  const bucketMs = bucketMinutes * 60 * 1000;
  const result: T[] = [];
  let lastBucket: number | null = null;

  for (const measurement of measurements) {
    const bucket = Math.floor(new Date(measurement.date).getTime() / bucketMs);
    if (bucket !== lastBucket) {
      result.push(measurement);
      lastBucket = bucket;
    }
  }

  return result;
}
