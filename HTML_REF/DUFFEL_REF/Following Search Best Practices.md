# Following Search Best Practices

1. Introduction
Flight offer payloads can sometimes contain thousands of offers, making it difficult to manage and display content.
The Duffel API supports building many kinds of search flows, but depending on your needs you might need to tweak your requests to ensure relevance of results and improve performance.
This guide outlines some options to help you deliver the best possible experience for your users.

---

2. The Scenario
A return trip flight from JKF to MAD, can have 30 outbound departures and 20 inbound departures, resulting in 600 possible itineraries.
In addition, each itinerary offers 5 fare brands that can be combined with each other (e.g. selecting flexible economy on the outbound and premium economy on the inbound) resulting in 6,000 possible itineraries.
In some of the most popular flight routes we see the number of offers go up to the tens of thousands meaning a lot of content to manage and a heavy payload.

---

3. Search Filters
Because airlines provide so very many options for flights it can be hard to find and quickly serve the right ones.
Duffel offers a series of Search Filters that can be used before sending a search request that notably reduce the number of offers.
The use of these filters prioritize relevant content to your users and optimize speed. We recommend using as many of these as possible in your integration, and in cases where it makes sense, setting them as default filters.

---

4. Cabin Class Filter
Users to specify what cabin they want to fly in, you can add the cabin_classfilter to the request body.
This value is passed down to each airline, meaning you not only receive more relevant results, but also faster.
Shell


> curl

´´´curl -X POST --compressed "https://api.duffel.com/air/offer_requests?return_offers=true"
    -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
  -d '{
    "data": {
        "slices": [
            {
                "origin": "MAD",
                "destination": "JFK",
                "departure_date": "2023-12-05"
            },
            {
                "origin": "JFK",
                "destination": "MAD",
                "departure_date": "2023-12-10"
            }
        ],
        "passengers": [
            {
                "type": "adult"
            }
        ],
        "cabin_class":"first"
    }
})
´´´


Read more in the Partial Offer Request reference and the Offer Request reference.

--- 

5. Max Connections
Using the max_connections filter on the request body, ensures your users only receive offers that have up to the specified number of connections.
We recommend setting this filter to either 0 or 1 to get the right balance of relevant content and search speed. Although, one can also set the value to 2 connections if looking for even more offers.
Today, Duffel defaults to searching up to 1 connection when no filter is specified.


> curl

´´´
curl -X POST --compressed "https://api.duffel.com/air/offer_requests?return_offers=true"
    -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
  -d '{
    "data": {
        "slices": [
            {
                "origin": "MAD",
                "destination": "JFK",
                "departure_date": "2023-12-05"
            },
            {
                "origin": "JFK",
                "destination": "MAD",
                "departure_date": "2023-12-10"
            }
        ],
        "passengers": [
            {
                "type": "adult"
            }
        ],
        "max_connections": "0"
    }
})
´´´


Read more in the Partial Offer Request reference and the Offer Request reference.
Departure and Arrival Time
This filter provides the fastest search experience if the user knows the flight they are looking for.
By providing the departure_time and/or arrival_time filters, we can limit the results to only those within the specified time frames.
This allows your users to e.g. search for all flights departing after 11am, or all flights arriving before 8pm. They can even specify if they want to depart and arrive between two specific times of the day.
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/offer_requests?return_offers=true"
    -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
  -d '{
    "data": {
        "slices": [
                {
                    "origin": "MAD",
                    "destination": "JFK",
                    "departure_time": {
                        "to": "11:00",
                        "from": "08:00"
                },
                    "departure_date": "2023-12-05",
                    "arrival_time": {
                        "to": "17:00",
                      "from": "09:45"
                  }
                },
                {
                    "origin": "JFK",
                    "destination": "MAD",
                    "departure_date": "2023-12-10"
                }
            ],
        "passengers": [
            {
                "type": "adult"
            }
        ],
    }
})


Hide full sample

Read more in the Partial Offer Request reference and the Offer Request reference.
Query Parameters
Controlling supplier timeout
Some searches take longer than others, and different users have different levels of tolerance for waiting.
The supplier_timeout allows you to specify on a per request basis, how long should a user wait for results.
A lower value is helpful if you are looking to favour speed over quantity of results, while a higher value favours more options.
By default, and as our recommendation, the Duffel API sets the limit at 20 seconds when the query parameter is unspecified.
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=10000"
    -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
  -d '{
    "data": {
        "slices": [
            {
                "origin": "MAD",
                "destination": "JFK",
                "departure_date": "2023-12-05"
            },
            {
                "origin": "JFK",
                "destination": "MAD",
                "departure_date": "2023-12-10"
            }
        ],
        "passengers": [
            {
                "type": "adult"
            }
        ],
    }
})

Choosing your search response format
Overview
When you create an offer request, you can ask the Duffel API to return results in one of two shapes:
offers (the default) — a flat list of offers, each containing the full slice, segment, airline, and airport data inline. This is the shape you already know.

itineraries — offers grouped into a hierarchy of slices, itineraries, and fare brands, with airlines, places, and aircraft pulled out into shared reference maps.

