### Adding Seats
Note

The ability to pick a seat is not yet available for all airlines. We recommend using an offer from American Airlines to follow along with this guide.
Ancillaries component

If you'd like to offer seat selection (and other ancillaries) to your customers quickly without having to build the user interface yourself, we offer a UI component that makes it trivially simple.


Learn how to use the Ancillaries component
→
What do you need to start?
This guide assumes that you've built a basic "search and book" flow with the Duffel API. If you haven't done this yet, we'd recommend that you read through our Quick Start guide first.
We also recommend reading through the seat maps endpoint API documentation before you continue on reading this guide.
Tip

We've put together a Postman Collection that contains all of the requests you'll need to follow along with this guide.
Overview
In this guide, we'll show you how to select free or paid seats for passengers when booking flights through the Duffel API.
We'll explain how to interpret the seat map data returned in the API so you can build your own interactive seat map, allowing customers to pick their own seats.
Searching for flights
To search for flights, you'll need to create an offer request. You'll get back a series of search results called offers. Each has a unique ID.
We recommend using an offer from American Airlines to follow along with this guide. To find an American Airlines offer where seat selection is available, we'd recommend searching with one slice from DFW (Dallas) to AUS (Austin), about three months from today's date. to follow along with this guide.
Requesting seat maps for an offer
Seat Maps in the Duffel API show you the layout of the plane, what seats are available and how much they cost, if anything.
You'll request seat maps in the context of an offer, using its ID. For this guide, we suggest using an offer from American Airlines. You can identify an American Airlines offer by looking at its owner attribute:
```
{
  "owner": {
    "iata_code": "AA",
    "id": "arl_00009VME7DAGiJjwomhv32",
    "name": "American Airlines"
  }
}
```
You'll use the "Get seat maps" API to get the seat maps for an offer:

> curl
```
curl -X GET --compressed "https://api.duffel.com/air/seat_maps?offer_id=$OFFER_ID"
  -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
The data attribute in the response will be an array with a list of seats maps. One offer can include multiple segments (i.e. flights), so we may return multiple seat maps:
> JSON
```
```
{
  "data": [
    {
      "cabins": [
        {
          "aisles": 2,
          "cabin_class": "economy",
          "deck": 0,
          "rows": [
            {
              "sections": [
                {
                  "elements": [
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA1A",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "30.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "1A",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA1B",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "30.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "1B",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA1C",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "30.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "1C",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA1D",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "30.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "1D",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA1E",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "30.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "1E",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [],
                      "designator": "1F",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [],
                      "designator": "1G",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA1J",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "30.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "1H",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA1K",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "30.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "1J",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA1M",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "30.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "1K",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "exit_row"
                    }
                  ]
                },
                {
                  "elements": []
                },
                {
                  "elements": [
                    {
                      "type": "exit_row"
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA2A",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "20.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "2A",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA2B",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "20.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "2B",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA2C",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "20.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "2C",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "available_services": [],
                      "designator": "2D",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [],
                      "designator": "2E",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA2F",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "20.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "2F",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA2G",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "20.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "2G",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "available_services": [],
                      "designator": "2H",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA2J",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "20.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "2J",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA2K",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "20.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "2K",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA3A",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "3A",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [],
                      "designator": "3B",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA3C",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "3C",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA3D",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "3D",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA3E",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "3E",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA3F",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "3F",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [],
                      "designator": "3G",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA3H",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "3H",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA3J",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "3J",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA3K",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "3K",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA4A",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "4A",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA4B",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "4B",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA4C",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "4C",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA4D",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "4D",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA4E",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "4E",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA4F",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "4F",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA4G",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "4G",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "available_services": [],
                      "designator": "4H",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [],
                      "designator": "4J",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    },
                    {
                      "available_services": [
                        {
                          "id": "ase_00009UhD4ongolulWAAA4K",
                          "passenger_id": "pas_00009hj8USM7Ncg31cAAA",
                          "total_amount": "10.00",
                          "total_currency": "GBP"
                        }
                      ],
                      "designator": "4K",
                      "disclosures": [],
                      "name": "",
                      "type": "seat"
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "lavatory"
                    }
                  ]
                },
                {
                  "elements": []
                },
                {
                  "elements": [
                    {
                      "type": "lavatory"
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "galley"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "galley"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "galley"
                    }
                  ]
                }
              ]
            }
          ],
          "wings": {
            "first_row_index": 1,
            "last_row_index": 2
          }
        }
      ],
      "id": "sea_00003hthlsHZ8W4LxXjkzo",
      "segment_id": "seg_00009htYpSCXrwaB9Dn456",
      "slice_id": "sli_00009htYpSCXrwaB9Dn123"
    }
  ]
}
```
Seat selection isn't currently available for all airlines. Even for airlines that support seat selection, there may be some offers where it isn't available (for example offers that include flights from other airlines).
If seat selection isn't available, the Seat Maps API will return an empty list of seat maps. You should handle this gracefully in your integration:
JSON
```
{
  "data": [],
  "meta": null
}
```
Turning the Seat Maps API response into a visual seat map
Next, you'll probably use the response from the Seat Maps API to render a visual seat map, where your customers can see the available seats and their prices, and pick a seat that meets their needs.
In this step, we'll show you how to interpret that data and turn it into something beautiful, like you see in the Duffel booking tool.
The goal of this guide is to show you how to interpret the data. You can, of course, apply your own visual style.
Example seat map in the Duffel booking tool
Example seat map in the Duffel booking tool

