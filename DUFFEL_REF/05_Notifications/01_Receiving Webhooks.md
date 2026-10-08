# Receiving Webhooks
Overview
In this guide, you'll learn how to set up and handle webhooks in your Duffel integration.
After you've set up webhooks, you'll receive notifications about events that happen in your Duffel account - for example, when an airline has a schedule change affecting one of your orders.
We'll send these events to your server, and then you can process them and take action automatically - for example updating your database or emailing a customer.
We'll go through three simple steps to set this up:
Build a simple webhook receiver in Python

Create a webhook

Send a test event to our webhook

Building a simple webhook receiver in Python
Let's start by creating a server, running locally on our machine, that can receive event notifications.
For this example, we'll write our server in Python 3, but you can use any modern programming language.
We'll assume that you have Python 3 and pip installed. We'll use Flask to quickly build a server. You can install Flask with pip install flask.
Once you have Flask installed, copy the code below and paste it into an app.py file. After you've set up your webhook in step 2, we'll replace <your-generated-webhook-secret> with your webhook's secret.
import json
import hmac
import hashlib
import base64

from flask import Flask, jsonify, request
app = Flask(__name__)

# Secret as bytes, ready for comparison
secret = b"<your-generated-webhook-secret>"


# Our route that will receive the webhooks from Duffel's servers
@app.route('/webhooks', methods=['POST'])
def hello_world():
    if not compare(secret, request):
        print('⚠️  Unsafe payload')
        return jsonify(success=True)

    # Sample event:
    # {'updated_at': None, 'type': 'order.created', 'live_mode': False, 'inserted_at': None, 'idempotency_key': 'ord_0000ApoiwggSbt7BordU1o', 'identity_organisation_id': 'org_0000A5IcgBRqte1uoxkDU8', 'id': 'wev_0000A5O5f2N91XniqO9DdY', 'data': {'object': {}}}
    event = None

    try:
        # Get the payload as JSON
        event = request.json
        print('ℹ️ Parsed event')

    except:
        print('⚠️  Webhook error while parsing basic request.' + str(e))
        return jsonify(success=False)

    # Handle the event
    if event and event['type'] in ['order.updated', 'order.airline_initiated_change_detected', 'ping.triggered']:
        print('ℹ️ Event type: ' + event['type'])

    else:
        # Unexpected event type
        print('⚠️ Unhandled event type {}'.format(event['type']))
        return jsonify(success=True)

    print('✅Handled event!')

    return jsonify(success=True)


# Compare the request's payload with our secret to verify that it was sent
# from Duffel, and not from a malicious actor.
def compare(secret, request):
    # Get the payload as bytes so that we can construct the signature from
    # raw/unparsed data
    raw_payload = request.get_data()

    # Format:
    # t=1616202842,v1=8aebaa7ecaf36950721e4321b6a56d7493d13e73814de672ac5ce4ddd7435054
    raw_signature = request.headers['X-Duffel-Signature']
    pairs = list(map(lambda x: x.split('='), raw_signature.split(',')))
    t = pairs[0][1]
    v1 = pairs[1][1]

    # Recreate the signature
    local_signature = signature(secret, raw_payload, t)

    # Use a secure comparison function to check that they're the same
    return hmac.compare_digest(v1, local_signature)


# Generate a signature
def signature(secret, payload, timestamp):
    # We need the signed payload as bytes
    signed_payload = timestamp.encode() + b"." + payload
    # The signature in bytes
    signature = hmac.new(secret, signed_payload, hashlib.sha256).digest()
    # Base16 encode the signature, in lowercase, then decode to a string
    return base64.b16encode(signature).lower().decode()



View full sample

The application is very simple. The comments throughout explain the flow of how we process a received notification.
You can run this application on port 4567 with a simple command:
Shell


FLASK_ENV=development FLASK_RUN_PORT=4567 FLASK_APP=app.py flask run

You'll need to expose your application to the internet to be able to receive events from Duffel. The simplest way to do this on your local machine is to use ngrok, which is free to download across all major operating systems.
Once you've installed ngrok, you can run it from the command line and expose port 4567 to the internet with the following command:
Shell


ngrok http 4567

