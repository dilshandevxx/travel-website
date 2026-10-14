// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Platform user (customer, provider or admin)
// TODO: Add columns (fullName, email, phone, passwordHash, roles, activeRole, isActive) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class User extends Model {
  declare id: number;
}

export function initUser(sequelize: Sequelize) {
  User.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'users' },
  );
}
