# Handling Flight Booking Confirmation Emails
After a flight booking is complete, your customers expect to receive a confirmation showing the order has gone through correctly and summarising the details of their flight. But what is your responsibility as a travel seller and what is the responsibility of the airline or tech provider?
We summarise common questions related to order confirmations in this resource.
What communication about orders do I need to ensure are sent to my customers?
An order (sometimes referred to as a booking) confirmation

Notification about any changes

Do I need to the send the order confirmation to my customers?
No. You can choose to do this yourself or you can ask Duffel to send these emails on your behalf.
Providing the right information can help reduce the amount of support calls you’ll receive from customers and can greatly improve their day of travel experience.
A small number of airlines may also send the passenger their own booking confirmation with the itinerary, and sometimes the price paid for their booking.
Which airlines send booking confirmations?*
Easyjet

Iberia

Singapore Airlines

United

We recommend that you manage your customer's experience and ensure a booking confirmation is always sent.
*List of airlines updated on 13th June 2022.
Why do you need an email address and phone number if you don’t send the confirmation?
When you book flights through Duffel, we require an email address and phone number for each of the passengers.
We pass this information to the airline so they can send customers operational notifications related to their flights, for example, if there is a schedule change or a flight is disrupted by bad weather.
Airline industry rules explicitly state that airlines must not use passengers' contact details for sales & marketing purposes, for example, for advertising extra products. Despite these rules, you might find that on rare occasions, airlines still send these kinds of communications.
What should I include in the booking confirmation email?
In the confirmation, you should include information about the itinerary, payment details, and booking reference, which the passenger will use to check in.
Our Flights API includes all of the details you need to send in that email. Below is an example booking confirmation email overlaid with all the key data you need to convey to your customer.
Booking confirmation including data description tooltips
Booking confirmation including data description tooltips

How do I send an order confirmation?
Based on the mockup above, you can take the data and create an email template that pulls this information in from your backend. You can then confirm your event name that will trigger the email to your user (e.g. order_confirmed, booking_completed).
Most travel sellers use an email provider to send transactional and/or marketing emails to their customers to comply with regulations and keep up-to-date records for their customers. Emails are generally created in HTML. You can code an email from scratch in-house or explore the web for examples to use. Some email providers also supply easy-to-use templates. A few examples of email platforms you may have heard of include Mailchimp, SendGrid, Sendinblue and Hubspot — but there are many more.
Once the email is set up with the custom data parameters inserted, you should test that it shows accurate information before using it with live orders. Once it’s live, your customers will receive an email that looks like the example above as soon as a booking has been completed.
You can always ask Duffel to send these emails on your behalf. If Duffel is sending them, we will require some branding information so it can remain consistent with your brand.
