// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Complaint raised about a booking
// TODO: Add columns (serviceRequestId, raisedById, reason, description, status, resolution) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class Complaint extends Model {
  declare id: number;
}

export function initComplaint(sequelize: Sequelize) {
  Complaint.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'complaints' },
  );
}
