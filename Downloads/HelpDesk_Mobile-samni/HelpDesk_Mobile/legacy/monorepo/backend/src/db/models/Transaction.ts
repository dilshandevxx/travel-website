// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sequelize model: Money movement for a job (customer payment, provider payout, refund)
// TODO: Add columns (serviceRequestId, payerId, payeeId, amount, type, status, method, reference) and a matching migration

import { DataTypes, Model, type Sequelize } from 'sequelize';

export class Transaction extends Model {
  declare id: number;
}

export function initTransaction(sequelize: Sequelize) {
  Transaction.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    },
    { sequelize, tableName: 'transactions' },
  );
}
