# Following Search Best Practices

1. Introduction
Flight offer payloads can sometimes contain thousands of offers, making it difficult to manage and display content.
The Duffel API supports building many kinds of search flows, but depending on your needs you might need to tweak your requests to ensure relevance of results and improve performance.
This guide outlines some options to help you deliver the best possible experience for your users.

2. The Scenario
A return trip flight from JKF to MAD, can have 30 outbound departures and 20 inbound departures, resulting in 600 possible itineraries.
In addition, each itinerary offers 5 fare brands that can be combined with each other (e.g. selecting flexible economy on the outbound and premium economy on the inbound) resulting in 6,000 possible itineraries.
In some of the most popular flight routes we see the number of offers go up to the tens of thousands meaning a lot of content to manage and a heavy payload.

3. Search Filters
Because airlines provide so very many options for flights it can be hard to find and quickly serve the right ones.
Duffel offers a series of Search Filters that can be used before sending a search request that notably reduce the number of offers.
The use of these filters prioritize relevant content to your users and optimize speed. We recommend using as many of these as possible in your integration, and in cases where it makes sense, setting them as default filters.

4. Cabin Class Filter
Users to specify what cabin they want to fly in, you can add the cabin_classfilter to the request body.
This value is passed down to each airline, meaning you not only receive more relevant results, but also faster.
Shell


> curl

```curl -X POST --compressed "https://api.duffel.com/air/offer_requests?return_offers=true"
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
```


**Read more in the Partial Offer Request reference and the Offer Request reference.**

--- 

5. Max Connections
Using the max_connections filter on the request body, ensures your users only receive offers that have up to the specified number of connections.
We recommend setting this filter to either 0 or 1 to get the right balance of relevant content and search speed. Although, one can also set the value to 2 connections if looking for even more offers.
Today, Duffel defaults to searching up to 1 connection when no filter is specified.


> curl

```
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
```

**Read more in the Partial Offer Request reference and the Offer Request reference.**

---

6. Departure and Arrival Time
This filter provides the fastest search experience if the user knows the flight they are looking for.
By providing the departure_time and/or arrival_time filters, we can limit the results to only those within the specified time frames.
This allows your users to e.g. search for all flights departing after 11am, or all flights arriving before 8pm. They can even specify if they want to depart and arrive between two specific times of the day.

> curl
```
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
```

**Read more in the Partial Offer Request reference and the Offer Request reference.**

---

7. Query Parameters
Controlling supplier timeout
Some searches take longer than others, and different users have different levels of tolerance for waiting.
The supplier_timeout allows you to specify on a per request basis, how long should a user wait for results.
A lower value is helpful if you are looking to favour speed over quantity of results, while a higher value favours more options.
By default, and as our recommendation, the Duffel API sets the limit at 20 seconds when the query parameter is unspecified.

> curl
```
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
```
