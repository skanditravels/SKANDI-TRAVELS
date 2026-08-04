1234567
import wixData from "wix-data";import wixLocation from "wix-location";import { getDestinationFlightSuggestions } from "backend/destinationFlightOffers.web";const HTML_ID = "#htmlDestinations";const HTML_SOURCE = "SKANDI_DESTINATION_FINDER";const PARENT_SOURCE = "SKANDI_WIX_PARENT";
import wixData from "wix-data";
import wixLocation from "wix-location";
import { getDestinationFlightSuggestions } from "backend/destinationFlightOffers.web";

const HTML_ID = "#htmlDestinations";
const HTML_SOURCE = "SKANDI_DESTINATION_FINDER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const DEFAULT_ORIGIN_IATA = "ARN"; // Change later if you want JFK, EWR, CPH, etc.
const DEFAULT_CURRENCY = "SEK";

