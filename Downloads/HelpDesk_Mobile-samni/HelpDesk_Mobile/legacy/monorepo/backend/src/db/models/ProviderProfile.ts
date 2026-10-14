// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Provider details and verification status
// TODO: Add columns (userId, status, bio, yearsOfExperience, availability, rating, location, documents) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class ProviderProfile extends Model {
  declare id: number;
}

export function initProviderProfile(sequelize: Sequelize) {
  ProviderProfile.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'provider_profiles' },
  );
}