Here's an example seat map response for an offer with a single passenger, a single slice and a single segment:
> JSON
```
{
  "data": [
    {
      "id": "sea_0000A8okiQhItNg1JSmCuW",
      "cabins": [
        {
          "wings": {
            "last_row_index": 1,
            "first_row_index": 0
          },
          "rows": [
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "28A",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "28B",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQhes3xbKYwUS1",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [
                        "Passenger must be an adult",
                        "Do not seat passengers with special needs in exit row seats or bulkheads"
                      ],
                      "designator": "28C",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQhes3xbKYwUSz",
                          "total_currency": "GBP",
                          "total_amount": "20.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "28D",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [
                        "Passenger must be an adult",
                        "Do not seat passengers with special needs in exit row seats or bulkheads"
                      ],
                      "designator": "28E",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQhes3xbKYwUT4",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "28F",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQhes3xbKYwUT7",
                          "total_currency": "GBP",
                          "total_amount": "20.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [
                        "Passenger must be an adult",
                        "Do not seat passengers with special needs in exit row seats or bulkheads"
                      ],
                      "designator": "28H",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [
                        "Passenger must be an adult",
                        "Do not seat passengers with special needs in exit row seats or bulkheads"
                      ],
                      "designator": "28J",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "28K",
                      "available_services": []
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "29A",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "29B",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQi0qkFBLf6m17",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "29C",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "29D",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "29E",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "29F",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "29H",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "29J",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "29K",
                      "available_services": []
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "30A",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "30B",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "30C",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "30D",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "30E",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "30F",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "30H",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQi0qkFBLf6m1T",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "30J",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQi0qkFBLf6m1W",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "30K",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQiMpQWlMlH3ZK",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "31A",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "31B",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQiMpQWlMlH3ZQ",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "31C",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "31D",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQiMpQWlMlH3ZV",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "31E",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "31F",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "31H",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQiMpQWlMlH3Zb",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "31J",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "31K",
                      "available_services": []
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "32A",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQiMpQWlMlH3Zi",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "32B",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "32C",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQiio6oLNrRL7a",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "32D",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "32E",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "32F",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQiio6oLNrRL7g",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "32H",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQiio6oLNrRL7k",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "32J",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQiio6oLNrRL7n",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "32K",
                      "available_services": []
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "33A",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "33B",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "33C",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "33D",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQiio6oLNrRL7x",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "33E",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "33F",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQj4mn5vOxbcfq",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "33H",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQj4mn5vOxbcfu",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "33J",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQj4mn5vOxbcfx",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "33K",
                      "available_services": []
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "34A",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "34B",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "34C",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQj4mn5vOxbcg5",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "34D",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "34E",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQjQlTNVQ3luE8",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "34F",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "34H",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "34J",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "34K",
                      "available_services": []
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "35A",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQjQlTNVQ3luEI",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "35B",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "35C",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "35D",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQjQlTNVQ3luEO",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "35E",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "35F",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "35H",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQjmk9f5R9wBmP",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "35J",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQjmk9f5R9wBmS",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "35K",
                      "available_services": []
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "lavatory"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "lavatory"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "lavatory"
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "exit_row"
                    }
                  ]
                },
                {
                  "elements": []
                },
                {
                  "elements": [
                    {
                      "type": "exit_row"
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "36A",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQmcZbvjZxGSCT",
                          "total_currency": "GBP",
                          "total_amount": "20.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "36B",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQmcZbvjZxGSCW",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "36C",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQmcZbvjZxGSCZ",
                          "total_currency": "GBP",
                          "total_amount": "20.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "36D",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "36E",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQmcZbvjZxGSCe",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "36F",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQmcZbvjZxGSCh",
                          "total_currency": "GBP",
                          "total_amount": "20.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "36H",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "36J",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQmcZbvjZxGSCm",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "36K",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQmyYIDJb3Qjkg",
                          "total_currency": "GBP",
                          "total_amount": "20.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "37A",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "37B",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQmyYIDJb3Qjkm",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "37C",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQmyYIDJb3Qjkp",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "37D",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "37E",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "37F",
                      "available_services": []
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "37H",
                      "available_services": [
                        {
                          "id": "ase_0000A8okiQmyYIDJb3Qjkx",
                          "total_currency": "GBP",
                          "total_amount": "0.0",
                          "passenger_id": "pas_0000A8oTVsAt8YurG9h4xn"
                        }
                      ]
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "37J",
                      "available_services": []
                    },
                    {
                      "type": "seat",
                      "name": "",
                      "disclosures": [],
                      "designator": "37K",
                      "available_services": []
                    }
                  ]
                }
              ]
            },
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "galley"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "galley"
                    }
                  ]
                },
                {
                  "elements": [
                    {
                      "type": "galley"
                    }
                  ]
                }
              ]
            }
          ],
          "deck": 0,
          "aisles": 2,
          "cabin_class": "economy"
        }
      ],
      "slice_id": "sli_0000A8oTVsOiJ9yVx2A7Vp",
      "segment_id": "seg_0000A8oTVsOiJ9yVx2A7Vo"
    }
  ]
}
```

