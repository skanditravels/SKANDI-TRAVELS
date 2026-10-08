# Choosing your search response format

## Overview
When you create an offer request, you can ask the Duffel API to return results in one of two shapes:
- `offers` (the default) — a flat list of offers, each containing the full slice, segment, airline, and airport data inline. This is the shape you already know.
- `itineraries` — offers grouped into a hierarchy of slices, itineraries, and fare brands, with airlines, places, and aircraft pulled out into shared reference maps.

The itinerary shape is designed for UIs that show a grouped search experience (one card per itinerary, with its fare brands and price points below) and, critically, it is the only shape that includes split-ticket itineraries.
Because airlines, places, and aircraft are deduplicated into reference maps and fare brands share a single set of segments, the `itineraries` shape is also significantly more condensed over the wire than the flat `offers` shape — often several times smaller for a typical return search. If payload size is a concern for your integration, this is a meaningful win on top of the UI benefits.
> The Accept header still controls wire format (JSON vs other encodings). The view query parameter only affects how offers are structured within the JSON response.

## What do you need to start?
This guide assumes you've built a basic "search and book" flow with the Duffel API.

## Requesting a response shape
Add `view=offers` or `view=itineraries` to any of the offer request endpoints:
- `POST /air/offer_requests`
- `GET /air/offer_requests/:id`
- `GET /air/batch_offer_requests/:id`

If you omit the parameter, you'll get the default `offers` shape so existing integrations are unaffected.
Shell


> curl
```
curl -X POST --compressed "https://api.duffel.com/air/offer_requests?view=itineraries"
  -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
  -d '{
  "data": {
    "cabin_class": "economy",
    "passengers": [
      { "type": "adult" }
    ],
    "slices": [
      {
        "origin": "NYC",
        "destination": "LON",
        "departure_date": "2026-12-15"
      },
      {
        "origin": "LON",
        "destination": "NYC",
        "departure_date": "2026-12-20"
      }
    ]
  }
}'
```

---

## Comparing the two shapes
### `view=offers` (default)
Each offer is self-contained and lives in a flat `offers` array. Airlines, places, and aircraft are embedded inline on every segment. Best for integrations that treat each offer as an opaque unit and don't need to group the UI around shared itineraries.
### `view=itineraries`
The response is restructured into:
- `slices[]` — one entry per slice in the request.
- `slices[].itineraries[]` — offers sharing the exact same flight segments (same flights, same order, same cabins).
- `slices[].itineraries[].brands[]` — fare brands available on that itinerary (cabin, baggage, change/refund conditions).
- `slices[].itineraries[].brands[].offers[]` — the priced offers within that brand.

Entities referenced by ID in the tree (airlines, places, aircraft) are looked up via top-level references maps rather than repeated inline.

> JSON
```
{
  "data": {
    "id": "orq_00009hthhsUZ8W4LxQghdf",
    "references": {
      "airlines": {
        "arl_00009VME7D6ivUu8dn35WK": {
          "name": "Duffel Airways",
          "iata_code": "ZZ"
        }
      },
      "places": { "arp_jfk_us": { "iata_code": "JFK", "type": "airport" } },
      "aircraft": {
        "arc_00009VMF8AhXSSRnQDI6HE": {
          "name": "Airbus A380",
          "iata_code": "380"
        }
      }
    },
    "slices": [
      {
        "origin": "arp_jfk_us",
        "destination": "arp_lhr_gb",
        "itineraries": [
          {
            "segments": [
              /* shared flight segments, carriers and places as references */
            ],
            "brands": [
              {
                "fare_brand_name": "Economy Basic",
                "offers": [
                  {
                    "id": "off_00009htYpSCXrwaB9Dn456",
                    "type": "single_ticket",
                    "owner": "arl_00009VME7D6ivUu8dn35WK",
                    "total_amount": "470.00",
                    "total_currency": "GBP"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```
