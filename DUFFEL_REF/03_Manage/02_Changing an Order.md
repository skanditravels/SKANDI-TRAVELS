# Changing an Order
What do you need to start?
All you need to get started with order changes is the id of the order you'd like to change.
Note that changes are not available for all orders. You can check if an order can be changed by looking for change in its available_actions property.
In this guide, we'll build on the example used on the quick start guide.

## Overview

| **Everything starts with an existing order:** |
| ----- |
| Tony, Pepper, and their daughter Morgan have booked flights from New York City to Atlanta, leaving on 11th June and returning a week later on 18th June. They want to delay their return date by a week, coming back on 24th June instead. |
| We can start by using the "Get a single order" API to check the current details for their order: | 

> JavaScript
> Node.JS
`duffel.orders.get(ORDER_ID)`

| You'll need to replace `ORDER_ID` with the ID of the order you want to change. | 
> JSON
```
{
  "data": {
    "total_currency": "GBP",
    "total_amount": "7477.00",
    "tax_currency": "GBP",
    "tax_amount": "1140.56",
    "available_actions": ["change"],
    "slices": [
      {
        "segments": [
          {
            "passengers": [
              {
                "seat": null,
                "passenger_id": "pas_0000A8L6LYhCn9xjBRTP60",
                "fare_basis_code": null,
                "cabin_class_marketing_name": "Business",
                "cabin_class": "business",
                "baggages": [
                  {
                    "type": "checked",
                    "quantity": 1
                  }
                ]
              },
              {
                "seat": null,
                "passenger_id": "pas_0000A8L6LYhCn9xjBRTP61",
                "fare_basis_code": null,
                "cabin_class_marketing_name": "Business",
                "cabin_class": "business",
                "baggages": [
                  {
                    "type": "checked",
                    "quantity": 1
                  }
                ]
              },
              {
                "seat": null,
                "passenger_id": "pas_0000A8L6LYhCn9xjBRTP62",
                "fare_basis_code": null,
                "cabin_class_marketing_name": "Business",
                "cabin_class": "business",
                "baggages": [
                  {
                    "type": "checked",
                    "quantity": 1
                  }
                ]
              }
            ],
            "origin_terminal": "2",
            "origin": {
              "type": "airport",
              "time_zone": "America/New_York",
              "name": "New York Stewart International Airport",
              "longitude": -74.102724,
              "latitude": 41.501292,
              "id": "arp_swf_us",
              "icao_code": "KSWF",
              "iata_country_code": "US",
              "iata_code": "SWF",
              "iata_city_code": "NYC",
              "city_name": "Newburgh",
              "city": {
                "type": "city",
                "time_zone": null,
                "name": "New York",
                "longitude": null,
                "latitude": null,
                "id": "cit_nyc_us",
                "icao_code": null,
                "iata_country_code": "US",
                "iata_code": "NYC",
                "iata_city_code": "NYC",
                "city_name": null
              }
            },
            "operating_carrier_flight_number": "7879",
            "operating_carrier": {
              "name": "Duffel Airways",
              "id": "arl_00009VME7D6ivUu8dn35WK",
              "iata_code": "ZZ"
            },
            "marketing_carrier_flight_number": "7879",
            "marketing_carrier": {
              "name": "Duffel Airways",
              "id": "arl_00009VME7D6ivUu8dn35WK",
              "iata_code": "ZZ"
            },
            "id": "seg_0000A8L6LZGIgg2EwHtQnY",
            "duration": "PT2H23M",
            "distance": "1360.5217397388235",
            "destination_terminal": "7",
            "destination": {
              "type": "airport",
              "time_zone": "America/New_York",
              "name": "Hartsfield-Jackson Atlanta International Airport",
              "longitude": -84.4279,
              "latitude": 33.638714,
              "id": "arp_atl_us",
              "icao_code": "KATL",
              "iata_country_code": "US",
              "iata_code": "ATL",
              "iata_city_code": "ATL",
              "city_name": "Atlanta",
              "city": {
                "type": "city",
                "time_zone": null,
                "name": "Atlanta",
                "longitude": null,
                "latitude": null,
                "id": "cit_atl_us",
                "icao_code": null,
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": null
              }
            },
            "departure_terminal": "2",
            "departure_datetime": "2022-06-11T23:00:00",
            "departing_at": "2022-06-11T23:00:00",
            "arriving_at": "2022-06-12T01:23:00",
            "arrival_terminal": "7",
            "arrival_datetime": "2022-06-12T01:23:00",
            "aircraft": {
              "name": "Boeing 777-300",
              "id": "arc_00009VMF8AhXSSRnQDI6HE",
              "iata_code": "773"
            }
          }
        ],
        "origin_type": "airport",
        "origin": {
          "type": "airport",
          "time_zone": "America/New_York",
          "name": "New York Stewart International Airport",
          "longitude": -74.102724,
          "latitude": 41.501292,
          "id": "arp_swf_us",
          "icao_code": "KSWF",
          "iata_country_code": "US",
          "iata_code": "SWF",
          "iata_city_code": "NYC",
          "city_name": "Newburgh",
          "city": {
            "type": "city",
            "time_zone": null,
            "name": "New York",
            "longitude": null,
            "latitude": null,
            "id": "cit_nyc_us",
            "icao_code": null,
            "iata_country_code": "US",
            "iata_code": "NYC",
            "iata_city_code": "NYC",
            "city_name": null
          }
        },
        "id": "sli_0000A8L6Pqy4nZVh0nPdK5",
        "duration": "PT2H23M",
        "destination_type": "airport",
        "destination": {
          "type": "airport",
          "time_zone": "America/New_York",
          "name": "Hartsfield-Jackson Atlanta International Airport",
          "longitude": -84.4279,
          "latitude": 33.638714,
          "id": "arp_atl_us",
          "icao_code": "KATL",
          "iata_country_code": "US",
          "iata_code": "ATL",
          "iata_city_code": "ATL",
          "city_name": "Atlanta",
          "city": {
            "type": "city",
            "time_zone": null,
            "name": "Atlanta",
            "longitude": null,
            "latitude": null,
            "id": "cit_atl_us",
            "icao_code": null,
            "iata_country_code": "US",
            "iata_code": "ATL",
            "iata_city_code": "ATL",
            "city_name": null
          }
        },
        "conditions": {
          "change_before_departure": {
            "penalty_currency": null,
            "penalty_amount": null,
            "allowed": false
          }
        }
      },
      {
        "segments": [
          {
            "passengers": [
              {
                "seat": null,
                "passenger_id": "pas_0000A8L6LYhCn9xjBRTP60",
                "fare_basis_code": null,
                "cabin_class_marketing_name": "Business",
                "cabin_class": "business",
                "baggages": [
                  {
                    "type": "checked",
                    "quantity": 1
                  }
                ]
              },
              {
                "seat": null,
                "passenger_id": "pas_0000A8L6LYhCn9xjBRTP61",
                "fare_basis_code": null,
                "cabin_class_marketing_name": "Business",
                "cabin_class": "business",
                "baggages": [
                  {
                    "type": "checked",
                    "quantity": 1
                  }
                ]
              },
              {
                "seat": null,
                "passenger_id": "pas_0000A8L6LYhCn9xjBRTP62",
                "fare_basis_code": null,
                "cabin_class_marketing_name": "Business",
                "cabin_class": "business",
                "baggages": [
                  {
                    "type": "checked",
                    "quantity": 1
                  }
                ]
              }
            ],
            "origin_terminal": "2",
            "origin": {
              "type": "airport",
              "time_zone": "America/New_York",
              "name": "Hartsfield-Jackson Atlanta International Airport",
              "longitude": -84.4279,
              "latitude": 33.638714,
              "id": "arp_atl_us",
              "icao_code": "KATL",
              "iata_country_code": "US",
              "iata_code": "ATL",
              "iata_city_code": "ATL",
              "city_name": "Atlanta",
              "city": {
                "type": "city",
                "time_zone": null,
                "name": "Atlanta",
                "longitude": null,
                "latitude": null,
                "id": "cit_atl_us",
                "icao_code": null,
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": null
              }
            },
            "operating_carrier_flight_number": "9303",
            "operating_carrier": {
              "name": "Duffel Airways",
              "id": "arl_00009VME7D6ivUu8dn35WK",
              "iata_code": "ZZ"
            },
            "marketing_carrier_flight_number": "9303",
            "marketing_carrier": {
              "name": "Duffel Airways",
              "id": "arl_00009VME7D6ivUu8dn35WK",
              "iata_code": "ZZ"
            },
            "id": "seg_0000A8L6LZGIgg2EwHtQna",
            "duration": "PT2H23M",
            "distance": "1360.5217397388235",
            "destination_terminal": "7",
            "destination": {
              "type": "airport",
              "time_zone": "America/New_York",
              "name": "New York Stewart International Airport",
              "longitude": -74.102724,
              "latitude": 41.501292,
              "id": "arp_swf_us",
              "icao_code": "KSWF",
              "iata_country_code": "US",
              "iata_code": "SWF",
              "iata_city_code": "NYC",
              "city_name": "Newburgh",
              "city": {
                "type": "city",
                "time_zone": null,
                "name": "New York",
                "longitude": null,
                "latitude": null,
                "id": "cit_nyc_us",
                "icao_code": null,
                "iata_country_code": "US",
                "iata_code": "NYC",
                "iata_city_code": "NYC",
                "city_name": null
              }
            },
            "departure_terminal": "2",
            "departure_datetime": "2022-06-18T23:00:00",
            "departing_at": "2022-06-18T23:00:00",
            "arriving_at": "2022-06-19T01:23:00",
            "arrival_terminal": "7",
            "arrival_datetime": "2022-06-19T01:23:00",
            "aircraft": {
              "name": "Boeing 777-300",
              "id": "arc_00009VMF8AhXSSRnQDI6HE",
              "iata_code": "773"
            }
          }
        ],
        "origin_type": "airport",
        "origin": {
          "type": "airport",
          "time_zone": "America/New_York",
          "name": "Hartsfield-Jackson Atlanta International Airport",
          "longitude": -84.4279,
          "latitude": 33.638714,
          "id": "arp_atl_us",
          "icao_code": "KATL",
          "iata_country_code": "US",
          "iata_code": "ATL",
          "iata_city_code": "ATL",
          "city_name": "Atlanta",
          "city": {
            "type": "city",
            "time_zone": null,
            "name": "Atlanta",
            "longitude": null,
            "latitude": null,
            "id": "cit_atl_us",
            "icao_code": null,
            "iata_country_code": "US",
            "iata_code": "ATL",
            "iata_city_code": "ATL",
            "city_name": null
          }
        },
        "id": "sli_0000A8L6Pqy4nZVh0nPdK6",
        "duration": "PT2H23M",
        "destination_type": "airport",
        "destination": {
          "type": "airport",
          "time_zone": "America/New_York",
          "name": "New York Stewart International Airport",
          "longitude": -74.102724,
          "latitude": 41.501292,
          "id": "arp_swf_us",
          "icao_code": "KSWF",
          "iata_country_code": "US",
          "iata_code": "SWF",
          "iata_city_code": "NYC",
          "city_name": "Newburgh",
          "city": {
            "type": "city",
            "time_zone": null,
            "name": "New York",
            "longitude": null,
            "latitude": null,
            "id": "cit_nyc_us",
            "icao_code": null,
            "iata_country_code": "US",
            "iata_code": "NYC",
            "iata_city_code": "NYC",
            "city_name": null
          }
        },
        "conditions": {
          "change_before_departure": {
            "penalty_currency": null,
            "penalty_amount": null,
            "allowed": false
          }
        }
      }
    ],
    "services": [],
    "payment_status": {
      "price_guarantee_expires_at": null,
      "payment_required_by": null,
      "awaiting_payment": false
    },
    "passengers": [
      {
        "type": "adult",
        "title": "mr",
        "infant_passenger_id": "pas_0000A8L6LYhCn9xjBRTP62",
        "id": "pas_0000A8L6LYhCn9xjBRTP60",
        "given_name": "Tony",
        "gender": "m",
        "family_name": "Stark",
        "born_on": "1980-07-24"
      },
      {
        "type": "adult",
        "title": "mrs",
        "infant_passenger_id": null,
        "id": "pas_0000A8L6LYhCn9xjBRTP61",
        "given_name": "Pepper",
        "gender": "m",
        "family_name": "Potts",
        "born_on": "1983-11-02"
      },
      {
        "type": "infant_without_seat",
        "title": "mrs",
        "infant_passenger_id": null,
        "id": "pas_0000A8L6LYhCn9xjBRTP62",
        "given_name": "Morgan",
        "gender": "f",
        "family_name": "Stark",
        "born_on": "2019-08-24"
      }
    ],
    "owner": {
      "name": "Duffel Airways",
      "id": "arl_00009VME7D6ivUu8dn35WK",
      "iata_code": "ZZ"
    },
    "metadata": null,
    "live_mode": false,
    "id": "ord_0000A8L6Pqy4nZVh0nPdK4",
    "documents": [
      {
        "unique_identifier": "1",
        "type": "electronic_ticket"
      },
      {
        "unique_identifier": "2",
        "type": "electronic_ticket"
      },
      {
        "unique_identifier": "3",
        "type": "electronic_ticket"
      }
    ],
    "created_at": "2021-06-16T09:40:25.456538Z",
    "conditions": {
      "refund_before_departure": {
        "penalty_currency": null,
        "penalty_amount": null,
        "allowed": false
      },
      "change_before_departure": {
        "penalty_currency": null,
        "penalty_amount": null,
        "allowed": false
      }
    },
    "cancelled_at": null,
    "booking_reference": "CKNG4U",
    "base_currency": "GBP",
    "base_amount": "6336.44"
  }
}
```

