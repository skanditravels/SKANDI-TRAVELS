# Adding Post Booking Bags
Note

The ability to book post-order is not available for all airlines yet. We recommend using easyJet to follow along on this guide.
What do you need to start?
This guide will go through the changes you need to list and book services for an order you've previously booked. It's important you have already made a booking before following this guide.
If you are not familiar with how to create an order please head over to our Quick Start Guide.

This guide will start from an order so make sure you grab an order ID for an easyJet flight before we start.

Tip

We've put together a Postman Collection that contains all of the requests you'll need to follow along with this guide.
Overview
Baggages are a type of what we call available_services. The changes we'll make to work with available services are:
Retrieve a list of available_services for an order

Pay for and book the services

Getting services for an order
We start by fetching the bags for the order. Using a valid order id you can use:
Shell


curl

curl -X GET --compressed "https://api.duffel.com/air/orders/$ORDER_ID/available_services"
  -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
This request will return a list of the available_services.
Available services
The only available service currently supported is baggages. Each available service is unique and identifiable by id. The price of the service is described by total_currency and total_amount. And the actual service information is determined by its type and metadata.
Important to notice that services are specific to segments and passengers. The relationship is described by the attributes segment_ids and passenger_ids.
Note

Please also note that baggage can only be added to existing orders where baggage was not part of the original booking.
Learn more
For a complete description of the available services schema checkout the API reference.
https://duffel.com/docs/api/offers/schema

Booking services
Once you know what service a user wants to book all you have to send request to the post-booking services endpoint with the following payload.
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/orders/$ORDER_ID/services"
  -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
  -d '{
  "data": {
    "payment": {
      "type": "balance",
      "currency": "'"$TOTAL_CURRENCY"'",
      "amount": "'"$TOTAL_AMOUNT"'"
    },
    "add_services": [
      {
        "quantity": 2,
        "id": "'"$SERVICE_ID_1"'"
      },
      {
        "quantity": 1,
        "id": "'"$SERVICE_ID_2"'"
      }
    ]
  }
}'
You must add the attribute services to your request payload. This field should contain a list of add_services. Each service on the list here must contain the available service id ($SERVICE_ID_N) and the desired quantity.
The payment amount ($TOTAL_AMOUNT) must be increased by the amount times quantity of each service you'd like to purchase. For example, if you include service A with quantity 2 and total_amount 10 GBP, the amount of the payment should now be 20 GBP.
Services on Order
Once the booking has gone through in the airline's system we will return the usual order create response payload to you. You can always retrieve your order by id:
Shell


curl

curl -X GET --compressed "https://api.duffel.com/air/orders/$ORDER_ID"
  -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
Services
The service object will look exactly the same as the available service except for maximum_quantity being replaced with quantity. It's worth flagging that any ancillary baggages booked as services will not be present in the slices[].segments[].passengers[].baggages[]. They are only present in the services field. If you want the full picture of a passenger's baggage you will need to combine both.