The itinerary shape is designed for UIs that show a grouped search experience (one card per itinerary, with its fare brands and price points below) and, critically, it is the only shape that includes split-ticket itineraries.
Because airlines, places, and aircraft are deduplicated into reference maps and fare brands share a single set of segments, the itineraries shape is also significantly more condensed over the wire than the flat offers shape — often several times smaller for a typical return search. If payload size is a concern for your integration, this is a meaningful win on top of the UI benefits.
The Accept header still controls wire format (JSON vs other encodings). The view query parameter only affects how offers are structured within the JSON response.
What do you need to start?
This guide assumes you've built a basic "search and book" flow with the Duffel API. If you haven't, read through our Quick Start guide first.
Requesting a response shape
Add view=offers or view=itineraries to any of the offer request endpoints:
POST /air/offer_requests

GET /air/offer_requests/:id

GET /air/batch_offer_requests/:id

If you omit the parameter, you'll get the default offers shape so existing integrations are unaffected.
Shell


curl

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


Hide full sample

Comparing the two shapes
view=offers (default)
Each offer is self-contained and lives in a flat offers array. Airlines, places, and aircraft are embedded inline on every segment. Best for integrations that treat each offer as an opaque unit and don't need to group the UI around shared itineraries.
view=itineraries
The response is restructured into:
slices[] — one entry per slice in the request.

slices[].itineraries[] — offers sharing the exact same flight segments (same flights, same order, same cabins).

slices[].itineraries[].brands[] — fare brands available on that itinerary (cabin, baggage, change/refund conditions).

slices[].itineraries[].brands[].offers[] — the priced offers within that brand.

Entities referenced by ID in the tree (airlines, places, aircraft) are looked up via top-level references maps rather than repeated inline.
JSON


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



Hide full sample

Which one should I use?
If your UI shows a single list of offers and you don't need shared-itinerary grouping, stay on view=offers — nothing to change.

If you want to present results grouped by itinerary and fare brand, if you want smaller responses over the wire, or if you want to offer split-ticket itineraries to your customers, use view=itineraries.

The type field on offers
In the itineraries shape, every offer carries a type:
single_ticket — a normal offer from a single airline covering all of the requested slices. This is what you already receive today.

split_ticket — a one-way offer that is part of a split-ticket combination. These only appear when split-ticket itineraries are enabled on the request.

If you haven't opted into split-ticket offers, every offer returned will be single_ticket.

---
Selling split-ticket itineraries
Overview
A split-ticket itinerary is a multi-slice trip made up of independent one-way offers — often from different airlines — instead of a single return or multi-city ticket from one carrier. Enabling split-ticket offers on a search gives the traveller a wider choice of possible itineraries to pick from, because each slice can be fulfilled by whichever one-way offer best fits.
Split-ticket itineraries are only returned when you use the grouped view=itineraries response shape. They are not included in the default flat offers response.
What do you need to start?
This guide assumes you've built a basic "search and book" flow with the Duffel API. If you haven't, read through our Quick Start guide first. You should also be familiar with choosing your search response format, since split-ticket itineraries require the view=itineraries shape.
When you're ready, please get in touch with the Duffel support team at help@duffel.com to access to this feature.
Request
Two things need to be true to receive split-ticket itineraries:
Set include_split_ticket to true in the request body.

Add view=itineraries as a query parameter so the response can expose them in the grouped shape.

The include_split_ticket flag has no effect on single-slice (one-way) searches.
Shell


curl

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


View full sample

Response
When include_split_ticket is enabled, you'll receive a mix of offers in the response:
type: "single_ticket" — a normal offer from one airline that covers every slice in the request. The customer books these exactly as they do today.

type: "split_ticket" — a one-way offer covering a single slice. Returned per slice alongside the single_ticket offers, so you can present alternative one-way combinations.

JSON


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



Hide full sample

Building a split-ticket trip
To build a split-ticket trip, pick one split_ticket offer from each slice in the response. single_ticket offers still cover the whole trip on their own — you choose one or the other, not both.
Pricing and booking
A split-ticket itinerary is not a single bookable unit. Each split_ticket offer is an independent offer, so it is priced and booked on its own through the same endpoints you already use for single-ticket offers. A two-slice split-ticket trip the customer selects looks like this end-to-end:
Search   POST /air/offer_requests?view=itineraries    → slice 0: [off_A (single_ticket), off_B (split_ticket), …]
                                                       → slice 1: [off_A (single_ticket), off_C (split_ticket), …]
Select   customer picks off_B + off_C
Price    GET  /air/offers/off_B                       → latest priced offer
         GET  /air/offers/off_C                       → latest priced offer
Book     POST /air/orders { selected_offers: [off_B] } → ord_001
         POST /air/orders { selected_offers: [off_C] } → ord_002
What to watch out for
One order per slice. Each order has its own PNR / airline booking reference and is independently changeable, refundable, and subject to its own airline's rules. Schedule changes or disruption on one slice don't propagate to the other.

You will need to manage partial success As you are now making multiple orders to fulfil a trip, you will have to be able to handle partial success where only a subset of the orders attempted succeed.

Separate payments and charges. Each order is paid for separately. This means two charges on the traveller's card or two debits from your balance. Even customers who understand they're buying a split-ticket itinerary can find two line items confusing.

This is the main trade-off of selling split-ticket itineraries: you expose more choice to the customer, but you take on managing the slices separately.