| We can see the order has two slices: one for the outbound flight, and one for the inbound flight. The order's available_actions includes change, indicating it can be changed through the API. |
| Notice each slice has a unique ID, we will be using them next to make changes to the order. |
| The order change process happens in 4 steps: |
| - You create an order change request (1) | 
| - You review the available order change offers (2) |
| - You create a pending order change (3) |
| - You confirm the order change (4) |

| 1. Create an order change request | 
| ----- |
| To request changes for an order, you need to provide a list of slices to remove, plus a list of search criteria for slices you want to add. |
| In our example, we want to remove the current inbound flight, so we will be adding its slice.id to the remove list. We also want to find new flights on the updated date 24th June, we can do that by adding the relevant search criteria to the add list: | 

> JavaScript
> Node.JS
```
duffel.orderChangeRequests.create({
    order_id: ORDER_ID,
    slices: {
      remove: [
        {slice_id: SLICE_TO_REMOVE_ID}
      ],
      add: [
        {
          origin: "ATL",
          destination: "SWF",
          departure_date: "2022-06-24",
          cabin_class: "business"
        }
      ]
    }
  })
```
| You'll need to replace `ORDER_ID` with the ID of the order you want to change, and `SLICE_TO_REMOVE_ID` with the ID of the slice you want to replace. |
| We'll return an order change request, echoing back the remove and add criteria. | 
| The response will also include an unique ID for the change request, we'll be using it on the next step to review the available change offers. |

