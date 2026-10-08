# Displaying Offer and Order Conditions
Overview
Airlines offer a range of different prices for the same flight(s) with different levels of flexibility. Some customers want the lowest price - even if that doesn't allow them to change their flights or get their money back if they need to change their plans. Other customers have flexibility at the top of their wish list and are willing to pay more for the freedom to change their mind later.
In this guide, you'll learn how to use data returned in the API to tell customers what will happen if they want to change or cancel their trip.
With offer and order conditions, you can see whether changes and refunds are allowed for an offer or order, and any fees (known as "penalties") that may apply. This information is available both before booking (that is, on offers) and after booking (that is, on orders).
To start using offer and order conditions and exposing them to your customers, you won't have to call any new APIs. You'll just need to interpret the conditions attributes returned in the Offers and Orders APIs you're already using.
We'll take you through the theory, and then finish with some worked examples so you can see how offer and order conditions work in practice.
What do you need to start?
In this guide, we'll assume that you've already built a basic booking flow using the Duffel API which can search for flights by creating an offer request and then book by creating an order.
If you haven't built your booking flow yet, then head over to our Quick Start guide which explains the first steps.
Setting the context
What are offers and orders?
To search for flights through Duffel, you create an offer request. As part of that offer request, you specify one or more slices.
A slice represents a journey that the passengers want to make between a particular origin and a particular destination on a particular date. That slice could be "fulfilled" by airlines in many different ways. For example, if I wanted to fly from London to Ibiza on 4th June, there are many possible options including:
Taking a direct flight with British Airways

Taking a connecting flight with Iberia via Madrid

Taking a connecting flight with Lufthansa via Munich

In response to an offer request, you get back a series of offers. Each offer represents a particular set of segments (that is, flights) that you can book for a particular price which fulfil the requested slices.
Airlines provide different offers to fly from London to Ibiza
Airlines provide different offers to fly from London to Ibiza

You'll often see multiple offers for exactly the same segments because airlines offer a range of "fare brands" with different features and benefits. For example, there might be a low-price "Basic" brand that is totally fixed and a more expensive "Standard" option that includes a bag and allows changes for a small fee.
Airlines can offer multiple options for exactly the same flight(s)
Airlines can offer multiple options for exactly the same flight(s)

Once your customer has picked the offer they want, you'll create an order, which represents the customer's booking with the airline.
What do airlines mean by "changes" and "refunds"?
When we book flights, we think in terms of changing or cancelling our plans and have our own ideas of what that means.
Airlines don't think in exactly the same way. They use two technical terms - "changes" and "refunds" - which have nuanced technical meanings. It's important to understand how airlines think if you're going to correctly explain flexibility options to your customers.
As an example, let's imagine that I've created an order with Duffel Airways like the one below:
A round-trip from London to Ibiza with Duffel Airways, departing on 4th June and returning on 11th June
A round-trip from London to Ibiza with Duffel Airways, departing on 4th June and returning on 11th June

My plans have changed. I know I can't fly to Ibiza on 4th June because I have an urgent meeting.
At this point, I have four options:
Request a refund: If my order allows me to refund before departure, then I can get my money back. If there's a penalty, that will be subtracted from the money that is refunded.

Postpone my outbound flight by a few days, but keep the inbound flight the same: If my outbound slice allows me to change before departure, then I can change that slice, pushing it back by a couple of days. I will have to pay the "fare difference" if my new flights are more expensive than the old ones. If there's a penalty, I'll also have to pay that to process the change.

Postpone my whole trip by two weeks: If my order as a whole allows me to change before departure, then I can change both slices, pushing them back by two weeks. I will have to pay any extra amount if my new flights are more expensive than the old ones. If there's a penalty, I'll also have to pay that to process the change.

Cancel both flights and pick new ones later: If my order as a whole allows me to change before departure, then I can cancel these flights and wait until later to decide my next steps. Later in the year, I can come back and pick my new dates, and at that point, I'll pay any extra amount for the flights plus any penalty that applies.

