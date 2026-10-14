// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: One row per booking status change
// TODO: Add columns (serviceRequestId, fromStatus, toStatus, changedById, note) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class StatusHistory extends Model {
  declare id: number;
}

export function initStatusHistory(sequelize: Sequelize) {
  StatusHistory.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'status_histories' },
  );
}
