// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: A booking made by a customer
// TODO: Add columns (customerId, providerId, categoryId, description, photos, addressId, status, scheduledAt) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class ServiceRequest extends Model {
  declare id: number;
}

export function initServiceRequest(sequelize: Sequelize) {
  ServiceRequest.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'service_requests' },
  );
}
