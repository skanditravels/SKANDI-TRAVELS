if (msg.type === "CUSTOMER_CREATE_CASE") {
  const payload = await createCustomerSupportCase({
    input: msg.case || {}
  });

  html.postMessage({
    source: PARENT_SOURCE,
    type: "CUSTOMER_CASE_CREATED",
    payload
  });
  return;
}