The response includes seats in the cabin that the passenger is flying in (economy).
This cabin has 2 aisles, so there will be 3 sections in each row . We'll refer to these as the left, middle, and right sections. In the response there are 13 rows, which consist of seats and other features (which we call "elements").
Tip

Rows are zero-indexed in our API. That means if you have 3 rows, the first row is at index 0, the second row at index 1, etc. In this guide, we'll refer to rows in a more "human" way (first row, second row, etc.).
Looking at our example response, a typical row has 3 seats each in the left section (ABC), middle section (DEF), and the right section (HJK). Aircraft configurations can be complex, so keep in mind that rows could have missing seats or contain other elements such as toilets.
We'll render each row one-by-one to build up a full seat map. A row is made up of elements. Seat elements have a type attribute that says seat.
Where a seat is available, the seat element will have a list of one or more available_services attached to it. The services will contain information about the seat like the total amount it costs (which can be free!) and any disclosures (text to display about the "rules" for the seat).
Where there are multiple passengers, there will be a service per passenger with the passenger's ID, to allow for the fact that an airline might charge different prices for the same seat, depending on who the passenger is.
If a seat doesn't have an available service (represented as an empty list, []), it means that the seat is unavailable. We'll want to make that clear on our map. On our example, we can see that seats 28A, 28D, 28H, 28J and 28K are not available.
Row 28 of the seat map
Row 28 of the seat map

You may just want to render the seat elements - this is enough for a basic seat selection experience.
However, in our seat maps we also include additional information which you can optionally use to visualise a more complete seat map and provide a better user experience. The next few rows in our example will demonstrate that.
The ninth row in the response has toilets in the left, center and right sections. We'll display this row like this:
Toilets on the seat map
Toilets on the seat map

The tenth row in the response is an exit row, as signified by its exit_row elements. We will render this as empty space and exit markers before the following rows of seats:
Multiple rows and exit row on the seat map
Multiple rows and exit row on the seat map

The last row (thirteenth row in the response) has one galley in each section. Following the rendering suggestions in the API documentation, to fill the section, we will render it like this:
Galleys on the seat map
Galleys on the seat map

Finally, the wings data in the response shows us that the wings are positioned over the rows from 28 to 29, which ends up being the first and second rows in our rendered seat map. We can render some markers on the side of the seat map to indicate that, completing our seat map:
Full seat map
Full seat map

Creating an order with one or more seats selected
When creating an order, you'll need to pass in a list of services to refer to the seat(s) you want to book.
Looking back to our seat map, we knew that a seat was available because it had one or more available_services attached to it.
The services attribute when creating an order is a list. Each entry in the list should have an id and a quantity. The quantity will always be 1, and the $SEAT_SERVICE_ID should be the ID of the available service which corresponds to the passenger you want to book the seat for.
Looking back to our example above, if we wanted to select seat 28B for passenger pas_0000A8oTVsAt8YurG9h4xn, we'd use the service ID ase_0000A8okiQhes3xbKYwUS1:

JSON
```
{
  "data": {
    "services": [
      {
        "quantity": 1,
        "id": "$SEAT_SERVICE_ID"
      }
    ]
  }
}
```
You can add extra bags alongside any seats. To do this, you'd just add more items to the services list.
In the order creation request, you'll also specify payments information. The amount for your payment must include the price of all the seats and other services you're adding. To reach the final amount, you'd add together the total_amount of the selected offer and the total_amount of any services.
Checking the created order
In the response after you create an order or if you retrieve your order later, you'll see any seat services you selected in the top-level services field.
If you delve into the passengers inside the segments inside the slices, you'll also see a seat attribute with the designator (e.g. 1D) of the passenger's seat.
