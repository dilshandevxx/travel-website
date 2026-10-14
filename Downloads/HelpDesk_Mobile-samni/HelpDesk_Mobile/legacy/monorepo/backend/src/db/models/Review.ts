// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Customer review of a completed job
// TODO: Add columns (serviceRequestId, customerId, providerId, rating, comment, providerResponse) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class Review extends Model {
  declare id: number;
}

export function initReview(sequelize: Sequelize) {
  Review.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'reviews' },
  );
}
