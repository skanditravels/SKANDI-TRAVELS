// /src/backend/SKANDI_CORE/automationEmailConfig.js
// SKANDI V12 — canonical, provider-neutral automated-email configuration and workflow catalog.
// Static brand/legal/contact values live here once. Transaction-specific values remain Wix trigger placeholders.

export const EMAIL_AUDIENCES = Object.freeze({
  CUSTOMER: "CUSTOMER",
  EMPLOYEE: "EMPLOYEE"
});

export const EMAIL_TYPES = Object.freeze({
  BUSINESS_CRITICAL: "BUSINESS_CRITICAL",
  BUSINESS_TRANSACTIONAL: "BUSINESS_TRANSACTIONAL",
  PROMOTIONAL: "PROMOTIONAL"
});

export const EMAIL_PLATFORM = Object.freeze({
  version: "12.0.0",
  siteId: "97bf5405-2507-4744-b53a-0f1a5a61796d",
  siteUrl: "https://www.skanditravels.com",
  employeePortalUrl: "https://www.skanditravels.com/riaintra",
  supportUrl: "https://www.skanditravels.com/about/support",
  legalUrl: "https://www.skanditravels.com/about/legal",
  privacyPolicyUrl: "https://www.skanditravels.com/about/legal/policies?slug=privacy-policy",
  termsOfUseUrl: "https://www.skanditravels.com/about/legal",
  bookingTermsUrl: "https://www.skanditravels.com/about/legal/policies?slug=booking-terms",
  cookiesPolicyUrl: "https://www.skanditravels.com/about/legal/policies?slug=skandi-travels-cookies-policy",
  accessibilityUrl: "https://www.skanditravels.com/about/legal/policies?slug=accessibility",
  disclaimerUrl: "https://www.skanditravels.com/about/legal/policies?slug=disclaimer",
  clubSignupUrl: "https://www.skanditravels.com/skandi-club",
  myProfileUrl: "https://www.skanditravels.com/my-profile",
  bookingUrl: "https://www.skanditravels.com/booking",
  careersUrl: "https://www.skanditravels.com/about/careers",
  senderEmail: "contact@skanditravels.com",
  supportPhone: "+1 646 583 1610",
  companyLegalName: "SKANDI GROUP Inc. (United States) & SKANDI GROUP Aktiebolag (Sweden)",
  companyMailingAddress: "450 Lexington Avenue, New York, NY 10163, United States",
  copyrightOwner: "SKANDI GROUP Inc. (United States) & SKANDI GROUP Aktiebolag (Sweden)",
  trademarkLine: "SKANDI TRAVELS™ is a trademark of the SKANDI GROUP.",
  employeeEmailDomain: "@skanditravels.com",
  employeeCompanyMarker: "SKANDI",
  brand: Object.freeze({
    navy: "#022e64",
    cyan: "#5FC7CF",
    page: "#eef3f8",
    white: "#ffffff",
    ink: "#172033",
    body: "#344054",
    muted: "#667085",
    line: "#e5e9ef",
    panel: "#f5fbfc"
  }),
  assets: Object.freeze({
    customerLogoUrl: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
    employeeLogoUrl: "https://static.wixstatic.com/media/394052_0c62c8360cad4471942915bc7fc6c8eb~mv2.png",
    skandiClubLogoUrl: "https://static.wixstatic.com/media/394052_a951f7d81eb04993981da0a51f26465e~mv2.png",
    riaintraLogoUrl: "https://static.wixstatic.com/media/394052_1024542c47664bff8f4e145d1adf472d~mv2.png",
    employeeWelcomeHeroImage: "",
    customerWelcomeHeroImage: "",
    skandiClubPromoImageUrl: ""
  }),
  social: Object.freeze({
    instagram: Object.freeze({
      url: "https://www.instagram.com/skanditravels",
      iconUrl: "https://static.wixstatic.com/media/394052_3140fd0b593e44bd993a64412b94011e~mv2.png"
    }),
    facebook: Object.freeze({
      url: "https://www.facebook.com/skanditravels",
      iconUrl: "https://static.wixstatic.com/media/394052_80ea7848b9a142ef9f5c3c0beb8a3230~mv2.png"
    }),
    linkedin: Object.freeze({
      url: "https://www.linkedin.com/en/skanditravels",
      iconUrl: "https://static.wixstatic.com/media/394052_a7bf9a6382bc4b8785c1e4ebae385cda~mv2.png"
    }),
    tiktok: Object.freeze({
      url: "https://www.tiktok.com/@skanditravels",
      iconUrl: "https://static.wixstatic.com/media/394052_74976eb394d14952af79f14988bb17b3~mv2.png"
    }),
    snapchat: Object.freeze({
      url: "https://www.snapchat.com/@skanditravels",
      iconUrl: "https://static.wixstatic.com/media/394052_1c961ca84c314ebc966444cb5449c618~mv2.png"
    })
  })
});

