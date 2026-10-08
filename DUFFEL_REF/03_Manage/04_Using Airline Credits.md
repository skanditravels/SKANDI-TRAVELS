# Using Airline Credits
Airline Credits allow your customers to use entities such as unused tickets, Vouchers and Travel Credits etc. to pay, partially or wholly, when booking new flights through Duffel. This guide will walk you through implementing a complete airline credits workflow, from storing credits after cancellations, to spending them during checkout.
The Airline Credits workflow consists of five main steps:
Storing credits when they're generated from order cancellations.

Tracking availability to know which credits are available for use.

Showing applicable credits during the shopping flow.

Pricing with credits to show accurate amounts before checkout.

Spending credits when creating new orders.

Storing Airline Credits from cancellations
When an order is cancelled (via the API or support team) and it generates an airline credit, Duffel automatically stores it as an Airline Credit entity. Each credit contains all the information you need to manage it effectively.
What happens when an order is cancelled
When an order cancellation generates a credit, Duffel will:
Create an Airline Credit entity with all relevant details.

Send you a webhook notification (air.airline_credit.created).

Where instantly available from the supplier, include the credit information in the cancellation response.

Understanding the Airline Credit object
JSON


{
  "id": "acd_0000AuiZQIN1qg4B78P79U",
  "code": "123456789",
  "amount": "12.13",
  "amount_currency": "GBP",
  "type": "eticket",
  "airline_iata_code": "UA",
  "issued_on": "2025-01-01",
  "live_mode": false,
  "expires_at": "2026-01-01T15:48:11.642Z",
  "spent_at": null,
  "invalidated_at": null,
  "given_name": "Joe",
  "family_name": "Bloggs",
  "passenger_id": "pas_00009hj8USM7Ncg31cBCLL",
  "order_id": "ord_0000AuiZQIN1qg4B78P79Q",
  "user_id": "icu_0000AuiZQIN1qg4B78PGUH",
  "created_at": "2025-01-01T15:47:11.642Z'"
}

Key fields to track:
id: The unique identifier you'll use to reference this credit in future requests.

code: The number representing the airline credits used by the airline. For examples, for unused tickets, this will be the ticket number.

amount and amount_currency: The value and currency of the credit.

owner_iata_code: The airline that issued the credit.

issued_on: When the credit was issued.

live_mode: Whether this is in Duffel's test or live mode.

expires_at: When the credit expires (critical for reminding customers). If this is in the past, then the credit is not available for use.

spent_at: When the credit was spent. If this field has a date set then it means the credit is no longer available for use.

invalidated_at: When the credit was determined to no longer be usable. If this field has a date set then it means the credit is no longer available for use.

given_name and family_name: The name of the individual who the credit is issued to. This will often be the only person who can use the credit.

order_id: The order that generate the airline credit. This will be null if the credit was inputted directly.

user_id: If you use our Customer User model, this will be populated with the ID of the user who owns the airline credit. The customer user will be identified on the basis of them being the passenger who the original ticket was issued to.

[Optional] Creating Credits Directly
You can also create airline credits independently of cancellations or changes.
Caution

Credits created directly cannot be used in search due to there not being a connection between the credit and the travel that generated it.

Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/airline_credits" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data": {
        "airline_iata_code": "AA",
        "code": "123456789",
        "amount": "12.13",
        "amount_currency": "GBP",
        "issued_on": "2025-01-01",
        "expires_at": "2026-01-01T23:59:59Z",
        "user_id": "icu_0000AuiZQIN1qg4B78PGUH",
        "type": "eticket"
    }
}'
Tracking credit availability
Airline credits will become unavailable when they're spent or expire. Duffel automatically tracks this for you.
When a credit's status changes, Duffel will:
Update the spent_at or invalidated_at fields.
spent_at will be set when we see the credit being spent through the Duffel platform.

invalidated_at will be set when we determine that a credit is not available for spending. It represents when we learned that it was no longer available for use and is not indicative of why.


