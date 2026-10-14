// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Chat message on a booking
// TODO: Add columns (serviceRequestId, senderId, body) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class Message extends Model {
  declare id: number;
}

export function initMessage(sequelize: Sequelize) {
  Message.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'messages' },
  );
}
