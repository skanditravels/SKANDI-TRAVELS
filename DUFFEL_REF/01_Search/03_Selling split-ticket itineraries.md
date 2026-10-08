# Selling split-ticket itineraries

## Overview
A split-ticket itinerary is a multi-slice trip made up of independent one-way offers — often from different airlines — instead of a single return or multi-city ticket from one carrier. Enabling split-ticket offers on a search gives the traveller a wider choice of possible itineraries to pick from, because each slice can be fulfilled by whichever one-way offer best fits.
Split-ticket itineraries are only returned when you use the grouped view=itineraries response shape. They are not included in the default flat offers response.

## What do you need to start?
This guide assumes you've built a basic "search and book" flow with the Duffel API. You should also be familiar with choosing your search response format, since split-ticket itineraries require the `view=itineraries shape`.
When you're ready, please get in touch with the Duffel support team at help@duffel.com to access to this feature.

## Request
Two things need to be true to receive split-ticket itineraries:
`Set include_split_ticket` to true in the request body.

Add `view=itineraries` as a query parameter so the response can expose them in the grouped shape.

The `include_split_ticket` flag has no effect on single-slice (one-way) searches.
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
    "include_split_ticket": true,
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

## Response
When `include_split_ticket` is enabled, you'll receive a mix of offers in the response:
- `type: "single_ticket"` — a normal offer from one airline that covers every slice in the request. The customer books these exactly as they do today.
- `type: "split_ticket"` — a one-way offer covering a single slice. Returned per slice alongside the single_ticket offers, so you can present alternative one-way combinations.

> JSON
```
{
  "data": {
    "slices": [
      {
        "origin": "arp_jfk_us",
        "destination": "arp_lhr_gb",
        "itineraries": [
          {
            "segments": [
              /* ... */
            ],
            "brands": [
              {
                "fare_brand_name": "Economy Basic",
                "offers": [
                  {
                    "id": "off_00009htYpSCXrwaB9Dn456",
                    "type": "split_ticket",
                    "owner": "arl_00009VME7D6ivUu8dn35WK",
                    "total_amount": "230.00",
                    "total_currency": "GBP"
                  }
                ]
              }
            ]
          }
        ]
      }
      // ...one slice per slice in the request
    ]
  }
}
```

### Building a split-ticket trip
To build a split-ticket trip, pick one `split_ticket` offer from each slice in the response. `single_ticket` offers still cover the whole trip on their own — you choose one or the other, not both.
### Pricing and booking
A `split-ticket` itinerary is not a single bookable unit. Each split_ticket offer is an independent offer, so it is priced and booked on its own through the same endpoints you already use for single-ticket offers. A two-slice split-ticket trip the customer selects looks like this end-to-end:
`Search   POST /air/offer_requests?view=itineraries    → slice 0: [off_A (single_ticket), off_B (split_ticket), …]`
`                                                       → slice 1: [off_A (single_ticket), off_C (split_ticket), …]`
`Select   customer picks off_B + off_C`
`Price    GET  /air/offers/off_B                       → latest priced offer`
`         GET  /air/offers/off_C                       → latest priced offer`
`Book     POST /air/orders { selected_offers: [off_B] } → ord_001`
`         POST /air/orders { selected_offers: [off_C] } → ord_002`

### What to watch out for
- One order per slice. Each order has its own PNR / airline booking reference and is independently changeable, refundable, and subject to its own airline's rules. Schedule changes or disruption on one slice don't propagate to the other.
- You will need to manage partial success As you are now making multiple orders to fulfil a trip, you will have to be able to handle partial success where only a subset of the orders attempted succeed.
- Separate payments and charges. Each order is paid for separately. This means two charges on the traveller's card or two debits from your balance. Even customers who understand they're buying a split-ticket itinerary can find two line items confusing.
This is the main trade-off of selling split-ticket itineraries: you expose more choice to the customer, but you take on managing the slices separately.
