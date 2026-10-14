// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Price proposed by a provider for a job
// TODO: Add columns (serviceRequestId, providerId, amount (LKR), note, status) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class CostProposal extends Model {
  declare id: number;
}

export function initCostProposal(sequelize: Sequelize) {
  CostProposal.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'cost_proposals' },
  );
}
