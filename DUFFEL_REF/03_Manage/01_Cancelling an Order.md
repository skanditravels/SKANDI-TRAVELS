# Cancelling an Order
Note

Cancellation is not yet supported for every order. If an order has the string cancel in its available_actions then you should be able to cancel it via the API. Otherwise, it is recommended to manually request a cancellation quote by clicking on the "Cancellation quote" option under "Manage this order" when viewing the order in the dashboard. The cancellation will then be handled by a member of our team.
What do you need to start?
All you need to get started is the id of the order you'd like to cancel. You must also ensure that the order is cancellable by checking whether "cancel" is a member of the available_actions property of the order.
Tip

We've put together a Postman Collection that contains all of the requests you'll need to follow along with this guide.
Overview
The order cancellation process happens in 2 steps:
You create an unconfirmed cancellation quote

You confirm the cancellation

Create Cancellation Quote
You have the ability to create a cancellation quote before cancelling an order. This allows you to review the conditions of the cancellation before confirming it such as the amount of money that will be refunded and where it will be refunded to (airline credit, the original form of payment or otherwise). You can create a cancellation quote by creating a new Order Cancellation using the id of the order you'd like to cancel.
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/order_cancellations" 
  -H "Accept-Encoding: gzip" 
  -H "Accept: application/json" 
  -H "Content-Type: application/json" 
  -H "Duffel-Version: v2" 
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN" 
  -d '{
  "data": {
    "order_id": "'"$ORDER_ID"'"
  }
}'
This request will return an Order Cancellation object which contains details of the cancellation quote. It will not be confirmed however it will contain important details about the prospective cancellation that you may wish to review before confirming it. Some of the important properties of the Order Cancellation object are explained below.
JSON


{
  // we'll use the id on the next step
  "id": "ore_00009qzZWzjDipIkqpaUAj",

  // determine whether you want to continue with the
  // cancellation or not based on the refund amount
  "refund_currency": "GBP",
  "refund_amount": "90.80",

  // if this timestamp is in the past you will
  // not be able to confirm your cancellation and
  // will need to re-request a cancellation quote
  "expires_at": "2020-01-17T10:42:14.545052Z",

  // where the refund will be returned to. In this
  // case the refund amount will be sent to the
  // original form of payment used to pay for the order.
  "refund_to": "original_form_of_payment"
  ...
}

The full schema definition can be found in the API documentation.
Confirm Cancellation
You can confirm the cancellation if you are happy with the quote provided. Please note that you can only confirm the most recent Order Cancellation quote otherwise you will receive a order_cancellation_stale error. Make the following request using the unique id of the Order Cancellation object created previously.
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/order_cancellations/$ORDER_CANCELLATION_ID/actions/confirm" 
  -H "Accept-Encoding: gzip" 
  -H "Accept: application/json" 
  -H "Duffel-Version: v2" 
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
The Order Cancellation object will be returned but it will now include a timestamp in the confirmed_at attribute. Your order is now cancelled and the refund offered in the quote should be applied. A cancelled order will also include the confirmed Order Cancellation object at the cancellation property.
Airline Credits
Occasionally an airline will provide airline credits instead of a monetary refund when an order is cancelled which the passenger can use to get a discount on future flights. These typically take the form of a "code" that the passenger can use on the airline's website.
Cancellations that will be refunded to airline credits will have the refund_to property set to airline_credits. The unconfirmed credits will also be included in the airline_credits array of the Order Cancellation albeit with the credit_code set to null. You can see an example of an Order Cancellation with airline credits below.
JSON


{
  "id": "ore_00009qzZWzjDipIkqpaUAj",

  // the total value of the airline credits detailed below
  "refund_currency": "GBP",
  "refund_amount": "90.80",

  // indicates that the cancellation will be refunded to
  // airline credits
  "refund_to": "airline_credits"

  // details about the specific airline credits
  "airline_credits": [
    {
      // typically the credit will be tied to a specific
      // passenger.
      "passenger_id": "pas_00009hj8USM7Ncg31cBCLL",

      // different airlines will have different names for
      // airline credit.
      "credit_name": "Duffel Travel Credit",

      // The value of the credit
      "credit_currency": "GBP",
      "credit_amount": "90.80"

      // The credit code that the passenger can use to
      // redeem the airline credit. this will be null
      // until the cancellation is confirmed at which
      // point it should be sent to the passenger.
      "credit_code": "1234567890123",
      ...
    }
  ]
  ...
}



Hide full sample

You can view the full airline credits schema in the API documentation. We also provide a test route from London Luton Airport (LTN) to London Stansted Airport (STN) which you can use to test your airline credits integration.