Send a webhook notification about the status change. When any information on the Airline Credit changes, you will be sent an air.airline_credit.spent or air.airline_credit.invalidated webhook notification.

Exclude the credit from future shopping results.

All of this information is available on the Airline Credit object.
JSON


{
  "id": "acd_0000AuiZQIN1qg4B78P79U",
  "code": "123456789",
  "amount": "12.13",
  "amount_currency": "GBP",
  "type": "eticket",
  "airline_iata_code": "UA",
  "issued_on": "2025-01-01",
  "live_mode": false,
  "expires_at": "2026-01-01T15:48:11.642Z",
  "spent_at": null,
  "invalidated_at": null,
  "given_name": "Joe",
  "family_name": "Bloggs",
  "passenger_id": "pas_00009hj8USM7Ncg31cBCLL",
  "order_id": "ord_0000AuiZQIN1qg4B78P79Q",
  "user_id": "icu_0000AuiZQIN1qg4B78PGUH",
  "created_at": "2025-01-01T15:47:11.642Z'"
}

Finding applicable credits during shopping
When searching for flights, you can pass airline credits to see which offers they apply to. This creates a seamless shopping experience where customers immediately see their available credits.
Creating an offer request with customer user
Include the airline credit IDs when creating your offer request:
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/offer_requests" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data":{
        "slices": [
            {
                "origin": "LHR",
                "destination": "JFK",
                "departure_date": "2026-04-24"
            }
        ],
        "passengers": [
            {
                "type": "adult",
                "user_id": "icu_0000AuiZQIN1qg4B78PGUH"
            }
        ],
        "max_connections": 1
    }
}
[Optional] Creating an offer request with credits
You only need to do this if you are managing the link between credits and users yourself. To include the airline credit IDs when creating your offer request:
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/offer_requests" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data":{
        "slices": [
            {
                "origin": "LHR",
                "destination": "JFK",
                "departure_date": "2026-04-24"
            }
        ],
        "airline_credit_ids": ["acd_0000AuiZQIN1qg4B78P79U"],
        "passengers": [
            {
                "type": "adult"
            }
        ],
		"max_connections": 1
  }
}
Understanding the response
Each offer in the response will include which airline credits apply on either the offer level (those passed in the request) or the passenger level (those linked to the customer user).
JSON


{
  "offers": [
    {
      "id": "off_00009htYpSCXrwaB9DnUm0",
      "total_currency": "GBP",
      "total_amount": "45.00",
      "available_airline_credit_ids": ["acd_0000AuiZQIN1qg4B78P79U"],
      "passengers": [
        {
          "type": "adult"
        }
      ]
      // ... other offer details
    }
  ]
  // ... other offers
}

Displaying credit availability in your UI
Show users which offers can use their credits:
Mark offers with available credits with a badge or indicator

Show the potential savings amount. You will need to calculate this based on the value of the credit. It is not guaranteed that the credit will be worth the amount stated on it, especially as some credits incur a penalty to use.

Pricing offers with credits
Before checkout, use the pricing endpoint to get exact amounts including any penalties incurred by the credit. This ensures transparency and prevents surprises at payment.
The current pricing endpoints are documented here and here and they will be enhanced to support airline credits.
Why pricing is important
Pricing with credits:
Confirms current availability with the airline.

Calculates any penalties for using credits from basic fares.

Shows how much credit we expect to be applied.

Returns the amount to be paid on each payment method.

Making a pricing request
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/offers/$OFFER_ID/actions/price" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data": {
        "intended_services": [
            {
                "quantity": 1,
                "id": "ser_00009UhD4ongolulWd9123"
            }
        ],
        "intended_payment_methods": [
            {
                "type": "card",
                "card_id": "tcd_0000A3t2sL46m5eDF45kWW"
            },
            {
    	        "type":"airline_credit",
    	        "airline_credit_id":"acd_0000AuiZQIN1qg4B78P79U"
            }
        ]
    }
}'
Understanding the pricing response
The response breaks down exactly how payment will be split:
JSON


