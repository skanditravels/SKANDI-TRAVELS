# flight-status

## Reference documents

- [HTML_REF/skandi/Flight Status.md](references/skandi-flight-status-md/README.md)

## Carrier logos — 2026-11-27

The Flight Status and Travel Info boards use the published carrier logo selected by Inventory Control. Codeshare rows use the logo of the carrier shown on the board. Existing assets remain available as fallbacks where the feed has no inventory match. The backend and existing receiver must serve the updated build.

## Swedavia airport boards · 2026-11-28

The standalone airport board and Travel Info share the supplied Arlanda screen presentation. The Swedavia screen uses a blue bezel, yellow directional header, separate rotating codeshares and labeled mobile rows. The airport, flight number and route controls continue to use the existing Flight Status controller and compiled receiver.

Airport lookups for Swedavia IATA or ICAO codes use FlightInfo v2 through the existing Flight Status facade. The board follows the Swedish local date, shows the feed update time when provided and uses Swedavia's passenger remarks. Confirmed Swedavia departures and arrivals show gates, terminals, codeshares and baggage belts when those fields are supplied.

The Swedavia key is read from `SWEDAVIA_FLIGHT_INFO_SUBSCRIPTION_KEY` in Wix Secrets Manager. A feed error can fall back to AirLabs and is identified on the board. AirLabs continues to serve other airports and flight-number and route lookups. The Wix page controller and message names are the same.

## Full-width carrier logos · 2026-11-28

Both boards look up the public Inventory Control airline by IATA code and use its selected logo and brand color. Wix image and vector references resolve to their public media URLs. The artwork keeps its proportions on a full-width colored field. A missing or failed image uses the existing carrier artwork when available and then displays the IATA code. Codeshares keep the mark of the carrier shown on the row.