export const AUTOMATION_PLACEHOLDERS = Object.freeze({
  contactId: "contactId",
  firstName: "contact.name.first",
  email: "contact.email",
  company: "contact.company",
  createSignupLink: "createSignupLink",
  confirmEmailCode: "confirmEmailCode",
  resetPasswordLink: "resetPasswordLink",
  bookingReference: "bookingReference",
  orderId: "orderId",
  amount: "amount",
  currency: "currency",
  departureDate: "departureDate",
  returnDate: "returnDate",
  origin: "origin",
  destination: "destination",
  flightNumber: "flightNumber",
  hotelName: "hotelName",
  caseReference: "caseReference",
  caseStatus: "caseStatus",
  clubTier: "clubTier",
  clubPoints: "clubPoints",
  trackingUrl: "trackingUrl",
  managerName: "managerName",
  taskName: "taskName",
  taskDueDate: "taskDueDate",
  rosterPeriod: "rosterPeriod",
  payslipPeriod: "payslipPeriod",
  policyTitle: "policyTitle",
  trainingTitle: "trainingTitle"
});

const C = EMAIL_AUDIENCES.CUSTOMER;
const E = EMAIL_AUDIENCES.EMPLOYEE;
const BOTH = Object.freeze([C, E]);

function workflow({
  category,
  audiences = [C],
  emailType = EMAIL_TYPES.BUSINESS_TRANSACTIONAL,
  template = "STANDARD",
  subject,
  preheader,
  headline,
  intro,
  ctaLabel = "View details",
  ctaPlaceholder = "",
  triggerKey = "",
  secure = false,
  allowMarketing = false,
  requiredPlaceholders = [],
  referenceCode = ""
}) {
  return Object.freeze({
    category,
    audiences: Object.freeze([...audiences]),
    emailType,
    template,
    subject,
    preheader,
    headline,
    intro,
    ctaLabel,
    ctaPlaceholder,
    triggerKey,
    secure,
    allowMarketing: allowMarketing && emailType === EMAIL_TYPES.PROMOTIONAL,
    requiredPlaceholders: Object.freeze([...requiredPlaceholders]),
    referenceCode
  });
}

const critical = props => workflow({ emailType: EMAIL_TYPES.BUSINESS_CRITICAL, secure: true, ...props });
const transactional = props => workflow({ emailType: EMAIL_TYPES.BUSINESS_TRANSACTIONAL, ...props });
const promotional = props => workflow({ emailType: EMAIL_TYPES.PROMOTIONAL, allowMarketing: true, ...props });

