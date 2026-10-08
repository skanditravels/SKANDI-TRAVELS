# Displaying Stops
What do you need to start?
This guide assumes that you've built a basic "search and book" flow with the Duffel API. If you haven't done this yet, we'd recommend that you read through our Quick Start guide first.
What is a stop?
When flying from your origin to your destination, it's either a non-stop flight or a flight that touches down. The main cause for a flight landing is to switch flights to continue on a journey, after a layover. We refer to these flights as segments, which are within slices.
On rare occasion, a segment itself may touchdown. This is called a stop. When this happens, you continue on the same flight number. The reason for these stops varies and is usually to take on fuel, off-load or on-load passengers, or change to a different aircraft though still with the same flight number.
Is a stopover a stop?
No. This can be confusing, so we'll cover the difference. A layover is a broad term that covers when a flight touches down and you continue after on a different flight number. The length of a layover can be as short as 30 minutes or as long as 23 hours and 59 minutes. If it's 24 hours or longer, it's a stopover. A stopover is considered a subset of a layover, by definition.
Why are stops important?
Non-stop vs direct flights are a key deciding factor for which offer a passenger would choose and is thus important to display.
How should I display stops?
This varies per your usage, so always do what is most appropriate. In general though, we recommend using the hierarchy of slice → segment → stop to inform your design. A simpler solution may be better for your product though.
Response example
This is an example taken from a full offer response.
JSON


              ..,
              "stops": [
                {
                  "id": "sto_00009htYpSCXrwaB9Dn456",
                  "duration": "PT02H26M",
                  "departing_at": "2020-06-13T16:38:02",
                  "airport": {
                    "time_zone": "America/New_York",
                    "name": "John F. Kennedy International Airport",
                    "longitude": -73.778519,
                    "latitude": 40.640556,
                    "id": "arp_jfk_us",
                    "icao_code": "KJFK",
                    "iata_country_code": "US",
                    "iata_code": "JFK",
                    "iata_city_code": "NYC",
                    "city_name": "New York",
                    "city": {
                      "name": "New York",
                      "id": "cit_nyc_us",
                      "iata_country_code": "US",
                      "iata_code": "NYC"
                    }
                  }
                }
              ],
              ...,