{
  "data": {
    "id": "off_00009htYpSCXrwaB9DnUm0",
    "expires_at": "2020-01-17T10:42:14.545Z",
    "created_at": "2020-01-17T10:12:14.545Z",
    "intended_payment_methods": [
      {
        "type": "card",
        "card_id": "tcd_00009hthhsUZ8W4LxQgkjb",
        "surcharge_amount": "1.57",
        "surcharge_currency": "USD",
        "charge_amount": "100.00",
        "charge_currency": "USD"
      },
      {
        "type": "airline_credit",
        "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
        "penalty_amount": "150.00",
        "penalty_currency": "USD",
        "charge_amount": "100.00",
        "charge_currency": "USD"
      }
    ]
    // ...
  }
}



Hide full sample

Key fields:
charge_amount and charge_currency: How much this payment method will cover

penalty_amount and penalty_currency: Any fees for using the credit (common with basic economy tickets)

Note

In all cases the charge amounts will equate to the cost of the offer and services priced. This means that sum(charge_amount) = total_amount + sum(surcharge_amount) + sum(penalty_amount)
Paying for orders with credits
Once your customer is ready to book, you can create the order using both airline credits and other payment methods.
Creating an order with instant payment
Use the same payment methods you last priced with.
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/orders" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data": {
        "selected_offers": ["off_00009htYpSCXrwaB9DnUm0"],
        "passengers": [
	            // ... passenger details
        ],
        "payments": [
            {
                "type": "card",
                "three_d_secure_session_id": "3ds_0000AWr2XsTR1F1Vp34gh5",
                "currency": "USD",
                "amount": "100.00"
            },
            {
                "type": "airline_credit",
                "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
                "amount": "100.00",
                "currency": "USD"
            }
        ]
    }
}'


Hide full sample

In the order creation request, the amount fields in each payment method must match those returned in the pricing response in the charge_amount fields.
Paying for a hold order
Use the same payment methods you last priced with.
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/payments" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data": {
	    "payments": [
            {
                "type": "card",
                "three_d_secure_session_id": "3ds_0000AWr2XsTR1F1Vp34gh5",
                "currency": "USD",
                "amount": "100.00"
            },
            {
                "type": "airline_credit",
                "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
                "amount": "100.00",
                "currency": "USD"
            },
            {
                "type": "airline_credit",
                "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
                "amount": "100.00",
                "currency": "USD"
            }
	    ],
	    "order_id": "ord_00003x8pVDGcS8y2AWCoWv"
    }
}'


Hide full sample

In the payment creation request, the amount fields in each payment method must match those returned in the pricing response in the charge_amount fields.
Handling different payment outcomes
There are four possible outcomes when paying for an order with airline credits. In these flows, we expect to always return you an order. However, that order may have different states depending on how payment is progressing.
1. Success
The order is created and paid successfully. You'll receive a standard order confirmation.
JSON


{
  "data": {
    "payment_status": {
      "price_guarantee_expires_at": "2020-01-17T10:42:14.545Z",
      "payment_required_by": "2020-01-17T10:42:14.545Z",
      "paid_at": "2020-01-17T10:42:14.545Z"
    },
    "total_amount": "455.00",
    "offer_id": "off_00009htYpSCXrwaB9DnUm0",
    "live_mode": false,
    "id": "ord_00009hthhsUZ8W4LxQgkjo"
    //...
  }
}

You will receive an air.payment.succeeded webhook event.
2. Order created but payment not possible
The order is created but couldn't be paid with the provided methods:
JSON