export const EMAIL_WORKFLOWS = Object.freeze({
  // Wix Members / identity security. Trigger contracts verified against the current SKANDI site.
  MEMBER_CREATE_PASSWORD: critical({
    category: "MEMBER_SECURITY", audiences: BOTH, template: "SECURITY",
    subject: "Welcome to SKANDI — Create Your Password",
    preheader: "Your SKANDI account is ready. Create your password to continue.",
    headline: "Create your password",
    intro: "Your SKANDI account is ready for secure password setup.",
    ctaLabel: "Create my password", ctaPlaceholder: "createSignupLink",
    triggerKey: "wix_sitemembers_app-member_activation",
    requiredPlaceholders: ["createSignupLink", "contactId"], referenceCode: "AUTH-SET-PASSWORD"
  }),
  MEMBER_APPROVED: transactional({
    category: "MEMBER_ACCOUNT", audiences: BOTH, template: "STANDARD",
    subject: "Your SKANDI account is approved",
    preheader: "Your SKANDI membership has been approved.", headline: "Your account is approved",
    intro: "Your SKANDI membership has been approved and your account is ready for the next step.",
    ctaLabel: "Open SKANDI", ctaPlaceholder: "", triggerKey: "wix_members-member_approves",
    requiredPlaceholders: ["contactId"], referenceCode: "MEMBER-APPROVED"
  }),
  MEMBER_EMAIL_CONFIRMATION: critical({
    category: "MEMBER_SECURITY", audiences: BOTH, template: "CODE",
    subject: "Confirm your SKANDI email",
    preheader: "Use your secure confirmation code to verify your email address.",
    headline: "Confirm your email address",
    intro: "Use the confirmation code below to verify the email address connected to your SKANDI account.",
    ctaLabel: "", ctaPlaceholder: "confirmEmailCode",
    triggerKey: "wix_sitemembers_app-member_email_confirmation_required",
    requiredPlaceholders: ["confirmEmailCode", "contactId"], referenceCode: "AUTH-EMAIL-CONFIRM"
  }),
  MEMBER_RESET_PASSWORD: critical({
    category: "MEMBER_SECURITY", audiences: BOTH, template: "SECURITY",
    subject: "Reset your SKANDI password",
    preheader: "Use the secure link to reset your SKANDI password.", headline: "Reset your password",
    intro: "A password reset was requested for your SKANDI account.",
    ctaLabel: "Reset my password", ctaPlaceholder: "resetPasswordLink",
    triggerKey: "wix_sitemembers_app-member_reset_password",
    requiredPlaceholders: ["resetPasswordLink", "contactId"], referenceCode: "AUTH-RESET-PASSWORD"
  }),
  MEMBER_PASSWORD_CHANGED: critical({ category: "MEMBER_SECURITY", audiences: BOTH, template: "SECURITY", subject: "Your SKANDI password was changed", preheader: "Security confirmation for your SKANDI account.", headline: "Password changed", intro: "The password for your SKANDI account was changed.", referenceCode: "AUTH-PASSWORD-CHANGED" }),
  MEMBER_ACCOUNT_SUSPENDED: critical({ category: "MEMBER_SECURITY", audiences: BOTH, template: "SECURITY", subject: "Important update to your SKANDI account", preheader: "Your SKANDI account access has changed.", headline: "Account access update", intro: "Access to your SKANDI account has been restricted. Contact Support if you need assistance.", referenceCode: "AUTH-SUSPENDED" }),
  MEMBER_ACCOUNT_RESTORED: critical({ category: "MEMBER_SECURITY", audiences: BOTH, template: "SECURITY", subject: "Your SKANDI account access is restored", preheader: "Your SKANDI account is available again.", headline: "Account access restored", intro: "Your SKANDI account access has been restored.", referenceCode: "AUTH-RESTORED" }),

  // Customer lifecycle.
  CUSTOMER_WELCOME: transactional({ category: "CUSTOMER", subject: "Welcome to SKANDI", preheader: "Your SKANDI journey starts here.", headline: "Welcome to SKANDI", intro: "Your SKANDI account is ready. Explore destinations, manage travel and discover services designed around your journey.", ctaLabel: "Explore SKANDI", allowMarketing: true, referenceCode: "CUSTOMER-WELCOME" }),
  CUSTOMER_PROFILE_UPDATED: transactional({ category: "CUSTOMER", subject: "Your SKANDI profile was updated", preheader: "Confirmation of changes to your SKANDI profile.", headline: "Profile updated", intro: "Your SKANDI profile information was updated successfully.", ctaLabel: "View profile", referenceCode: "CUSTOMER-PROFILE" }),
  CUSTOMER_DOCUMENT_EXPIRY_REMINDER: transactional({ category: "CUSTOMER", subject: "Travel document reminder", preheader: "Review your travel documents before your next journey.", headline: "Check your travel documents", intro: "One or more travel documents on your profile may require attention before upcoming travel.", ctaLabel: "Review documents", referenceCode: "CUSTOMER-DOCUMENT" }),

  // Booking, payments and documents.
  BOOKING_CREATED: transactional({ category: "BOOKING", subject: "We received your SKANDI booking", preheader: "Your booking request is being processed.", headline: "Booking received", intro: "We have received your booking and will keep you updated as it moves through confirmation.", ctaLabel: "View booking", referenceCode: "BOOKING-CREATED" }),
  BOOKING_CONFIRMED: transactional({ category: "BOOKING", subject: "Your SKANDI booking is confirmed", preheader: "Your journey is confirmed.", headline: "Your journey is confirmed", intro: "Your SKANDI booking is confirmed. The information below comes from your completed reservation. Sign in to My Profile to review the current live details and travel documents.", ctaLabel: "Manage booking", ctaPlaceholder: "manageBookingUrl", requiredPlaceholders: ["contactId", "bookingId", "bookingReference", "supplierReference", "confirmationDate", "travelerDetails", "flightDetails", "hotelDetails", "carDetails", "transferDetails", "seatDetails", "extrasDetails", "totalAmount", "paymentStatus", "manageBookingUrl"], referenceCode: "BOOKING-CONFIRMED" }),
  BOOKING_PENDING: transactional({ category: "BOOKING", subject: "Your SKANDI booking is pending", preheader: "We are finalizing part of your booking.", headline: "Booking pending", intro: "Part of your booking is still being finalized. No action is required unless stated below.", ctaLabel: "View booking", referenceCode: "BOOKING-PENDING" }),
  BOOKING_CHANGED: transactional({ category: "BOOKING", subject: "Your SKANDI booking was updated", preheader: "Important changes to your journey.", headline: "Your booking was updated", intro: "There has been a change to your SKANDI booking. Review the latest itinerary and service details.", ctaLabel: "Review changes", referenceCode: "BOOKING-CHANGED" }),
  BOOKING_CANCELLED: transactional({ category: "BOOKING", subject: "Your SKANDI booking was cancelled", preheader: "Cancellation confirmation for your booking.", headline: "Booking cancelled", intro: "Your SKANDI booking has been cancelled. Review the details below for any refund or follow-up information.", ctaLabel: "View booking", referenceCode: "BOOKING-CANCELLED" }),
  BOOKING_REFUND: transactional({ category: "PAYMENT", subject: "SKANDI refund update", preheader: "An update is available for your refund.", headline: "Refund update", intro: "A refund update is available for your SKANDI booking or purchase.", ctaLabel: "View details", referenceCode: "PAYMENT-REFUND" }),
  BOOKING_PAYMENT_RECEIPT: transactional({ category: "PAYMENT", subject: "Your SKANDI payment receipt", preheader: "Payment confirmation for your booking.", headline: "Payment received", intro: "We received your payment. Keep this email with your booking records.", ctaLabel: "View booking", referenceCode: "PAYMENT-RECEIPT" }),
  BOOKING_PAYMENT_FAILED: transactional({ category: "PAYMENT", subject: "Action required: SKANDI payment issue", preheader: "We could not complete your payment.", headline: "Payment requires attention", intro: "We could not complete a payment connected to your SKANDI booking.", ctaLabel: "Review payment", referenceCode: "PAYMENT-FAILED" }),
  BOOKING_BALANCE_DUE: transactional({ category: "PAYMENT", subject: "Your SKANDI booking balance is due", preheader: "Review and complete your remaining balance.", headline: "Balance due", intro: "A remaining balance is due for your SKANDI booking.", ctaLabel: "Review payment", referenceCode: "PAYMENT-BALANCE" }),
  BOOKING_DOCUMENTS_READY: transactional({ category: "DOCUMENTS", subject: "Your SKANDI travel documents are ready", preheader: "Your travel documents are available.", headline: "Travel documents ready", intro: "Your latest SKANDI travel documents are ready to review.", ctaLabel: "View documents", referenceCode: "DOCS-READY" }),
  BOOKING_CHECKIN_OPEN: transactional({ category: "TRAVEL", subject: "Check-in is open for your journey", preheader: "Complete check-in for your upcoming travel.", headline: "Check-in is open", intro: "Check-in is now available for part of your upcoming journey.", ctaLabel: "Check in", referenceCode: "TRAVEL-CHECKIN" }),
  BOOKING_DEPARTURE_REMINDER: transactional({ category: "TRAVEL", subject: "Your SKANDI journey is coming up", preheader: "A quick reminder before departure.", headline: "Your journey is approaching", intro: "Your departure is coming up. Review your latest itinerary, travel documents and important travel information.", ctaLabel: "Review my trip", referenceCode: "TRAVEL-DEPARTURE" }),
  BOOKING_RETURN_REMINDER: transactional({ category: "TRAVEL", subject: "Your return journey is coming up", preheader: "Review your return travel details.", headline: "Return journey reminder", intro: "Your return journey is approaching. Review the latest departure details before you travel.", ctaLabel: "Review my trip", referenceCode: "TRAVEL-RETURN" }),

  // Operational travel updates.
  FLIGHT_SCHEDULE_CHANGE: transactional({ category: "TRAVEL", audiences: BOTH, subject: "Flight schedule change", preheader: "Important timing update for your flight.", headline: "Your flight schedule changed", intro: "A flight connected to your journey has a new scheduled time.", ctaLabel: "Review flight", referenceCode: "FLIGHT-SCHEDULE" }),
  FLIGHT_DELAY: transactional({ category: "TRAVEL", audiences: BOTH, subject: "Flight delay update", preheader: "Your flight timing has changed.", headline: "Your flight is delayed", intro: "A flight connected to your journey is delayed. Review the latest operating information.", ctaLabel: "View flight status", referenceCode: "FLIGHT-DELAY" }),
  FLIGHT_CANCELLED: transactional({ category: "TRAVEL", audiences: BOTH, subject: "Important: flight cancellation", preheader: "A flight connected to your journey has been cancelled.", headline: "Flight cancelled", intro: "A flight connected to your journey has been cancelled. Review your options and current booking information.", ctaLabel: "Review options", referenceCode: "FLIGHT-CANCELLED" }),
  FLIGHT_GATE_CHANGE: transactional({ category: "TRAVEL", audiences: BOTH, subject: "Flight gate change", preheader: "Your departure gate has changed.", headline: "Gate change", intro: "The operating gate for your flight has changed.", ctaLabel: "View flight status", referenceCode: "FLIGHT-GATE" }),
  TRANSFER_UPDATE: transactional({ category: "TRAVEL", audiences: BOTH, subject: "SKANDI transfer update", preheader: "An update is available for your transfer.", headline: "Transfer update", intro: "There is an update to a transfer connected to your journey.", ctaLabel: "View transfer", referenceCode: "TRANSFER-UPDATE" }),
  HOTEL_UPDATE: transactional({ category: "TRAVEL", subject: "SKANDI hotel update", preheader: "An update is available for your accommodation.", headline: "Hotel update", intro: "There is an update to accommodation connected to your journey.", ctaLabel: "View booking", referenceCode: "HOTEL-UPDATE" }),
  CRUISE_UPDATE: transactional({ category: "TRAVEL", subject: "SKANDI cruise update", preheader: "An update is available for your cruise.", headline: "Cruise update", intro: "There is an update to a cruise connected to your journey.", ctaLabel: "View cruise", referenceCode: "CRUISE-UPDATE" }),
  TOUR_UPDATE: transactional({ category: "TRAVEL", subject: "SKANDI tour update", preheader: "An update is available for your tour or activity.", headline: "Tour update", intro: "There is an update to a tour or activity connected to your journey.", ctaLabel: "View details", referenceCode: "TOUR-UPDATE" }),
  CAR_RENTAL_UPDATE: transactional({ category: "TRAVEL", subject: "SKANDI car rental update", preheader: "An update is available for your rental car.", headline: "Car rental update", intro: "There is an update to a rental car connected to your journey.", ctaLabel: "View details", referenceCode: "CAR-UPDATE" }),
  BAGGAGE_UPDATE: transactional({ category: "TRAVEL", audiences: BOTH, subject: "Baggage update", preheader: "An update is available for your baggage case or service.", headline: "Baggage update", intro: "New information is available about your baggage service or case.", ctaLabel: "View update", referenceCode: "BAGGAGE-UPDATE" }),
  TRAVEL_REQUIREMENT_UPDATE: transactional({ category: "TRAVEL", audiences: BOTH, subject: "Travel requirement update", preheader: "Review updated travel requirements before departure.", headline: "Travel requirements changed", intro: "Travel requirements relevant to your journey have been updated.", ctaLabel: "Review travel information", referenceCode: "TRAVEL-REQUIREMENT" }),
  DESTINATION_ALERT: transactional({ category: "TRAVEL", audiences: BOTH, subject: "Important destination update", preheader: "New information may affect your destination.", headline: "Destination update", intro: "New destination information may affect your travel plans.", ctaLabel: "Review update", referenceCode: "DESTINATION-ALERT" }),

  // Customer support and cases.
  SUPPORT_CASE_CREATED: transactional({ category: "SUPPORT", audiences: BOTH, subject: "Your SKANDI support case is open", preheader: "We received your request.", headline: "Support case created", intro: "We received your request and created a SKANDI support case.", ctaLabel: "View support", referenceCode: "SUPPORT-CREATED" }),
  SUPPORT_CASE_UPDATED: transactional({ category: "SUPPORT", audiences: BOTH, subject: "Your SKANDI support case was updated", preheader: "New information is available on your case.", headline: "Support case updated", intro: "There is an update to your SKANDI support case.", ctaLabel: "View support", referenceCode: "SUPPORT-UPDATED" }),
  SUPPORT_AGENT_REPLY: transactional({ category: "SUPPORT", audiences: BOTH, subject: "New reply from SKANDI Support", preheader: "A SKANDI support agent replied to your case.", headline: "You have a new support reply", intro: "A SKANDI support agent has added a new reply to your case.", ctaLabel: "Open case", referenceCode: "SUPPORT-REPLY" }),
  SUPPORT_CASE_CLOSED: transactional({ category: "SUPPORT", audiences: BOTH, subject: "Your SKANDI support case is closed", preheader: "Your support case has been completed.", headline: "Support case closed", intro: "Your SKANDI support case has been marked complete.", ctaLabel: "View support", referenceCode: "SUPPORT-CLOSED" }),
  LOST_BAGGAGE_CASE_CREATED: transactional({ category: "SUPPORT", audiences: BOTH, subject: "Your SKANDI baggage case is open", preheader: "Your baggage report has been recorded.", headline: "Baggage case created", intro: "Your baggage report has been recorded and a case reference is available.", ctaLabel: "View case", referenceCode: "BAGGAGE-CASE" }),

  // SKANDI CLUB / marketing. These remain promotional and must never be embedded in Business Critical mail.
  CLUB_WELCOME: promotional({ category: "CLUB", subject: "Welcome to SKANDI CLUB", preheader: "Your SKANDI CLUB membership starts here.", headline: "Welcome to SKANDI CLUB", intro: "Discover member offers, travel inspiration and benefits designed around the way you travel.", ctaLabel: "Explore SKANDI CLUB", referenceCode: "CLUB-WELCOME" }),
  CLUB_TIER_CHANGED: transactional({ category: "CLUB", subject: "Your SKANDI CLUB tier changed", preheader: "Your membership status has been updated.", headline: "Membership tier update", intro: "Your SKANDI CLUB membership tier has changed.", ctaLabel: "View membership", referenceCode: "CLUB-TIER" }),
  CLUB_POINTS_UPDATE: transactional({ category: "CLUB", subject: "SKANDI CLUB points update", preheader: "Your points balance has changed.", headline: "Points update", intro: "Your SKANDI CLUB points balance has been updated.", ctaLabel: "View membership", referenceCode: "CLUB-POINTS" }),
  CLUB_OFFER: promotional({ category: "CLUB", subject: "A SKANDI CLUB offer for you", preheader: "Discover your latest member offer.", headline: "Your member offer", intro: "A new SKANDI CLUB offer is available for eligible members.", ctaLabel: "View offer", referenceCode: "CLUB-OFFER" }),
  CLUB_ANNIVERSARY: promotional({ category: "CLUB", subject: "Happy SKANDI CLUB anniversary", preheader: "Thank you for traveling with SKANDI.", headline: "Another year with SKANDI CLUB", intro: "Thank you for being part of SKANDI CLUB.", ctaLabel: "Explore SKANDI", referenceCode: "CLUB-ANNIVERSARY" }),

  // Store and gift cards.
  STORE_ORDER_CONFIRMATION: transactional({ category: "STORE", subject: "Your SKANDI order is confirmed", preheader: "We received your order.", headline: "Order confirmed", intro: "Your SKANDI Store order is confirmed.", ctaLabel: "View order", referenceCode: "STORE-ORDER" }),
  STORE_ORDER_UPDATED: transactional({ category: "STORE", subject: "Your SKANDI order was updated", preheader: "New information is available for your order.", headline: "Order update", intro: "There is an update to your SKANDI Store order.", ctaLabel: "View order", referenceCode: "STORE-UPDATE" }),
  STORE_SHIPPING: transactional({ category: "STORE", subject: "Your SKANDI order has shipped", preheader: "Tracking information is available.", headline: "Your order is on the way", intro: "Your SKANDI Store order has shipped.", ctaLabel: "Track order", referenceCode: "STORE-SHIPPING" }),
  STORE_REFUND: transactional({ category: "STORE", subject: "SKANDI Store refund update", preheader: "A refund update is available for your order.", headline: "Refund update", intro: "A refund update is available for your SKANDI Store order.", ctaLabel: "View order", referenceCode: "STORE-REFUND" }),
  GIFT_CARD_DELIVERY: transactional({ category: "STORE", subject: "Your SKANDI gift card is ready", preheader: "Your SKANDI gift card has arrived.", headline: "Your gift card is ready", intro: "Your SKANDI gift card is ready to use.", ctaLabel: "View gift card", referenceCode: "GIFT-CARD" }),

  // Recruitment.
  RECRUITING_APPLICATION_RECEIVED: transactional({ category: "RECRUITING", subject: "We received your SKANDI application", preheader: "Thank you for your interest in joining SKANDI.", headline: "Application received", intro: "Thank you for your interest in joining SKANDI. Your application has been received.", ctaLabel: "View careers", referenceCode: "CAREERS-APPLICATION" }),
  RECRUITING_INTERVIEW: transactional({ category: "RECRUITING", subject: "Your SKANDI interview", preheader: "Interview information from the SKANDI recruitment team.", headline: "Interview details", intro: "Your SKANDI recruitment process has moved to the interview stage.", ctaLabel: "View details", referenceCode: "CAREERS-INTERVIEW" }),
  RECRUITING_OFFER: transactional({ category: "RECRUITING", subject: "Your SKANDI employment offer", preheader: "An employment offer from SKANDI is ready for you.", headline: "Welcome to the next step", intro: "We are pleased to share your SKANDI employment offer and next steps.", ctaLabel: "Review offer", referenceCode: "CAREERS-OFFER" }),
  RECRUITING_REJECTION: transactional({ category: "RECRUITING", subject: "An update from SKANDI Careers", preheader: "An update regarding your application.", headline: "Application update", intro: "Thank you for the time and interest you invested in the SKANDI recruitment process.", ctaLabel: "Explore careers", referenceCode: "CAREERS-UPDATE" }),

  // Employee lifecycle / operations. Authorization is never granted by email routing or delivery.
  EMPLOYEE_WELCOME: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "Welcome to SKANDI", preheader: "Your SKANDI employee onboarding starts here.", headline: "Welcome to SKANDI", intro: "We’re pleased to welcome you to the team. Your employee onboarding is ready to continue.", ctaLabel: "Open RIAINTRA", referenceCode: "EMPLOYEE-WELCOME" }),
  EMPLOYEE_ONBOARDING_TASK: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "New SKANDI onboarding task", preheader: "A new onboarding task is assigned to you.", headline: "Onboarding task assigned", intro: "A new task has been assigned to your SKANDI employee profile.", ctaLabel: "Open RIAINTRA", referenceCode: "EMPLOYEE-ONBOARDING" }),
  EMPLOYEE_ACCESS_ENABLED: critical({ category: "EMPLOYEE_SECURITY", audiences: [E], template: "EMPLOYEE", subject: "Your SKANDI employee access is enabled", preheader: "Your approved RIAINTRA access is now available.", headline: "Employee access enabled", intro: "Your approved SKANDI employee access is now available. Access remains controlled by your active employee record and assigned permissions.", ctaLabel: "Open RIAINTRA", referenceCode: "EMPLOYEE-ACCESS" }),
  EMPLOYEE_ACCESS_SUSPENDED: critical({ category: "EMPLOYEE_SECURITY", audiences: [E], template: "EMPLOYEE", subject: "Important SKANDI access update", preheader: "Your employee system access has changed.", headline: "Employee access update", intro: "Your SKANDI internal access has changed. Contact your manager or support if you believe this is unexpected.", referenceCode: "EMPLOYEE-SUSPEND" }),
  EMPLOYEE_ROSTER_PUBLISHED: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "Your SKANDI roster is published", preheader: "A new roster period is available.", headline: "Roster published", intro: "A new roster period is available in your SKANDI employee workspace.", ctaLabel: "View roster", referenceCode: "EMPLOYEE-ROSTER" }),
  EMPLOYEE_ROSTER_CHANGED: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "Your SKANDI roster changed", preheader: "Review an update to your roster.", headline: "Roster update", intro: "There has been a change to your published SKANDI roster.", ctaLabel: "Review roster", referenceCode: "EMPLOYEE-ROSTER-CHANGE" }),
  EMPLOYEE_TRIP_TRADE: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "SKANDI TripTrade update", preheader: "An update is available for your TripTrade request.", headline: "TripTrade update", intro: "There is an update to your SKANDI TripTrade request.", ctaLabel: "Open MyRoster", referenceCode: "EMPLOYEE-TRIPTRADE" }),
  EMPLOYEE_PAYSLIP_AVAILABLE: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "Your SKANDI payslip is available", preheader: "A new payslip is ready to view.", headline: "Payslip available", intro: "A new payslip is available in your approved payroll workspace.", ctaLabel: "Open payroll", referenceCode: "EMPLOYEE-PAYSLIP" }),
  EMPLOYEE_POLICY_ACK_REQUIRED: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "SKANDI policy acknowledgement required", preheader: "Review and acknowledge an assigned policy.", headline: "Policy acknowledgement required", intro: "A SKANDI policy requires your review and acknowledgement.", ctaLabel: "Review policy", referenceCode: "EMPLOYEE-POLICY" }),
  EMPLOYEE_TRAINING_ASSIGNED: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "New SKANDI training assigned", preheader: "A training module has been assigned to you.", headline: "Training assigned", intro: "A new SKANDI training module has been assigned to your employee profile.", ctaLabel: "Open training", referenceCode: "EMPLOYEE-TRAINING" }),
  EMPLOYEE_TRAINING_COMPLETED: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "SKANDI training completed", preheader: "Your training completion was recorded.", headline: "Training completed", intro: "Your SKANDI training completion has been recorded.", ctaLabel: "Open training", referenceCode: "EMPLOYEE-TRAINING-DONE" }),
  EMPLOYEE_UNIFORM_ORDER: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "SKANDI Uniform Center update", preheader: "An update is available for your uniform request.", headline: "Uniform update", intro: "There is an update to your SKANDI Uniform Center request.", ctaLabel: "Open Uniform Center", referenceCode: "EMPLOYEE-UNIFORM" }),
  EMPLOYEE_HELPDESK_UPDATE: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "SKANDI Helpdesk update", preheader: "There is an update to your internal support request.", headline: "Helpdesk update", intro: "There is an update to your SKANDI internal support request.", ctaLabel: "Open Helpdesk", referenceCode: "EMPLOYEE-HELPDESK" }),
  EMPLOYEE_DOCUMENT_READY: transactional({ category: "EMPLOYEE", audiences: [E], template: "EMPLOYEE", subject: "A SKANDI employee document is ready", preheader: "A document is available in your employee workspace.", headline: "Employee document ready", intro: "A document is available for you in your approved SKANDI employee workspace.", ctaLabel: "Open RIAINTRA", referenceCode: "EMPLOYEE-DOCUMENT" }),

  // Generic extensibility for future workflows. Production use still requires a verified trigger schema and action type.
  GENERIC_CUSTOMER_TRANSACTIONAL: transactional({ category: "GENERIC", subject: "An update from SKANDI", preheader: "New information is available for your SKANDI account.", headline: "SKANDI update", intro: "New information is available for your SKANDI account or journey.", ctaLabel: "View details", referenceCode: "GENERIC-CUSTOMER" }),
  GENERIC_EMPLOYEE_TRANSACTIONAL: transactional({ category: "GENERIC", audiences: [E], template: "EMPLOYEE", subject: "SKANDI employee update", preheader: "New information is available in your employee workspace.", headline: "Employee update", intro: "New information is available in your SKANDI employee workspace.", ctaLabel: "Open RIAINTRA", referenceCode: "GENERIC-EMPLOYEE" }),
  GENERIC_CUSTOMER_PROMOTIONAL: promotional({ category: "GENERIC", subject: "Discover more with SKANDI", preheader: "Travel inspiration, offers and updates from SKANDI.", headline: "Discover more with SKANDI", intro: "Explore the latest SKANDI destinations, offers and travel inspiration.", ctaLabel: "Explore SKANDI", referenceCode: "GENERIC-PROMO" })
});

export const COMMON_DYNAMIC_VARIABLE_KEYS = Object.freeze([
  "contactId", "memberId", "firstName", "lastName", "fullName", "email", "company", "skId", "jobTitle", "department", "baseCode",
  "createSignupLink", "confirmEmailCode", "resetPasswordLink",
  "bookingId", "bookingReference", "orderId", "currency", "amount", "balanceDue", "paymentReference",
  "departureDate", "returnDate", "origin", "destination", "flightNumber", "airline", "hotelName", "cruiseName", "transferReference", "carRentalReference",
  "checkinUrl", "manageBookingUrl", "documentCenterUrl",
  "caseId", "caseReference", "caseStatus", "caseSubject", "supportMessage",
  "clubTier", "clubPoints", "clubPointsChange", "clubOfferTitle", "clubOfferUrl",
  "employeeName", "managerName", "taskName", "taskDueDate", "rosterPeriod", "shiftDate", "payslipPeriod", "policyTitle", "trainingTitle", "documentTitle", "helpdeskReference",
  "storeOrderNumber", "shippingStatus", "trackingUrl", "giftCardCode",
  "primaryActionUrl", "primaryActionLabel", "secondaryActionUrl", "secondaryActionLabel", "message", "emailReferenceId"
]);
