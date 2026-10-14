// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: In-app notification for a user
// TODO: Add columns (userId, type, title, body, data, readAt) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class Notification extends Model {
  declare id: number;
}

export function initNotification(sequelize: Sequelize) {
  Notification.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'notifications' },
  );
}
