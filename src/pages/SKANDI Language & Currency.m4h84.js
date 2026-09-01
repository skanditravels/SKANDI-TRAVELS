import wixWindowFrontend from "wix-window-frontend";

const EMBED_ID =
  "#languageCurrencyPopupEmbed";

const CHILD_SOURCE =
  "SKANDI_LANGUAGE_CURRENCY_POPUP";

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

const LANGUAGES =
  new Set([
    "EN",
    "SV",
    "NO",
    "DA"
  ]);

const CURRENCIES =
  new Set([
    "USD",
    "SEK",
    "NOK",
    "DKK",
    "EUR"
  ]);


function parseMessage(
  data
) {

  if (
    typeof data ===
    "string"
  ) {

    try {

      return JSON.parse(
        data
      );

    } catch (_) {

      return null;

    }

  }


  if (
    data &&
    typeof data ===
      "object"
  ) {

    return data;

  }


  return null;

}


function normalizeLanguage(
  value
) {

  const result =
    String(
      value ||
      "EN"
    )
      .trim()
      .toUpperCase();


  return LANGUAGES
    .has(result)
      ? result
      : "EN";

}


function normalizeCurrency(
  value
) {

  const result =
    String(
      value ||
      "USD"
    )
      .trim()
      .toUpperCase();


  return CURRENCIES
    .has(result)
      ? result
      : "USD";

}


$w.onReady(
  function () {

    const embed =
      $w(
        EMBED_ID
      );


    const context =
      wixWindowFrontend
        .lightbox
        .getContext() ||
      {};


    const initial = {

      language:
        normalizeLanguage(
          context.language
        ),

      currency:
        normalizeCurrency(
          context.currency
        )

    };


    function send(
      type,
      payload = {}
    ) {

      embed.postMessage({

        source:
          PARENT_SOURCE,

        type,

        payload,

        timestamp:
          new Date()
            .toISOString()

      });

    }


    embed.onMessage(
      event => {

        const message =
          parseMessage(
            event?.data
          );


        if (!message) {

          return;

        }


        if (
          message.source !==
          CHILD_SOURCE
        ) {

          return;

        }


        const type =
          String(
            message.type ||
            ""
          );


        const payload =
          message.payload &&
          typeof message.payload ===
            "object"

            ? message.payload

            : {};


        if (
          type ===
          "POPUP_READY"
        ) {

          send(
            "POPUP_INIT",
            initial
          );

          return;

        }


        if (
          type ===
          "POPUP_SUBMIT"
        ) {

          const language =
            normalizeLanguage(
              payload.language
            );


          const currency =
            normalizeCurrency(
              payload.currency
            );


          wixWindowFrontend
            .lightbox
            .close({
              language,
              currency
            });

        }

      }
    );


    /*
     * Also initialize immediately in case POPUP_READY
     * fired just before the listener was registered.
     */
    send(
      "POPUP_INIT",
      initial
    );

  }
);
