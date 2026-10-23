// /src/backend/SKANDI_CORE/toursActivities.web.js
// V12 public Tours & Activities web-method boundary.
import { Permissions, webMethod } from '@wix/web-methods';
import {
  getToursActivitiesBootstrapCore,
  searchToursActivitiesCore,
  getTourActivityDetailCore,
  searchNearbyToursActivitiesCore,
  checkTourActivityBookingCore,
  saveTourFavoriteCore
} from 'backend/SKANDI_CORE/toursActivities';

export const getToursActivitiesBootstrap = webMethod(Permissions.Anyone, async (input = {}) => getToursActivitiesBootstrapCore(input));
export const searchToursActivities = webMethod(Permissions.Anyone, async (input = {}) => searchToursActivitiesCore(input));
export const getTourActivityDetail = webMethod(Permissions.Anyone, async (input = {}) => getTourActivityDetailCore(input));
export const searchNearbyToursActivities = webMethod(Permissions.Anyone, async (input = {}) => searchNearbyToursActivitiesCore(input));
export const checkTourActivityBooking = webMethod(Permissions.Anyone, async (input = {}) => checkTourActivityBookingCore(input));
export const saveTourFavorite = webMethod(Permissions.SiteMember, async (input = {}) => saveTourFavoriteCore(input));
