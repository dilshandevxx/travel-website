// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Saved customer address
// TODO: Add columns (userId, label, line1, line2, city, district, latitude, longitude) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class Address extends Model {
  declare id: number;
}

export function initAddress(sequelize: Sequelize) {
  Address.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'addresses' },
  );
}
