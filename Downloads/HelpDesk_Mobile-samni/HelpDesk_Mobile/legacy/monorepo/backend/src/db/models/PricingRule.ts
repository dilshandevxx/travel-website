// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Admin-set price limits per category
// TODO: Add columns (categoryId, baseFee, minHourlyRate, maxHourlyRate) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class PricingRule extends Model {
  declare id: number;
}

export function initPricingRule(sequelize: Sequelize) {
  PricingRule.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'pricing_rules' },
  );
}