> JSON
```
{
  "meta": null,
  "data": {
    "updated_at": "2021-06-16T10:41:31.954687Z",
    "slices": {
      "remove": [
        {
          "slice_id": "sli_0000A8L6Pqy4nZVh0nPdK6"
        }
      ],
      "add": [
        {
          "origin": "ATL",
          "destination": "SWF",
          "departure_date": "2022-06-24",
          "cabin_class": "business"
        }
      ]
    },
    "live_mode": false,
    "id": "ocr_0000A8LBrykRxt3J1MGlcG",
    "created_at": "2021-06-16T10:41:31.954687Z"
  }
}
```
| 2. Review available order change offers |
| ----- |
| Now that you have requested an order change, you should review the available offers. You can do this with the "Get a single order change request" endpoint: |

> JavaScript
> Node.JS
```
duffel.orderChangeRequests.get(ORDER_CHANGE_REQUEST_ID)
```
| The response will include a list of order_change_offers, each including details for the slices that would be added and removed from the order. They also include the difference in price change_total_amount, as well as the penalty imposed by the airline penalty_total_amount. The price of new flights could be more expensive or cheaper than the original. |
| If you'd like to get a complete look at the change offer schema, check out our API reference. |

> JSON
```
{
  "meta": null,
  "data": {
    "updated_at": "2021-06-16T10:41:31.954687Z",
    "slices": {
      "remove": [
        {
          "slice_id": "sli_0000A8L6Pqy4nZVh0nPdK6"
        }
      ],
      "add": [
        {
          "origin": "ATL",
          "destination": "SWF",
          "departure_date": "2022-06-24",
          "cabin_class": "business"
        }
      ]
    },
    "order_change_offers": [
      {
        "updated_at": "2021-06-16T10:41:31.970983Z",
        "slices": {
          "remove": [
            {
              "segments": [
                {
                  "origin_terminal": "2",
                  "origin": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "Hartsfield-Jackson Atlanta International Airport",
                    "longitude": -84.4279,
                    "latitude": 33.638714,
                    "id": "arp_atl_us",
                    "icao_code": "KATL",
                    "iata_country_code": "US",
                    "iata_code": "ATL",
                    "iata_city_code": "ATL",
                    "city_name": "Atlanta",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "Atlanta",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_atl_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "ATL",
                      "iata_city_code": "ATL",
                      "city_name": null
                    }
                  },
                  "operating_carrier_flight_number": "9303",
                  "operating_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "marketing_carrier_flight_number": "9303",
                  "marketing_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "id": "seg_0000A8L6LZGIgg2EwHtQna",
                  "duration": "PT2H23M",
                  "distance": "1360.5217397388235",
                  "destination_terminal": "7",
                  "destination": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "New York Stewart International Airport",
                    "longitude": -74.102724,
                    "latitude": 41.501292,
                    "id": "arp_swf_us",
                    "icao_code": "KSWF",
                    "iata_country_code": "US",
                    "iata_code": "SWF",
                    "iata_city_code": "NYC",
                    "city_name": "Newburgh",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "New York",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_nyc_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "NYC",
                      "iata_city_code": "NYC",
                      "city_name": null
                    }
                  },
                  "departing_at": "2022-06-18T23:00:00",
                  "arriving_at": "2022-06-19T01:23:00",
                  "aircraft": {
                    "name": "Boeing 777-300",
                    "id": "arc_00009VMF8AhXSSRnQDI6HE",
                    "iata_code": "773"
                  }
                }
              ],
              "origin_type": "airport",
              "origin": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "Hartsfield-Jackson Atlanta International Airport",
                "longitude": -84.4279,
                "latitude": 33.638714,
                "id": "arp_atl_us",
                "icao_code": "KATL",
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": "Atlanta",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "Atlanta",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_atl_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "ATL",
                  "iata_city_code": "ATL",
                  "city_name": null
                }
              },
              "id": "sli_0000A8L6Pqy4nZVh0nPdK6",
              "duration": "PT2H23M",
              "destination_type": "airport",
              "destination": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "New York Stewart International Airport",
                "longitude": -74.102724,
                "latitude": 41.501292,
                "id": "arp_swf_us",
                "icao_code": "KSWF",
                "iata_country_code": "US",
                "iata_code": "SWF",
                "iata_city_code": "NYC",
                "city_name": "Newburgh",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "New York",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_nyc_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "NYC",
                  "iata_city_code": "NYC",
                  "city_name": null
                }
              }
            }
          ],
          "add": [
            {
              "segments": [
                {
                  "origin_terminal": "2",
                  "origin": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "Hartsfield-Jackson Atlanta International Airport",
                    "longitude": -84.4279,
                    "latitude": 33.638714,
                    "id": "arp_atl_us",
                    "icao_code": "KATL",
                    "iata_country_code": "US",
                    "iata_code": "ATL",
                    "iata_city_code": "ATL",
                    "city_name": "Atlanta",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "Atlanta",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_atl_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "ATL",
                      "iata_city_code": "ATL",
                      "city_name": null
                    }
                  },
                  "operating_carrier_flight_number": "5901",
                  "operating_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "marketing_carrier_flight_number": "5901",
                  "marketing_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "id": "seg_0000A8LBrymDrITD6r6BNY",
                  "duration": "PT2H23M",
                  "distance": "1360.5217397388235",
                  "destination_terminal": "7",
                  "destination": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "New York Stewart International Airport",
                    "longitude": -74.102724,
                    "latitude": 41.501292,
                    "id": "arp_swf_us",
                    "icao_code": "KSWF",
                    "iata_country_code": "US",
                    "iata_code": "SWF",
                    "iata_city_code": "NYC",
                    "city_name": "Newburgh",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "New York",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_nyc_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "NYC",
                      "iata_city_code": "NYC",
                      "city_name": null
                    }
                  },
                  "departing_at": "2022-06-24T23:00:00",
                  "arriving_at": "2022-06-25T01:23:00",
                  "aircraft": {
                    "name": "Boeing 777-300",
                    "id": "arc_00009VMF8AhXSSRnQDI6HE",
                    "iata_code": "773"
                  }
                }
              ],
              "origin_type": "airport",
              "origin": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "Hartsfield-Jackson Atlanta International Airport",
                "longitude": -84.4279,
                "latitude": 33.638714,
                "id": "arp_atl_us",
                "icao_code": "KATL",
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": "Atlanta",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "Atlanta",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_atl_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "ATL",
                  "iata_city_code": "ATL",
                  "city_name": null
                }
              },
              "id": "sli_0000A8LBrymDrITD6r6BNZ",
              "duration": "PT2H23M",
              "destination_type": "airport",
              "destination": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "New York Stewart International Airport",
                "longitude": -74.102724,
                "latitude": 41.501292,
                "id": "arp_swf_us",
                "icao_code": "KSWF",
                "iata_country_code": "US",
                "iata_code": "SWF",
                "iata_city_code": "NYC",
                "city_name": "Newburgh",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "New York",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_nyc_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "NYC",
                  "iata_city_code": "NYC",
                  "city_name": null
                }
              }
            }
          ]
        },
        "refund_to": "original_form_of_payment",
        "penalty_total_currency": "GBP",
        "penalty_total_amount": "25.00",
        "order_change_id": null,
        "new_total_currency": "GBP",
        "new_total_amount": "25.00",
        "live_mode": false,
        "id": "oco_0000A8LBrynHnLJxA9b22K",
        "expires_at": "2021-06-19T10:41:31Z",
        "created_at": "2021-06-16T10:41:31.970983Z",
        "change_total_currency": "GBP",
        "change_total_amount": "50.00"
      },
      {
        "updated_at": "2021-06-16T10:41:31.979325Z",
        "slices": {
          "remove": [
            {
              "segments": [
                {
                  "origin_terminal": "2",
                  "origin": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "Hartsfield-Jackson Atlanta International Airport",
                    "longitude": -84.4279,
                    "latitude": 33.638714,
                    "id": "arp_atl_us",
                    "icao_code": "KATL",
                    "iata_country_code": "US",
                    "iata_code": "ATL",
                    "iata_city_code": "ATL",
                    "city_name": "Atlanta",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "Atlanta",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_atl_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "ATL",
                      "iata_city_code": "ATL",
                      "city_name": null
                    }
                  },
                  "operating_carrier_flight_number": "9303",
                  "operating_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "marketing_carrier_flight_number": "9303",
                  "marketing_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "id": "seg_0000A8L6LZGIgg2EwHtQna",
                  "duration": "PT2H23M",
                  "distance": "1360.5217397388235",
                  "destination_terminal": "7",
                  "destination": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "New York Stewart International Airport",
                    "longitude": -74.102724,
                    "latitude": 41.501292,
                    "id": "arp_swf_us",
                    "icao_code": "KSWF",
                    "iata_country_code": "US",
                    "iata_code": "SWF",
                    "iata_city_code": "NYC",
                    "city_name": "Newburgh",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "New York",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_nyc_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "NYC",
                      "iata_city_code": "NYC",
                      "city_name": null
                    }
                  },
                  "departing_at": "2022-06-18T23:00:00",
                  "arriving_at": "2022-06-19T01:23:00",
                  "aircraft": {
                    "name": "Boeing 777-300",
                    "id": "arc_00009VMF8AhXSSRnQDI6HE",
                    "iata_code": "773"
                  }
                }
              ],
              "origin_type": "airport",
              "origin": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "Hartsfield-Jackson Atlanta International Airport",
                "longitude": -84.4279,
                "latitude": 33.638714,
                "id": "arp_atl_us",
                "icao_code": "KATL",
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": "Atlanta",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "Atlanta",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_atl_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "ATL",
                  "iata_city_code": "ATL",
                  "city_name": null
                }
              },
              "id": "sli_0000A8L6Pqy4nZVh0nPdK6",
              "duration": "PT2H23M",
              "destination_type": "airport",
              "destination": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "New York Stewart International Airport",
                "longitude": -74.102724,
                "latitude": 41.501292,
                "id": "arp_swf_us",
                "icao_code": "KSWF",
                "iata_country_code": "US",
                "iata_code": "SWF",
                "iata_city_code": "NYC",
                "city_name": "Newburgh",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "New York",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_nyc_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "NYC",
                  "iata_city_code": "NYC",
                  "city_name": null
                }
              }
            }
          ],
          "add": [
            {
              "segments": [
                {
                  "origin_terminal": "2",
                  "origin": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "Hartsfield-Jackson Atlanta International Airport",
                    "longitude": -84.4279,
                    "latitude": 33.638714,
                    "id": "arp_atl_us",
                    "icao_code": "KATL",
                    "iata_country_code": "US",
                    "iata_code": "ATL",
                    "iata_city_code": "ATL",
                    "city_name": "Atlanta",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "Atlanta",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_atl_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "ATL",
                      "iata_city_code": "ATL",
                      "city_name": null
                    }
                  },
                  "operating_carrier_flight_number": "7189",
                  "operating_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "marketing_carrier_flight_number": "7189",
                  "marketing_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "id": "seg_0000A8LBrymZpykn7xGSvo",
                  "duration": "PT2H23M",
                  "distance": "1360.5217397388235",
                  "destination_terminal": "7",
                  "destination": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "New York Stewart International Airport",
                    "longitude": -74.102724,
                    "latitude": 41.501292,
                    "id": "arp_swf_us",
                    "icao_code": "KSWF",
                    "iata_country_code": "US",
                    "iata_code": "SWF",
                    "iata_city_code": "NYC",
                    "city_name": "Newburgh",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "New York",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_nyc_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "NYC",
                      "iata_city_code": "NYC",
                      "city_name": null
                    }
                  },
                  "departing_at": "2022-06-24T23:00:00",
                  "arriving_at": "2022-06-25T01:23:00",
                  "aircraft": {
                    "name": "Boeing 777-300",
                    "id": "arc_00009VMF8AhXSSRnQDI6HE",
                    "iata_code": "773"
                  }
                }
              ],
              "origin_type": "airport",
              "origin": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "Hartsfield-Jackson Atlanta International Airport",
                "longitude": -84.4279,
                "latitude": 33.638714,
                "id": "arp_atl_us",
                "icao_code": "KATL",
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": "Atlanta",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "Atlanta",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_atl_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "ATL",
                  "iata_city_code": "ATL",
                  "city_name": null
                }
              },
              "id": "sli_0000A8LBrymZpykn7xGSvp",
              "duration": "PT2H23M",
              "destination_type": "airport",
              "destination": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "New York Stewart International Airport",
                "longitude": -74.102724,
                "latitude": 41.501292,
                "id": "arp_swf_us",
                "icao_code": "KSWF",
                "iata_country_code": "US",
                "iata_code": "SWF",
                "iata_city_code": "NYC",
                "city_name": "Newburgh",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "New York",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_nyc_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "NYC",
                  "iata_city_code": "NYC",
                  "city_name": null
                }
              }
            }
          ]
        },
        "refund_to": "original_form_of_payment",
        "penalty_total_currency": "GBP",
        "penalty_total_amount": "25.00",
        "order_change_id": null,
        "new_total_currency": "GBP",
        "new_total_amount": "25.00",
        "live_mode": false,
        "id": "oco_0000A8LBryndm1bXBFlJac",
        "expires_at": "2021-06-19T10:41:31Z",
        "created_at": "2021-06-16T10:41:31.979325Z",
        "change_total_currency": "GBP",
        "change_total_amount": "50.00"
      },
      {
        "updated_at": "2021-06-16T10:41:31.983198Z",
        "slices": {
          "remove": [
            {
              "segments": [
                {
                  "origin_terminal": "2",
                  "origin": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "Hartsfield-Jackson Atlanta International Airport",
                    "longitude": -84.4279,
                    "latitude": 33.638714,
                    "id": "arp_atl_us",
                    "icao_code": "KATL",
                    "iata_country_code": "US",
                    "iata_code": "ATL",
                    "iata_city_code": "ATL",
                    "city_name": "Atlanta",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "Atlanta",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_atl_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "ATL",
                      "iata_city_code": "ATL",
                      "city_name": null
                    }
                  },
                  "operating_carrier_flight_number": "9303",
                  "operating_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "marketing_carrier_flight_number": "9303",
                  "marketing_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "id": "seg_0000A8L6LZGIgg2EwHtQna",
                  "duration": "PT2H23M",
                  "distance": "1360.5217397388235",
                  "destination_terminal": "7",
                  "destination": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "New York Stewart International Airport",
                    "longitude": -74.102724,
                    "latitude": 41.501292,
                    "id": "arp_swf_us",
                    "icao_code": "KSWF",
                    "iata_country_code": "US",
                    "iata_code": "SWF",
                    "iata_city_code": "NYC",
                    "city_name": "Newburgh",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "New York",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_nyc_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "NYC",
                      "iata_city_code": "NYC",
                      "city_name": null
                    }
                  },
                  "departing_at": "2022-06-18T23:00:00",
                  "arriving_at": "2022-06-19T01:23:00",
                  "aircraft": {
                    "name": "Boeing 777-300",
                    "id": "arc_00009VMF8AhXSSRnQDI6HE",
                    "iata_code": "773"
                  }
                }
              ],
              "origin_type": "airport",
              "origin": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "Hartsfield-Jackson Atlanta International Airport",
                "longitude": -84.4279,
                "latitude": 33.638714,
                "id": "arp_atl_us",
                "icao_code": "KATL",
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": "Atlanta",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "Atlanta",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_atl_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "ATL",
                  "iata_city_code": "ATL",
                  "city_name": null
                }
              },
              "id": "sli_0000A8L6Pqy4nZVh0nPdK6",
              "duration": "PT2H23M",
              "destination_type": "airport",
              "destination": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "New York Stewart International Airport",
                "longitude": -74.102724,
                "latitude": 41.501292,
                "id": "arp_swf_us",
                "icao_code": "KSWF",
                "iata_country_code": "US",
                "iata_code": "SWF",
                "iata_city_code": "NYC",
                "city_name": "Newburgh",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "New York",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_nyc_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "NYC",
                  "iata_city_code": "NYC",
                  "city_name": null
                }
              }
            }
          ],
          "add": [
            {
              "segments": [
                {
                  "origin_terminal": "2",
                  "origin": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "Hartsfield-Jackson Atlanta International Airport",
                    "longitude": -84.4279,
                    "latitude": 33.638714,
                    "id": "arp_atl_us",
                    "icao_code": "KATL",
                    "iata_country_code": "US",
                    "iata_code": "ATL",
                    "iata_city_code": "ATL",
                    "city_name": "Atlanta",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "Atlanta",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_atl_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "ATL",
                      "iata_city_code": "ATL",
                      "city_name": null
                    }
                  },
                  "operating_carrier_flight_number": "2303",
                  "operating_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "marketing_carrier_flight_number": "2303",
                  "marketing_carrier": {
                    "name": "Duffel Airways",
                    "id": "arl_00009VME7D6ivUu8dn35WK",
                    "iata_code": "ZZ"
                  },
                  "id": "seg_0000A8LBrymvof2N93QkU4",
                  "duration": "PT2H23M",
                  "distance": "1360.5217397388235",
                  "destination_terminal": "7",
                  "destination": {
                    "type": "airport",
                    "time_zone": "America/New_York",
                    "name": "New York Stewart International Airport",
                    "longitude": -74.102724,
                    "latitude": 41.501292,
                    "id": "arp_swf_us",
                    "icao_code": "KSWF",
                    "iata_country_code": "US",
                    "iata_code": "SWF",
                    "iata_city_code": "NYC",
                    "city_name": "Newburgh",
                    "city": {
                      "type": "city",
                      "time_zone": null,
                      "name": "New York",
                      "longitude": null,
                      "latitude": null,
                      "id": "cit_nyc_us",
                      "icao_code": null,
                      "iata_country_code": "US",
                      "iata_code": "NYC",
                      "iata_city_code": "NYC",
                      "city_name": null
                    }
                  },
                  "departing_at": "2022-06-24T23:00:00",
                  "arriving_at": "2022-06-25T01:23:00",
                  "aircraft": {
                    "name": "Boeing 777-300",
                    "id": "arc_00009VMF8AhXSSRnQDI6HE",
                    "iata_code": "773"
                  }
                }
              ],
              "origin_type": "airport",
              "origin": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "Hartsfield-Jackson Atlanta International Airport",
                "longitude": -84.4279,
                "latitude": 33.638714,
                "id": "arp_atl_us",
                "icao_code": "KATL",
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": "Atlanta",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "Atlanta",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_atl_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "ATL",
                  "iata_city_code": "ATL",
                  "city_name": null
                }
              },
              "id": "sli_0000A8LBrymvof2N93QkU5",
              "duration": "PT2H23M",
              "destination_type": "airport",
              "destination": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "New York Stewart International Airport",
                "longitude": -74.102724,
                "latitude": 41.501292,
                "id": "arp_swf_us",
                "icao_code": "KSWF",
                "iata_country_code": "US",
                "iata_code": "SWF",
                "iata_city_code": "NYC",
                "city_name": "Newburgh",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "New York",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_nyc_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "NYC",
                  "iata_city_code": "NYC",
                  "city_name": null
                }
              }
            }
          ]
        },
        "refund_to": "original_form_of_payment",
        "penalty_total_currency": "GBP",
        "penalty_total_amount": "25.00",
        "order_change_id": null,
        "new_total_currency": "GBP",
        "new_total_amount": "25.00",
        "live_mode": false,
        "id": "oco_0000A8LBryoLjOAhDS5sh6",
        "expires_at": "2021-06-19T10:41:31Z",
        "created_at": "2021-06-16T10:41:31.983198Z",
        "change_total_currency": "GBP",
        "change_total_amount": "50.00"
      }
    ],
    "live_mode": false,
    "id": "ocr_0000A8LBrykRxt3J1MGlcG",
    "created_at": "2021-06-16T10:41:31.954687Z"
  }
}
```
| 3. Create a pending order change |
| ----- |
| After reviewing the available change offers, Tony's family has chosen a new return flight. |
| We can now create a pending order change using the change offer's unique ID and the Create a pending order change endpoint: |