{
  "data": {
    "payment_status": {
      "price_guarantee_expires_at": "2020-01-17T10:42:14.545Z",
      "payment_required_by": "2020-01-17T10:42:14.545Z",
      "paid_at": null,
      "awaiting_payment": true
    },
    "total_amount": "455.00",
    "offer_id": "off_00009htYpSCXrwaB9DnUm0",
    "live_mode": false,
    "id": "ord_00009hthhsUZ8W4LxQgkjo"
    //...
  }
}

What to do:
Check if any credits were ineligible, this will be present in the air.payment.failed webhook.

Show the updated price to your customer

Attempt payment again via POST /air/payments with valid methods

3. Order created with payment pending
Payment is being processed asynchronously:
JSON


{
  "data": {
    //...
    "payment_status": {
      "price_guarantee_expires_at": "2020-01-17T10:42:14.545Z",
      "payment_required_by": "2020-01-17T10:42:14.545Z",
      "paid_at": null,
      "awaiting_payment": false
    },
    "intended_payment_methods": [
      {
        "type": "card",
        "card_id": "tcd_00009hthhsUZ8W4LxQgkjb",
        "surcharge_amount": "5.00",
        "charge_amount": "100.00",
        "charge_currency": "USD"
      },
      {
        "type": "airline_credit",
        "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
        "penalty_amount": "250.00",
        "charge_amount": "100.00",
        "charge_currency": "USD"
      }
    ],
    "offer_id": "off_00009htYpSCXrwaB9DnUm0",
    "live_mode": false,
    "id": "ord_00009hthhsUZ8W4LxQgkjo"
    //...
  }
}



Hide full sample

What to do:
Show a "processing payment" state to your customer

Wait for the webhook notification when payment completes. This will be either air.payment.failed or air.payment.succeeded.

Update your UI when the order status changes

4. Order not created
If we were not able to create an order, paid or not, we will return an error to your request.
Determining Outcome
To determine outcome, the key information to monitor is order.payment_status.awaiting_payment and order.payment_status.paid_at.
.awaiting_payment = true	.awaiting_payment = false
.paid_at is null	We are waiting for you to submit payment.	You have submitted payment and it is still pending. Please wait for a notification.
.paid_at is not null	N/A	Payment is confirmed and complete.
Best practices
Customer experience
Show savings clearly: Display the credit amount and expiry date prominently

Explain penalties: If using a credit incurs fees, explain why before checkout

Handle failures gracefully: Have a fallback payment method ready

Technical implementation
Always track ownership: Store the relationship between credits and customers in your database

Use webhooks: Subscribe to credit status updates to keep your data current

Price before checkout: Always call the pricing endpoint before creating an order

API Reference
Note

This section focusses on the new API endpoints and fields. For existing resources and endpoints, this is in addition to information already published on the Duffel API reference. New endpoints or fields stated below are not yet available in the API.
This document always takes precedence where there are contradictions.
Airline Credits
Schema
JSON


{
  "id": "acd_0000AuiZQIN1qg4B78P79U",
  "code": "123456789",
  "amount": "12.13",
  "amount_currency": "GBP",
  "type": "eticket",
  "airline_iata_code": "UA",
  "issued_on": "2025-01-01",
  "live_mode": false,
  "expires_at": "2026-01-01T15:48:11.642Z",
  "spent_at": null,
  "invalidated_at": null,
  "given_name": "Joe",
  "family_name": "Bloggs",
  "passenger_id": "pas_00009hj8USM7Ncg31cBCLL",
  "order_id": "ord_0000AuiZQIN1qg4B78P79Q",
  "user_id": "icu_0000AuiZQIN1qg4B78PGUH",
  "created_at": "2025-01-01T15:47:11.642Z'"
}

id: The unique identifier you'll use to reference this credit in future requests

code: The number representing the unused ticket, voucher etc issued by the airline. For unused tickets, this will be the ticket number.

amount: The value of the credit.

amount_currency: The currency of the credit.

type: The document type associated with the credit, e.g. "eticket".

owner_iata_code: The airline that issued the credit.

issued_on: When the credit was issued.

