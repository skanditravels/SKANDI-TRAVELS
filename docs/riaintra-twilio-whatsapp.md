# RIA INTRA WhatsApp setup

Customer Service Desk → WhatsApp uses the existing RIA INTRA case and message history. The Twilio integration accepts inbound messages, sends agent text replies, and records delivery and read statuses. The desk requires staff access and sends messages only to the WhatsApp number on the conversation. Verify the traveler separately before sharing booking details.

## Connect the sender

1. Apply `supabase/migrations/20261127035250_twilio_whatsapp_support.sql` through the project's SQL migration process. Publish the GitHub changes to the SKANDI TRAVELS Wix site and verify the published endpoint before changing live inbound routing.
2. In Wix Secrets Manager, enter the three values from the Twilio account or subaccount that owns the approved sender.

   | Secret | Value |
   | --- | --- |
   | `SKANDI_TWILIO_ACCOUNT_SID` | Account SID beginning with `AC` |
   | `SKANDI_TWILIO_AUTH_TOKEN` | Primary Auth Token for that Twilio account |
   | `SKANDI_TWILIO_WHATSAPP_SENDER` | Approved sender in E.164 format, with or without the `whatsapp:` prefix |

3. In Twilio Console, open **Communications → Numbers & senders → Overview → WhatsApp**. Open the sender's **Messaging configuration**. Set **Webhook URL for Incoming messages** to `https://www.skanditravels.com/_functions/skandiTwilioWhatsAppInbound` and select **POST**. If the sender belongs to a Messaging Service, inspect that service's **Integration** settings. **Defer to sender's webhook** uses the sender-level URL. A service-wide webhook affects every sender in that service.
4. Each RIA INTRA reply supplies its own **StatusCallback** URL to Twilio. It uses `https://www.skanditravels.com/_functions/skandiTwilioWhatsAppStatus` with a unique `replyId` query parameter. Twilio signs the full URL, including that parameter.

## Verify with a test number

1. Send a WhatsApp text from an authorized test number to the approved sender. Open **RIA INTRA → Customer Service Desk → WhatsApp** and check the message and traveler number.
2. Reply from the desk. Check that the test number receives the reply and that the desk updates the message to **Delivered** or **Read** when Twilio reports that status.
3. Add an internal note and verify it appears only inside the case. An inbound attachment appears as a notice in the case. Outbound replies from this connection are text only.
4. Check a conversation whose last customer message is more than 24 hours old. The composer returns a window-closed message. Sending approved WhatsApp Content Templates is a separate workflow and requires a configured `ContentSid` for each approved template.

The public webhook returns HTTP 403 for a form request without a valid Twilio signature. Check Twilio's message logs for live delivery errors and webhook response codes. If Twilio has not confirmed a send, check the conversation and Twilio logs before repeating it.

[Twilio sender configuration](https://help.twilio.com/articles/55716185417627) · [Messaging Service integration](https://help.twilio.com/articles/55716100212635) · [WhatsApp customer service windows](https://www.twilio.com/docs/whatsapp/key-concepts)