It's important to note that, in the fourth case, I cancel all of my flights but the airline still calls this a "change" because I intend to come back later and pick new flights, rather than asking for my money back.
What information is available in the Duffel API?
In the Duffel API, we return "conditions" to tell you what will happen if a customer wants to change or refund their flights.
The conditions attribute is available on offers and orders - in other words, before and after a customer makes a booking. Inside it, there can be two different types of condition: change_before_departure and refund_before_departure.
At the top level of an offer or order, we tell you what will happen if you want to change or refund all of the slices together at the same time for all of the passengers.
At the level of an individual slice, we tell you what will happen if you want to change that slice on its own for all of the passengers - for example, if you want to change the date of the inbound flights in a round trip.
Tip

We don't return refund conditions at the slice level because it isn't possible to refund one slice in an order with multiple slices. The airline thinks of that as a change, because there are still flights left over.
For each condition, we'll give you:
a boolean telling you whether it's allowed

the penalty_amount and penalty_currency of any penalty that applies - if we know it

We get our data directly from the airlines. In some cases, it won't be available. In this case, the condition will be null. This doesn't mean that changing or refunding isn't possible, or that there's no fee. It just means that we don't know.
The data we return only applies for changes and refunds before departure. If any of the flights in the booking have departed - even if the passenger didn't take those flights! - different conditions will apply.
It's also only relevant for what airlines call a "voluntary change", where the passenger chooses voluntarily to change their plans. If there's a schedule change on the airline's side - for example they change the times of the flights or cancel one or more of them - then different "involuntary change" rules will apply.
Worked examples
Let's take our example of our round trip from London to Ibiza and go through some scenarios for how the conditions could look.
An example of the way change and refund conditions can be displayed to customers
An example of the way change and refund conditions can be displayed to customers

Refunds are not allowed
This section explains the refund conditions for the Economy Basic scenario depicted above.
If refunds aren't allowed, the conditions.refund_before_departure.allowed attribute will be false, and the penalty amount and currency will be null:
JSON


{
  "id": "off_123",
  // ...
  "conditions": {
    "refund_before_departure": {
      "allowed": false,
      "penalty_amount": null,
      "penalty_currency": null
    }
    // ...
  }
}

This means that the customer can't cancel their flights and get their money back. However, depending on the change conditions, they may be able to pick new flights and hold on to some of the money they paid.
Refunds are allowed, but with a penalty
This section explains the refund conditions for the Economy Comfort scenario depicted above.
If refunds are allowed but a penalty applies, then the conditions.refund_before_departure.allowed attribute on the offer or order will be true with a non-zero amount:
JSON


{
  "id": "off_123",
  // ...
  "conditions": {
    "refund_before_departure": {
      "allowed": true,
      "penalty_amount": "100.00",
      "penalty_currency": "GBP"
    }
    // ...
  }
}

In this case, we're allowed to refund the offer or order, but a 100 GBP penalty will be subtracted from any refund.
Caution

The penalty_currency will not always match the currency of the offer or order (that is, its total_currency ). Where this is the case, the penalty will be converted into the currency you're paying in at the time that you process any change or refund, using the current exchange rate. This can happen if the airline provided the price in a different currency and Duffel is converting it into your chosen currency.
Refunds are allowed free of charge
This section explains the refund conditions for the Economy Flexible scenario depicted above.
If refunds are allowed free of charge, then the conditions.refund_before_departure.allowed attribute on the offer or order will be true with a zero penalty amount:
JSON


{
  "id": "off_123",
  // ...
  "conditions": {
    "refund_before_departure": {
      "allowed": true,
      "penalty_amount": "0.00",
      "penalty_currency": "GBP"
    }
    // ...
  }
}

This means that the customer can cancel their flights and get all of their money back.
Changes are not allowed for any of the flights
This section explains the changes conditions for the Economy Basic scenario depicted above.
If you aren't able to change any of the flights in the offer or order, the conditions.change_before_departure.allowed attribute at the top level will be false, and the penalty amount and currency will be null:
JSON