live_mode: Whether this is in Duffel's test or live mode.

expires_at: When the credit expires (critical for reminding customers). If this is in the past, then the credit is not available for use.

spent_at: When the credit was spent. If this field has a date set then it means the credit is no longer available for use.

invalidated_at: When the credit was determined to no longer be usable. If this field has a date set then it means the credit is no longer available for use.

given_name: The individual the credit belongs to.

family_name: The individual the credit belongs to.

order_id: The order that generated the airline credit. This will be null if the credit was inputted directly.

user_id: If you use our Customer User model, this will be populated with the ID of the user who owns the airline credit. The customer user will be identified on the basis of them being the passenger who the original ticket was issued to.

created_at: When the credit was created in Duffel's database.

Creating an Airline Credit
POST https://api.duffel.com/air/airline_credits
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/airline_credits" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data": {
        "airline_iata_code": "AA",
        "code": "123456789",
        "amount": "12.13",
        "amount_currency": "GBP",
        "issued_on": "2025-01-01",
        "expires_at": "2026-01-01T23:59:59Z",
        "given_name": "Joe",
        "family_name": "Bloggs",
        "user_id": "icu_0000AuiZQIN1qg4B78PGUH",
        "type": "eticket"
    }
}}
Possible type values are: eticket or mco.
Retrieving an Airline Credit
GET https://api.duffel.com/air/airline_credits/$ID
Shell


curl

curl -X GET --compressed "https://api.duffel.com/air/airline_credits/$ID" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
Listing Airline Credits
Returns a paginated list of airline credits which can be filtered to a specific customer user if the user_id query param is provided.
Shell


curl

curl -X GET --compressed "https://api.duffel.com/air/airline_credits?after=g2wAAAACbQAAABBBZXJvbWlzdC1LaGFya2l2bQAAAB=&before=g2wAAAACbQAAABBBZXJvbWlzdC1LaGFya2l2bQAAAB=&limit=1&user_id=icu_0000AuiZQIN1qg4B78PGUH" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
Webhooks
air.airline_credit.created
JSON


{
  "data": {
    "object": {
      "id": "acd_0000AuiZQIN1qg4B78P79U"
    }
  }
}

air.airline_credit.spent
JSON


{
  "data": {
    "object": {
      "id": "acd_0000AuiZQIN1qg4B78P79U"
    }
  }
}

air.airline_credit.invalidated
JSON


{
  "data": {
    "object": {
      "id": "acd_0000AuiZQIN1qg4B78P79U"
    }
  }
}

Offer Requests
Schema
JSON


{
  //...
  "offers": [
    {
      "id": "off_00009htYpSCXrwaB9DnUm0",
      "total_currency": "GBP",
      "total_amount": "45.00",
      "available_airline_credit_ids": ["acd_0000AuiZQIN1qg4B78P79U"]
      // ... other offer details
    }
    //... other offers
  ]
}

offers[].available_airline_credit_ids[]: The airline credits passed in an Offer Request creation that we expect to be available to pay for an order made from this offer.

Creating an Offer Request
POST https://api.duffel.com/air/offer_requests
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/offer_requests" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data":{
        "slices": [
            {
                "origin": "LHR",
                "destination": "JFK",
                "departure_date": "2026-04-24"
            }
        ],
        "airline_credit_ids": ["acd_0000AuiZQIN1qg4B78P79U"],
        "passengers": [
            {
                "type": "adult",
                "user_id": "icu_0000AuiZQIN1qg4B78PGUH"
            }
        ],
        "max_connections": 1
    }
};
data.airline_credit_ids[]: The credits available to the user searching that you would like to be matched to any subsequent offers.

data.passengers[].user_id: The user linked to that passenger, the credits associated to them will be matched to any subsequent offers.

Offers
Schema
JSON


