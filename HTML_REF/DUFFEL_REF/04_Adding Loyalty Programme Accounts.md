# Adding Loyalty Programme Accounts
What is a Loyalty Programme Account?
In the travel industry where differentiation is key, and the customer is king, travel sellers need to think about what elements of their business can be a big driver for customer retention and how to make money selling flights. There's no shortage of places to purchase flights from direct airline websites, to meta-search engines like Skyscanner. Thinking about ways to motivate your customers to return to your website time and time again to purchase flights is more important than ever before. This is where Loyalty Programmes come in.
Travellers with Loyalty Programme Accounts can accrue points for flights taken. They then can access benefits such as discounted fares or included services such as additional baggage and seat selection. By providing travellers with the ability to supply their Loyalty Programme Accounts during searching for flights, you can significantly improve your travellers' shopping experience.
How are they included in Offers?
If the airline(s) have lower prices, more services, or anything else, they'll be represented in the existing Offer schema. The Offer schema includes Passenger Loyalty Programme Accounts, if any, that were sent to the airline(s).
Use with Offers
There are different flows for adding Loyalty Programme Accounts for Offers. This gives you flexibility in how you use the Duffel API.
The first flow is through the existing endpoint for creating an Offer Request. The second flow is through the new endpoint for updating an Offer Passenger. You will only be able to witness a discount on the ticket price in the latter flow.
In this guide we'll go through both flows. For both of them, you can provide as many unique Loyalty Programme Accounts per passenger as you'd like. We'll send them to the appropriate airlines.
What do you need to start?
It’s important you know the basics of how to search for flights and create an order. If you could use a refresher, please head over to our Quick Start Guide.
Tip

We've put together a Postman Collection that contains all of the requests you'll need to follow along with this guide.
Flow: Creating an Offer Request
The only difference to the existing endpoint is with the passengers data that you pass in. If you're creating an Offer Request without Loyalty Programme Accounts, your data may look like:
JSON


"data": {
    "slices": [
      {
        "origin": "LHR",
        "destination": "JFK",
        "departure_date": "2020-04-24"
      }
    ],
    "passengers": [
      {
        "type": "adult"
      },
      {
        "age": 14
      }
    ],
    "cabin_class": "economy"
  }

A request to create an Offer Request with Loyalty Programme Accounts would include a list of them per passenger. Previously, it was only required to provide the traveller's name when creating an Order. Airlines require the traveller's name when searching with Loyalty Programme Accounts. Here's what your data may now look like:
For example:
JSON


"data": {
    "slices": [
      {
        "origin": "LHR",
        "destination": "JFK",
        "departure_date": "2020-04-24"
      }
    ],
    "passengers": [
      {
        "type": "adult",
        "given_name": "Amelia",
        "family_name": "Earhart"
        "loyalty_programme_accounts": [
          {
            "airline_iata_code": "QF",
            "account_number": "12901014"
          }
        ]
      },
      {
        "age": 14
      }
    ],
    "cabin_class": "economy"
  }



Hide full sample

You'd then send that request, as usual. The resulting offers will include any available benefits like discounted fares, additional baggage, or preferential seat selection.
Flow: Updating an Offer Passenger
With this flow, you already have an Offer, from creating Offer Request, that didn't include any Loyalty Programme Accounts for the passengers.
To see if the airline has a discounted fares, more services, etc., you need to update the Passengers in your Offer. This is done through the updating an Offer Passenger endpoint.
Shell


curl

curl -X PATCH --compressed "https://api.duffel.com/air/offers/$OFFER_ID/passengers/$OFFER_PASSENGER_ID" 
  -H "Accept-Encoding: gzip" 
  -H "Accept: application/json" 
  -H "Content-Type: application/json" 
  -H "Duffel-Version: v2" 
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN" 
  -d '{
  "data": {
    "given_name": "Amelia",
    "family_name": "Earhart"
    "loyalty_programme_accounts": [
      {
        "airline_iata_code": "QF",
        "account_number": "12901014"
      }
    ]
  }
}'
You'll need to repeat this for each passenger that you would like to update with Loyalty Programme Accounts since they're not shared between passengers.
Note

After you've done this, you'll need to get the Offer again as the price of the offer might change.
JavaScript


Node.JS

duffel.offers.get(OFFER_ID)
Creating an Order
There's no difference when creating an Order. You do not need to provide Loyalty Programme Accounts data again when creating an Order.
Testing your integration
We provide Duffel Airways for testing features, but it's also helpful to test with other airlines. Please contact us at help@duffel.com for test data.
Using the following passenger details will result in a 10% discount, as well as a baggage allowance of six checked bags per passenger, for all Duffel Airways flights. It will also include a 10% discount off of seat services.
JSON


{
  "type": "adult",
  "given_name": "Amelia",
  "family_name": "Earhart"
  "loyalty_programme_accounts": [
    {
      "airline_iata_code": "ZZ",
      "account_number": "1234567890"
    }
  ]
}