{
  "id": "off_123",
  // ...
  "conditions": {
    "change_before_departure": {
      "allowed": false,
      "penalty_amount": null,
      "penalty_currency": null
    }
    // ...
  }
}

This means that the customer can't change their flights. If they don't take them, they'll lose the money they paid.
Changes are allowed for all of the flights, but with a penalty
This section explains the changes conditions for the Economy Comfort scenario depicted above.
If changes are allowed but a penalty applies, then the conditions.change_before_departure.allowed attribute on the offer or order will be true with a non-zero amount:
JSON


{
  "id": "off_123",
  // ...
  "conditions": {
    "change_before_departure": {
      "allowed": true,
      "penalty_amount": "50.00",
      "penalty_currency": "GBP"
    }
    // ...
  }
  // ...
}

In this case, we're allowed to change all of the flights in the offer/order together, but we'll have to pay a 50 GBP penalty as well any fare difference if the new flights are more expensive than the old ones.
Changes are allowed free of charge for all of the flights
This section explains the changes conditions for the Economy Flexible scenario depicted above.
If changes are allowed free of charge, then the conditions.change_before_departure.allowed attribute on the offer or order will be true with a zero amount:
JSON


{
  "id": "off_123",
  // ...
  "conditions": {
    "refund_before_departure": {
      "allowed": true,
      "penalty_amount": "0.00",
      "penalty_currency": "GBP"
    }
    // ...
  }
}

In this case, we're allowed to change all of the flights in the offer/order, and we won't have to pay any penalty.
You'd expect to see this same condition replicated for each of the slices. If all of the slices can be changed together free of charge, then generally speaking, you can also change a single slice free of charge.
Changes are allowed for some, but not all, of the flights
Even if a change isn't allowed for the whole offer or order (i.e. changing all of the flights), it might still be possible to change some of the slices if there are multiple slices (for example a round trip).
If allowed is false at the offer or order level, but you're interested in partial changes, then you should check the conditions inside the slices. Even if changes are not allowed for the offer or order as a whole, you may find that there are slice-specific conditions where allowed is true.
In this example, the inbound flights can't be changed and thus the whole order can't be changed, but the outbound flights do allow changes for a 25 GBP fee:
JSON


{
    "id": "off_123",
    // ...
	"conditions": {
	    "change_before_departure": {
			"allowed": false,
			"penalty_amount": null,
			"penalty_currency": null
		}
		// ...
	},
	"slices": [
		{
			// ...
			"conditions": {
				"change_before_departure": {
					"allowed": true
					"penalty_amount": "25.00",
					"penalty_currency": "GBP"
				}
			}
		},
		{
			// ...
			"conditions": {
				"change_before_departure": {
                    "allowed": false,
                    "penalty_amount": null,
                    "penalty_currency": null
                }
			}
		}
	]
}



Hide full sample

There may still be a price difference to pay if the new flights are more expensive than the old ones, which the customer would also have to pay.
We don't know if changes and/or refunds are allowed
Duffel doesn't support conditions for all airlines, and even for airlines where conditions are supported, it may not be available for all offers and orders.
Where we don't know the conditions for an offer or order, the change_before_departure and/or refund_before_departure attributes will be null:
JSON


{
  "id": "off_123",
  // ...
  "conditions": {
    "change_before_departure": null,
    "refund_before_departure": null
  },
  "slices": [
    {
      // ...
      "conditions": {
        "change_before_departure": null,
        "refund_before_departure": null
      }
    },
    {
      // ...
      "conditions": {
        "change_before_departure": null,
        "refund_before_departure": null
      }
    }
  ]
}

This can also happen at the slice level.
We know that changes/refunds are allowed, but we don't know what penalty applies (if any)
In some cases, we may know that changes or refunds are allowed, but we may not know the penalty.
In this case, the allowed attribute will be true but the penalty_amount and penalty_currency inside the condition will be null:
JSON


{
  "id": "off_123",
  // ...
  "conditions": {
    "change_before_departure": {
      "allowed": true,
      "penalty_amount": null,
      "penalty_currency": null
    }
    // ...
  }
}

This can also happen at the slice level.