{
  "id": "off_00009htYpSCXrwaB9DnUm0",
  "expires_at": "2020-01-17T10:42:14.545Z",
  "created_at": "2020-01-17T10:12:14.545Z",
  "available_airline_credit_ids": ["acd_0000AuiZQIN1qg4B78P79U"],
  "intended_payment_methods": [
    {
      "type": "card",
      "card_id": "tcd_00009hthhsUZ8W4LxQgkjb",
      //...
      "charge_amount": "100.00",
      "charge_currency": "USD"
    },
    {
      "type": "airline_credit",
      "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
      "penalty_amount": "150.00",
      "penalty_currency": "USD",
      "charge_amount": "100.00",
      "charge_currency": "USD"
    }
  ]
  // ...
}

available_airline_credit_ids[]: The airline credits passed in an Offer Request creation that we expect to be available to pay for an order made from this offer.

intended_payment_methods[]: The payment methods that the offer was last priced with.
Type = Card
type: Indicating the type of intended payment method (card).

card_id: The id of the card.

charge_amount: The amount we expect the card to be charged.

charge_currency: The currency of the charge_amount.


Type = Airline Credit
type: Indicating the type of intended payment method (airline_credit).

airline_credit_id: the id of the airline credit.

penalty_amount: The amount of the penalty incurred by using the airline credit. Some airlines will charge a penalty when spending an airline credit generated from a basic economy fare.

penalty_currency: The currency of the penalty_amount.

charge_amount: The amount we expect the card to b charged.

charge_currency: The currency of the charge_amount.



Pricing an Offer
POST https://api.duffel.com/air/offers/$OFFER_ID/actions/price
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/offers/$OFFER_ID/actions/price" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data": {
        "intended_services": [
            {
                "quantity": 1,
                "id": "ser_00009UhD4ongolulWd9123"
            }
        ],
        "intended_payment_methods": [
            {
                "type": "card",
                "card_id": "tcd_0000A3t2sL46m5eDF45kWW"
            },
            {
	            "type":"airline_credit",
	            "airline_credit_id":"acd_0000AuiZQIN1qg4B78P79U"
            }
        ]
    }
}'
Orders
Schema
JSON


{
  "id": "ord_00009htYpSCXrwaB9DnUm0",
  "created_at": "2020-01-17T10:12:14.545Z",
  "intended_payment_methods": [
    {
      "type": "card",
      "card_id": "tcd_00009hthhsUZ8W4LxQgkjb",
      "surcharge_amount": "1.57",
      "surcharge_currency": "USD",
      "charge_amount": "100.00",
      "charge_currency": "USD"
    },
    {
      "type": "airline_credit",
      "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
      "penalty_amount": "150.00",
      "penalty_currency": "USD",
      "charge_amount": "100.00",
      "charge_currency": "USD"
    }
  ]
  // ...
}

intended_payment_methods[]: The payment methods that the order was last priced with. These will only be present when the order is unpaid (ie payment_status.paid_at is null).
Type = Card
type: Indicating the type of intended payment method (card).

card_id: The id of the card.

charge_amount: The amount we expect the card to b charged.

charge_currency: The currency of the charge_amount.


Type = Airline Credit
type: Indicating the type of intended payment method (airline_credit).

airline_credit_id: the id of the airline credit.

penalty_amount: The amount of the penalty incurred by using the airline credit. Some airlines will charge a penalty when spending an airline credit generated from a basic economy fare.

penalty_currency: The currency of the penalty_amount.

charge_amount: The amount we expect the card to b charged.

charge_currency: The currency of the charge_amount.



Creating an Order (with payment)
POST https://api.duffel.com/air/orders
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/orders" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data": {
    "selected_offers": ["off_00009htYpSCXrwaB9DnUm0"],
    "passengers": [
        // ... passenger details
    ],
    "payments": [
        {
            "type": "card",
            "three_d_secure_session_id": "3ds_0000AWr2XsTR1F1Vp34gh5",
            "currency": "USD",
            "amount": "100.00"
        },
        {
            "type": "airline_credit",
            "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
            "amount": "100.00",
            "currency": "USD"
        }
    ]
  }
}'