With ngrok running, you'll need to copy the URL it gives you so you can pass that to Duffel and we can send you events.
You should see output from ngrok with a line that looks something like $ Forwarding http://be3baxdc.ngrok.io -> 127.0.0.1:4567. You should copy the http://be3baxdc.ngrok.io part.
You'll need to keep the Python script and ngrok running for the next steps of this guide.
Creating a webhook
Next, we need to use the Duffel API to create a new webhook pointing to our webhook receiver.
Duffel can send a range of different kinds of "event" via a webhook. Let's start by creating a webhook which is subscribed to the order.airline_initiated_change_detected event. This event will be triggered, and we'll send a request to your webhook, when an order has a schedule change initiated by the airline.
You can use a request like this to create a webhook - you'll need to replace <YOUR_ACCESS_TOKEN> with your access token for the Duffel API, and the url with the URL you got from ngrok above:
Shell


curl -X POST --compressed "https://api.duffel.com/air/webhooks" \
  -H "Accept-Encoding: gzip" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Duffel-Version: v2" \
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN" \
  -d '{
  "data": {
    "url": "https://www.example.com:4000/webhooks",
    "events": [
      "order.airline_initiated_change_detected"
    ]
  }
}'

You'll get back a response like this:
JSON


{
  "meta": null,
  "data": {
    "url": "http://be3baxdc.ngrok.io/webhooks",
    "secret": "54vFWvaSbbzYpxXPeB4YEw==",
    "id": "end_0000A5TK3psWyzKIU2La52",
    "live_mode": false,
    "events": ["order.airline_initiated_change_detected"],
    "created_at": "2021-03-22T15:14:42.127734Z",
    "active": true
  }
}

You'll see that the webhook is currently active. You can deactivate a webhook using the update a webhook endpoint in the API, you can also change the URL if you wish with this endpoint.
You must write down the returned secret as it's only available at the time when you create a webhook. You'll never be able to see it again.
You'll need to take that secret and replace <your-generated-webhook-secret> in your Python code above with it, and then restart the application.
Note that you'll have specific, separate webhooks for Duffel's live mode and test mode. When you create a webhook, its mode will be determined by the access token you use. live_mode will be set to true if you create the webhook using a live mode access token. It'll be set to false if you use a test mode access token. You should start in test mode.
Sending a test event to our webhook
We now have our local webhook receiver running and we've created a webhook in Duffel to send events to that receiver. Congratulations! 🎉 The next step is to make sure it works.
We have an API endpoint that allows you to trigger a ping event to your webhook. To trigger a ping, you'll need the ID for the webhook (which was returned when you created your webhook - for example sev_0000A5TK3psWyzKIU2La52). With that, you can send a request to Duffel to trigger the ping event:
Shell


curl

curl -X POST --compressed "https://api.duffel.com/air/webhooks/id/$WEBHOOK_ID/actions/ping"
  -H "Accept-Encoding: gzip"
  -H "Accept: application/json"
  -H "Content-Type: application/json"
  -H "Duffel-Version: v2"
  -H "Authorization: Bearer $YOUR_ACCESS_TOKEN"
  -d '{}'
You'll need to replace $YOUR_ACCESS_TOKEN with your Duffel access token and $WEBHOOK_ID with the ID of your webhook.
If your webhook was configured successfully and your code was running and accessible to the internet, your local Python server should output ✅ Handled event!.
What's next?
You've created a webhook which subscribes to the order.airline_initiated_change_detected event, so you'd receive a push whenever an airline changes the schedule of your order.
An order.airline_initiated_change_detected webhook looks like this:
JSON


{
  "created_at": "2021-04-22T13:13:18.420272Z",
  "data": {
    "object": {
      ..
    }
  },
  "id": "wev_0000A6VP9fgKxAccTSKWUy",
  "live_mode": false,
  "object": "order",
  "type": "order.airline_initiated_change_detected",
  "idempotency_key": "aic_0000ApoiwggSbt7BordU1o"
}

In your code, you should look at the type of events that you receive and handle that appropriately. As our system will retry failed events, there can be cases when we will send you duplicate events, in those cases you should use the idempotency_key to check for uniqueness.
