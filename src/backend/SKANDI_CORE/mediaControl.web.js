// /src/backend/SKANDI_CORE/mediaControl.web.js
// V12 Media Control — single stable frontend-callable Asset Library dispatch boundary.
// Business logic remains owned by backend/SKANDI_CORE/assets.js.

import { Permissions, webMethod } from "@wix/web-methods";
import { getWebsiteDesignCore, saveWebsiteDesignCore } from 'backend/SKANDI_CORE/websiteDesign';
import { getWebsitePreviewCore, searchMediaSourcesCore, importMediaSourceCore, importWebsiteImageCore, getWebsiteFontCore } from 'backend/SKANDI_CORE/mediaControlSources';
import { getHomeCardManagerCore, saveHomeCardManagerCore } from "backend/SKANDI_CORE/homeContent";
import { testMediaConnectorCore, listCanvaTemplatesCore, mediaCopyCore, destinationResearchCore, searchConsoleReportCore } from "backend/SKANDI_CORE/mediaControlIntegrations";
import {
  listAssetsCore,
  checkAssetDuplicateCore,
  prepareAssetUploadCore,
  finalizeAssetUploadCore,
  getAssetAccessUrlCore,
  registerAssetUsageCore,
  archiveAssetCore
} from "backend/SKANDI_CORE/assets";

const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const clean = value => String(value || "").trim().toUpperCase();

// Wix masks exceptions crossing a web-module boundary. Return only approved,
// fixed messages for these integrations so the control can explain failures
// without exposing provider responses, configuration values, or credentials.
const INTEGRATION_ACTIONS = new Set(['TEST_MEDIA_CONNECTOR','LIST_CANVA_TEMPLATES','CREATE_EDITORIAL_SUGGESTION','RESEARCH_DESTINATION','GET_SEARCH_CONSOLE_REPORT']);
const INTEGRATION_ERRORS = Object.freeze({
  CANVA_NOT_CONFIGURED:'Canva is not connected. Configure the Canva service app credentials first.',
  CANVA_TOKEN_INVALID:'Canva did not return an access token.',
  CANVA_RESPONSE_INVALID:'Canva returned an unexpected template list.',
  SECRET_ACCESS_UNAVAILABLE:'The site configuration could not be read. Check the service settings.',
  CONNECTOR_UNREACHABLE:'The service could not be reached. Try again later.',
  CONNECTOR_AUTH_OR_ACCESS:'The service declined access. Check its credentials and permissions.',
  CONNECTOR_RATE_LIMIT:'The service is limiting requests. Try again later.',
  CONNECTOR_HTTP_ERROR:'The service returned an error. Try again later.',
  CONNECTOR_RESPONSE_INVALID:'The service returned an unexpected response.',
  CONNECTOR_UNKNOWN:'This connection is not available for testing.',
  COPY_TEXT_REQUIRED:'Add some copy before requesting a suggestion.',
  COPY_LANGUAGE_INVALID:'Choose a supported language.',
  AI_UNAVAILABLE:'The writing service could not complete the request. Check its configuration and try again.',
  AI_EMPTY:'The writing service returned no suggestion.',
  DESTINATION_REQUIRED:'Enter a destination to research.',
  RESEARCH_LANGUAGE_INVALID:'Choose a supported language.',
  RESEARCH_PROVIDER_ERROR:'Wikipedia could not complete the search.',
  SEARCH_CONSOLE_NOT_CONFIGURED:'Search Console is not connected. Configure a service account with access to the site property.',
  SEARCH_CONSOLE_CREDENTIALS_INVALID:'The Search Console service account credentials could not be read.',
  SEARCH_CONSOLE_AUTH_INVALID:'Google did not return an access token.',
  SEARCH_CONSOLE_PROPERTY_REQUIRED:'Configure the verified SKANDI Travels Search Console property.',
  SEARCH_CONSOLE_DATE_INVALID:'Choose a range between 1 and 90 days.'
});

const ACTIONS = Object.freeze({
  GET_WEBSITE_DESIGN: getWebsiteDesignCore,
  SAVE_WEBSITE_DESIGN: saveWebsiteDesignCore,
  GET_WEBSITE_PREVIEW: getWebsitePreviewCore,
  SEARCH_MEDIA_SOURCES: searchMediaSourcesCore,
  IMPORT_MEDIA_SOURCE: importMediaSourceCore,
  IMPORT_WEBSITE_IMAGE: importWebsiteImageCore,
  GET_WEBSITE_FONT: getWebsiteFontCore,
  TEST_MEDIA_CONNECTOR: testMediaConnectorCore,
  LIST_CANVA_TEMPLATES: listCanvaTemplatesCore,
  CREATE_EDITORIAL_SUGGESTION: mediaCopyCore,
  RESEARCH_DESTINATION: destinationResearchCore,
  GET_SEARCH_CONSOLE_REPORT: searchConsoleReportCore,
  GET_HOME_CARD_MANAGER: getHomeCardManagerCore,
  SAVE_HOME_CARD_MANAGER: saveHomeCardManagerCore,
  LIST_ASSETS: listAssetsCore,
  CHECK_DUPLICATE: checkAssetDuplicateCore,
  PREPARE_UPLOAD: prepareAssetUploadCore,
  FINALIZE_UPLOAD: finalizeAssetUploadCore,
  GET_ACCESS_URL: getAssetAccessUrlCore,
  REGISTER_USAGE: registerAssetUsageCore,
  ARCHIVE_ASSET: archiveAssetCore
});

export const handleMediaControlAssetAction = webMethod(
  Permissions.SiteMember,
  async input => {
    const request = object(input);
    const action = clean(request.action);
    const handler = ACTIONS[action];
    if (!handler) {
      const error = new Error("MEDIA_CONTROL_ASSET_ACTION_UNSUPPORTED");
      error.code = "MEDIA_CONTROL_ASSET_ACTION_UNSUPPORTED";
      throw error;
    }
    if (!INTEGRATION_ACTIONS.has(action)) return handler(object(request.payload));
    try { return await handler(object(request.payload)); }
    catch (error) {
      const code = String(error?.code || '');
      const approved = Object.prototype.hasOwnProperty.call(INTEGRATION_ERRORS, code);
      return { ok:false, error:{
        code:approved ? code : 'MEDIA_CONTROL_INTEGRATION_FAILED',
        message:approved ? INTEGRATION_ERRORS[code] : 'The request could not be completed. Check your access and service configuration, then try again.'
      } };
    }
  }
);
