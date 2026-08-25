import wixLocationFrontend from "wix-location-frontend";

const EMBED_ID =
  "#storeOrderConfirmationEmbed";

const SOURCE =
  "SKANDI_STORE_CONFIRMATION";

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

let embed = null;

function send(type, payload = {}) {
  embed?.postMessage({
    source:
      PARENT_SOURCE,
    type,
    payload,
    timestamp:
      new Date().toISOString()
  });
}

function queryData() {
  const query =
    wixLocationFrontend.query ||
    {};

  return {
    orderId:
      String(
        query.orderId ||
        ""
      ),

    paymentStatus:
      String(
        query.paymentStatus ||
        "Submitted"
      )
  };
}

$w.onReady(function () {
  embed =
    $w(
      EMBED_ID
    );

  embed.onMessage(
    (event) => {
      const message =
        event?.data ||
        {};

      if (
        message.source !==
          SOURCE
      ) {
        return;
      }

      if (
        message.type ===
          "CONFIRMATION_READY"
      ) {
        send(
          "STORE_CONFIRMATION_DATA",
          queryData()
        );
        return;
      }

      if (
        message.type ===
          "CONFIRMATION_NAVIGATE" &&
        message
          ?.payload
          ?.path
      ) {
        wixLocationFrontend.to(
          message.payload.path
        );
      }
    }
  );

  send(
    "STORE_CONFIRMATION_DATA",
    queryData()
  );
});
