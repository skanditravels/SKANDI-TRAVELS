# Finding Airports within an Area
Overview
Flights go from airport to airport, and thus that's how searches are framed. Within the airline industry, there's also the concept of cities (AKA metropolitan areas) that can have 1 or more airports attached to them.
A traveller may want to know which airport(s) best suit the location that they're wanting to go to. To help with this, we have an endpoint that can suggest places based on some filtering criteria.
Finding airports by a location
We'll use an example trip to demonstrate how to do this. Lagos, Portugal doesn't have its own airport. Which is the most reasonably close airport that could be flown into and then have a less than an hour drive?
Request
Here's an example of a query to our API to list airports within 100km of Lagos, using its latitude and longitude.
Shell


curl

curl -X GET --compressed "https://api.duffel.com/places/suggestions?lat=37.129665&lng=-8.669586&rad=100000"
    -H "Accept-Encoding: gzip"
    -H "Accept: application/json"
    -H "Duffel-Version: v2"
})
Response
We get back 2 airports from the API which are in the nearby cities of Faro and Portimão.
JSON


{
  "meta": null,
  "data": [
    {
      "type": "airport",
      "time_zone": "Europe/Lisbon",
      "name": "Portimão Airport",
      "longitude": -8.582632,
      "latitude": 37.148769,
      "id": "arp_prm_pt",
      "icao_code": "LPPM",
      "iata_country_code": "PT",
      "iata_code": "PRM",
      "iata_city_code": "PRM",
      "city_name": "Portimão"
    },
    {
      "type": "airport",
      "time_zone": "Europe/Lisbon",
      "name": "Faro Airport",
      "longitude": -7.967814,
      "latitude": 37.015998,
      "id": "arp_fao_pt",
      "icao_code": "LPFR",
      "iata_country_code": "PT",
      "iata_code": "FAO",
      "iata_city_code": "FAO",
      "city_name": "Faro"
    }
  ]
}



Hide full sample

Doing searches for the suggested location
Now that we have airports, you can do separate searches for each of them, and return them to your traveller to pick from. You would need to combine the offers, if any, from the 2 different responses.