View full sample

Pricing an Order
Note

This is only possible with hold orders.
POST https://api.duffel.com/air/orders/$ORDER_ID/actions/price
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/orders/$ORDER_ID/actions/price" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
  "data": {
    "intended_payment_methods": [
        {
            "type": "card",
            "card_id": "tcd_0000A3t2sL46m5eDF45kWW"
        },
        {
	        "type":"airline_credit",
	        "airline_credit_id":"acd_0000AuiZQIN1qg4B78P79U"
        }
    ]
  }
}'
Webhooks
order.created
(Documentation)
Payments
Creating a Payment
POST https://api.duffel.com/air/payments
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/payments" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
-d '{
    "data": {
        "payments": [
            {
                "type": "card",
                "three_d_secure_session_id": "3ds_0000AWr2XsTR1F1Vp34gh5",
                "currency": "USD",
                "amount": "100.00"
            },
            {
                "type": "airline_credit",
                "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
                "amount": "100.00",
                "currency": "USD"
            }
	    ],
        "order_id": "ord_00003x8pVDGcS8y2AWCoWv"
    }
}'
Listing Order Payments
GET https://api.duffel.com/air/payments?order_id=$ORDER_ID
Shell


curl

curl -X GET --compressed "https://api.duffel.com/air/payments?order_id=$ORDER_ID" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
Example Response
JSON


[
    {
        "type": "card",
        "id": "pay_00009hthhsUZ8W4LxQgkfg",
        "card_id": "tcd_00009hthhsUZ8W4LxQgkjb",
        "amount": "355.00",
        "currency": "USD",
        "order_id": "ord_00003x8pVDGcS8y2AWCoWv",
        "failure_reason": "payment_declinde",
        "created_at": "2020-01-17T10:42:14.545Z",
        "status": "succeeded"|"failed"|"pending"|"cancelled"
    },
    {
        "type": "airline_credit",
        "id": "pay_00009hthhsUZ8W4LxQgkfg",
        "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
        "amount": "100.00",
        "currency": "USD",
        "order_id": "ord_00003x8pVDGcS8y2AWCoWv",
        "failure_reason": "payment_declinde",
        "created_at": "2020-01-17T10:42:14.545Z",
        "status": "succeeded"|"failed"|"pending"|"cancelled"
    }
]

Retrieving a Payment
GET https://api.duffel.com/air/payments/$PAYMENT_ID
Shell


curl

curl -X GET --compressed "https://api.duffel.com/air/payments/$PAYMENT_ID" \
-H "Accept-Encoding: gzip" \
-H "Accept: application/json" \
-H "Duffel-Version: v2" \
-H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
Example Response
JSON


{
    "type": "airline_credit",
    "id": "pay_00009hthhsUZ8W4LxQgkfg",
    "airline_credit_id": "acd_0000AuiZQIN1qg4B78P79U",
    "amount": "100.00",
    "currency": "USD",
    "order_id": "ord_00003x8pVDGcS8y2AWCoWv",
    "failure_reason": "payment_declinde",
    "created_at": "2020-01-17T10:42:14.545Z",
    "status": "succeeded"|"failed"|"pending"|"cancelled"
}

Webhooks
air.payment.pending
JSON


{
  "data": {
    "object": {
      "id": "pay_00009hthhsUZ8W4LxQgkfg"
    }
  }
}

air.payment.succeeded
JSON


{
  "data": {
    "object": {
      "id": "pay_00009hthhsUZ8W4LxQgkfg"
    }
  }
}

air.payment.failed
JSON


{
  "data": {
    "object": {
      "id": "pay_00009hthhsUZ8W4LxQgkfg"
    }
  }
}

air.payment.cancelled
JSON


{
  "data": {
    "object": {
      "id": "pay_00009hthhsUZ8W4LxQgkfg"
    }
  }
}

