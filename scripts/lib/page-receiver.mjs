import fs from 'node:fs/promises';
import path from 'node:path';

export const RECEIVER_TEMPLATE = 'skandi-embeds/receiver/skandi-wix-universal-receiver.html';

export function pageReceiverPath(page) {
  return path.posix.join(page.sourceDirectory, `${page.stem}.receiver.html`);
}

function safeJSON(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => ({
    '<': '\\u003c',
    '>': '\\u003e',
    '&': '\\u0026',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
  })[character]);
}

const PAGE_COPY_CONFIG = Object.freeze({
  "home": {
    "title": "Home",
    "eyebrow": "PLAN YOUR NEXT ESCAPE",
    "heading": "Find your next getaway",
    "description": "Search flights and explore trip inspiration to start planning your SKANDI journey.",
    "foot": "Preparing flight search and getaway ideas",
    "subject": "flight search and getaway ideas"
  },
  "search": {
    "title": "Flight Search",
    "eyebrow": "SEARCH FLIGHTS",
    "heading": "Find the right flight",
    "description": "Compare available routes and review the latest flight offers for your trip.",
    "foot": "Preparing your flight results",
    "subject": "flight search results and offers"
  },
  "carRental": {
    "title": "Car Rental",
    "eyebrow": "TRAVEL YOUR WAY",
    "heading": "Find a car for the trip",
    "description": "Check available rental cars and compare the options for your journey.",
    "foot": "Preparing car rental availability",
    "subject": "rental car availability and booking options"
  },
  "tours": {
    "title": "Tours & Activities",
    "eyebrow": "MAKE MORE OF YOUR TRIP",
    "heading": "Find your next experience",
    "description": "Explore tours, activities and experiences for the places you plan to visit.",
    "foot": "Preparing tours and activities",
    "subject": "tours, activities, and experience search"
  },
  "destinations": {
    "title": "Our Destinations",
    "eyebrow": "EXPLORE WITH SKANDI",
    "heading": "Explore the SKANDI network",
    "description": "Browse destinations, routes and travel inspiration to plan where to go next.",
    "foot": "Preparing destination and network information",
    "subject": "destination and route discovery"
  },
  "travelInfo": {
    "title": "Travel Information",
    "eyebrow": "TRAVEL WITH CONFIDENCE",
    "heading": "Get ready for your journey",
    "description": "Find practical details that help you prepare before and during your trip.",
    "foot": "Preparing travel information",
    "subject": "trip guidance and travel information"
  },
  "skandiCollection": {
    "title": "SKANDI Collection",
    "eyebrow": "STAYS WITH A STORY",
    "heading": "Find a stay worth remembering",
    "description": "Explore curated hotels, resorts and signature travel experiences.",
    "foot": "Preparing curated stays",
    "subject": "SKANDI Collection hotel and resort discovery"
  },
  "club": {
    "title": "SKANDI Club",
    "eyebrow": "THE JOURNEY HAS ITS REWARDS",
    "heading": "Make more of every journey",
    "description": "Explore SKANDI Club benefits, membership and ways to use your points.",
    "foot": "Preparing your SKANDI Club benefits",
    "subject": "SKANDI Club membership and benefits"
  },
  "clubLogin": {
    "title": "SKANDI Club Login",
    "eyebrow": "WELCOME BACK",
    "heading": "Sign in to SKANDI Club",
    "description": "Continue to your member account and travel benefits.",
    "foot": "Opening the secure member sign-in",
    "subject": "SKANDI Club member sign-in"
  },
  "forgotPassword": {
    "title": "Reset your Password",
    "eyebrow": "ACCOUNT HELP",
    "heading": "Reset your password",
    "description": "We’ll connect you to the secure account recovery flow.",
    "foot": "Preparing secure password recovery",
    "subject": "secure account password recovery"
  },
  "about": {
    "title": "About SKANDI",
    "eyebrow": "OUR STORY",
    "heading": "Travel with a story",
    "description": "Learn about SKANDI Travels, our team and the experiences we create.",
    "foot": "Preparing the SKANDI story",
    "subject": "SKANDI company information and story"
  },
  "newsroom": {
    "title": "SKANDI Newsroom",
    "eyebrow": "NEWS & STORIES",
    "heading": "The latest from SKANDI",
    "description": "Browse company news, travel stories and announcements.",
    "foot": "Preparing SKANDI newsroom updates",
    "subject": "SKANDI news and stories"
  },
  "theStore": {
    "title": "The Store",
    "eyebrow": "THE SKANDI STORE",
    "heading": "Find something for the journey",
    "description": "Browse travel products, SKANDI gifts and gift cards in one store.",
    "foot": "Preparing the product catalog",
    "subject": "store products and gift cards"
  },
  "storeCheckout": {
    "title": "Store Checkout",
    "eyebrow": "SECURE CHECKOUT",
    "heading": "Complete your order",
    "description": "Review your items, delivery details and payment before placing an order.",
    "foot": "Preparing your store checkout",
    "subject": "cart, delivery, and payment details"
  },
  "storeConfirmation": {
    "title": "Order Confirmation",
    "eyebrow": "ORDER DETAILS",
    "heading": "Check your order confirmation",
    "description": "We’re retrieving the latest details for your completed store order.",
    "foot": "Preparing your order details",
    "subject": "store order confirmation and receipt"
  },
  "legal": {
    "title": "Legal Information",
    "eyebrow": "POLICIES & NOTICES",
    "heading": "Important travel information",
    "description": "Review legal notices and customer information for SKANDI Travels.",
    "foot": "Preparing legal information",
    "subject": "SKANDI legal information and notices"
  },
  "policies": {
    "title": "Travel Policies",
    "eyebrow": "TRAVEL POLICIES",
    "heading": "Review the policies for your trip",
    "description": "Access current customer policies and any required acknowledgements.",
    "foot": "Preparing your policy documents",
    "subject": "customer travel policies and acknowledgements"
  },
  "legalInternal": {
    "title": "RIAINTRA Legal",
    "eyebrow": "INTERNAL POLICY LIBRARY",
    "heading": "Find the right staff policy",
    "description": "Access published SKANDI and ALTEA policies for authorized employees.",
    "foot": "Preparing the internal policy library",
    "subject": "employee policy library"
  },
  "alteaLaunchpad": {
    "title": "ALTEA Launchpad",
    "eyebrow": "ALTEA OPERATIONS",
    "heading": "Your operations workspace",
    "description": "Open the ALTEA tools and operating resources available to your role.",
    "foot": "Preparing your ALTEA operations workspace",
    "subject": "ALTEA operational tools and resources"
  },
  "alteaReservations": {
    "title": "ALTEA Reservations",
    "eyebrow": "RESERVATION OPERATIONS",
    "heading": "Manage passenger reservations",
    "description": "Search and review live reservations, then continue with permitted booking changes and services.",
    "foot": "Preparing reservation search and management",
    "subject": "ALTEA reservation search and passenger booking management"
  },
  "opsControl": {
    "title": "OPS Control",
    "eyebrow": "ALTEA OPERATIONS",
    "heading": "Keep operations in view",
    "description": "Review operational activity, exception queues and work requiring attention.",
    "foot": "Preparing the operations control workspace",
    "subject": "OPS Control operational monitoring and review"
  },
  "uniformCenter": {
    "title": "Uniform Center",
    "eyebrow": "RIAINTRA STAFF SERVICES",
    "heading": "Order your SKANDI uniform",
    "description": "Browse the staff uniform catalog and manage uniform requests.",
    "foot": "Preparing the uniform catalog",
    "subject": "staff uniform catalog and requests"
  },
  "mail": {
    "title": "RIAINTRA Mail",
    "eyebrow": "STAFF COMMUNICATIONS",
    "heading": "Open your work inbox",
    "description": "Access your staff messages and shared communication tools.",
    "foot": "Preparing staff mail",
    "subject": "RIAINTRA staff email and messages"
  },
  "docunet": {
    "title": "DocuNet",
    "eyebrow": "CONTROLLED DOCUMENTS",
    "heading": "Find your operational documents",
    "description": "Open current controlled documents, guides and policy references.",
    "foot": "Preparing the DocuNet library",
    "subject": "controlled travel documents and reference library"
  },
  "policyControl": {
    "title": "Policy Control",
    "eyebrow": "POLICY ADMINISTRATION",
    "heading": "Manage published policies",
    "description": "Review, edit and prepare controlled policy content for staff.",
    "foot": "Preparing the policy management workspace",
    "subject": "staff policy editing and publication"
  },
  "mediaControl": {
    "title": "Media Control",
    "eyebrow": "WEBSITE CONTENT MANAGEMENT",
    "heading": "Manage SKANDI page content",
    "description": "Open the page editor for website text, images, cards and presentation settings.",
    "foot": "Preparing Media Control",
    "subject": "website text, images, cards, and layout controls"
  },
  "storeControl": {
    "title": "Store Control",
    "eyebrow": "STORE ADMINISTRATION",
    "heading": "Manage The Store",
    "description": "Review products, gift cards, orders and store settings.",
    "foot": "Preparing Store Control",
    "subject": "store products, gift cards, and administration"
  },
  "payroll": {
    "title": "Payroll",
    "eyebrow": "RIAINTRA STAFF SERVICES",
    "heading": "Open payroll workspace",
    "description": "Access the payroll information and employee tools assigned to your account.",
    "foot": "Preparing payroll workspace",
    "subject": "employee payroll workspace"
  },
  "country": {
    "title": "Destinations",
    "eyebrow": "EXPLORE WITH SKANDI",
    "heading": "Setting the compass",
    "description": "Uncovering handpicked resorts, local highlights, and sunny holiday packages for your destination.",
    "foot": "Preparing your destination guide",
    "subject": "country guides, resort highlights, and holiday packages"
  },
  "bookingFlow": {
    "title": "SKANDI Booking",
    "eyebrow": "YOUR JOURNEY STARTS HERE",
    "heading": "Plan your journey, step by step",
    "description": "Search flights, review offers, add trip details and complete your booking in one place.",
    "foot": "Preparing the complete booking journey",
    "subject": "booking search, offers, passenger details, and checkout"
  },
  "myProfile": {
    "title": "My Profile",
    "eyebrow": "YOUR SKANDI CLUB",
    "heading": "Your account, in one place",
    "description": "View your member profile, points, upcoming trips, documents and account settings.",
    "foot": "Preparing your SKANDI Club profile",
    "subject": "member profile, points, and upcoming trips"
  },
  "groupTalk": {
    "title": "ALTEA GroupTalk",
    "eyebrow": "ALTEA CREW COMMUNICATIONS",
    "heading": "Stay in sync with your crew",
    "description": "Open real-time crew communication for operational groups and teams.",
    "foot": "Connecting to ALTEA GroupTalk",
    "subject": "real-time crew communication"
  },
  "passportVisa": {
    "title": "Passport & Visa",
    "eyebrow": "BEFORE YOU TRAVEL",
    "heading": "Get ready for every border",
    "description": "Check passport, visa and entry requirements that may apply to your journey.",
    "foot": "Preparing travel document guidance",
    "subject": "passport, visa, and entry requirement guidance"
  },
  "baggageAllowance": {
    "title": "Baggage Allowance",
    "eyebrow": "PACK FOR YOUR TRIP",
    "heading": "Know what you can bring",
    "description": "Review baggage rules and allowances before you pack.",
    "foot": "Preparing baggage allowance information",
    "subject": "baggage rules and allowances"
  },
  "travelInsurance": {
    "title": "Travel Insurance",
    "eyebrow": "TRAVEL WITH PEACE OF MIND",
    "heading": "Protect the unexpected",
    "description": "Review travel insurance information and options for your trip.",
    "foot": "Preparing travel insurance information",
    "subject": "travel insurance information and options"
  },
  "flightStatus": {
    "title": "Flight Status",
    "eyebrow": "FLIGHT INFORMATION",
    "heading": "Check the latest flight details",
    "description": "Look up current flight status and airport information for your journey.",
    "foot": "Preparing flight status data",
    "subject": "flight status and airport information"
  },
  "cookiePreferences": {
    "title": "Cookie Preferences",
    "eyebrow": "YOUR PRIVACY",
    "heading": "Choose your cookie preferences",
    "description": "Review and manage your optional cookie and privacy settings.",
    "foot": "Preparing your privacy preferences",
    "subject": "cookie consent and privacy preferences"
  },
  "eos": {
    "title": "EOS Mobile Operations",
    "eyebrow": "ALTEA MOBILE OPERATIONS",
    "heading": "Your mobile operations workspace",
    "description": "Open ALTEA EOS on a supported phone or tablet to access staff operations tools.",
    "foot": "Preparing EOS for mobile or tablet",
    "subject": "mobile staff operations"
  },
  "myRoster": {
    "title": "ALTEA MyRoster",
    "eyebrow": "CREW SCHEDULING",
    "heading": "Your roster and flight tools",
    "description": "Review crew schedules and search for flights, including when you are not scheduled.",
    "foot": "Preparing your roster and flight search",
    "subject": "crew roster and flight search"
  },
  "specialAssistance": {
    "title": "Special Assistance",
    "eyebrow": "SUPPORT FOR YOUR JOURNEY",
    "heading": "Travel with the support you need",
    "description": "Explore available assistance and prepare a request for your travel needs.",
    "foot": "Preparing special assistance information",
    "subject": "special assistance options and travel support"
  },
  "riaintra": {
    "title": "RIAINTRA Staff Login",
    "eyebrow": "EMPLOYEE ACCESS",
    "heading": "Sign in to RIAINTRA",
    "description": "Use your staff account to access SKANDI internal systems.",
    "foot": "Preparing the employee login",
    "subject": "secure staff sign-in"
  },
  "successFactors": {
    "title": "Success Factors",
    "eyebrow": "RIAINTRA STAFF WORKSPACE",
    "heading": "Open your staff workspace",
    "description": "Access internal staff services and HR tools available to your account.",
    "foot": "Preparing employee services",
    "subject": "employee services and HR workspace"
  }
});