> JavaScript
> Node.JS
```
duffel.orderChanges.create({selected_order_change_offer: ORDER_CHANGE_OFFER_ID})
```
| We will return an order change. You can see the value of confirmed_at is null, indicating that the change has not been confirmed yet. |
| The price of a pending change order can change over time. You should let your customers review the final price before confirming the order. You can use Get a single order change endpoint to obtain the latest price using the pending order change's id. | 

> JavaScript
> Node.JS
```
duffel.orderChanges.get(ORDER_CHANGE_ID)
```
| There are also some important legal notices that you must display to make sure that the customer understands how their data will be used and the rules that apply to their booking. |

> JSON
```
{
  "meta": null,
  "data": {
    "updated_at": "2021-06-16T12:50:09.386961Z",
    "slices": {
      "remove": [
        {
          "segments": [
            {
              "origin_terminal": "2",
              "origin": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "Hartsfield-Jackson Atlanta International Airport",
                "longitude": -84.4279,
                "latitude": 33.638714,
                "id": "arp_atl_us",
                "icao_code": "KATL",
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": "Atlanta",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "Atlanta",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_atl_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "ATL",
                  "iata_city_code": "ATL",
                  "city_name": null
                }
              },
              "operating_carrier_flight_number": "9303",
              "operating_carrier": {
                "name": "Duffel Airways",
                "id": "arl_00009VME7D6ivUu8dn35WK",
                "iata_code": "ZZ"
              },
              "marketing_carrier_flight_number": "9303",
              "marketing_carrier": {
                "name": "Duffel Airways",
                "id": "arl_00009VME7D6ivUu8dn35WK",
                "iata_code": "ZZ"
              },
              "id": "seg_0000A8L6LZGIgg2EwHtQna",
              "duration": "PT2H23M",
              "distance": "1360.5217397388235",
              "destination_terminal": "7",
              "destination": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "New York Stewart International Airport",
                "longitude": -74.102724,
                "latitude": 41.501292,
                "id": "arp_swf_us",
                "icao_code": "KSWF",
                "iata_country_code": "US",
                "iata_code": "SWF",
                "iata_city_code": "NYC",
                "city_name": "Newburgh",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "New York",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_nyc_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "NYC",
                  "iata_city_code": "NYC",
                  "city_name": null
                }
              },
              "departing_at": "2022-06-18T23:00:00",
              "arriving_at": "2022-06-19T01:23:00",
              "aircraft": {
                "name": "Boeing 777-300",
                "id": "arc_00009VMF8AhXSSRnQDI6HE",
                "iata_code": "773"
              }
            }
          ],
          "origin_type": "airport",
          "origin": {
            "type": "airport",
            "time_zone": "America/New_York",
            "name": "Hartsfield-Jackson Atlanta International Airport",
            "longitude": -84.4279,
            "latitude": 33.638714,
            "id": "arp_atl_us",
            "icao_code": "KATL",
            "iata_country_code": "US",
            "iata_code": "ATL",
            "iata_city_code": "ATL",
            "city_name": "Atlanta",
            "city": {
              "type": "city",
              "time_zone": null,
              "name": "Atlanta",
              "longitude": null,
              "latitude": null,
              "id": "cit_atl_us",
              "icao_code": null,
              "iata_country_code": "US",
              "iata_code": "ATL",
              "iata_city_code": "ATL",
              "city_name": null
            }
          },
          "id": "sli_0000A8L6Pqy4nZVh0nPdK6",
          "duration": "PT2H23M",
          "destination_type": "airport",
          "destination": {
            "type": "airport",
            "time_zone": "America/New_York",
            "name": "New York Stewart International Airport",
            "longitude": -74.102724,
            "latitude": 41.501292,
            "id": "arp_swf_us",
            "icao_code": "KSWF",
            "iata_country_code": "US",
            "iata_code": "SWF",
            "iata_city_code": "NYC",
            "city_name": "Newburgh",
            "city": {
              "type": "city",
              "time_zone": null,
              "name": "New York",
              "longitude": null,
              "latitude": null,
              "id": "cit_nyc_us",
              "icao_code": null,
              "iata_country_code": "US",
              "iata_code": "NYC",
              "iata_city_code": "NYC",
              "city_name": null
            }
          }
        }
      ],
      "add": [
        {
          "segments": [
            {
              "origin_terminal": "2",
              "origin": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "Hartsfield-Jackson Atlanta International Airport",
                "longitude": -84.4279,
                "latitude": 33.638714,
                "id": "arp_atl_us",
                "icao_code": "KATL",
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": "Atlanta",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "Atlanta",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_atl_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "ATL",
                  "iata_city_code": "ATL",
                  "city_name": null
                }
              },
              "operating_carrier_flight_number": "5901",
              "operating_carrier": {
                "name": "Duffel Airways",
                "id": "arl_00009VME7D6ivUu8dn35WK",
                "iata_code": "ZZ"
              },
              "marketing_carrier_flight_number": "5901",
              "marketing_carrier": {
                "name": "Duffel Airways",
                "id": "arl_00009VME7D6ivUu8dn35WK",
                "iata_code": "ZZ"
              },
              "id": "seg_0000A8LBrymDrITD6r6BNY",
              "duration": "PT2H23M",
              "distance": "1360.5217397388235",
              "destination_terminal": "7",
              "destination": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "New York Stewart International Airport",
                "longitude": -74.102724,
                "latitude": 41.501292,
                "id": "arp_swf_us",
                "icao_code": "KSWF",
                "iata_country_code": "US",
                "iata_code": "SWF",
                "iata_city_code": "NYC",
                "city_name": "Newburgh",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "New York",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_nyc_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "NYC",
                  "iata_city_code": "NYC",
                  "city_name": null
                }
              },
              "departing_at": "2022-06-24T23:00:00",
              "arriving_at": "2022-06-25T01:23:00",
              "aircraft": {
                "name": "Boeing 777-300",
                "id": "arc_00009VMF8AhXSSRnQDI6HE",
                "iata_code": "773"
              }
            }
          ],
          "origin_type": "airport",
          "origin": {
            "type": "airport",
            "time_zone": "America/New_York",
            "name": "Hartsfield-Jackson Atlanta International Airport",
            "longitude": -84.4279,
            "latitude": 33.638714,
            "id": "arp_atl_us",
            "icao_code": "KATL",
            "iata_country_code": "US",
            "iata_code": "ATL",
            "iata_city_code": "ATL",
            "city_name": "Atlanta",
            "city": {
              "type": "city",
              "time_zone": null,
              "name": "Atlanta",
              "longitude": null,
              "latitude": null,
              "id": "cit_atl_us",
              "icao_code": null,
              "iata_country_code": "US",
              "iata_code": "ATL",
              "iata_city_code": "ATL",
              "city_name": null
            }
          },
          "id": "sli_0000A8LBrymDrITD6r6BNZ",
          "duration": "PT2H23M",
          "destination_type": "airport",
          "destination": {
            "type": "airport",
            "time_zone": "America/New_York",
            "name": "New York Stewart International Airport",
            "longitude": -74.102724,
            "latitude": 41.501292,
            "id": "arp_swf_us",
            "icao_code": "KSWF",
            "iata_country_code": "US",
            "iata_code": "SWF",
            "iata_city_code": "NYC",
            "city_name": "Newburgh",
            "city": {
              "type": "city",
              "time_zone": null,
              "name": "New York",
              "longitude": null,
              "latitude": null,
              "id": "cit_nyc_us",
              "icao_code": null,
              "iata_country_code": "US",
              "iata_code": "NYC",
              "iata_city_code": "NYC",
              "city_name": null
            }
          }
        }
      ]
    },
    "refund_to": "original_form_of_payment",
    "penalty_total_currency": "GBP",
    "penalty_total_amount": "25.00",
    "order_id": "ord_0000A8L6Pqy4nZVh0nPdK4",
    "new_total_currency": "GBP",
    "new_total_amount": "25.00",
    "live_mode": false,
    "id": "oce_0000A8LNLgZVCzBypYW5mC",
    "expires_at": "2021-06-19T12:50:09Z",
    "created_at": "2021-06-16T12:50:09.386961Z",
    "confirmed_at": null,
    "change_total_currency": "GBP",
    "change_total_amount": "50.00"
  }
}
```
| 4. Confirm an order change |
| ----- |
| We are finally ready to confirm the order changes for Tony and his family. You'll only need two things at this point: |
| The ID of the order change you'd like to confirm |
| Payment method and details to confirm the change |
| To confirm an order, use the Confirm an order change endpoint: |

