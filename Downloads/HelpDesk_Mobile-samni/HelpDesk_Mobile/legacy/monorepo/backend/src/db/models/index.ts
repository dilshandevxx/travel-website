// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Initialises every model and sets up associations
// TODO: Define associations (hasMany/belongsTo) in associateModels

import type { Sequelize } from 'sequelize';
import { User, initUser } from './User';
import { ProviderProfile, initProviderProfile } from './ProviderProfile';
import { Category, initCategory } from './Category';
import { ServiceRequest, initServiceRequest } from './ServiceRequest';
import { StatusHistory, initStatusHistory } from './StatusHistory';
import { CostProposal, initCostProposal } from './CostProposal';
import { Message, initMessage } from './Message';
import { Review, initReview } from './Review';
import { Complaint, initComplaint } from './Complaint';
import { Notification, initNotification } from './Notification';
import { Address, initAddress } from './Address';
import { PricingRule, initPricingRule } from './PricingRule';
import { AuditLog, initAuditLog } from './AuditLog';
import { Transaction, initTransaction } from './Transaction';

export function initModels(sequelize: Sequelize) {
  initUser(sequelize);
  initProviderProfile(sequelize);
  initCategory(sequelize);
  initServiceRequest(sequelize);
  initStatusHistory(sequelize);
  initCostProposal(sequelize);
  initMessage(sequelize);
  initReview(sequelize);
  initComplaint(sequelize);
  initNotification(sequelize);
  initAddress(sequelize);
  initPricingRule(sequelize);
  initAuditLog(sequelize);
  initTransaction(sequelize);
  associateModels();
}

function associateModels() {
  // e.g. User.hasOne(ProviderProfile, { foreignKey: 'userId' });
}

export {
  User,
  ProviderProfile,
  Category,
  ServiceRequest,
  StatusHistory,
  CostProposal,
  Message,
  Review,
  Complaint,
  Notification,
  Address,
  PricingRule,
  AuditLog,
  Transaction,
};
