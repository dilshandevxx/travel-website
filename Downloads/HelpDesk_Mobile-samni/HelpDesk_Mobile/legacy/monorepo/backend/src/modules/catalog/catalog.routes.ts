// OWNER: Member 1 - Customer app
// PURPOSE: Routes for the catalog module: Public browsing of categories and providers
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import * as controller from './catalog.controller';

export const catalogRoutes = Router();

catalogRoutes.get('/categories', controller.listCategories);
catalogRoutes.get('/providers', controller.listProviders);
catalogRoutes.get('/providers/:id', controller.getProvider);
