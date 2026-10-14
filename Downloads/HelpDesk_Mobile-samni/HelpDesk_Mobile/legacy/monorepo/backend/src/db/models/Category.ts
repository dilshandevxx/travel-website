// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Service trade (Plumbing, Electrical, ...)
// TODO: Add columns (slug, name, icon) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class Category extends Model {
  declare id: number;
}

export function initCategory(sequelize: Sequelize) {
  Category.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'categories' },
  );
}
