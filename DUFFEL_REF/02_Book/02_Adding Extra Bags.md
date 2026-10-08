# Adding Extra Bags
Note

The ability to book baggage with your flight is not available for all airlines yet. We recommend using British Airways offers to follow along on this guide.
Ancillaries component

If you'd like to offer extra bags (and other ancillaries) to your customers quickly without having to build the user interface yourself, we offer a UI component that makes it trivially simple.


Learn how to use the Ancillaries component →

What do you need to start?
This guide will go through the changes you need to make in the booking flow to be able to list and book services for any offer you want. It's important you know the basics of how to create a booking.
If you are not familiar with how to create an order please head over to our Quick Start Guide.

This guide will start from an offer so make sure you grab an offer ID for a British Airways flight before we start.

Tip

We've put together a Postman Collection that contains all of the requests you'll need to follow along with this guide.
Overview
Baggages are a type of what we call available_services. Available services are specific to an offer but not surfaced through the API by default. The changes we'll make to work with available services are:
Retrieve an offer along with its available_services

Include services to order creation

See the services booked on an order

Getting services for an offer
We start by fetching the offer to make sure to get its most up-to-date information. The get offer endpoint gives you the ability to retrieve available services with the offer by applying the query parameter return_available_services set to true. Using a valid offer ID you can use:
Shell


curl

curl -X GET --compressed "https://api.duffel.com/air/offers/$OFFER_ID?return_available_services=true"
  -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
This request will return an offer which now includes the available_services attribute.
Available services
The only available service currently supported is baggages. Each available service is unique and identifiable by ID. The price of the service is described by total_currency and total_amount. And the actual service information is determined by its type and metadata.
Important to notice that services are specific to segments and passengers. The relationship is described by the attributes segment_ids and passenger_ids.
Learn more
For a complete description of the available services schema check out the API reference.
https://duffel.com/docs/api/offers/schema

Booking with services
Once you know what offer and service a user wants to book, all you have to do is send a request to the create order endpoint with 2 small changes to the payload.
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/orders"
  -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
  -d '{
  "data": {
    "selected_offers": ["'"$OFFER_ID"'"],
    "payments": [
      {
        "type": "balance",
        "currency": "'"$TOTAL_CURRENCY"'",
        "amount": "'"$TOTAL_AMOUNT"'"
      }
    ],
    "passengers": [
      {
        "phone_number": "+442080160508",
        "email": "tony@example.com",
        "born_on": "1980-07-24",
        "title": "mr",
        "gender": "m",
        "family_name": "Stark",
        "given_name": "Tony",
        "infant_passenger_id": "'"$INFANT_PASSENGER_ID"'",
        "id": "'"$ADULT_PASSENGER_ID_1"'"
      },
      {
        "phone_number": "+442080160509",
        "email": "potts@example.com",
        "born_on": "1983-11-02",
        "title": "mrs",
        "gender": "m",
        "family_name": "Potts",
        "given_name": "Pepper",
        "id": "'"$ADULT_PASSENGER_ID_2"'"
      },
      {
        "phone_number": "+442080160506",
        "email": "morgan@example.com",
        "born_on": "2019-08-24",
        "title": "mrs",
        "gender": "f",
        "family_name": "Stark",
        "given_name": "Morgan",
        "id": "'"$INFANT_PASSENGER_ID"'"
      }
    ],
    "services": [
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


Hide full sample

You must add the attribute services to your request payload. This field should contain a list of services to be booked along with the offer specified in the selected_offers field. Each service on the list here must contain the available service ID ($SERVICE_ID_N) and the desired quantity.
The payment amount ($TOTAL_AMOUNT) must be increased by the amount times quantity of each service you'd like to purchase. For example, if your offer total is 50 GBP and you include service A with quantity 2 and total_amount 10 GBP, the amount of the payment should now be 70 GBP.
Services on Order
Once the booking has gone through in the airline's system we will return the usual order create response payload to you. You can always retrieve your order by ID:
Shell


curl

curl -X GET --compressed "https://api.duffel.com/air/orders/$ORDER_ID"
  -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
Services
The service object will look exactly the same as the available service except for maximum_quantity being replaced with quantity. It's worth flagging that any ancillary baggages booked as services will not be present in the slices[].segments[].passengers[].baggages[]. They are only present in the services field. If you want the full picture of a passenger's baggage you will need to combine both.
Documents
Some airlines record the booking and the payment of ancillary services in a document different from the electronic ticket issued for the flight. These documents are called Electronic Miscellaneous Documents. When available we expose them in the API as a document with a type of electronic_miscellaneous_document_associated.
