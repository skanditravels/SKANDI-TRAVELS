# Choosing a payment method
Overview
When purchasing goods or services online, the typical flow sees you select your products and then provide a payment method, usually in the form of a credit or debit card, for them at checkout.
The same pattern applies when purchasing travel, but there are a few variations that are important to know when deciding how you want to pay when planning your integration.
This guide introduces how you and your travellers pay for travel services booked through the Duffel platform. Travel services include Flights, Stays and any other services available through Duffel.
Entities involved in a travel payment transaction
There are several entities involved to enable the payment for a travel service indirectly, i.e. when a customer books anywhere other than the suppliers’ own websites, e.g. aa.com or marriott.com.
To understand which payment methods suit you it’s essential to understand each actor and their responsibilities in the payment flow.
Entities in the payment flow
Entities in the payment flow

Traveller - The person purchasing the travel service from the Customer. This could be individuals or businesses, and could be the person consuming the travel service, or someone booking on their behalf.
Responsibility: Select the required travel services and provide the appropriate payment details during checkout.


Customer - You. Then entity enabling Travellers to book and pay for travel services.
Responsibility: Collecting payment details during checkout. To ensure seamless transactions, it’s essential to follow payment practices aligned with industry standards, including any required steps, such as 3DSecure authentication checks for card payments.


Duffel - The intermediary connecting you, the Customer, to 100s of Travel Suppliers. Depending on your chosen form of payment Duffel may either securely relay payment details onwards to the Travel Supplier, or pay the Travel Supplier on your behalf.
Responsibility: Secure and compliant handling of payment, including credit card information.


Travel Supplier - The airline, accommodation, or other provider who makes their services available for purchase through the Duffel Platform. i.e. a Flight or a Hotel room.
Responsibility: Processing of the payment for the travel service.


Available payment methods
Duffel supports two methods of paying for a travel service, Card and Cash. You can use either method on its own, or both — but not for the same transaction.
Card
Credit and Debit cards can be used to pay for both Duffel Flights and Duffel Stays services. Card is a near universally available payment method, easily available to most Travellers, and accepted by the majority of Travel Suppliers.
When you make a booking through Duffel, you will need to supply the Traveller's card details during checkout.
Duffel facilitates the transaction by passing the payment card information to the travel suppliers and does not take part in the movement of funds.
The Travel Supplier is the Merchant of Record, and their name will appear on the Traveller’s card statement, but as the owner of the relationship with the Traveller in the travel booking process you are contractually liable for any chargebacks or fraud that may occur. The Travel Supplier is often the airline (i.e. American Airlines), or accommodation (i.e. Marriott), but may also be an intermediary such as Expedia or Booking.com. The supplier name is made clear in our API.
Cardholder
We support three different types of cards, based on who the cardholder is:
Individual - Cards issued in the name of an individual. These could be consumer cards or corporate cards issued to individual employees. These might be Physical or Virtual cards.

Corporate - Cards issued in the name of your Traveller’s business. These might be Physical or Virtual cards.

Agency - Cards issued in the name of your business used to pay on behalf of your Traveller. This applies to any business selling travel whether you're a traditional travel agent or a business facilitating travel bookings using your own payment method. These might be Physical or Virtual cards.

Important Considerations
Travel suppliers generally require the name on the credit card to match the name of the Traveller for verification purposes and to minimise fraud. If the cardholder’s name does not match the Traveller's name, it may result in a declined payment or, worst case, the Traveller may not be able to board a flight or check-in at a accommodation.
The use of Agency cards is not widely accepted for Flights Travel Suppliers and requires written permission from each Travel Supplier. Making bookings with Agency card without written permission may incur penalties from Travel Suppliers and worst case the Traveller may not be able to board a flight or check-in at a accommodation. If using Agency cards is critical to your business model please discuss this with your Duffel contact so we can help you understand suitability and the options available to you.
Flow of payment card information between actors
Flow of payment card information between actors

The main benefits:
Does not tie up any of your capital

Enables you to price match with the travel supplier

Streamlined payment process due to the reduced number of steps during the checkout process.

The main disadvantages:
You cannot markup or discount the transaction as card payments must be for the exact amount quoted by the travel supplier. If you wish to control the price you will need to be Merchant of Record and collect customer card payments yourself.

Some Travel Suppliers will conditionally add payment processing fees to the price, compared to the cash purchase price (i.e. Jetstar).

Handling payment card Information - You need to fulfil Payment Card Industry (PCI) compliance requirements to take payments using card. This includes secure data storage, and following best practices for safeguarding customer card details, implementing necessary checks and safeguards to prevent unauthorised transactions or misuse of card information. See below for more information on the tooling Duffel provides to minimise the burden of PCI.

Payment currency is always in the travel suppliers own currency which may result in a reduced booking conversion rate due to Travellers typically preferring to pay in their own currency. i.e. easyJet is always paid in GBP, Marriott in New York is always paid in USD.

Handling Payment Card Information
Payment Card Industry (PCI) compliance is required by credit card companies to make secure online transactions and minimise the risk of identity theft. Any merchant that handles card information, including processing, storing or transmitting, is required to be compliant.
Duffel provides a card component that you can embed in your checkout flow to handle credit card information in a PCI compliant way so you don't have to.
If you follow the Paying with customer card integration guide and are using Duffel's CardPayment component to collect card details, then your customers' card information never touches your servers, significantly reducing your PCI compliance obligations.
For further information on suitability and how to use this payment method please read our Paying with customer card integration guide.
Note

This payment method requires approval to access. If this payment method seems right for your needs, please get in touch with the Duffel support team at help@duffel.com to see if you would be approved for access.
Cash
Cash can be used to pay for both Duffel Flights and Duffel Stays services by adding funds to your Duffel Balance, a pre-funded wallet, to use to pay for a Flight Orders or Stays Bookings. When you make a booking through Duffel, we will automatically debit your Duffel Balance for each transaction before making a payment to the Travel Supplier.
You fund your Duffel Balance by bank transfer. See our Top-up guide for instructions on how to fund your Duffel Balance.
We also offer low balance notifications to ensure you never run out of funds.
If you plan to collect payment from your customers to fund your Balance then you must collect such payment yourself.
Note

For customers with their own ARC or IATA accreditation, we also support ARC and BSP Cash across all major airlines.
Payment using ARC or BSP Cash requires Duffel and you to engage with each airline to gain access and setup. If this applies to you, please get in touch with the Duffel support team at help@duffel.com to get started.
Flow of funds between actors
Flow of funds between actors

The main benefits:
Flexibility to support any local payment methods, maximising checkout conversion rates.

Eliminate risk of suppliers rejecting your form of payment and failing a booking.

Transparent pricing, what you see is what you pay.

One single, simple, way to pay. No need to handle variances based on different suppliers, currencies, or country.

Always pay in your preferred currencies.

Centralised and complete reporting on all payments for Orders and Post-booking servicing.

The main disadvantages:
You have to pre-fund your Duffel Balance which may affect your available capital.

Only Duffel Stays rates paid at time of checkout can be booked using Duffel Balance. Rates that require a card only to guarantee the room and not for payment are not bookable.