Testing Your Implementation
You can test your implementation using Duffel's test mode. In test mode, you can create airline credits and use them in the same way as in live mode, but without any real-world consequences. All scenarios are for Duffel Airways (ZZ).
Scenario	Input
Immediate success.	Any credit not stated below
Credit fails to be attached at pricing.	Code: 1000000000001
Credit succeeds but a penalty is applied at pricing.	Code: 1000000000002
Order creation fails synchronously due to credit not attaching.	Code: 2000000000001
Order creation fails synchronously due to charge amounts changing.	Code: 2000000000002
Order Create will be asynchronous.	Route: One-way BQH-LCY, any date
Order Create fails asynchronously due to credit not attaching.	Code: 2000000000001 (One-way BQH-LCY)
Order Create fails asynchronously due to charge amounts changing.	Code: 2000000000002 (One-way BQH-LCY)
Airline credits generated upon cancellation.	Route: One-way LTN-SYD, any date
FAQs
What can an airline credit represent?
An airline credit is a general blanket term that can refer to several instruments airlines issue to offset future travel, including:
Unused tickets (eTickets)

Miscellaneous Charges Orders (MCOs)

Other airline-issued credit instruments

The API limits the allowable types to those we know how to support today, with the intention of covering all commonly used types over time.
Can I spend multiple credits?
Yes. You can include multiple airline credits when pricing, and we will try to apply as many as the airline allows. In practice, most airlines allow at most one credit per passenger. Vouchers are more commonly combinable than unused tickets.
Note

Whether multiple credits can be combined depends on the airline and credit type.
What happens if my airline credit is worth more than the fare?
The residual value depends on the airline and the credit type. It will either:
be forfeited, or

be reissued as a new credit (e.g. an MCO or similar).

Examples (subject to change):
Often forfeited: United, Delta, Alaska

Often reissued as a new credit: American (MCO), Southwest (credit/travel fund)

JetBlue: may issue an MCO depending on fare rules

Note

Policies vary by airline and can change.
Why can a fare look more expensive when paying with a credit?
Some airlines charge a penalty when redeeming a credit, especially if the original ticket was a basic/economy fare. We surface these fees at pricing as penalty_amount.
Examples (subject to change):
United: may charge around 149 USD for credits from Basic Economy

Delta: may charge around 99–199 USD depending on origin and rules

JetBlue: may charge around 100–200 USD depending on route and rules

How are GDS and NDC different for airline credits?
Both GDS and NDC commonly use unused tickets (eTickets) and MCOs. Cross-source usage can be restricted:
Credits from NDC orders often cannot be used to pay GDS orders

Credits from GDS orders are more often usable on NDC orders

Duffel indicates applicability per offer via offers[].available_airline_credit_ids[] and validates again at pricing.
What if I void after paying with an airline credit?
If you cancel on the same calendar day the order was paid, a full refund/void is usually possible. After that, airlines typically issue a new credit for the value of the new fare rather than restoring the original.
Note

Exact timing and outcomes depend on airline policy.
Are credits only usable by the passenger named on the credit?
Yes. Duffel expects the traveller’s name to match the name on the credit. Some airlines may allow intra-company transfers under business programs, which is not currently supported by Duffel.
How long do I have to spend an airline credit?
This is set by the airline. Typically:
Valid for about 12 months from issuance

All travel on the new booking must be completed before expiry

Some exceptions exist (for example, certain Southwest Basic fares are valid for only 6 months)

Expired credits cannot be used.
Where can I use my airline credit?
Timing: Travel must be completed before the credit's expiry date.

Route: Some airlines restrict usage based on the original ticket (e.g., credits from international tickets may be limited to the same route or to domestic travel; credits from domestic tickets may be limited to domestic travel).

Where possible, Duffel aims to enforce these rules by only returning applicable credits on offers and confirming them at pricing.
