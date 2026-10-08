# Adding Corporate Loyalty Programme Accounts
Overview
Corporate loyalty programmes allow businesses to earn rewards and benefits when their employees travel. This guide explains how to access these programmes through the Duffel API when searching for flights.
When searching for flights using the Duffel API, you can access corporate loyalty programmes by adding specific information to your offer request.
Similar to corporate private fares, corporate loyalty programmes are accessed through the private_fares object. However, airlines require different parameters to be submitted.
Supported airlines and requirements
The following airlines support corporate loyalty programmes through the Duffel API, each with specific required parameters:
Airline	Programme Name	Required Parameter
United Airlines (UA)	PerksPlus	tour_code
American Airlines (AA)	AAdvantage Business	tracking_reference
Air France (AF)	Bluebiz	tracking_reference
KLM (KL)	Bluebiz	tracking_reference
Delta (DL)	Sky Miles For Business	tracking_reference
Southwest (WN)	SWABIZ and Rapid Rewards BIZ	tracking_reference
Frontier (F9)	Biz travel for less	tracking_reference
Alaskan (AS)	EasyBiz	tracking_reference
WestJet (WS)	WestJetBiz	tracking_reference
JetBlue (B6)	JetBlue Business Travel	tracking_reference
This is not a definitive list. If there are major carriers missing from the list please reach out to us to find out about our support, it's possible we already support them.
Adding corporate loyalty programmes to your search
To add corporate loyalty programme details to your search, include the private_fares object in your offer request with the appropriate parameters for each airline.
Example: United Airlines PerksPlus
When accessing United Airlines' PerksPlus programme, you need to provide a tour_code:
Shell


curl

curl -X POST https://api.duffel.com/offer_requests \
    -H "Accept-Encoding: gzip"
    -H "Accept: application/json"
    -H "Duffel-Version: v2"
    -d '{
    "slices": [
        {
            "origin": "SFO",
            "destination": "LAX",
            "departure_date": "2025-07-15"
        }
    ],
    "passengers": [{ "type": "adult" }],
    "private_fares": {
        "UA": [
            {
                "tour_code": "CORP123"
            }
        ]
    }
}'
Example: American Airlines AAdvantage Business
For American Airlines' AAdvantage Business corporate programme, use the tracking_reference parameter:
Shell


curl

curl -X POST https://api.duffel.com/offer_requests \
    -H "Accept-Encoding: gzip"
    -H "Accept: application/json"
    -H "Duffel-Version: v2"
    -d '{
    "slices": [
            {
                    "origin": "JFK",
                    "destination": "ORD",
                    "departure_date": "2023-07-15"
            }
    ],
    "passengers": [{ "type": "adult" }],
    "private_fares": {
            "AA": [
                    {
                            "tracking_reference": "AA12345"
                    }
            ]
    }
}'
Checking if an offer includes corporate loyalty benefits
When you receive offers, you can check if they include the corporate loyalty programme benefits by examining the private_fares property of each offer. This property will include details about any corporate loyalty programme applied to the offer.
Caution

Suppliers do not usually validate that correct loyalty programmes have been input at search or order creation time. It is imperative you provide accurate information. Invalid information will often result in offers that have the incorrect information attached and nothing earned on the scheme.
