# Paying with cards in corporate booking tools
Overview
Duffel provides a Payment card industry (PCI) compliant way for your corporate customers to pay airlines and accommodation providers directly for their bookings.
This guide will walk you through how to capture your cards, have the customers complete a 3DS challenge when required, and book flights or accommodation directly with these cards. To pay with cards adds new steps to the normal search, select and create instant orders workflow:
Search for Offers

Select Offer

Sending Card details

Initiate 3DSecure Session

Create Order

Tip

Although this guide is focused on the flow of booking instant orders, Duffel Cards can also be used to pay for hold orders, order changes or Stays bookings.
Requirements
This guide assumes that you already have a working integration with the Duffel API. Only the basics of searching and booking are required for this guide. If you could use a refresher, please head over to our Quick Start Guide.
Is this guide right for you?
This section helps you understand which implementation guide to follow based on the types of cards your customers plan to pay with.
Individual cards are physical or virtual cards that are issued to an individual person. These can be either cards issued for personal use, or corporate cards issued in the name of an employee.
Corporate cards are physical or virtual cards that are issued to a business, and may be issued with either individual or a company as the cardholder name. Personal use cards that are used for business use by an employee or contractor are not classified as corporate cards even if the transactions are for business.
To determine if this integration guide is right for your integration please answer the following questions for each type of card you plan to accept:
Question 1: Is your customer paying with a physical card issued to an individual?
If the answer is Yes → Please implement our Paying with customer card guide.
If the answer is No → Please continue to the next question.
Question 2: Is the card being used within a secure corporate environment?
A secure corporate environment is where company employees require secure logins to make bookings. Examples of a secure corporate environment:
You offer a corporate travel Online Booking Tool (OBT) that is only accessible by authorised employees through a secure login.

You are a Travel Management Company (TMC) that stores corporate card details of your customers’ employees using secure profiles that are only accessible by your authorised employees through a secure login.

If the answer is No → Please implement our Paying with customer card guide.
If the answer is Yes → Please continue, this guide is written for you.
Note

Not sure if your use case is supported? Please get in touch with the Duffel support team at help@duffel.com to see if we support your payment needs.
PCI compliance
Payment card industry (PCI) compliance is required by credit card companies when making secure online transactions to minimise the risk of fraud and identity theft. Any merchant that handles credit card information, including processing, storing or transmitting, is required to be compliant.
Duffel is a PCI DSS Level 1 certified service provider, adhering to the highest compliance standards.
By following this guide, you can minimise your PCI compliance requirements. Duffel’s functionality for managing all card data collection means your customers' card information never touches your servers, significantly reducing your PCI compliance obligations.
All companies who handle card data are required to perform annual assessments to ensure you take appropriate measures to handle card details securely. Customers collecting customer card details using our web component typically are only required to do the lightest form of self-assessment questionnaire (SAQ-A). It is your responsibility to ensure you are complying with PCI guidelines for your business. Please see the PCI security standards website to find out which SAQ is right for your business.
Approval
Approval is required to pay using cards. Please get in touch with the Duffel support team at help@duffel.com to request approval for your corporate booking tool before beginning your integration.
Sending cards details
A card is a resource that will be used to represent a card that does not expose PCI sensitive data and can be used to pay travel suppliers directly.
Once your customer has searched for and selected an offer to book, you now need to pass the card details to be able to pay for the booking from your environment to Duffel.
Use Duffel’s card endpoints to securely store the card details on Duffel’s servers ready for checkout.
Request
Caution

This request hostname is different from other endpoints: api.duffel.cards
Shell


curl -X POST --compressed "https://api.duffel.cards/payments/cards" \
  -H "Accept-Encoding: gzip" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Duffel-Version: v2" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
  "data": {
    "address_city": "London",
    "address_country_code": "GB",
    "address_line_1": "1 Downing St",
    "address_line_2": "First floor",
    "address_postal_code": "EC2A 4RQ",
    "address_region": "London",
    "expiry_month": "03",
    "expiry_year": "30",
    "name": "Neil Armstrong",
    "number": "4242424242424242",
    "cvc": "123",
    "multi_use": false
  }
}'

