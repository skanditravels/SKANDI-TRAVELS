# flight-status

## Reference documents

- [HTML_REF/skandi/Flight Status.md](references/skandi-flight-status-md/README.md)

## Carrier logos — 2026-11-27

The Flight Status and Travel Info boards use the published carrier logo selected by Inventory Control. Codeshare rows use the logo of the carrier shown on the board. Existing assets remain available as fallbacks where the feed has no inventory match. The backend and existing receiver must serve the updated build.

## Swedavia airport boards · 2026-11-28

Airport lookups for Swedavia IATA or ICAO codes use FlightInfo v2 through the existing Flight Status facade. The board follows the Swedish local date, shows the feed update time when provided and uses Swedavia's passenger remarks. Confirmed Swedavia departures and arrivals show gates, terminals, codeshares and baggage belts when those fields are supplied.

The Swedavia key is read from `SWEDAVIA_FLIGHT_INFO_SUBSCRIPTION_KEY` in Wix Secrets Manager. A feed error can fall back to AirLabs and is identified on the board. AirLabs continues to serve other airports and flight-number and route lookups. The Wix page controller and message names are the same.