function escapeHTML(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function pageCopy(page) {
  const configured = PAGE_COPY_CONFIG[page.key] || {};
  const title = String(configured.title || page.title || page.key || 'SKANDI page');
  const eyebrow = String(configured.eyebrow || (page.family === 'altea' ? 'ALTEA OPERATIONS' : page.family === 'riaintra' ? 'RIAINTRA STAFF SERVICES' : 'SKANDI TRAVELS'));
  const heading = String(configured.heading || ('Preparing ' + title));
  const description = String(configured.description || ('Connecting to the page content and functions for ' + title + '.'));
  const foot = String(configured.foot || ('Preparing ' + title));
  const subject = String(configured.subject || (title + ' page content and functions'));
  const family = page.family;
  const titlePrefix = family === 'public' ? 'SKANDI Travels' : family === 'altea' ? 'ALTEA' : 'RIAINTRA';
  const support = family === 'public' ? 'SKANDI Support' : family === 'altea' ? 'ALTEA Operations Support' : 'RIAINTRA Support';
  const staffLabel = family === 'altea' ? 'ALTEA staff' : family === 'riaintra' ? 'RIAINTRA staff' : 'SKANDI staff';
  return {
    title, titlePrefix, eyebrow, heading, description, foot, subject,
    stages: {
      connection: { heading: 'Opening ' + title, description: 'Connecting to ' + title + ' and preparing ' + subject + '.', detail: 'Connecting to ' + title },
      catalog: { heading: 'Checking ' + title, description: 'Checking the route and published content for ' + subject + '.', detail: 'Checking ' + subject },
      content: { heading: 'Preparing ' + title, description: 'Loading the page content for ' + subject + '.', detail: 'Loading ' + subject },
      final: { heading: 'Almost ready', description: 'Finishing setup for ' + title + '.', detail: 'Opening ' + title }
    },
    failure: {
      title: title + ' is taking a little longer',
      copy: "We couldn't open " + subject + ' right now.',
      foot: 'Try again to reload ' + subject + '. If the issue continues, contact ' + support + '.'
    },
    errors: {
      generic: "We couldn't load " + subject + ' right now.',
      http: "We couldn't reach " + subject + ' (Status ',
      manifestInvalid: 'Published details for ' + subject + ' are being refreshed. Please try again shortly.',
      notFound: "We couldn't find this page in the published catalog for " + subject + '.',
      stale: 'Published ' + subject + " isn't ready yet. Please try again shortly.",
      routeUpdated: 'The page link for ' + title + ' has changed. Refresh to get the latest link.',
      locate: "We couldn't locate the published " + subject + ' page.',
      access: 'Sign in with an authorized ' + staffLabel + ' account to access ' + subject + '.',
      updatePending: 'The ' + subject + ' page update is still finishing. Please refresh shortly.',
      checksum: 'A new ' + subject + ' version is going live now. Please refresh in a few seconds.',
      markup: 'The ' + subject + ' page did not pass its final setup check. Try again shortly.',
      handshake: title + " didn't finish connecting to the page controller. Please try again shortly.",
      invalidIdentity: "We couldn't verify the " + title + ' page route. Refresh and try again.',
      wrongEmbed: 'The ' + title + ' embed is connected to another page. Refresh and try again.',
      timeout: 'The ' + title + ' page could not load because its Wix startup handshake did not complete. Try again later or contact ' + support + '.',
      unavailable: 'The ' + subject + ' page is temporarily unavailable. Please try again in a moment.'
    }
  };
}

function replaceElementText(html, tag, id, value) {
  const pattern = new RegExp('(<' + tag + '\\b[^>]*\\bid="' + id + '"[^>]*>)[\\s\\S]*?(</' + tag + '>)', 'i');
  const match = html.match(pattern);
  if (!match) throw new Error('Universal receiver is missing loader element #' + id + '.');
  return html.replace(pattern, match[1] + escapeHTML(value) + match[2]);
}

function replacePageCopy(html, copy) {
  const titlePattern = /<title>[\s\S]*?<\/title>/i;
  if (!titlePattern.test(html)) throw new Error('Universal receiver is missing its document title.');
  html = html.replace(titlePattern, '<title>' + escapeHTML(copy.titlePrefix + ' | ' + copy.title) + '</title>');
  html = replaceElementText(html, 'p', 'skandi-loader-eyebrow', copy.eyebrow);
  html = replaceElementText(html, 'h1', 'skandi-loader-title', copy.heading);
  html = replaceElementText(html, 'p', 'skandi-loader-copy', copy.description);
  return replaceElementText(html, 'p', 'skandi-loader-foot', copy.foot);
}

export async function renderPageReceiver(root, page) {
  const expected = {
    key: page.key,
    route: page.route,
    family: page.family,
    chrome: page.chrome,
    embedIds: Array.isArray(page.embedIds) ? page.embedIds.map(id => String(id).trim()) : [],
    receiver: pageReceiverPath(page)
  };
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(expected.key)
    || typeof expected.route !== 'string'
    || !['public', 'riaintra', 'altea'].includes(expected.family)
    || !['none', 'public', 'riaintra', 'altea'].includes(expected.chrome)
    || !/^(?:skandi-embeds|riaintra-embeds)\/[a-z0-9/-]+\/[a-z0-9-]+\.receiver\.html$/.test(expected.receiver)
    || expected.receiver.includes('..')) {
    throw new Error('Cannot generate a page receiver for invalid route metadata: ' + (page.key || 'unknown'));
  }
  const templatePath = path.join(root, RECEIVER_TEMPLATE);
  let template = await fs.readFile(templatePath, 'utf8');
  const expectedMarker = 'const EXPECTED=null;';
  if (template.split(expectedMarker).length !== 2) throw new Error(RECEIVER_TEMPLATE + ': expected exactly one page receiver marker.');
  const copyPrefix = '  const PAGE_COPY = Object.freeze(';
  if (template.split(copyPrefix).length !== 2) throw new Error(RECEIVER_TEMPLATE + ': expected exactly one page copy marker.');
  template = template.replace(expectedMarker, 'const EXPECTED=Object.freeze(' + safeJSON(expected) + ');');
  const lineStart = template.indexOf(copyPrefix);
  const lineEnd = template.indexOf('\n', lineStart);
  if (lineStart < 0 || lineEnd < 0) throw new Error(RECEIVER_TEMPLATE + ': page copy marker must occupy one source line.');
  const copy = pageCopy(page);
  template = template.slice(0, lineStart) + copyPrefix + safeJSON(copy) + ');' + template.slice(lineEnd);
  return replacePageCopy(template, copy);
}