Response
JSON


{
  "data": {
    "id": "tcd_00009hthhsUZ8W4LxQgkjb",
    "live_mode": false,
    "last_4_digits": "4242",
    "multi_use": false,
    "brand": "visa",
    "unavailable_at": "2024-01-20T12:00:00Z"
  }
}

Field definitions can be found in the API reference.
Initiating a 3DS Session
Card payments must be authenticated before authorisation of a payment can be given. In this step, we will perform 3DS authentication for a card payment and use the result to place an order using the Duffel API.
3D Secure
3D Secure (3DS) is an authentication protocol that provides an extra layer of authentication for online card transactions before the payment is authorised to be taken.
In a typical e-commerce scenario, the same entity authenticates and authorises a payment. When selling travel services indirectly, you present the customer with the shopping experience and checkout page to purchase a travel service, such as a flight, on behalf of the travel supplier. As such, you must authenticate the card before they can authorise the payment.
Duffel's 3DS Session functionality is provided for you to perform that authentication. When required, we initiate a 3DS authentication challenge to maximise the likelihood of card acceptance.
The need for 3DS authentication can vary due to geography, card type, brand, and the card issuer or acquirer. Duffel simplifies this process by handling these complexities and determining when 3DS is needed during checkout so you don’t have to.
All bookings made in a secure corporate environment with a corporate card do not require the end user to authorise the payment using an authentication challenge. Instead, you must declare that the transaction was initiated inside a secure corporate environment. To make that declaration, you must initiate a 3DS Session with the exception parameter set to secure_corporate_payment.
Tip

When paying with physical corporate cards issued to an individual employee an authentication challenge may still be required or the transaction could be declined. You must not pass the exemption for individual physical corporate cards. Implement the 3DS challenge component to handle situations when a challenge occurs. For guidance on how to do that please follow the Initiate 3DS Session section of the Customer card guide .
In the example below you can see how to create a 3DS session using the exception for a secure corporate payment which allows you to then go straight to payment.
Request
Shell


curl -X POST --compressed "https://api.duffel.com/payments/three_d_secure_sessions" \
  -H "Accept-Encoding: gzip" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Duffel-Version: v2" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
  "data": {
    "card_id": "tcd_00009hthhsUZ8W4LxQgkjb",
    "resource_id": "off_00009htYpSCXrwaB9DnUm0",
    "services": [{"id": "sea_00003hthlsHZ8W4LxXjkzo", "quantity": 1}],
    "multi_use": false,
    "exception": "secure_corporate_payment"
  }
}'

Response
JSON


{
  "data": {
    "id": "3ds_00004htsssTG8W4LxQgrtp",
    "live_mode": false,
    "card_id": "tcd_00009hthhsUZ8W4LxQgkjb",
    "resource_id": "off_00009htYpSCXrwaB9DnUm0",
    "expires_at": "2024-12-21T12:21:12Z",
    "status": "ready_for_payment",
    "client_id": "tds_visa_5a9a7b0a574c"
  }
}

Note that the status field is ready_for_payment.
The three_d_secure_session_id can now be used to pay when creating a Flights order, hold order, order change or to pay for a Stays booking.
There are 2 outcomes when using secure_corporate_payment exception, either the status is ready_for_payment or failed because the card can't be used with the secure_corporate_payment exception.
Further information in the request and response schema can be found in the API reference.
Testing your integration
In test mode the following card details can be used to trigger different outcomes on the card acceptance of the 3DS flow.
Follow the below instructions to simulate the different 3DS authentication scenarios in test mode:
Card number:
Test scenario	Visa	Mastercard	American Express
Ready for payment	4111110116638870	5555550130659057	378282246310005
Failed	4242424242424242	5555555555554444	378282246310005
Expiry date: Use any future date for expiry_month and expiry_year
Card Verification Code (CVC): Use any valid value for cvc. 3 digits for Visa and Mastercard, 4 digits for American Express.
Address details: Use any valid address.
