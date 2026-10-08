# Holding Orders and Paying Later
Note

The ability to hold an order and pay for it later is not yet available for all airlines. We recommend using an offer from Duffel Airways or American Airlines to follow along with this guide.
What does it mean to hold an order?
Holding an order allows you to hold space on a flight and pay for it at a later time. For example, perhaps your customer is booking a flight for a business trip and wants to hold their seat while they wait for their manager to approve the trip. In the industry, holding an order is sometimes referred to as deferred ticketing. We refer to orders that can be paid after booking as “Hold Orders”.
You hold an order by creating an order without supplying payment, and then paying for it by a particular time indicated in the order.
What do you need to start?
It’s important you know the basics of how to search for flights and create an order. If you could use a refresher, please head over to our Quick Start Guide.
Tip

We've put together a Postman Collection that contains all of the requests you'll need to follow along with this guide.
Overview
Holding an order involves three steps:
You identify an offer that can be held and paid for later

You create an order with type hold

You pay for your order before it expires

Identifying an offer that can be held and paid for later
Offers that can be held and paid for later will have payment_requirements.requires_instant_payment set to false.
For example, all American Airlines and Duffel Airways offers are eligible. Here’s a simple search for Duffel Airways flights:
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/offer_requests" 
  -H "Accept-Encoding: gzip" 
  -H "Accept: application/json" 
  -H "Content-Type: application/json" 
  -H "Duffel-Version: v2" 
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN" 
  -d '{
  "data": {
    "slices": [
      {
        "departure_date": "2024-06-21",
        "destination": "LGW",
        "origin": "LHR"
      }
    ],
    "passengers": [{"type": "adult"}]
  }
}'
Hold offers may also have a price guarantee, but not all offers that can be held have a price guarantee.
JSON


"payment_requirements": {
  "requires_instant_payment": false,
  "price_guarantee_expires_at": "2021-06-01T23:59:59Z",
  "payment_required_by": "2021-06-20T23:59:59Z"
}

Although some airlines may support holding for all orders, you should always check payment_requirements.requires_instant_payment to determine whether the particular offer is eligible. This protects against any changes in the future and allows you to support future airlines that may have more complex rules.
How does the price guarantee work?
If price_guarantee_expires_at is not null the airline will hold the price of this offer - that is, the total_amount - up to the specified time, providing you create a hold order to lock in the price quote.
If price_guarantee_expires_at is null the space on the flight will be reserved (until the payment_required_by timestamp) but the price can change between booking and payment.
Creating an order to hold the passenger’s seat
Booking a hold order is similar to booking an order that is paid instantly, but you need to take some additional steps:
Set the type field to hold

Omit the payments key, as no payment takes place at the time of booking

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
    "type": "hold",
    "selected_offers": ["'"$OFFER_ID"'"],
    "passengers": [
      {
        "phone_number": "+442080160508",
        "email": "tony@example.com",
        "born_on": "1980-07-24",
        "title": "mr",
        "gender": "m",
        "family_name": "Stark",
        "given_name": "Tony",
        "id": "'"$PASSENGER_ID"'"
      }
    ]
  }
}
After booking, you can see the payment status and timestamps through the payment_status field on the order:
JSON


"payment_status": {
  "price_guarantee_expires_at": "2021-06-01T23:59:59Z",
  "payment_required_by": "2021-06-20T23:59:59Z",
  "awaiting_payment": true
}

What happens if I don’t pay?
If you don’t pay for a flight before the time indicated in payment_required_by, the space will be released by the airline and the awaiting_payment status of the order will be set to false. You will need to create a new order if you still wish to make a similar booking.
How do I get the latest price?
You can always get the most up-to-date price by retrieving the order:
Shell


curl

curl -X GET --compressed "https://api.duffel.com/air/orders/$ORDER_ID" 
  -H "Accept-Encoding: gzip" 
  -H "Accept: application/json" 
  -H "Content-Type: application/json" 
  -H "Duffel-Version: v2" 
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
You should get the latest price before paying. If you haven’t checked the price and you try to pay using an out-of-date price, you’ll get a price_changed error. If you get this error you should retrieve the order to get the latest price.
Note that it isn't currently possible to access the history of prices for an order, so you will need to implement your own tracking of differences between prices if it's required for your use case.
Paying for the order
To pay for the order, use the create a payment endpoint and pass in the order_id and the latest order price.
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/payments" 
  -H "Accept-Encoding: gzip" 
  -H "Accept: application/json" 
  -H "Content-Type: application/json" 
  -H "Duffel-Version: v2" 
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN" 
  -d '{
  "data": {
    "order_id": "'"$ORDER_ID"'",
    "payment": {
      "type": "balance",
      "amount": "'"$ORDER_TOTAL_AMOUNT"'",
      "currency": "'"$ORDER_TOTAL_CURRENCY"'"
    }
  }
}
You'll also need to include the currency of the payment ($ORDER_TOTAL_CURRENCY) in ISO 4217 format — it should match the pending order's total_currency — and the total amount ($ORDER_TOTAL_AMOUNT) of the order, which should match the pending order's total_amount.
The order is now paid for and the passenger is ready to fly. To verify that the order is paid for, you can retrieve the order again and check that awaiting_payment is now set to false and that documents have been issued for the order.
JSON


{
  "payment_status": {
    "price_guarantee_expires_at": "2021-06-01T23:59:59Z",
    "payment_required_by": "2021-06-20T23:59:59Z",
    "awaiting_payment": false
  },
  "documents": [
    {
      "unique_identifier": "123-1230984567",
      "type": "electronic_ticket"
    }
  ]
}

What happens if the price guarantee expires?
The price guarantee can expire part-way through the lifetime of the order. If this happens, retrieving the order after the price_guarantee_expires_at time may give you a new price.
The price_guarantee_expires_at is always the guarantee that applies to the price at the time that the order is retrieved. This means that after we fetch a new price, the price_guarantee_expires_at timestamp will be:
updated to a new timestamp if the new price is guaranteed

updated to null if the new price doesn’t have a guarantee

Even as the price guarantee expires, the order will be available to complete until payment_required_by.
What happens if the flight schedule changes?
For instant orders, we usually notify you about changes. But for held orders, we won’t notify you of changes until they have been paid.
If the airline makes a change to an order between you creating it and paying for it, you will get a schedule_changed error when attempting to pay. This is to protect you from paying for a different itinerary than you were expecting at the time of booking.