> JavaScript
> Node.JS
```
duffel.orderChanges.confirm({
    ORDER_CHANGE_ID,
    "payment": {
      "type": "balance",
      "currency": "GBP",
      "amount": "50.00"
    }
  })
```
| We will return an order change. This time you will see the updated confirmed_at value, indicating the order change has now been confirmed. |

> JSON
```
{
  "meta": null,
  "data": {
    "updated_at": "2021-06-16T13:14:25.143485Z",
    "slices": {
      "remove": [
        {
          "segments": [
            {
              "origin_terminal": "2",
              "origin": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "Hartsfield-Jackson Atlanta International Airport",
                "longitude": -84.4279,
                "latitude": 33.638714,
                "id": "arp_atl_us",
                "icao_code": "KATL",
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": "Atlanta",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "Atlanta",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_atl_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "ATL",
                  "iata_city_code": "ATL",
                  "city_name": null
                }
              },
              "operating_carrier_flight_number": "9303",
              "operating_carrier": {
                "name": "Duffel Airways",
                "id": "arl_00009VME7D6ivUu8dn35WK",
                "iata_code": "ZZ"
              },
              "marketing_carrier_flight_number": "9303",
              "marketing_carrier": {
                "name": "Duffel Airways",
                "id": "arl_00009VME7D6ivUu8dn35WK",
                "iata_code": "ZZ"
              },
              "id": "seg_0000A8L6LZGIgg2EwHtQna",
              "duration": "PT2H23M",
              "distance": "1360.5217397388235",
              "destination_terminal": "7",
              "destination": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "New York Stewart International Airport",
                "longitude": -74.102724,
                "latitude": 41.501292,
                "id": "arp_swf_us",
                "icao_code": "KSWF",
                "iata_country_code": "US",
                "iata_code": "SWF",
                "iata_city_code": "NYC",
                "city_name": "Newburgh",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "New York",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_nyc_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "NYC",
                  "iata_city_code": "NYC",
                  "city_name": null
                }
              },
              "departing_at": "2022-06-18T23:00:00",
              "arriving_at": "2022-06-19T01:23:00",
              "aircraft": {
                "name": "Boeing 777-300",
                "id": "arc_00009VMF8AhXSSRnQDI6HE",
                "iata_code": "773"
              }
            }
          ],
          "origin_type": "airport",
          "origin": {
            "type": "airport",
            "time_zone": "America/New_York",
            "name": "Hartsfield-Jackson Atlanta International Airport",
            "longitude": -84.4279,
            "latitude": 33.638714,
            "id": "arp_atl_us",
            "icao_code": "KATL",
            "iata_country_code": "US",
            "iata_code": "ATL",
            "iata_city_code": "ATL",
            "city_name": "Atlanta",
            "city": {
              "type": "city",
              "time_zone": null,
              "name": "Atlanta",
              "longitude": null,
              "latitude": null,
              "id": "cit_atl_us",
              "icao_code": null,
              "iata_country_code": "US",
              "iata_code": "ATL",
              "iata_city_code": "ATL",
              "city_name": null
            }
          },
          "id": "sli_0000A8L6Pqy4nZVh0nPdK6",
          "duration": "PT2H23M",
          "destination_type": "airport",
          "destination": {
            "type": "airport",
            "time_zone": "America/New_York",
            "name": "New York Stewart International Airport",
            "longitude": -74.102724,
            "latitude": 41.501292,
            "id": "arp_swf_us",
            "icao_code": "KSWF",
            "iata_country_code": "US",
            "iata_code": "SWF",
            "iata_city_code": "NYC",
            "city_name": "Newburgh",
            "city": {
              "type": "city",
              "time_zone": null,
              "name": "New York",
              "longitude": null,
              "latitude": null,
              "id": "cit_nyc_us",
              "icao_code": null,
              "iata_country_code": "US",
              "iata_code": "NYC",
              "iata_city_code": "NYC",
              "city_name": null
            }
          }
        }
      ],
      "add": [
        {
          "segments": [
            {
              "origin_terminal": "2",
              "origin": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "Hartsfield-Jackson Atlanta International Airport",
                "longitude": -84.4279,
                "latitude": 33.638714,
                "id": "arp_atl_us",
                "icao_code": "KATL",
                "iata_country_code": "US",
                "iata_code": "ATL",
                "iata_city_code": "ATL",
                "city_name": "Atlanta",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "Atlanta",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_atl_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "ATL",
                  "iata_city_code": "ATL",
                  "city_name": null
                }
              },
              "operating_carrier_flight_number": "5901",
              "operating_carrier": {
                "name": "Duffel Airways",
                "id": "arl_00009VME7D6ivUu8dn35WK",
                "iata_code": "ZZ"
              },
              "marketing_carrier_flight_number": "5901",
              "marketing_carrier": {
                "name": "Duffel Airways",
                "id": "arl_00009VME7D6ivUu8dn35WK",
                "iata_code": "ZZ"
              },
              "id": "seg_0000A8LBrymDrITD6r6BNY",
              "duration": "PT2H23M",
              "distance": "1360.5217397388235",
              "destination_terminal": "7",
              "destination": {
                "type": "airport",
                "time_zone": "America/New_York",
                "name": "New York Stewart International Airport",
                "longitude": -74.102724,
                "latitude": 41.501292,
                "id": "arp_swf_us",
                "icao_code": "KSWF",
                "iata_country_code": "US",
                "iata_code": "SWF",
                "iata_city_code": "NYC",
                "city_name": "Newburgh",
                "city": {
                  "type": "city",
                  "time_zone": null,
                  "name": "New York",
                  "longitude": null,
                  "latitude": null,
                  "id": "cit_nyc_us",
                  "icao_code": null,
                  "iata_country_code": "US",
                  "iata_code": "NYC",
                  "iata_city_code": "NYC",
                  "city_name": null
                }
              },
              "departing_at": "2022-06-24T23:00:00",
              "arriving_at": "2022-06-25T01:23:00",
              "aircraft": {
                "name": "Boeing 777-300",
                "id": "arc_00009VMF8AhXSSRnQDI6HE",
                "iata_code": "773"
              }
            }
          ],
          "origin_type": "airport",
          "origin": {
            "type": "airport",
            "time_zone": "America/New_York",
            "name": "Hartsfield-Jackson Atlanta International Airport",
            "longitude": -84.4279,
            "latitude": 33.638714,
            "id": "arp_atl_us",
            "icao_code": "KATL",
            "iata_country_code": "US",
            "iata_code": "ATL",
            "iata_city_code": "ATL",
            "city_name": "Atlanta",
            "city": {
              "type": "city",
              "time_zone": null,
              "name": "Atlanta",
              "longitude": null,
              "latitude": null,
              "id": "cit_atl_us",
              "icao_code": null,
              "iata_country_code": "US",
              "iata_code": "ATL",
              "iata_city_code": "ATL",
              "city_name": null
            }
          },
          "id": "sli_0000A8LBrymDrITD6r6BNZ",
          "duration": "PT2H23M",
          "destination_type": "airport",
          "destination": {
            "type": "airport",
            "time_zone": "America/New_York",
            "name": "New York Stewart International Airport",
            "longitude": -74.102724,
            "latitude": 41.501292,
            "id": "arp_swf_us",
            "icao_code": "KSWF",
            "iata_country_code": "US",
            "iata_code": "SWF",
            "iata_city_code": "NYC",
            "city_name": "Newburgh",
            "city": {
              "type": "city",
              "time_zone": null,
              "name": "New York",
              "longitude": null,
              "latitude": null,
              "id": "cit_nyc_us",
              "icao_code": null,
              "iata_country_code": "US",
              "iata_code": "NYC",
              "iata_city_code": "NYC",
              "city_name": null
            }
          }
        }
      ]
    },
    "refund_to": "original_form_of_payment",
    "penalty_total_currency": "GBP",
    "penalty_total_amount": "25.00",
    "order_id": "ord_0000A8L6Pqy4nZVh0nPdK4",
    "new_total_currency": "GBP",
    "new_total_amount": "25.00",
    "live_mode": false,
    "id": "oce_0000A8LNLgZVCzBypYW5mC",
    "expires_at": "2021-06-19T12:50:09Z",
    "created_at": "2021-06-16T12:50:09.386961Z",
    "confirmed_at": "2021-06-16T13:14:25Z",
    "change_total_currency": "GBP",
    "change_total_amount": "50.00"
  }
}
```
