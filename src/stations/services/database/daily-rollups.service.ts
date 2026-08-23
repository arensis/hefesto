import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import {
  DailyRollupEntity,
  Extreme,
  MetricRollup,
  RollupOwnerType,
} from '../../database/model/daily-rollup.entity';
import { AggregatePeriod } from '../../dto/aggregate-query.dto';

const METRICS = ['temperature', 'humidity', 'airPressure'] as const;
type Metric = (typeof METRICS)[number];

export interface MetricAggregate {
  avg: number;
  min: Extreme | null;
  max: Extreme | null;
}

export interface AggregateResult {
  period: AggregatePeriod;
  from: Date;
  to: Date;
  temperature: MetricAggregate | null;
  humidity: MetricAggregate | null;
  airPressure: MetricAggregate | null;
}

@Injectable()
export class DailyRollupsService {
  constructor(
    @InjectModel(DailyRollupEntity.name)
    private dailyRollupModel: Model<DailyRollupEntity>,
  ) {}

  // Actualiza (upsert) el rollup del dia con una nueva medicion: acumula
  // sum/count y recalcula min/max (con su fecha) mediante un pipeline update.
  async applyMeasurement(
    ownerType: RollupOwnerType,
    ownerId: string,
    date: Date,
    measurement: Partial<Record<Metric, number>>,
    session?: ClientSession,
  ): Promise<void> {
    const day = this.startOfUTCDay(date);

    const set: Record<string, unknown> = {};
    for (const field of METRICS) {
      const value = measurement[field];
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;

      set[`${field}.sum`] = { $add: [{ $ifNull: [`$${field}.sum`, 0] }, value] };
      set[`${field}.count`] = {
        $add: [{ $ifNull: [`$${field}.count`, 0] }, 1],
      };
      set[`${field}.min`] = {
        $cond: [
          {
            $or: [
              { $eq: [{ $type: `$${field}.min` }, 'missing'] },
              { $lt: [value, `$${field}.min.value`] },
            ],
          },
          { value, date },
          `$${field}.min`,
        ],
      };
      set[`${field}.max`] = {
        $cond: [
          {
            $or: [
              { $eq: [{ $type: `$${field}.max` }, 'missing'] },
              { $gt: [value, `$${field}.max.value`] },
            ],
          },
          { value, date },
          `$${field}.max`,
        ],
      };
    }

    if (Object.keys(set).length === 0) return;

    await this.dailyRollupModel.updateOne(
      { ownerType, ownerId, day },
      [{ $set: set }],
      { upsert: true, session },
    );
  }

  // Devuelve los agregados (media/min/max) del periodo indicado, combinando
  // los rollups diarios que caen en el rango.
  async getAggregate(
    ownerType: RollupOwnerType,
    ownerId: string,
    period: AggregatePeriod,
    date: Date,
  ): Promise<AggregateResult> {
    const { from, to } = this.rangeFor(period, date);

    const rollups = await this.dailyRollupModel
      .find({ ownerType, ownerId, day: { $gte: from, $lt: to } })
      .lean();

    const result: AggregateResult = {
      period,
      from,
      to,
      temperature: null,
      humidity: null,
      airPressure: null,
    };

    for (const field of METRICS) {
      result[field] = this.combineMetric(
        rollups.map((rollup) => rollup[field]).filter(Boolean) as MetricRollup[],
      );
    }

    return result;
  }

  private combineMetric(metrics: MetricRollup[]): MetricAggregate | null {
    let sum = 0;
    let count = 0;
    let min: Extreme | null = null;
    let max: Extreme | null = null;

    for (const metric of metrics) {
      sum += metric.sum ?? 0;
      count += metric.count ?? 0;
      if (metric.min && (!min || metric.min.value < min.value)) {
        min = metric.min;
      }
      if (metric.max && (!max || metric.max.value > max.value)) {
        max = metric.max;
      }
    }

    if (count === 0) return null;

    return { avg: sum / count, min, max };
  }

  private startOfUTCDay(date: Date): Date {
    const day = new Date(date);
    day.setUTCHours(0, 0, 0, 0);
    return day;
  }

  private rangeFor(
    period: AggregatePeriod,
    date: Date,
  ): { from: Date; to: Date } {
    const from = this.startOfUTCDay(date);
    const to = new Date(from);

    if (period === 'day') {
      to.setUTCDate(from.getUTCDate() + 1);
    } else if (period === 'month') {
      from.setUTCDate(1);
      to.setTime(from.getTime());
      to.setUTCMonth(from.getUTCMonth() + 1);
    } else {
      from.setUTCMonth(0, 1);
      to.setTime(from.getTime());
      to.setUTCFullYear(from.getUTCFullYear() + 1);
    }

    return { from, to };
  }
}
