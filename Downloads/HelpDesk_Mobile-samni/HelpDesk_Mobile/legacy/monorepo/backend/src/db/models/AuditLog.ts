// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Record of admin actions
// TODO: Add columns (actorId, action, entityType, entityId, details) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class AuditLog extends Model {
  declare id: number;
}

export function initAuditLog(sequelize: Sequelize) {
  AuditLog.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'audit_logs' },
  );
}
