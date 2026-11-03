
(function(){
"use strict";
const SOURCE="SKANDI_MEDIA_CONTROL";
const PARENT="SKANDI_WIX_PARENT";
const STORAGE_KEY="SKANDI_MM_VOY_MAGAZINE_STUDIO_V2";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));
const logoAssetValue=value=>{const source=String(value||"").trim();return source==="[LEAVE_PLACEHOLDER]"?"":source};
const arr=v=>Array.isArray(v)?v:String(v||"").split(",").map(x=>x.trim()).filter(Boolean);
const uid=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
function today(){return new Date().toISOString().slice(0,10)}
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}
const LIVE_REFRESH_MS=300000;
const EXPECTED_COLLECTIONS=["VoyIssues","VoyPages","VoyArticles","VoyAssets","VoyCampaigns","VoyApprovals","VoyCategories","VoyBanners","VoyTravelCards","VoyBrandKits","VoyQualityReports","VoyDistributionKits","VoyPrintPackages","VoyApiAttributions"];
let lastLiveRefreshAt=0;
function requestLiveRefresh(reason="manual"){
  lastLiveRefreshAt=Date.now();
  post("VOY_ADMIN_BOOTSTRAP",{reason,requestedAt:new Date().toISOString(),activePanel:state?.activePanel||"",expectedCollections:EXPECTED_COLLECTIONS});
}
function refreshAfterSave(reason="save"){
  window.setTimeout(()=>requestLiveRefresh(reason),900);
  window.setTimeout(()=>requestLiveRefresh(reason+"-confirm"),2600);
}
function toast(msg,mode=""){const el=$("toast");el.textContent=msg;el.style.background=mode==="bad"?"#b91c1c":mode==="ok"?"#15803d":"#020617";el.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display="none",2600)}
function status(msg,mode=""){const el=$("statusLine");el.textContent=msg||"";el.style.display=msg?"block":"none";el.style.borderLeftColor=mode==="bad"?"#b91c1c":mode==="ok"?"#15803d":mode==="warn"?"#b45309":"#022e64"}
function loadLocal(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}catch(e){return {}}}
function saveLocal(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(_error){/* Wix iframe storage can be restricted. Canonical server remains the persistence authority. */}}
const baseState={
  session:{}, activeModule:"management", activePanel:"dashboard", selectedIssueId:"", selectedPageId:"", selectedArticleId:"",
  issues:[], pages:[], articles:[], categories:[], banners:[], travelCards:[], assets:[], assetResults:[],
  campaigns:[], approvals:[], connectors:{}, destinationResearch:null, seoResult:null, apiStatus:[],
  newsroomPosts:[], newsroomCategories:[], newsroomMedia:[], pressContacts:[], editingPostId:"", editingContactId:"",
  brandKit:{name:"SKANDI VOY",tone:"Premium, warm, practical and commercially sharp",fonts:"Montserrat / Tahoma",colors:"#022e64, #0b3a7a, #5FC7CF, #ffffff",requiredWords:"SKANDI Travels, curated, destination, experience",blockedWords:"cheap, guaranteed, best in the world",defaultCta:"Explore destination"},
  qualityResult:null, brandGuardResult:null, printQa:null, distributionKit:null, distributionKits:[],
  catalog:[], editorialSelection:{planPageKey:"",copyPageKey:"",copySectionId:"",copyFieldId:"",mediaPageKey:"",mediaSectionId:"",mediaSlotId:"",releasePageKey:""},
  editingCategoryId:"", editingBannerId:"", editingCardId:"", editingIssueId:"", editingWebContentId:"", editingWebMediaId:"", editingWebPlanId:""
};
let state={...baseState,...loadLocal()};
const modules=[
  {id:"website",title:"Website",panels:["websiteeditor","siteplan","webcontent","webmedia","assets","pressreleases"]},
  {id:"management",title:"Management",panels:["dashboard","issues","workflow"]},
  {id:"contacts",title:"Contacts",panels:["presscontacts","articles"]},
  {id:"reports",title:"Reports",panels:["quality","printqa","distribution"]},
  {id:"marketing",title:"Marketing",panels:["pressreleases","campaign","banners","travelcards"]},
  {id:"circulation",title:"Circulation",panels:["distribution","issues"]},
  {id:"production",title:"Production",panels:["builder","articles","assets","printqa"]},
  {id:"tools",title:"Tools",panels:["research","quality","brandkit","api"]},
  {id:"nonadmin",title:"NonAdmin Setup",panels:["categories","brandkit"]},
  {id:"chargebrite",title:"ChargeBrite",panels:["campaign","banners"]},
  {id:"governance",title:"Governance",panels:["presentationmatrix","contentaudit","releasecenter","quality","brandkit"]},
  {id:"communications",title:"Communications",panels:["emailstudio"]}
];
const panels=[
  ["websiteeditor","Visual Website Editor","EDIT"],["dashboard","Studio Desk","F1"],["issues","Issues","F2"],["builder","Magazine Builder","F3"],["articles","Articles","F4"],["assets","Assets / Media","F5"],
  ["research","Destination Research","F6"],["campaign","Campaigns","F7"],["quality","Quality Lab","QA"],["brandkit","Brand Kit","BK"],["printqa","Print QA","PQ"],["distribution","Distribution","DS"],["workflow","Workflow","F8"],["categories","Categories","F9"],["banners","Banners","F10"],["travelcards","Travel Cards","F11"],["api","API Connectors","F12"],
  ["pressreleases","Press Releases","PR"],["presscontacts","Press Contacts","PC"],["siteplan","Website Planner","WEB"],["webcontent","Page Copy","TXT"],["webmedia","Hero / Card Media","IMG"],
  ["presentationmatrix","Presentation Matrix","PM"],["contentaudit","Content Audit","CA"],["releasecenter","Release Center","RC"],["emailstudio","Email Template Studio","EM"]
];
const templates=[
  {id:"cover",title:"VOY Cover",sub:"Masthead, lead stories and cover image",cls:"cover"},
  {id:"contents",title:"Contents",sub:"Issue sections, editor note and page index",cls:"spread"},
  {id:"brand-feature",title:"SKANDI Brand Feature",sub:"Brand story and signature promise",cls:"feature"},
  {id:"offers",title:"Offers",sub:"Four editable offer cards and pricing",cls:"spread"},
  {id:"section-opener",title:"Section Opener",sub:"Full-bleed destination chapter opener",cls:"cover"},
  {id:"feature",title:"Feature Story",sub:"Hero image and editorial columns",cls:"feature"},
  {id:"destination-grid",title:"Destination Grid",sub:"Four-place visual discovery layout",cls:"spread"},
  {id:"nightlife",title:"After Dark",sub:"Dark editorial nightlife feature",cls:"cover"},
  {id:"experiences",title:"Curated Experiences",sub:"Experience cards and editorial notes",cls:"spread"},
  {id:"travel-well",title:"Travel Well",sub:"Practical checklist and travel advice",cls:"feature"},
  {id:"airline-guide",title:"Airline Directory",sub:"All partner airlines, logos and journey roles",cls:"spread"},
  {id:"airline-profile",title:"Airline Profiles",sub:"Two detailed airline profiles per page",cls:"spread"},
  {id:"onboard-guide",title:"Onboard Guide",sub:"Cabin, meals, baggage and service",cls:"feature"},
  {id:"airport-guide",title:"Airport Guide",sub:"Airport logos, codes, terminals and transfers",cls:"spread"},
  {id:"route-map",title:"Route Map",sub:"Route directory and connection map",cls:"spread"},
  {id:"transfer-promise",title:"Transfer Promise",sub:"SKANDI transfer safety and service standards",cls:"feature"},
  {id:"signature-collection",title:"Signature Collection",sub:"Curated hotel and partner collection",cls:"feature"},
  {id:"back-cover",title:"Back Cover",sub:"Closing campaign and call to action",cls:"ad"}
];
const templateCopy={
  cover:["The Blue Issue","Dream deeper. Travel further.","Aegean light, Nordic calm and the journeys worth taking now."],
  contents:["Inside VOY","Your guide to this issue","Destinations, useful travel information and SKANDI recommendations."],
  "brand-feature":["Travel, the SKANDI way","Signature travels. Unforgettable moments.","Thoughtful planning, trusted support and journeys shaped around how you want to travel."],
  offers:["Selected for this issue","Curated journeys and seasonal offers","Prices and availability can be updated directly in each offer card."],
  "section-opener":["Where to now?","The Greece chapter","Four islands, one capital and a different shade of blue."],
  feature:["A Different Kind of Blue","Greece beyond the postcard","Slow mornings, clear water and stories shaped by place."],
  "destination-grid":["Greece, Four Ways","Find your version of the Aegean","Athens, Santorini, Crete and Rhodes each bring a different rhythm."],
  nightlife:["Golden Hour, After Dark","When the islands change pace","Sunset tables, small bars and evenings that stretch naturally."],
  experiences:["Worth the Detour","Experiences selected by SKANDI","The places, people and moments that make a journey memorable."],
  "travel-well":["Travel Light. Arrive Ready.","Practical details, clearly explained","A calm journey starts with the right information before departure."],
  "airline-guide":["The Airline Guide","Choose how you fly","Compare SKANDI partner airlines, cabin products and the details worth knowing before you book."],
  "airline-profile":["Airline Profiles","Compare before you book","Seat, baggage, meals, Wi-Fi, airport benefits and loyalty — airline by airline."],
  "onboard-guide":["On Board, Your Way","Cabin information and service","Meals, baggage, comfort and what to expect during the journey."],
  "airport-guide":["Airport Guide","From check-in to arrival","Terminal, transfer and airport information for the featured routes."],
  "route-map":["Across the Atlantic, Into the Aegean","Routes featured in this issue","New York to Copenhagen and Athens, with onward island connections."],
  "transfer-promise":["Always With SKANDI","The SKANDI Transfer Promise","Safety, comfort and care continue after the flight, whether the journey is operated by SKANDI or a contracted transfer partner."],
  "signature-collection":["The SKANDI Signature Collection","Places we would choose ourselves","Hotels, airlines and partners selected for character, quality and care."],
  "back-cover":["Your next story starts here.","Explore the journey with SKANDI","Signature Travels, Unforgettable Moments."]
};

const BLOCK_SCHEMAS={
  contents:[["meta","Page","text"],["title","Title","text"],["subtitle","Description","textarea"]],
  offers:[["meta","Badge / duration","text"],["title","Offer title","text"],["subtitle","Description","textarea"],["imageUrl","Image asset","text"],["price","Price","text"],["cta","CTA label","text"],["href","Booking URL","text"]],
  "destination-grid":[["title","Destination","text"],["meta","Best for","text"],["imageUrl","Image asset","text"],["subtitle","Introduction","textarea"],["stay","Stay","textarea"],["do","Do","textarea"],["eat","Eat","textarea"],["gettingThere","Getting there","textarea"]],
  nightlife:[["meta","Time / label","text"],["title","Stop title","text"],["body","Copy","textarea"]],
  experiences:[["meta","Number / location","text"],["title","Experience","text"],["subtitle","Description","textarea"],["imageUrl","Image asset","text"]],
  "travel-well":[["title","Heading","text"],["body","Advice","textarea"]],
  "airline-guide":[["title","Airline","text"],["subtitle","Journey role","text"],["logoUrl","Logo asset","text"],["secondaryLogoUrl","Second logo asset","text"],["meta","Cabins / alliance","text"],["cta","Profile label","text"]],
  "airline-profile":[["title","Airline","text"],["subtitle","Profile focus","text"],["logoUrl","Logo asset","text"],["secondaryLogoUrl","Second logo asset","text"],["meta","Cabins","text"],["body","Summary","textarea"],["seat","Seat & comfort","textarea"],["baggage","Baggage","textarea"],["food","Food & drink","textarea"],["wifi","Wi-Fi & power","textarea"],["airport","Airport benefits","textarea"],["loyalty","Loyalty","textarea"],["tip","VOY tip","textarea"],["booking","Know before you book","textarea"]],
  "onboard-guide":[["title","Cabin / service","text"],["subtitle","Subheading","text"],["body","Description","textarea"]],
  "airport-guide":[["code","IATA code","text"],["title","Airport name","text"],["location","Location","text"],["logoUrl","Airport logo asset","text"],["meta","Role label","text"],["role","Role","textarea"],["plan","Plan for","textarea"],["note","VOY note","textarea"]],
  "route-map":[["title","Route","text"],["subtitle","Description","text"],["meta","Type","text"]],
  "transfer-promise":[["title","Promise / standard","text"],["subtitle","Short label","text"],["body","Description","textarea"]],
  "signature-collection":[["title","Partner / stay","text"],["subtitle","Location / category","text"],["imageUrl","Image asset","text"],["meta","Collection label","text"]]
};
function defaultBlocksForTemplate(template){
  const d={
    contents:[{meta:"04",title:"Offers Worth Leaving For",subtitle:"Curated journeys and seasonal offers."},{meta:"06",title:"A Different Kind of Blue",subtitle:"The Greece Issue feature."},{meta:"11",title:"The Airline Guide",subtitle:"Compare partner airlines and cabins."},{meta:"20",title:"Airport Guide",subtitle:"Gateways used in this issue."}],
    offers:[{meta:"Featured · 7 nights",title:"Athens & the Aegean",subtitle:"A city stay followed by unhurried island days.",price:"From $2,195",imageUrl:""},{meta:"5 nights",title:"Santorini, Unhurried",subtitle:"Caldera views and an easier island escape.",price:"From $2,495",imageUrl:""},{meta:"City break",title:"Copenhagen Design Weekend",subtitle:"A central design hotel and a curated city guide.",price:"From $1,795",imageUrl:""},{meta:"8 nights",title:"Crete, Slowly",subtitle:"A longer island stay with selected seaside hotel.",price:"From $2,395",imageUrl:""}],
    "destination-grid":[{title:"Santorini",meta:"For the romantics",subtitle:"White villages, caldera views and evenings designed for two.",imageUrl:"",stay:"",do:"",eat:"",gettingThere:""},{title:"Crete",meta:"For the explorers",subtitle:"Beaches, food, mountains, cities and history.",imageUrl:"",stay:"",do:"",eat:"",gettingThere:""},{title:"Mykonos",meta:"For the free spirits",subtitle:"Beach days, sunset and a famously social night scene.",imageUrl:"",stay:"",do:"",eat:"",gettingThere:""},{title:"Skiathos",meta:"For the beach lovers",subtitle:"Pine-covered hills and clear-water beaches.",imageUrl:"",stay:"",do:"",eat:"",gettingThere:""}],
    nightlife:[{meta:"18:30",title:"Find the higher view",body:"Choose a terrace where the city or island remains the main event."},{meta:"20:15",title:"Let sunset move past you",body:"Stay after the last light for the softer blue hour."},{meta:"22:00",title:"Order for the table",body:"Share a few dishes at a time and leave room for the house suggestion."}],
    experiences:[{meta:"01 · Santorini",title:"Sail the Caldera",subtitle:"See the island as it was first approached: from the water.",imageUrl:""},{meta:"02 · Athens",title:"Market to Table",subtitle:"Begin among produce stalls and turn the morning’s finds into lunch.",imageUrl:""},{meta:"03 · Crete",title:"Take the Long Road South",subtitle:"Cross the island slowly, stopping for mountain air and a swim.",imageUrl:""}],
    "travel-well":[{title:"Before you leave",body:"Save documents offline. Keep first-night essentials in your cabin bag. Pre-book the arrival transfer."},{title:"At the airport",body:"Build in time, refill water after security and keep medication and chargers within reach."},{title:"In the air",body:"Set your watch to local time, hydrate and prioritize rest."},{title:"On arrival",body:"Keep the first afternoon open and let one local recommendation reshape the itinerary."}],
    "airline-guide":[],
    "airline-profile":[],
    "onboard-guide":[{title:"Economy",subtitle:"The considered essentials",body:"A practical seat and the airline’s standard onboard service; inclusions depend on fare."},{title:"Premium",subtitle:"More room for the journey",body:"Additional space and enhanced service on selected routes and aircraft."},{title:"Business",subtitle:"Rest, privacy and time",body:"Priority services and a more complete seating and dining experience where offered."}],
    "airport-guide":[],
    "route-map":[{title:"JFK → ATH",subtitle:"New York to Athens · Greece gateway",meta:"Transatlantic"},{title:"EWR → CPH",subtitle:"Newark to Copenhagen · Nordic gateway",meta:"Transatlantic"},{title:"ATH → JTR",subtitle:"Athens to Santorini · Island connection",meta:"Onward"},{title:"ATH → HER",subtitle:"Athens to Heraklion · Crete connection",meta:"Onward"},{title:"ATH → RHO",subtitle:"Athens to Rhodes · Island connection",meta:"Onward"}],
    "transfer-promise":[{title:"Seatbelts at Every Seat",subtitle:"Vehicle safety",body:"Every coach is equipped with operational passenger seatbelts."},{title:"DOT / Regulatory Compliance",subtitle:"Vehicle safety",body:"Vehicles follow applicable operating and inspection requirements."},{title:"Rest & Break Standards",subtitle:"Driver standards",body:"Driver schedules are planned around regulated rest and break requirements."},{title:"Screening & Testing",subtitle:"Driver standards",body:"Contracted operating standards include required screening and testing protocols."}],
    "signature-collection":[{title:"Sense of place",subtitle:"01",meta:"Signature principle"},{title:"Considered comfort",subtitle:"02",meta:"Signature principle"},{title:"Local character",subtitle:"03",meta:"Signature principle"},{title:"Care throughout",subtitle:"04",meta:"Signature principle"}]
  };
  return JSON.parse(JSON.stringify(d[template]||[]));
}
const VOY_AIRLINE_PARTNERS=[
  {title:"SAS Scandinavian Airlines",subtitle:"Scandinavian network",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Economy · Premium · Business",body:"Nordic gateways, European connections and transatlantic travel.",seat:"Add route and aircraft-specific seat information.",baggage:"Show the allowance attached to the fare being compared.",food:"Show what is included by cabin, fare and flight length.",wifi:"Show availability and whether access is free or paid.",airport:"Show Fast Track, priority boarding and lounge eligibility.",loyalty:"EuroBonus · SkyTeam",tip:"Compare the cabin with the fare family.",booking:"Confirm the operating carrier and aircraft."},
  {title:"Norwegian",subtitle:"Nordic short-haul / leisure network",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Fare-family cabin product",body:"A value-led Nordic network where the final fare depends heavily on selected extras.",seat:"Compare standard and extra-legroom seats.",baggage:"Compare cabin and checked-bag inclusions by fare.",food:"Show included versus pre-order or buy-on-board options.",wifi:"Show aircraft-specific connectivity.",airport:"Show priority services where included.",loyalty:"Add current loyalty earning and benefits.",tip:"Compare final price after bags and seat selection.",booking:"Fare inclusions matter more than headline price."},
  {title:"Norse Atlantic Airways",subtitle:"Transatlantic partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Economy · Premium",body:"Long-haul value across the Atlantic with a distinct Premium cabin.",seat:"Add pitch, width and recline for each cabin.",baggage:"Show exactly which bags are included in each fare.",food:"Show meal inclusion and optional purchase rules.",wifi:"Add current connectivity availability.",airport:"Show priority benefits attached to Premium or fare type.",loyalty:"Add current program details if applicable.",tip:"Compare Premium when Economy extras narrow the price gap.",booking:"Show add-on costs before comparing total fare value."},
  {title:"American Airlines",subtitle:"U.S. partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Economy · Premium Economy · Business",body:"A major U.S. network with several cabin and fare layers.",seat:"Add aircraft-specific seat and lie-flat information.",baggage:"Show allowance by cabin and fare.",food:"Show route-specific meal and beverage service.",wifi:"Show aircraft-specific Wi-Fi pricing or inclusion.",airport:"Show priority check-in, security, boarding and lounge eligibility.",loyalty:"AAdvantage · oneworld",tip:"Aircraft type can materially change the premium-seat experience.",booking:"Codeshare flight numbers do not guarantee an American-operated aircraft."},
  {title:"Delta Air Lines",subtitle:"U.S. partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Main · Comfort · Premium Select · Delta One",body:"Separate extra-legroom Economy, true Premium Economy and lie-flat products clearly.",seat:"Show the practical difference between each seat product.",baggage:"Show fare-level baggage inclusions.",food:"Show meal and beverage differences by cabin.",wifi:"Show current Wi-Fi eligibility by aircraft and membership requirements.",airport:"Show priority and lounge rules by cabin, status and fare.",loyalty:"SkyMiles · SkyTeam",tip:"Do not confuse extra-legroom Economy with Premium Economy.",booking:"Check both marketing and operating carrier."},
  {title:"United Airlines",subtitle:"U.S. partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Economy · Economy Plus · Premium Plus · Polaris",body:"A broad U.S. network with multiple comfort steps on long-haul routes.",seat:"Add aircraft-specific seat, recline and bed information.",baggage:"Show cabin and fare baggage differences.",food:"Show meal inclusions by route and cabin.",wifi:"Show current aircraft and route availability.",airport:"Show priority and lounge eligibility.",loyalty:"MileagePlus · Star Alliance",tip:"A protected one-ticket connection can matter as much as fare.",booking:"Check whether every sector is United-operated."},
  {title:"JetBlue",subtitle:"U.S. partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Core · EvenMore · Mint where offered",body:"Seat choice, connectivity and aircraft matter when comparing JetBlue products.",seat:"Add pitch and premium-seat configuration by aircraft.",baggage:"Show fare-specific carry-on and checked-bag rules.",food:"Show complimentary versus premium dining service.",wifi:"Show current onboard connectivity.",airport:"Show priority and lounge benefits where applicable.",loyalty:"TrueBlue",tip:"Compare the exact aircraft when choosing a premium transatlantic seat.",booking:"Premium products may not be available on every route."},
  {title:"Thai Airways International",subtitle:"Thailand & long-haul partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Economy · Business · First where offered",body:"Aircraft type is particularly important when comparing long-haul cabin layouts.",seat:"Add seat and bed information by aircraft.",baggage:"Show cabin and fare baggage allowances.",food:"Show long-haul dining and special-meal options.",wifi:"Show aircraft-specific connectivity.",airport:"Show lounge, priority and transfer benefits.",loyalty:"Royal Orchid Plus · Star Alliance",tip:"Check the scheduled aircraft before choosing a premium seat.",booking:"Aircraft swaps can change the cabin product."},
  {title:"AEGEAN Airlines",subtitle:"Greece & regional partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Economy · Business",body:"A key Athens and Greek-island connection partner.",seat:"Explain standard seating versus European Business personal-space treatment.",baggage:"Show baggage by fare family and cabin.",food:"Show route-specific meal and beverage service.",wifi:"Show connectivity on equipped aircraft.",airport:"Show lounge and priority benefits.",loyalty:"Miles+Bonus · Star Alliance",tip:"For Athens connections, compare the whole journey rather than only the short sector.",booking:"Separate tickets can change baggage and connection protection."},
  {title:"Icelandair",subtitle:"North Atlantic partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Economy · Saga Premium",body:"Explain the premium front-cabin experience without implying a lie-flat long-haul Business product.",seat:"Add seat pitch, width and recline.",baggage:"Show fare-specific baggage.",food:"Show included and optional dining.",wifi:"Show aircraft-specific connectivity.",airport:"Show priority and lounge eligibility.",loyalty:"Saga Club",tip:"Compare actual seat specification rather than cabin names alone.",booking:"Connection and stopover structure can matter as much as cabin."},
  {title:"Iberia",subtitle:"Spain & Europe partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Economy · Premium Economy · Business",body:"A useful Madrid gateway with a clear long-haul cabin progression.",seat:"Add aircraft-specific pitch, width and lie-flat information.",baggage:"Show fare and cabin allowances.",food:"Show onboard dining by cabin and route.",wifi:"Show aircraft-specific Wi-Fi.",airport:"Show priority and lounge eligibility.",loyalty:"Iberia Plus / Avios · oneworld",tip:"Protected Madrid connections can add value beyond the headline fare.",booking:"Check which airline operates codeshare sectors."},
  {title:"Bangkok Airways",subtitle:"Thailand regional partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Regional cabin products by aircraft",body:"A regional and island connection partner where convenience and included services matter.",seat:"Add aircraft-specific seating.",baggage:"Show fare and cabin baggage.",food:"Show included service by route.",wifi:"Show current availability where applicable.",airport:"Show lounge and priority benefits available to the booked fare.",loyalty:"FlyerBonus",tip:"On short sectors, baggage and connection convenience can outweigh a small fare difference.",booking:"Check through-ticket baggage and connection handling."},
  {title:"Alaska Airlines & Hawaiian Airlines",subtitle:"Combined SKANDI partner group",logoUrl:"[LEAVE_PLACEHOLDER]",secondaryLogoUrl:"[LEAVE_PLACEHOLDER]",meta:"Products depend on operating brand",body:"Keep both operating brands visible because the passenger experience differs by operator and aircraft.",seat:"Split seat information by operating airline and aircraft.",baggage:"Show rules attached to the operating airline and ticket.",food:"Separate Alaska and Hawaiian service where it differs.",wifi:"Show aircraft-specific connectivity for each brand.",airport:"Show benefits that apply to the operating brand and fare.",loyalty:"Add current group loyalty structure and benefits.",tip:"Never collapse the onboard product into one generic experience.",booking:"Display both marketing and operating carrier prominently."},
  {title:"Finnair",subtitle:"Finland & long-haul partner",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Economy · Premium Economy · Business",body:"A Nordic long-haul option with distinct Premium Economy and Business products.",seat:"Add pitch, width and premium-seat / bed information.",baggage:"Show cabin and fare allowance.",food:"Show dining by cabin and flight length.",wifi:"Show aircraft and route availability.",airport:"Show priority and lounge eligibility.",loyalty:"Finnair Plus · oneworld",tip:"Compare Premium Economy and Business against flight duration and departure time.",booking:"Check aircraft and operating carrier before describing the seat."}
];
function currentVoyBlueprint(issueId){
  const p=(template,pageNo,overrides={})=>({...makeTemplatePage(templates.find(t=>t.id===template)||templates[0],pageNo-1,issueId),pageNo,...overrides,blocks:overrides.blocks||defaultBlocksForTemplate(template)});
  const profilePairs=[];for(let i=0;i<VOY_AIRLINE_PARTNERS.length;i+=2)profilePairs.push(VOY_AIRLINE_PARTNERS.slice(i,i+2));
  return [
    p("cover",1,{kicker:"The Greece Issue",title:"A Different Kind of Blue",deck:"Crete, Santorini and the Greek islands through the SKANDI lens.",imageUrl:"https://static.wixstatic.com/media/394052_df1cdfcfeb434cd1aa47ee47949309f3~mv2.png",blocks:[{title:"The Mediterranean’s remarkable new hotels"},{title:"New York's Lower Manhattan — restaurants not to miss"},{title:"A calmer way across the Atlantic"}]}),
    p("contents",2,{kicker:"Issue 01 · Summer 2026",title:"In this issue.",deck:"The Greece Issue",blocks:defaultBlocksForTemplate("contents")}),
    p("brand-feature",3,{kicker:"Travel, the SKANDI way",title:"Signature Travels. Unforgettable Moments.",deck:"Carefully selected flights, stays, transfers and experiences.",imageUrl:"https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1800&q=90"}),
    p("offers",4,{kicker:"Curated by SKANDI",title:"Offers worth leaving for.",deck:"Four journeys selected for VOY readers.",blocks:defaultBlocksForTemplate("offers")}),
    p("section-opener",5,{kicker:"Journeys begin with a question",title:"Where to now?",deck:"Follow the light from Athens to the islands, choosing fewer stops, longer stays and room for the unexpected.",destination:"Crete · Santorini · Athens · Mykonos",imageUrl:"https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1800&q=90"}),
    p("feature",6,{kicker:"The Greece Issue",title:"A Different Kind of Blue",deck:"Fall in love in Santorini. Swim the waters of Crete. Dance until sunrise in Mykonos.",body:"Some places you visit. Greece gets under your skin.\n\nMaybe yours begins in Santorini, where whitewashed villages tumble towards the Aegean and evenings seem designed for two.\n\nHead south to Crete for beaches, mountain villages, ancient ruins, olive groves and tavernas where dinner runs long.\n\nThen there’s Mykonos: glamorous, free-spirited and famously social after dark.\n\nCome as a couple. Come with friends. Come to celebrate. Come to disappear for a while. You just have to find your shade of blue.",imageUrl:"https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1800&q=90"}),
    p("destination-grid",7,{kicker:"Four distinct moods",title:"Find your shade of Greece",deck:"Four islands. Four moods. Four very different reasons to pack your bags.",blocks:defaultBlocksForTemplate("destination-grid")}),
    p("nightlife",8,{kicker:"An evening in three acts",title:"Golden Hour, After Dark",deck:"The Greek evening rewards a slower clock: one view, one drink and a table chosen without hurry.",imageUrl:"https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1400&q=90",blocks:defaultBlocksForTemplate("nightlife")}),
    p("experiences",9,{kicker:"Three stories to bring home",title:"Worth the Detour",deck:"The experiences we remember tend to be simple: a boat, a table, a road — and the right person showing the way.",blocks:defaultBlocksForTemplate("experiences")}),
    p("travel-well",10,{kicker:"A calmer way to go",title:"Travel Light. Arrive Ready.",deck:"A few considered choices can make the journey feel like part of the holiday.",blocks:defaultBlocksForTemplate("travel-well")}),
    p("airline-guide",11,{kicker:"Choose how you fly",title:"The Airline Guide",deck:"Meet the airline partners behind a SKANDI journey and compare what matters before choosing a fare.",body:"Look for ‘operated by’ when comparing the onboard product. Cabin does not always equal fare: baggage, flexibility, seat selection and lounge benefits may differ within the same cabin.",blocks:VOY_AIRLINE_PARTNERS.map((a,i)=>({title:a.title,subtitle:a.subtitle,logoUrl:a.logoUrl,secondaryLogoUrl:a.secondaryLogoUrl||"",meta:a.meta,cta:`Profile ${String(i+1).padStart(2,"0")}`}))}),
    ...profilePairs.map((pair,i)=>p("airline-profile",12+i,{kicker:"Compare before you book",title:"Airline Profiles",deck:"Look beyond the headline fare. Seat, bags, meals, Wi-Fi, lounge access and flexibility can change the real value of a ticket.",blocks:pair})),
    p("onboard-guide",19,{kicker:"Comfort at every altitude",title:"On Board, Your Way",deck:"Understand the broad cabin choices, then confirm the exact product on your booking.",imageUrl:"https://images.unsplash.com/photo-1540339832862-474599807836?auto=format&fit=crop&w=1300&q=90",blocks:defaultBlocksForTemplate("onboard-guide")}),
    p("airport-guide",20,{kicker:"From curb to coast",title:"Airport Guide",deck:"The main gateways used throughout this issue, with practical notes for each departure, connection and arrival.",blocks:[
      {code:"JFK",title:"John F. Kennedy International Airport",location:"New York · United States",logoUrl:"[LEAVE_PLACEHOLDER]",meta:"Departure",role:"Primary transatlantic departure gateway.",plan:"Security, terminal navigation and possible traffic delays.",note:"Confirm airline and terminal before leaving for the airport."},
      {code:"EWR",title:"Newark Liberty International Airport",location:"Newark · United States",logoUrl:"",meta:"Departure",role:"New York-area gateway for transatlantic and Nordic journeys.",plan:"Allow time for the correct terminal and check-in area.",note:"Use the airport code, not only ‘New York’, when arranging transport."},
      {code:"ATH",title:"Athens International Airport",location:"Athens · Greece",logoUrl:"",meta:"Gateway",role:"Main international gateway and island-connection point.",plan:"Connection time and the correct onward departure area.",note:"Keep the next boarding pass and baggage receipt easy to reach."},
      {code:"JTR",title:"Santorini Airport",location:"Santorini · Greece",logoUrl:"",meta:"Island",role:"Compact island arrival for Santorini stays.",plan:"Pre-arranged transfer during busy periods.",note:"Keep accommodation and transfer contact available offline."},
      {code:"HER",title:"Heraklion International Airport",location:"Crete · Greece",logoUrl:"",meta:"Island",role:"Gateway for central and eastern Crete itineraries.",plan:"Road transfer between airport and resort area.",note:"Match the arrival airport to the part of Crete where you are staying."},
      {code:"RHO",title:"Rhodes International Airport",location:"Rhodes · Greece",logoUrl:"",meta:"Island",role:"Arrival gateway for Rhodes town and coastal stays.",plan:"The onward journey to the old town or resort area.",note:"Confirm the transfer meeting point in your SKANDI documents."}
    ]}),
    p("route-map",21,{kicker:"Issue 01 route guide",title:"Across the Atlantic, Into the Aegean",deck:"An illustrated view of the gateways and connections featured in this Greece issue.",blocks:defaultBlocksForTemplate("route-map")}),
    p("transfer-promise",22,{kicker:"The SKANDI Transfer Promise",title:"Always With SKANDI.",deck:"When you step off the airplane, safety, comfort and peace of mind remain part of the journey.",body:"These standards apply to SKANDI-operated transfers and the contracted operators selected for our journeys.",blocks:defaultBlocksForTemplate("transfer-promise")}),
    p("signature-collection",23,{kicker:"Selected with purpose",title:"The SKANDI Signature Collection",deck:"Stays, routes and local partners chosen for character, comfort and a genuine sense of place.",imageUrl:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=90",blocks:defaultBlocksForTemplate("signature-collection")}),
    p("back-cover",24,{kicker:"VOY · By SKANDI",title:"Your next story starts here.",deck:"Explore considered journeys, selected stays and experiences shaped around the way you want to travel.",ctaLabel:"Scan to explore",ctaPath:"https://www.skanditravels.com",backgroundColor:"#022e64",textColor:"#ffffff",accentColor:"#5fc7cf"})
  ];
}
function renderBlockEditor(p={}){
  const blocks=parseBlocks(p.blocks);const schema=BLOCK_SCHEMAS[p.template]||[["meta","Label / meta","text"],["title","Title","text"],["subtitle","Subtitle","textarea"],["body","Body","textarea"],["imageUrl","Image asset","text"],["logoUrl","Logo asset","text"],["price","Price","text"],["cta","CTA","text"]];
  const fields=(b,i)=>schema.map(([key,label,type])=>`<div class="field ${type==="textarea"?"full":""}"><label class="label">${esc(label)}</label>${type==="textarea"?`<textarea data-block-index="${i}" data-block-field="${esc(key)}">${esc(b[key]||"")}</textarea>`:`<input class="input" data-block-index="${i}" data-block-field="${esc(key)}" value="${esc(b[key]||"")}">`}</div>`).join("");
  return `<div class="mm-block-editor"><div class="mm-block-toolbar"><strong>Structured ${esc(templates.find(t=>t.id===p.template)?.title||"page")} content</strong><button type="button" class="btn primary" data-action="add-block">Add item</button></div><div class="mm-block-list">${blocks.length?blocks.map((b,i)=>`<article class="mm-block-item"><div class="mm-block-head"><b>Item ${i+1}</b><div class="mm-block-actions"><button type="button" class="btn" data-block-move="up" data-block-index-action="${i}">↑</button><button type="button" class="btn" data-block-move="down" data-block-index-action="${i}">↓</button><button type="button" class="btn bad" data-block-remove="${i}">Remove</button></div></div><div class="mm-block-fields">${fields(b,i)}</div></article>`).join(""):`<div class="empty">No structured items on this page. Add an item or load the template defaults.</div>`}</div></div>`;
}
function collectVisualBlocks(){
  const nodes=[...document.querySelectorAll("[data-block-field]")];if(!nodes.length)return null;const blocks=[];for(const node of nodes){const i=Number(node.dataset.blockIndex);if(!blocks[i])blocks[i]={};blocks[i][node.dataset.blockField]=node.value.trim()}return blocks.filter(Boolean);
}

function makeTemplatePage(template,index,issueId){
  const copy=templateCopy[template.id]||[template.title,template.sub,"Start writing here."];
  const dark=["cover","section-opener","nightlife","back-cover"].includes(template.id);
  return {pageId:uid("PAGE"),issueId,pageNo:index+1,template:template.id,status:"DRAFT",category:"VOY Magazine",kicker:"VOY by SKANDI",title:copy[0],deck:copy[1],body:copy[2],imageUrl:"",secondaryImageUrl:"",imageCredit:"",imageFit:"cover",imagePosition:"center center",destination:"",ctaLabel:template.id==="back-cover"?"Explore SKANDI":"Explore more",ctaPath:"/",backgroundColor:dark?"#07162c":"#ffffff",textColor:dark?"#ffffff":"#103154",accentColor:"#4dcad6",headingFont:"Montserrat",bodyFont:"Inter",footerText:"VOY by SKANDI · skanditravels.com",blocks:defaultBlocksForTemplate(template.id),seoNotes:"",updatedAt:new Date().toISOString()};
}
function init(){
  if(!modules.some(m=>m.id===state.activeModule))state.activeModule="management";
  const activeModule=modules.find(m=>m.id===state.activeModule)||modules[0];
  if(!activeModule.panels.includes(state.activePanel))state.activePanel=activeModule.panels[0];
  renderModules(); renderNav(); renderShell(); setInterval(()=>{const c=$("clock");if(c)c.textContent=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})},1000);
  post("MEDIA_CONTROL_READY",{workspace:"media-control-full",version:"V12-2026.10.14-FULL-EDITORIAL-STUDIO"});
  post("MEDIA_CONTROL_CATALOG_REQUEST",{});
  post("NEWSROOM_ADMIN_READY",{workspace:"voy-magazine-manager"});
  window.parent.postMessage({source:"SKANDI_INTERNAL_CHROME",type:"INTERNAL_CHROME_READY",payload:{pagePath:location.pathname},timestamp:new Date().toISOString()},"*");
  requestLiveRefresh("page-load");
  setInterval(()=>requestLiveRefresh("auto-5-minute-field-refresh"),LIVE_REFRESH_MS);
  window.addEventListener("pageshow",()=>requestLiveRefresh("page-show"));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-lastLiveRefreshAt>LIVE_REFRESH_MS)requestLiveRefresh("visible-after-idle")});
  status("Magazine Manager ready. Waiting for live data sync or use the local editorial draft.");
}
function renderModules(){
  const host=$("mmModules");if(!host)return;
  host.innerHTML=modules.map(m=>`<button class="mm-module ${state.activeModule===m.id?"active":""}" type="button" data-module="${m.id}">${esc(m.title)}</button>`).join("");
  const module=modules.find(m=>m.id===state.activeModule)||modules[0];
  const panel=panels.find(p=>p[0]===state.activePanel);
  if($("mmBreadcrumb"))$("mmBreadcrumb").textContent=`${module.title} / ${panel?.[1]||"Overview"}`;
  if($("mmPageTitle"))$("mmPageTitle").textContent=state.activePanel==="builder"?"VOY Magazine Page Builder":state.activePanel==="pressreleases"?"Newsroom & Press Releases":state.activePanel==="emailstudio"?"Email Template Studio":"VOY Magazine & Newsroom Control";
}
function renderNav(){
  const module=modules.find(m=>m.id===state.activeModule)||modules[0];
  $("nav").innerHTML=`<div class="nav-title">${esc(module.title)}</div>`+module.panels.map(id=>panels.find(p=>p[0]===id)).filter(Boolean).map(p=>`<button class="nav-btn ${state.activePanel===p[0]?"active":""}" data-panel="${p[0]}"><span>${esc(p[1])}</span><span class="nav-key">${esc(p[2])}</span></button>`).join("");
  renderModules();
}
function renderShell(){
  const content=$("content");
  content.innerHTML=panels.map(p=>`<section class="panel-view ${state.activePanel===p[0]?"active":""}" id="panel-${p[0]}"></section>`).join("");
  renderAll();
}
function renderAll(){
  renderNav();
  updateStats();
  renderDashboard();
  renderIssues();
  renderBuilder();
  renderArticles();
  renderAssets();
  renderResearch();
  renderCampaign();
  renderQualityLab();
  renderBrandKit();
  renderPrintQa();
  renderDistribution();
  renderWorkflow();
  renderCategories();
  renderBanners();
  renderTravelCards();
  renderApi();
  renderPressReleases();
  renderPressContacts();
  renderSitePlanner();
  renderWebContent();
  renderWebMedia();
  renderPresentationMatrix();
  renderContentAudit();
  renderReleaseCenter();
  saveLocal();window.SKANDIEmailStudioHostMount?.();window.SKANDIWebsiteStudioMount?.({pages:state.catalog,assets:state.assets});
}
function setPanel(panel){
  if(!panels.some(p=>p[0]===panel))return;
  const current=modules.find(m=>m.id===state.activeModule);
  if(!current?.panels.includes(panel)){
    const preferred={siteplan:"website",webcontent:"website",webmedia:"website",presentationmatrix:"governance",contentaudit:"governance",releasecenter:"governance",builder:"production",assets:"production",articles:"production",pressreleases:"marketing",presscontacts:"contacts",distribution:"circulation",quality:"reports",printqa:"reports",research:"tools",api:"tools",brandkit:"tools",categories:"nonadmin",banners:"marketing",travelcards:"marketing",campaign:"marketing"};
    state.activeModule=preferred[panel]||modules.find(m=>m.panels.includes(panel))?.id||"management";
  }
  state.activePanel=panel;
  document.body.classList.remove("mobile-drawer-open");
  document.querySelectorAll(".panel-view").forEach(v=>v.classList.toggle("active",v.id===`panel-${panel}`));
  renderAll();
  post("VOY_ADMIN_PANEL_CHANGED",{panel});
}
function setModule(moduleId){
  const module=modules.find(m=>m.id===moduleId);if(!module)return;
  state.activeModule=module.id;
  if(!module.panels.includes(state.activePanel))state.activePanel=module.panels[0];
  document.querySelectorAll(".panel-view").forEach(v=>v.classList.toggle("active",v.id===`panel-${state.activePanel}`));
  renderAll();
  post("VOY_ADMIN_PANEL_CHANGED",{module:module.id,panel:state.activePanel});
}
function updateStats(){
  $("statIssues").textContent=state.issues.length;
  $("statPages").textContent=state.pages.length;
  $("statArticles").textContent=state.articles.length;
  $("statAssets").textContent=state.assets.length;
  $("statReady").textContent=state.articles.filter(a=>["APPROVED","READY","PUBLISHED"].includes(String(a.status||"").toUpperCase())).length;
}
function currentIssue(){
  return state.issues.find(i=>i.issueId===state.selectedIssueId||i._id===state.selectedIssueId) || state.issues[0] || null;
}
function currentIssueId(){const i=currentIssue();return i?(i.issueId||i._id):""}
function issuePages(issueId=currentIssueId()){
  return state.pages.filter(p=>String(p.issueId||p.issueRef||"")===String(issueId)).sort((a,b)=>Number(a.pageNo||0)-Number(b.pageNo||0));
}
function currentPage(){
  return state.pages.find(p=>p.pageId===state.selectedPageId||p._id===state.selectedPageId) || issuePages()[0] || null;
}
function currentArticle(){
  return state.articles.find(a=>a.articleId===state.selectedArticleId||a._id===state.selectedArticleId) || state.articles[0] || null;
}
function pill(status){
  const s=String(status||"DRAFT").toUpperCase();
  const c=s.includes("APPROVED")||s.includes("READY")||s.includes("PUBLISHED")?"ok":s.includes("REJECT")||s.includes("BLOCK")||s.includes("ARCHIVED")?"bad":s.includes("REVIEW")||s.includes("DRAFT")||s.includes("PROGRESS")?"warn":"info";
  return `<span class="pill ${c}">${esc(status||"DRAFT")}</span>`;
}

function websiteRecords(type,kind){
  const source=type==="article"?state.articles:type==="banner"?state.banners:state.campaigns;
  return source.filter(x=>String(x.scope||x.channel||"").toUpperCase()==="WEBSITE" && String(x.presentationKind||"").toUpperCase()===kind);
}
function catalogPages(){return Array.isArray(state.catalog)?state.catalog:[]}
function editorialPages(){return catalogPages().filter(p=>p?.editorial===true&&Array.isArray(p.sections)&&p.sections.length)}
function pageByKey(key){return catalogPages().find(p=>String(p.key)===String(key))||null}
function sectionById(page,id){return (page?.sections||[]).find(x=>String(x.id)===String(id))||null}
function firstSection(page,mode="copy"){return (page?.sections||[]).find(x=>mode==="media"?(x.mediaSlots||[]).length:(x.fields||[]).length)||null}
function recordId(r){return r.articleId||r.campaignId||r.bannerId||r.cardId||r.categoryId||r.entityId||r._id||r.id||""}
function option(value,label,selected=""){return `<option value="${esc(value)}" ${String(value)===String(selected)?"selected":""}>${esc(label)}</option>`}
function pageOptions(pages,selected="",includeLocked=false){const rows=(pages||[]).filter(p=>includeLocked||p.editorial);return rows.map(p=>option(p.key,`${p.label} · ${p.path}${p.editorial?"":" · locked"}`,selected)).join("")}
function sectionOptions(page,selected="",mode="copy"){return (page?.sections||[]).filter(x=>mode==="media"?(x.mediaSlots||[]).length:(x.fields||[]).length).map(x=>option(x.id,x.label,selected)).join("")}
function fieldOptions(section,selected=""){return (section?.fields||[]).map(x=>option(x.id,`${x.label} · ${x.id}`,selected)).join("")}
function mediaOptions(section,selected=""){return (section?.mediaSlots||[]).map(x=>option(x.id,`${x.label} · ${x.id}`,selected)).join("")}
function ownershipNote(){return `<div class="notice"><b>Authority boundary:</b> Media Control owns registered presentation copy and non-inventory presentation media. Inventory Control remains authoritative for destination, airline, airport, hotel, package and provider-owned facts/media. Policy bodies, Store commerce, customer data and bookings remain with their own systems.</div>`}
function pageRecordSet(path){return{plans:websiteRecords("campaign","PAGE_PLAN").filter(x=>x.pagePath===path),copy:websiteRecords("article","CONTENT_BLOCK").filter(x=>x.pagePath===path),media:websiteRecords("banner","MEDIA_SLOT").filter(x=>x.pagePath===path)}}
function statusUpper(x){return String(x?.status||"").toUpperCase()}
function isPublished(x){return x?.published===true||statusUpper(x)==="PUBLISHED"}
function isHttpUrl(v){return /^https:\/\//i.test(String(v||"").trim())}
function selectPlanRecord(page){return websiteRecords("campaign","PAGE_PLAN").find(x=>x.pagePath===page?.path)||null}
function selectCopyRecord(page,fieldId){return websiteRecords("article","CONTENT_BLOCK").find(x=>x.pagePath===page?.path&&String(x.contentId)===String(fieldId))||null}
function selectMediaRecord(page,slotId){return websiteRecords("banner","MEDIA_SLOT").find(x=>x.pagePath===page?.path&&String(x.slotId)===String(slotId))||null}
function presentationCounts(page){const records=pageRecordSet(page.path),fieldCount=(page.sections||[]).reduce((n,x)=>n+(x.fields||[]).length,0),mediaCount=(page.sections||[]).reduce((n,x)=>n+(x.mediaSlots||[]).length,0);return{...records,fieldCount,mediaCount,publishedCopy:records.copy.filter(isPublished).length,publishedMedia:records.media.filter(isPublished).length}}
function currentCatalogPage(kind){const key=kind==="plan"?state.editorialSelection.planPageKey:kind==="copy"?state.editorialSelection.copyPageKey:kind==="media"?state.editorialSelection.mediaPageKey:state.editorialSelection.releasePageKey;return pageByKey(key)||(kind==="plan"?catalogPages()[0]:editorialPages()[0])||null}
function ensureCatalogSelections(){
  const all=catalogPages(),editable=editorialPages();
  if(!pageByKey(state.editorialSelection.planPageKey))state.editorialSelection.planPageKey=all[0]?.key||"";
  if(!pageByKey(state.editorialSelection.copyPageKey)?.editorial)state.editorialSelection.copyPageKey=editable[0]?.key||"";
  if(!pageByKey(state.editorialSelection.mediaPageKey)?.editorial)state.editorialSelection.mediaPageKey=(editable.find(p=>(p.sections||[]).some(s=>(s.mediaSlots||[]).length))||editable[0])?.key||"";
  if(!pageByKey(state.editorialSelection.releasePageKey))state.editorialSelection.releasePageKey=editable[0]?.key||all[0]?.key||"";
  const cp=pageByKey(state.editorialSelection.copyPageKey),cs=sectionById(cp,state.editorialSelection.copySectionId)||firstSection(cp,"copy");state.editorialSelection.copySectionId=cs?.id||"";
  if(!(cs?.fields||[]).some(x=>x.id===state.editorialSelection.copyFieldId))state.editorialSelection.copyFieldId=cs?.fields?.[0]?.id||"";
  const mp=pageByKey(state.editorialSelection.mediaPageKey),ms=sectionById(mp,state.editorialSelection.mediaSectionId)||firstSection(mp,"media");state.editorialSelection.mediaSectionId=ms?.id||"";
  if(!(ms?.mediaSlots||[]).some(x=>x.id===state.editorialSelection.mediaSlotId))state.editorialSelection.mediaSlotId=ms?.mediaSlots?.[0]?.id||"";
}
function renderSitePlanner(){
  const el=$("panel-siteplan");if(!el)return;ensureCatalogSelections();const rows=websiteRecords("campaign","PAGE_PLAN"),page=currentCatalogPage("plan")||{};const rec=selectPlanRecord(page)||{};
  el.innerHTML=`<div class="hero"><div><div class="eyebrow">SKANDI website planning</div><h2>Website Planner</h2><p>Plan every registered public route without typing paths. Editorial and operational ownership remain separated by the V12 authority catalog.</p></div><div class="status-card"><div class="status-number">${catalogPages().length}</div><div class="status-sub">registered public routes</div></div></div>${ownershipNote()}<div class="split"><div class="panel scroll"><h3>Page register</h3><div class="admin-table">${catalogPages().map(p=>{const r=selectPlanRecord(p);return `<div class="admin-row"><div><div class="item-title">${esc(p.label)}</div><div class="item-sub mono">${esc(p.path)} · ${esc(p.authority||"")}</div><div class="item-sub">${r?`${esc(r.status||"DRAFT")} · ${esc(r.notes||r.summary||"")}`:"No page-plan record"}</div></div><div class="row"><button class="btn" data-web-plan-page="${esc(p.key)}">Open</button>${r?`<button class="btn bad" data-delete-web-plan="${esc(recordId(r))}">Delete plan</button>`:""}</div></div>`}).join("")}</div></div><div class="panel"><h3>Page plan</h3><div class="field"><span class="label">Page</span><select id="webPlanPage">${pageOptions(catalogPages(),page.key,true)}</select></div><div class="kv" style="margin:8px 0"><div class="k">Route</div><div class="v mono">${esc(page.path||"")}</div><div class="k">Authority</div><div class="v">${esc(page.authority||"")}</div><div class="k">Editorial</div><div class="v">${page.editorial?"Registered":"System-owned / planning only"}</div></div><div class="field"><span class="label">Status</span><select id="webPlanStatus">${["DRAFT","REVIEW","READY","PUBLISHED"].map(v=>option(v,v,rec.status||"DRAFT")).join("")}</select></div><div class="field full"><span class="label">Planning notes</span><textarea id="webPlanNotes">${esc(rec.notes||rec.summary||"")}</textarea></div><div class="row"><button class="btn primary" data-save-web-plan>Save page plan</button><button class="btn" data-open-public-page="${esc(page.key||"")}">Open public page</button></div></div></div>`;
}
function renderWebContent(){
  const el=$("panel-webcontent");if(!el)return;ensureCatalogSelections();const page=currentCatalogPage("copy")||{},section=sectionById(page,state.editorialSelection.copySectionId)||firstSection(page,"copy"),field=(section?.fields||[]).find(x=>x.id===state.editorialSelection.copyFieldId)||section?.fields?.[0]||null,rec=selectCopyRecord(page,field?.id)||{};const rows=websiteRecords("article","CONTENT_BLOCK");
  el.innerHTML=`<div class="panel"><h3>Page Copy Registry</h3>${ownershipNote()}<div class="help" style="margin:10px 0">Select the registered page, section and field. Technical content IDs are displayed for traceability but cannot be typed manually.</div><div class="admin-grid"><div class="field"><span class="label">Page</span><select id="webContentPage">${pageOptions(editorialPages(),page.key)}</select></div><div class="field"><span class="label">Section</span><select id="webContentSection">${sectionOptions(page,section?.id,"copy")}</select></div><div class="field full"><span class="label">Editable field</span><select id="webContentField">${fieldOptions(section,field?.id)}</select><div class="help mono">${esc(field?.id||"No editable field registered")}</div></div><div class="field full"><span class="label">Text</span>${field?.type==="LONG_TEXT"?`<textarea id="webContentValue">${esc(rec.value??rec.body??"")}</textarea>`:`<input class="input" id="webContentValue" value="${esc(rec.value??rec.body??"")}">`}</div><div class="field"><span class="label">Status</span><select id="webContentStatus">${["DRAFT","REVIEW","READY","PUBLISHED"].map(v=>option(v,v,rec.status||"DRAFT")).join("")}</select></div><div class="field"><span class="label">Characters</span><div class="input" id="webContentCount" aria-live="polite">${String(rec.value??rec.body??"").length}</div></div></div><div class="row" style="margin-top:8px"><button class="btn primary" data-save-web-content ${field?"":"disabled"}>Save page copy</button>${rec&&recordId(rec)?`<button class="btn bad" data-delete-web-content="${esc(recordId(rec))}">Delete record</button>`:""}<button class="btn" data-open-public-page="${esc(page.key||"")}">Open public page</button></div></div><div class="panel scroll"><h3>Registered copy</h3><div class="admin-table">${rows.map(x=>`<div class="admin-row"><div><div class="item-title">${esc(x.title||x.contentId||"Content block")}</div><div class="item-sub mono">${esc(x.pagePath||"")} · ${esc(x.contentId||"")}</div><div class="item-sub">${esc(String(x.value??x.body??"").slice(0,240))}</div></div><div class="row"><button class="btn" data-edit-web-content="${esc(recordId(x))}">Edit</button>${pill(x.status)}</div></div>`).join("")||`<div class="empty">No website copy records yet.</div>`}</div></div>`;
}
function renderWebMedia(){
  const el=$("panel-webmedia");if(!el)return;ensureCatalogSelections();const page=currentCatalogPage("media")||{},section=sectionById(page,state.editorialSelection.mediaSectionId)||firstSection(page,"media"),slot=(section?.mediaSlots||[]).find(x=>x.id===state.editorialSelection.mediaSlotId)||section?.mediaSlots?.[0]||null,rec=selectMediaRecord(page,slot?.id)||{},rows=websiteRecords("banner","MEDIA_SLOT");
  el.innerHTML=`<div class="panel"><h3>Hero / Card / Ad Media Registry</h3>${ownershipNote()}<div class="help" style="margin:10px 0">Select a registered presentation slot, then choose a public image from the shared Asset Library. Raw media-slot IDs and raw URLs are not editor inputs.</div><div class="admin-grid"><div class="field"><span class="label">Page</span><select id="webMediaPage">${pageOptions(editorialPages().filter(p=>(p.sections||[]).some(s=>(s.mediaSlots||[]).length)),page.key)}</select></div><div class="field"><span class="label">Section</span><select id="webMediaSection">${sectionOptions(page,section?.id,"media")}</select></div><div class="field full"><span class="label">Media slot</span><select id="webMediaSlotSelect">${mediaOptions(section,slot?.id)}</select><div class="help mono">${esc(slot?.id||"No presentation media slot registered")}</div></div><div class="field wide"><span class="label">Selected asset</span><input class="input" id="webMediaUrl" data-web-media-asset="1" value="${esc(rec.assetUrl||rec.imageUrl||"")}" placeholder="Choose from Asset Library" readonly></div><div class="field"><span class="label">Alt text</span><input class="input" id="webMediaAlt" value="${esc(rec.alt||"")}"></div><div class="field"><span class="label">Status</span><select id="webMediaStatus">${["DRAFT","REVIEW","READY","PUBLISHED"].map(v=>option(v,v,rec.status||"DRAFT")).join("")}</select></div></div><div class="row" style="margin-top:8px"><button class="btn" data-sk-media-choose="website:media">Choose asset</button><button class="btn" data-sk-media-upload="website:media">Upload asset</button><button class="btn primary" data-save-web-media ${slot?"":"disabled"}>Save media slot</button>${recordId(rec)?`<button class="btn bad" data-delete-web-media="${esc(recordId(rec))}">Delete record</button>`:""}</div>${rec.assetUrl||rec.imageUrl?`<div class="asset-card" style="margin-top:10px"><div class="asset-img" style="background-image:url('${esc(rec.assetUrl||rec.imageUrl)}')"></div><div class="asset-body"><div class="asset-title">Current presentation asset</div><div class="asset-meta">${esc(rec.alt||"No alt text")}</div></div></div>`:""}</div><div class="panel scroll"><h3>Registered presentation media</h3><div class="admin-table">${rows.map(x=>`<div class="admin-row"><div><div class="item-title">${esc(x.title||x.slotId||"Media slot")}</div><div class="item-sub mono">${esc(x.pagePath||"")} · ${esc(x.slotId||"")}</div><div class="item-sub">${esc(x.alt||"No alt text")}</div></div><div class="row"><button class="btn" data-edit-web-media="${esc(recordId(x))}">Edit</button>${pill(x.status)}</div></div>`).join("")||`<div class="empty">No website presentation-media records yet.</div>`}</div></div>`;
}
function editorialAudit(){
  const issues=[];const pages=editorialPages(),copy=websiteRecords("article","CONTENT_BLOCK"),media=websiteRecords("banner","MEDIA_SLOT"),plans=websiteRecords("campaign","PAGE_PLAN");
  const allIds=new Map();for(const p of pages)for(const sec of p.sections||[])for(const f of sec.fields||[]){const k=f.id;if(allIds.has(k))issues.push({severity:"bad",page:p.label,item:k,message:`Duplicate content ID also registered on ${allIds.get(k)}.`});else allIds.set(k,p.label)}
  for(const p of pages){const c=presentationCounts(p);if(!plans.some(x=>x.pagePath===p.path))issues.push({severity:"warn",page:p.label,item:p.path,message:"No page-plan record."});if(!p.presentationRuntime&&(c.publishedCopy||c.publishedMedia))issues.push({severity:"bad",page:p.label,item:p.path,message:"Published presentation records exist but the catalog does not verify an installed Presentation Runtime."});for(const x of c.media){if(isPublished(x)&&!String(x.alt||"").trim())issues.push({severity:"bad",page:p.label,item:x.slotId||"media",message:"Published presentation media is missing alt text."});if((x.assetUrl||x.imageUrl)&&!isHttpUrl(x.assetUrl||x.imageUrl))issues.push({severity:"bad",page:p.label,item:x.slotId||"media",message:"Presentation asset URL is not HTTPS."})}for(const x of c.copy){if(isPublished(x)&&!String(x.value??x.body??"").trim())issues.push({severity:"bad",page:p.label,item:x.contentId||"copy",message:"Published copy is empty."})}}
  return issues;
}
function renderPresentationMatrix(){
  const el=$("panel-presentationmatrix");if(!el)return;const pages=catalogPages();el.innerHTML=`<div class="hero"><div><div class="eyebrow">Enterprise presentation registry</div><h2>Presentation Matrix</h2><p>One view of every registered route, source authority, editable hook, runtime status and publishing coverage.</p></div><div class="status-card"><div class="status-number">${pages.filter(p=>p.editorial).length}</div><div class="status-sub">editorial-enabled pages</div></div></div><div class="panel scroll"><h3>Page / authority / runtime matrix</h3><div class="grid"><div class="grid-head" style="grid-template-columns:1.2fr 1.2fr .8fr .55fr .55fr .7fr"><div>Page</div><div>Route</div><div>Authority</div><div>Fields</div><div>Media</div><div>Runtime</div></div><div class="grid-body">${pages.map(p=>{const c=presentationCounts(p);return `<div class="grid-row" style="grid-template-columns:1.2fr 1.2fr .8fr .55fr .55fr .7fr"><div class="cell"><b>${esc(p.label)}</b></div><div class="cell mono">${esc(p.path)}</div><div class="cell">${esc(p.authority||"")}</div><div class="cell">${c.fieldCount} · ${c.publishedCopy} live</div><div class="cell">${c.mediaCount} · ${c.publishedMedia} live</div><div class="cell">${p.presentationRuntime?'<span class="pill ok">Verified</span>':p.editorial?'<span class="pill warn">Needs live test</span>':'<span class="pill info">System-owned</span>'}</div></div>`}).join("")}</div></div></div>`;
}
function renderContentAudit(){
  const el=$("panel-contentaudit");if(!el)return;const issues=editorialAudit(),bad=issues.filter(x=>x.severity==="bad").length,warn=issues.filter(x=>x.severity==="warn").length;el.innerHTML=`<div class="hero"><div><div class="eyebrow">Automated governance</div><h2>Content Audit</h2><p>Static publication checks for catalog integrity, empty live copy, missing alt text, invalid media URLs, missing page plans and runtime coverage.</p></div><div class="status-card"><div class="status-number">${bad}</div><div class="status-sub">blocking findings · ${warn} warnings</div></div></div><div class="panel"><h3>Audit actions</h3><div class="row"><button class="btn primary" data-run-content-audit>Run audit</button><button class="btn" data-export-editorial-snapshot>Export editorial snapshot</button><button class="btn" data-action="brand-guard">Run brand guard</button><button class="btn" data-action="quality-lab">Run VOY quality lab</button></div></div><div class="panel scroll"><h3>Findings</h3><div class="admin-table">${issues.length?issues.map(x=>`<div class="admin-row"><div><div class="item-title">${esc(x.page)}</div><div class="item-sub mono">${esc(x.item)}</div><div class="item-sub">${esc(x.message)}</div></div><div>${x.severity==="bad"?'<span class="pill bad">Block</span>':'<span class="pill warn">Warn</span>'}</div></div>`).join(""):`<div class="empty">No static editorial findings.</div>`}</div></div>`;
}
function renderReleaseCenter(){
  const el=$("panel-releasecenter");if(!el)return;ensureCatalogSelections();const page=currentCatalogPage("release")||{},c=presentationCounts(page),plan=c.plans[0],all=[...c.copy,...c.media],draft=all.filter(x=>!["READY","PUBLISHED"].includes(statusUpper(x))).length,missingAlt=c.media.filter(x=>isPublished(x)&&!String(x.alt||"").trim()).length;const ready=page.editorial&&!!plan&&draft===0&&missingAlt===0&&(page.presentationRuntime||all.length===0);el.innerHTML=`<div class="hero"><div><div class="eyebrow">Controlled publishing</div><h2>Release Center</h2><p>Move a complete page presentation through draft, review, ready and published states from one governed workspace.</p></div><div class="status-card"><div class="status-number">${ready?"READY":"HOLD"}</div><div class="status-sub">${esc(page.label||"No page selected")}</div></div></div><div class="panel"><h3>Page release</h3><div class="field"><span class="label">Page</span><select id="releasePage">${pageOptions(editorialPages(),page.key)}</select></div><div class="kpi-row" style="margin-top:8px"><div class="kpi"><small>Copy</small><b>${c.copy.length}</b><div class="help">${c.publishedCopy} published</div></div><div class="kpi"><small>Media</small><b>${c.media.length}</b><div class="help">${c.publishedMedia} published</div></div><div class="kpi"><small>Outstanding</small><b>${draft}</b><div class="help">Not READY/PUBLISHED</div></div><div class="kpi"><small>Alt gaps</small><b>${missingAlt}</b><div class="help">Published media</div></div><div class="kpi"><small>Runtime</small><b>${page.presentationRuntime?"YES":"TEST"}</b><div class="help">Catalog verification</div></div></div><div class="row"><button class="btn" data-release-status="DRAFT">Return to draft</button><button class="btn warn" data-release-status="REVIEW">Send to review</button><button class="btn ok" data-release-status="READY">Mark ready</button><button class="btn primary" data-release-status="PUBLISHED">Publish page presentation</button><button class="btn" data-open-public-page="${esc(page.key||"")}">Open public page</button></div></div><div class="panel"><h3>Release checklist</h3><div class="kv"><div class="k">Page plan</div><div class="v">${plan?esc(plan.status||"DRAFT"):"Missing"}</div><div class="k">Editorial hooks</div><div class="v">${c.fieldCount} copy · ${c.mediaCount} media</div><div class="k">Unresolved records</div><div class="v">${draft}</div><div class="k">Published alt gaps</div><div class="v">${missingAlt}</div><div class="k">Presentation runtime</div><div class="v">${page.presentationRuntime?"Verified in catalog":"Requires live verification"}</div></div></div>`;
}
function saveWebsiteRecordWithStatus(record,status){const published=status==="PUBLISHED";if(record.presentationKind==="CONTENT_BLOCK")post("VOY_ADMIN_SAVE_ARTICLE",{article:{...record,status,published}});else if(record.presentationKind==="MEDIA_SLOT")post("VOY_ADMIN_SAVE_BANNER",{banner:{...record,status,published}});else if(record.presentationKind==="PAGE_PLAN")post("VOY_ADMIN_SAVE_CAMPAIGN",{campaign:{...record,status,published}})}
function releasePageTo(status){const page=currentCatalogPage("release");if(!page)return;const records=pageRecordSet(page.path),all=[...records.plans,...records.copy,...records.media];if(status==="PUBLISHED"&&!confirm(`Publish ${all.length} presentation record(s) for ${page.label}?`))return;if(!all.length){toast("No presentation records exist for this page.","bad");return}all.forEach(r=>saveWebsiteRecordWithStatus(r,status));toast(`${all.length} records queued for ${status}.`,status==="PUBLISHED"?"ok":"");refreshAfterSave(`release-${status.toLowerCase()}`)}
function exportEditorialSnapshot(){const payload={exportedAt:new Date().toISOString(),catalog:catalogPages(),pagePlans:websiteRecords("campaign","PAGE_PLAN"),contentBlocks:websiteRecords("article","CONTENT_BLOCK"),mediaSlots:websiteRecords("banner","MEDIA_SLOT"),audit:editorialAudit()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`skandi-media-control-editorial-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}

function renderDashboard(){
  const issue=currentIssue();
  const due=state.articles.filter(a=>["DRAFT","IN PROGRESS","REVIEW"].includes(String(a.status||"").toUpperCase())).length;
  const adSlots=state.banners.filter(b=>b.active!==false).length;
  const pages=issuePages();
  $("panel-dashboard").innerHTML=`
    <div class="hero">
      <div>
        <div class="eyebrow">SKANDI SKANDI publishing & website studio</div>
        <h2>Magazine & website control room</h2>
        <p>Plan and publish VOY, Newsroom and public-site presentation from one controlled workspace. Website copy, hero/card/ad presentation slots and shared assets are managed here; Inventory-owned facts and Inventory-owned media remain read-only and outside this editor.</p>
      </div>
      <div class="status-card">
        <span class="status-pill">Active issue</span>
        <div class="status-number">${esc(issue?.edition || "No issue")}</div>
        <div class="status-sub">${esc(issue?.title || "Create or select an issue to start building the magazine.")}</div>
      </div>
    </div>
    <div class="kpi-row">
      <div class="kpi"><small>Issues</small><b>${state.issues.length}</b><div class="help">VOY publications</div></div>
      <div class="kpi"><small>Pages</small><b>${state.pages.length}</b><div class="help">Magazine layouts</div></div>
      <div class="kpi"><small>Article tasks</small><b>${state.articles.length}</b><div class="help">Editorial pipeline</div></div>
      <div class="kpi"><small>Open editorial</small><b>${due}</b><div class="help">Draft/review work</div></div>
      <div class="kpi"><small>Assets</small><b>${state.assets.length}</b><div class="help">Media library</div></div>
      <div class="kpi"><small>Ad slots</small><b>${adSlots}</b><div class="help">Active banners/campaigns</div></div>
    </div>
    <div class="split">
      <div class="panel scroll"><h3>Current issue page plan</h3>${pages.length?pages.map(pageRow).join(""):`<div class="empty">No pages yet. Open Magazine Builder and add cover/feature/catalogue pages.</div>`}</div>
      <div class="stack">
        <div class="panel"><h3>Production actions</h3>
          <div class="row"><button class="btn primary" data-action="new-issue">New issue</button><button class="btn" data-action="new-page">New page</button><button class="btn" data-action="new-article">New article brief</button><button class="btn ok" data-action="publish-issue">Publish to VOY Magazine</button><button class="btn" data-action="export-print">Export print package</button></div>
        </div>
        <div class="panel"><h3>PR / marketing readiness</h3>
          <div class="kv"><div class="k">SEO status</div><div class="v">${esc(state.seoResult?.score || "Not checked")}</div><div class="k">Campaigns</div><div class="v">${state.campaigns.length}</div><div class="k">Approvals</div><div class="v">${state.approvals.filter(a=>a.status!=="APPROVED").length} open</div></div>
        </div>
      </div>
    </div>`;
}
function pageRow(p){
  return `<article class="admin-row" data-page="${esc(p.pageId||p._id)}"><div><div class="news-meta">${pill(p.status)}<span class="pill">Page ${esc(p.pageNo||"—")}</span><span class="pill">${esc(p.template||"feature")}</span></div><div class="item-title">${esc(p.title||"Untitled page")}</div><div class="item-sub">${esc(p.kicker||"")} · ${esc((p.body||"").slice(0,160))}</div></div><div class="row"><button class="btn" data-edit-page="${esc(p.pageId||p._id)}">Edit</button><button class="btn bad" data-delete-page="${esc(p.pageId||p._id)}">Delete</button></div></article>`;
}
function renderIssues(){
  const q=String($("globalQuery")?.value||"").toLowerCase();
  const items=state.issues.filter(i=>!q||[i.title,i.edition,i.slug,i.summary,arr(i.categories).join(" ")].join(" ").toLowerCase().includes(q));
  $("panel-issues").innerHTML=`
  <div class="split">
    <div class="panel scroll">
      <h3>VOY issues</h3>
      <div class="row" style="margin-bottom:8px"><button class="btn primary" data-action="new-issue">New issue</button><button class="btn" data-action="new-standard-issue">New VOY issue from current edition</button></div>
      <div class="admin-table">${items.length?items.map(i=>`<article class="admin-row ${currentIssueId()===(i.issueId||i._id)?"selected":""}"><div><div class="news-meta">${pill(i.publishStatus)}${arr(i.categories).slice(0,4).map(c=>`<span class="pill">${esc(c)}</span>`).join("")}</div><div class="item-title">${esc(i.title||"Untitled issue")}</div><div class="item-sub">${esc(i.edition||"")} · ${esc(i.summary||"")}</div></div><div class="row"><button class="btn" data-select-issue="${esc(i.issueId||i._id)}">Select</button><button class="btn" data-edit-issue="${esc(i.issueId||i._id)}">Adjust</button><button class="btn ok" data-publish-issue="${esc(i.issueId||i._id)}">Publish</button><button class="btn warn" data-archive-issue="${esc(i.issueId||i._id)}">Archive</button><button class="btn bad" data-delete-issue="${esc(i.issueId||i._id)}">Delete</button></div></article>`).join(""):`<div class="empty">No issues found.</div>`}</div>
    </div>
    <div class="panel scroll">
      <h3 id="issueEditorTitle">${state.editingIssueId?"Adjust issue":"Add VOY issue"}</h3>
      <div class="notice">PDF and media upload are handled through the secure upload connector. This editor sends metadata, page plan, campaign and export requests to the backend.</div>
      ${issueEditorForm(state.issues.find(i=>(i.issueId||i._id)===state.editingIssueId)||{})}
    </div>
  </div>`;
}
function issueEditorForm(i={}){
  return `<div class="admin-grid" style="margin-top:8px">
    <div class="field wide"><label class="label">Title</label><input class="input" id="issueTitle" value="${esc(i.title||"")}" placeholder="VOY Atelier — Summer Escapes"></div>
    <div class="field"><label class="label">Edition</label><input class="input" id="issueEdition" value="${esc(i.edition||"")}" placeholder="Issue 01 / Summer 2026"></div>
    <div class="field"><label class="label">Slug</label><input class="input" id="issueSlug" value="${esc(i.slug||"")}" placeholder="summer-escapes-2026"></div>
    <div class="field"><label class="label">Publish date</label><input class="input" id="issuePublishDate" type="date" value="${esc(String(i.publishDate||"").slice(0,10))}"></div>
    <div class="field"><label class="label">Publication status (use Publish / Archive)</label><select id="issuePublishStatus" disabled>${["DRAFT","REVIEW","PUBLISHED","ARCHIVED"].map(s=>`<option ${String(i.publishStatus||"DRAFT")===s?"selected":""}>${s}</option>`).join("")}</select></div>
    <div class="field"><label class="label">Featured</label><select id="issueFeatured"><option value="false">No</option><option value="true" ${i.featured?"selected":""}>Yes</option></select></div>
    <div class="field wide"><label class="label">Categories</label><input class="input" id="issueCategories" value="${esc(arr(i.categories).join(", "))}" placeholder="Destinations, Hotels, Culture"></div>
    <div class="field wide"><label class="label">Destinations</label><input class="input" id="issueDestinations" value="${esc(arr(i.destinations).join(", "))}" placeholder="Crete, Mallorca, New York"></div>
    <div class="field wide"><label class="label">Cover image asset</label><input class="input" id="issueCoverImage" value="${esc(i.coverImageUrl||i.coverImage||"")}" placeholder="Select or upload a Supabase asset" readonly></div>
    <div class="field full"><label class="label">Summary</label><textarea id="issueSummary" placeholder="Short public summary">${esc(i.summary||"")}</textarea></div>
    <div class="field full"><label class="label">Search text / article topics</label><textarea id="issueSearchText" placeholder="Add keywords, article titles, topics and OCR text.">${esc(i.searchText||"")}</textarea></div>
    <div class="field full"><label class="label">Print settings</label><input class="input" id="issuePrintSettings" value="${esc(i.printSettings||"A4, 3mm bleed, CMYK export by backend")}"></div>
  </div>
  <div class="row" style="margin-top:8px"><button class="btn primary" data-action="save-issue">Save issue metadata</button><button class="btn" data-action="save-issue-upload">Upload PDF and save</button><button class="btn ok" data-action="publish-issue">Publish to VOY Magazine</button><button class="btn" data-action="clear-issue">Clear</button></div>`;
}
function collectIssue(){
  return {issueId:state.editingIssueId||state.selectedIssueId||uid("ISSUE"),title:$("issueTitle").value.trim(),edition:$("issueEdition").value.trim(),slug:$("issueSlug").value.trim(),publishDate:$("issuePublishDate").value,publishStatus:$("issuePublishStatus").value,featured:$("issueFeatured").value==="true",categories:arr($("issueCategories").value),destinations:arr($("issueDestinations").value),coverImageUrl:$("issueCoverImage").value.trim(),summary:$("issueSummary").value.trim(),searchText:$("issueSearchText").value.trim(),printSettings:$("issuePrintSettings").value.trim()};
}
function renderBuilder(){
  const issue=currentIssue();
  const pages=issuePages();
  const p=currentPage()||{};
  const activeTemplate=p.template||"cover";
  $("panel-builder").innerHTML=`
  <div class="split wide">
    <div class="stack">
      <div class="panel scroll"><h3>Issue pages</h3>
        <div class="row" style="margin-bottom:8px"><select id="builderIssueSelect">${state.issues.map(i=>`<option value="${esc(i.issueId||i._id)}" ${currentIssueId()===(i.issueId||i._id)?"selected":""}>${esc(i.edition||i.title||i.issueId)}</option>`).join("")}</select><button class="btn primary" data-action="new-page">Add page</button><button class="btn" data-action="add-standard-pages">Add all layout types</button><button class="btn ok" data-action="load-current-voy">Load Current VOY</button></div>
        <div class="admin-table">${pages.length?pages.map(pageRow).join(""):`<div class="empty">No pages in this issue yet.</div>`}</div>
      </div>
      <div class="panel scroll"><h3>Layout templates</h3><div class="template-grid">${templates.map(t=>templateCard(t,activeTemplate)).join("")}</div></div>
    </div>
    <div class="panel scroll">
      <h3>Page editor</h3>
      <div class="mm-page-actions"><button class="btn" data-action="move-page-up">Move up</button><button class="btn" data-action="move-page-down">Move down</button><button class="btn" data-action="copy-page">Duplicate</button><button class="btn bad" data-action="delete-current-page">Remove page</button></div>
      ${pageEditorForm(p)}
    </div>
    <div class="stack">
      <div class="panel" style="display:flex;flex-direction:column;min-height:0">
        <h3>Live page preview</h3>
        <div class="row" style="margin-bottom:8px"><button class="btn" data-action="toggle-bleed">Bleed / safety</button><button class="btn primary" data-action="print-page">Print page</button><button class="btn ok" data-action="export-page-pdf">Export PDF</button></div>
        <div class="mag-preview-wrap">${magPreview(p)}</div>
      </div>
    </div>
  </div>`;
}
function templateCard(t,active){return `<div class="template-card ${t.cls} ${active===t.id?"active":""}" data-template="${esc(t.id)}"><div class="template-thumb"><span class="t-block dark"></span><span class="t-block light"></span><span class="t-block"></span></div><div class="template-title">${esc(t.title)}</div><div class="template-sub">${esc(t.sub)}</div></div>`}
function pageEditorForm(p={}){
  return `<div class="admin-grid">
    <div class="field"><label class="label">Page No.</label><input id="pageNo" class="input" type="number" value="${esc(p.pageNo||nextPageNo())}"></div>
    <div class="field"><label class="label">Template</label><select id="pageTemplate">${templates.map(t=>`<option value="${t.id}" ${String(p.template||"cover")===t.id?"selected":""}>${esc(t.title)}</option>`).join("")}</select></div>
    <div class="field"><label class="label">Status</label><select id="pageStatus">${["DRAFT","IN PROGRESS","REVIEW","APPROVED","PUBLISHED"].map(s=>`<option ${String(p.status||"DRAFT")===s?"selected":""}>${s}</option>`).join("")}</select></div>
    <div class="field"><label class="label">Category</label><input id="pageCategory" class="input" value="${esc(p.category||"")}" placeholder="Destinations"></div>
    <div class="field wide"><label class="label">Kicker</label><input id="pageKicker" class="input" value="${esc(p.kicker||"")}" placeholder="Mediterranean Escape"></div>
    <div class="field wide"><label class="label">Title / headline</label><input id="pageTitle" class="input" value="${esc(p.title||"")}" placeholder="Island light, slow mornings and blue horizons"></div>
    <div class="field full"><label class="label">Deck / standfirst</label><textarea id="pageDeck" placeholder="Short lead paragraph for the page">${esc(p.deck||"")}</textarea></div>
    <div class="field full"><label class="label">Body copy</label><textarea id="pageBody" style="min-height:180px" placeholder="Magazine article copy, destination guide, offer text or advertorial">${esc(p.body||"")}</textarea></div>
    <div class="field wide"><label class="label">Hero image asset</label><input id="pageImageUrl" class="input" value="${esc(p.imageUrl||"")}" placeholder="Select or upload a Supabase asset" readonly></div>
    <div class="field"><label class="label">Hero image fit</label><select id="pageImageFit"><option ${String(p.imageFit||"cover")==="cover"?"selected":""}>cover</option><option ${String(p.imageFit||"")==="contain"?"selected":""}>contain</option></select></div>
    <div class="field"><label class="label">Hero image position</label><input id="pageImagePosition" class="input" value="${esc(p.imagePosition||"center center")}" placeholder="center 45%"></div>
    <div class="field wide"><label class="label">Secondary image asset</label><input id="pageSecondaryImageUrl" class="input" value="${esc(p.secondaryImageUrl||"")}" placeholder="Select or upload a Supabase asset" readonly></div>
    <div class="field wide"><label class="label">Image credit / license</label><input id="pageImageCredit" class="input" value="${esc(p.imageCredit||"")}" placeholder="Photographer / Provider / License"></div>
    <div class="field"><label class="label">Destination</label><input id="pageDestination" class="input" value="${esc(p.destination||"")}" placeholder="Mallorca"></div>
    <div class="field"><label class="label">CTA label</label><input id="pageCtaLabel" class="input" value="${esc(p.ctaLabel||"Book the journey")}"></div>
    <div class="field wide"><label class="label">CTA path / URL</label><input id="pageCtaPath" class="input" value="${esc(p.ctaPath||"")}"></div>
    <div class="mm-page-style-grid">
      <div class="field"><label class="label">Background color</label><input id="pageBackgroundColor" class="input" type="color" value="${esc(normalizeHex(p.backgroundColor,"#ffffff"))}"></div>
      <div class="field"><label class="label">Text color</label><input id="pageTextColor" class="input" type="color" value="${esc(normalizeHex(p.textColor,"#103154"))}"></div>
      <div class="field"><label class="label">Accent color</label><input id="pageAccentColor" class="input" type="color" value="${esc(normalizeHex(p.accentColor,"#4dcad6"))}"></div>
      <div class="field"><label class="label">Heading font</label><select id="pageHeadingFont">${fontOptions(p.headingFont||"Montserrat")}</select></div>
      <div class="field"><label class="label">Body font</label><select id="pageBodyFont">${fontOptions(p.bodyFont||"Inter")}</select></div>
      <div class="field wide"><label class="label">Footer text</label><input id="pageFooterText" class="input" value="${esc(p.footerText||"VOY by SKANDI · skanditravels.com")}"></div>
      <div class="mm-template-note">This template has structured, repeatable content. Edit the items below visually, including Supabase image/logo assets. You can add, remove and reorder items without editing HTML.</div>
      ${renderBlockEditor(p)}
      <details class="mm-block-source"><summary>Advanced JSON source</summary><div class="field full" style="margin-top:6px"><label class="label">Template data (JSON array)</label><textarea id="pageBlocks" style="min-height:150px">${esc(formatBlocks(p.blocks))}</textarea></div></details>
    </div>
    <div class="field full"><label class="label">SEO / social notes</label><textarea id="pageSeoNotes">${esc(p.seoNotes||"")}</textarea></div>
  </div>
  <div class="row" style="margin-top:8px"><button class="btn primary" data-action="save-page">Save page</button><button class="btn" data-action="request-copy-assist">Copy assist</button><button class="btn" data-action="seo-check">SEO check</button></div>`;
}
function normalizeHex(value,fallback){const v=String(value||"").trim();return /^#[0-9a-f]{6}$/i.test(v)?v:fallback}
function fontOptions(selected){return ["Montserrat","Inter","Playfair Display","Cormorant Garamond","Georgia","Arial"].map(f=>`<option ${selected===f?"selected":""}>${f}</option>`).join("")}
function parseBlocks(value){
  if(Array.isArray(value))return value;
  if(!value)return [];
  try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[]}catch(e){return []}
}
function formatBlocks(value){const blocks=parseBlocks(value);return blocks.length?JSON.stringify(blocks,null,2):"[]"}
function collectPage(){
  const issueId=currentIssueId()||state.selectedIssueId||"";
  const p=currentPage()||{};
  let blocks=collectVisualBlocks();if(!blocks){try{blocks=JSON.parse($("pageBlocks").value||"[]");if(!Array.isArray(blocks))throw new Error("array")}catch(e){throw new Error("Template data must be a valid JSON array.")}}
  return {pageId:p.pageId||p._id||state.selectedPageId||uid("PAGE"),issueId,pageNo:Number($("pageNo").value||0),template:$("pageTemplate").value,status:$("pageStatus").value,category:$("pageCategory").value.trim(),kicker:$("pageKicker").value.trim(),title:$("pageTitle").value.trim(),deck:$("pageDeck").value.trim(),body:$("pageBody").value.trim(),imageUrl:$("pageImageUrl").value.trim(),secondaryImageUrl:$("pageSecondaryImageUrl").value.trim(),imageCredit:$("pageImageCredit").value.trim(),imageFit:$("pageImageFit")?.value||"cover",imagePosition:$("pageImagePosition")?.value.trim()||"center center",destination:$("pageDestination").value.trim(),ctaLabel:$("pageCtaLabel").value.trim(),ctaPath:$("pageCtaPath").value.trim(),backgroundColor:$("pageBackgroundColor").value,textColor:$("pageTextColor").value,accentColor:$("pageAccentColor").value,headingFont:$("pageHeadingFont").value,bodyFont:$("pageBodyFont").value,footerText:$("pageFooterText").value.trim(),blocks,seoNotes:$("pageSeoNotes").value.trim(),updatedAt:new Date().toISOString()};
}
function nextPageNo(){return issuePages().reduce((m,p)=>Math.max(m,Number(p.pageNo||0)),0)+1}
function magPreview(p={}){
  const tpl=p.template||"cover";
  const title=esc(p.title||"Untitled VOY Page");
  const kicker=esc(p.kicker||"VOY Magazine");
  const deck=esc(p.deck||"Travel inspiration, destination stories and curated SKANDI recommendations.");
  const body=esc(p.body||"Start writing the article copy here. Build a destination feature, hotel spotlight, onboard magazine story, or campaign-ready catalogue page.").replace(/\n/g,"<br>");
  const cta=esc(p.ctaLabel||"Explore more");
  const vars=previewVars(p);
  const hero=previewImage(p.imageUrl);
  const second=previewImage(p.secondaryImageUrl||p.imageUrl);
  const credit=p.imageCredit?`<div class="voyp-credit">Image: ${esc(p.imageCredit)}</div>`:"";
  const footer=`<footer class="voyp-footer"><span>${esc(p.footerText||"VOY by SKANDI · skanditravels.com")}</span><b>${esc(p.pageNo||"")}</b></footer>`;
  const defaults={
    contents:[{title:"Welcome aboard",meta:"03"},{title:"The blue issue",meta:"06"},{title:"Greece, four ways",meta:"07"},{title:"Worth the detour",meta:"09"},{title:"Travel well",meta:"10"},{title:"Airline & airport guide",meta:"11"}],
    offers:[{title:"Athens city break",subtitle:"3 nights · selected hotel",price:"From $899"},{title:"Santorini escape",subtitle:"5 nights · breakfast",price:"From $1,249"},{title:"Crete family week",subtitle:"7 nights · transfers",price:"From $1,499"},{title:"Rhodes adults escape",subtitle:"7 nights · selected resort",price:"From $1,329"}],
    destinations:[{title:"Athens",subtitle:"Culture and city energy"},{title:"Santorini",subtitle:"Clifftop views and slow evenings"},{title:"Crete",subtitle:"Beaches, villages and food"},{title:"Rhodes",subtitle:"History and clear water"}],
    experiences:[{title:"Cook with a local",subtitle:"A market-to-table afternoon"},{title:"Sail into sunset",subtitle:"Small-group Aegean cruise"},{title:"Walk ancient paths",subtitle:"History beyond the guidebook"}],
    tips:[{title:"Before you fly",body:"Check documents, baggage and transfer details."},{title:"Pack lighter",body:"Choose pieces that work from beach to dinner."},{title:"Arrive ready",body:"Save key numbers and the SKANDI support line."}],
    airlines:[{title:"SKANDI partner airline",subtitle:"New York · Copenhagen · Athens",meta:"Economy · Premium · Business"},{title:"Regional connection",subtitle:"Athens · Crete · Rhodes",meta:"Cabin baggage included"}],
    airports:[{title:"JFK · New York",subtitle:"Departure terminal and check-in details"},{title:"CPH · Copenhagen",subtitle:"Easy Nordic connection"},{title:"ATH · Athens",subtitle:"Gateway to the islands"}],
    signature:[{title:"The Aegean House",subtitle:"Santorini",meta:"SKANDI Signature Collection"},{title:"Cretan Coast Retreat",subtitle:"Crete",meta:"SKANDI Signature Collection"}]
  };
  const items=(fallback)=>previewBlocks(p,fallback);
  const cards=(rows,cls="")=>rows.map(x=>`<article class="voyp-card ${cls}">${x.imageUrl?`<div class="voyp-card-img" ${previewImage(x.imageUrl)}></div>`:""}<small>${esc(x.meta||x.kicker||"")}</small><h3>${esc(x.title||"Untitled")}</h3><p>${esc(x.subtitle||x.body||"")}</p>${x.price?`<b class="voyp-price">${esc(x.price)}</b>`:""}${x.cta?`<span class="voyp-cta">${esc(x.cta)}</span>`:""}</article>`).join("");
  if(tpl==="cover")return `<div class="mag-page bleed"><section class="voyp voyp-cover" ${previewVars(p,p.imageUrl)}><div class="voyp-cover-top"><b>VOY</b><span>BY SKANDI</span></div><div class="voyp-cover-copy"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><div class="voyp-cover-lines">${items(defaults.contents).slice(0,3).map(x=>`<span>${esc(x.title)}</span>`).join("")}</div><em>${esc(currentIssue()?.edition||"Special Edition")}</em></div>${credit}</section></div>`;
  if(tpl==="contents")return `<div class="mag-page bleed"><section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title||"Inside VOY"}</h1><p>${deck}</p></header><div class="voyp-contents">${items(defaults.contents).map((x,i)=>`<div><b>${esc(x.meta||String(i+1).padStart(2,"0"))}</b><span><strong>${esc(x.title)}</strong><em>${esc(x.subtitle||"")}</em></span></div>`).join("")}</div><aside class="voyp-note">${body}</aside>${footer}</section></div>`;
  if(tpl==="brand-feature")return `<div class="mag-page bleed"><section class="voyp voyp-split" ${vars}><div class="voyp-split-img" ${hero}></div><div class="voyp-split-copy"><small>${kicker}</small><h1>${title}</h1><p class="voyp-lead">${deck}</p><div class="voyp-columns">${body}</div><span class="voyp-rule"></span></div>${credit}${footer}</section></div>`;
  if(tpl==="offers")return `<div class="mag-page bleed"><section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-card-grid voyp-offers">${cards(items(defaults.offers),"offer")}</div><p class="voyp-smallprint">${body}</p>${footer}</section></div>`;
  if(tpl==="section-opener")return `<div class="mag-page bleed"><section class="voyp voyp-opener" ${previewVars(p,p.imageUrl)}><div><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><span>${esc(p.destination||"Explore with SKANDI")}</span></div>${credit}</section></div>`;
  if(tpl==="feature")return `<div class="mag-page bleed"><section class="voyp voyp-feature" ${vars}><div class="voyp-feature-img" ${hero}></div><article><small>${kicker}</small><h1>${title}</h1><p class="voyp-lead">${deck}</p><div class="voyp-columns">${body}</div></article>${credit}${footer}</section></div>`;
  if(tpl==="destination-grid")return `<div class="mag-page bleed"><section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-destination-grid">${cards(items(defaults.destinations))}</div>${footer}</section></div>`;
  if(tpl==="nightlife")return `<div class="mag-page bleed"><section class="voyp voyp-night" ${previewVars(p,p.imageUrl)}><div class="voyp-night-card"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><div>${body}</div></div>${credit}${footer}</section></div>`;
  if(tpl==="experiences")return `<div class="mag-page bleed"><section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-experience-grid">${cards(items(defaults.experiences))}</div><div class="voyp-wide-copy">${body}</div>${footer}</section></div>`;
  if(tpl==="travel-well")return `<div class="mag-page bleed"><section class="voyp voyp-tips" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-tip-list">${items(defaults.tips).map((x,i)=>`<article><b>${String(i+1).padStart(2,"0")}</b><div><h3>${esc(x.title)}</h3><p>${esc(x.body||x.subtitle||"")}</p></div></article>`).join("")}</div><aside ${second}></aside>${footer}</section></div>`;
  if(tpl==="airline-guide")return `<div class="mag-page bleed"><section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-guide-list">${items(defaults.airlines).map(x=>`<article><div>${logoAssetValue(x.logoUrl)||logoAssetValue(x.secondaryLogoUrl)?`<div class="voyp-logo-pair">${logoAssetValue(x.logoUrl)?`<img class="voyp-logo" src="${esc(logoAssetValue(x.logoUrl))}" alt="${esc(x.title||"Airline")} logo">`:""}${logoAssetValue(x.secondaryLogoUrl)?`<img class="voyp-logo" src="${esc(logoAssetValue(x.secondaryLogoUrl))}" alt="${esc(x.title||"Airline")} secondary logo">`:""}</div>`:""}<small>${esc(x.meta||"")}</small><h3>${esc(x.title)}</h3><p>${esc(x.subtitle||x.body||"")}</p></div><span>${esc(x.cta||"Profile")}</span></article>`).join("")}</div><div class="voyp-wide-copy">${body}</div>${footer}</section></div>`;
  if(tpl==="onboard-guide")return `<div class="mag-page bleed"><section class="voyp voyp-onboard" ${vars}><div class="voyp-feature-img" ${hero}></div><article><small>${kicker}</small><h1>${title}</h1><p class="voyp-lead">${deck}</p><div class="voyp-service-grid">${cards(items(defaults.tips))}</div></article>${footer}</section></div>`;
  if(tpl==="airport-guide")return `<div class="mag-page bleed"><section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-guide-list">${items(defaults.airports).map(x=>`<article class="voyp-airport-row">${logoAssetValue(x.logoUrl)?`<div class="voyp-airport-logo"><img src="${esc(logoAssetValue(x.logoUrl))}" alt="${esc(x.title||x.code||"Airport")} logo"></div>`:`<div class="voyp-airport-logo"><b>${esc(x.code||"APT")}</b></div>`}<div><small>${esc([x.code,x.location,x.meta].filter(Boolean).join(" · "))}</small><h3>${esc(x.title||x.code||"Airport")}</h3><p>${esc(x.role||x.subtitle||x.body||"")}</p></div><span>${esc(x.meta||"Airport")}</span></article>`).join("")}</div><div class="voyp-wide-copy">${body}</div>${footer}</section></div>`;
  if(tpl==="route-map")return `<div class="mag-page bleed"><section class="voyp voyp-map" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-map-art"><span class="dot nyc">NYC</span><span class="dot cph">CPH</span><span class="dot ath">ATH</span><span class="dot isl">ISLANDS</span><i class="route r1"></i><i class="route r2"></i><i class="route r3"></i></div><div class="voyp-route-list">${items(defaults.airlines).map(x=>`<div><b>${esc(x.title)}</b><span>${esc(x.subtitle||x.body||"")}</span></div>`).join("")}</div>${footer}</section></div>`;
  if(tpl==="airline-profile")return `<div class="mag-page bleed"><section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-airline-profiles">${items([]).map(x=>`<article class="voyp-airline-profile">${logoAssetValue(x.logoUrl)||logoAssetValue(x.secondaryLogoUrl)?`<div class="voyp-logo-pair">${logoAssetValue(x.logoUrl)?`<img class="voyp-logo" src="${esc(logoAssetValue(x.logoUrl))}" alt="${esc(x.title||"Airline")} logo">`:""}${logoAssetValue(x.secondaryLogoUrl)?`<img class="voyp-logo" src="${esc(logoAssetValue(x.secondaryLogoUrl))}" alt="${esc(x.title||"Airline")} secondary logo">`:""}</div>`:""}<small>${esc(x.subtitle||"")}</small><h3>${esc(x.title||"Airline")}</h3><p>${esc(x.body||"")}</p><div class="cabins">${String(x.meta||"").split("·").map(c=>c.trim()).filter(Boolean).map(c=>`<span>${esc(c)}</span>`).join("")}</div><div class="voyp-factgrid"><div><b>Seat & comfort</b><span>${esc(x.seat||"")}</span></div><div><b>Baggage</b><span>${esc(x.baggage||"")}</span></div><div><b>Food & drink</b><span>${esc(x.food||"")}</span></div><div><b>Wi-Fi & power</b><span>${esc(x.wifi||"")}</span></div><div><b>Airport benefits</b><span>${esc(x.airport||"")}</span></div><div><b>Loyalty</b><span>${esc(x.loyalty||"")}</span></div></div><div class="voyp-profile-tip"><b>VOY tip</b>${esc(x.tip||x.booking||"")}</div></article>`).join("")}</div>${footer}</section></div>`;
  if(tpl==="transfer-promise")return `<div class="mag-page bleed"><section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-transfer-grid">${cards(items(defaultBlocksForTemplate("transfer-promise")))}</div><div class="voyp-transfer-banner">${body}</div>${footer}</section></div>`;
  if(tpl==="signature-collection")return `<div class="mag-page bleed"><section class="voyp voyp-signature" ${vars}><div class="voyp-signature-hero" ${hero}><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></div><div class="voyp-signature-cards">${cards(items(defaults.signature))}</div>${footer}</section></div>`;
  return `<div class="mag-page bleed"><section class="voyp voyp-back" ${previewVars(p,p.imageUrl)}><div><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><span class="voyp-back-cta">${cta}</span><em>${esc(p.ctaPath||"skanditravels.com")}</em></div>${credit}</section></div>`;
}
function previewBlocks(p,fallback){const rows=parseBlocks(p.blocks);return rows.length?rows:fallback}
function previewImage(url,p=currentPage()||{}){const value=String(url||"").trim().replace(/["'()]/g,"");const fit=String(p.imageFit||"cover")==="contain"?"contain":"cover";const pos=String(p.imagePosition||"center center").replace(/["'<>]/g,"");return value?`style="background-image:url(${value});background-size:${fit};background-position:${pos};background-repeat:no-repeat"`:""}
function previewVars(p,imageUrl=""){
  const fonts=["Montserrat","Inter","Playfair Display","Cormorant Garamond","Georgia","Arial"];
  const heading=fonts.includes(p.headingFont)?p.headingFont:"Montserrat";
  const body=fonts.includes(p.bodyFont)?p.bodyFont:"Inter";
  const bg=String(imageUrl||"").trim().replace(/["'()]/g,"");
  const fit=String(p.imageFit||"cover")==="contain"?"contain":"cover";
  const pos=String(p.imagePosition||"center center").replace(/["'<>]/g,"");
  return `style="--p-bg:${normalizeHex(p.backgroundColor,"#ffffff")};--p-text:${normalizeHex(p.textColor,"#103154")};--p-accent:${normalizeHex(p.accentColor,"#4dcad6")};--p-heading:'${heading}';--p-body:'${body}';${bg?`background-image:url(${bg});background-size:${fit};background-position:${pos};background-repeat:no-repeat;`:""}"`;
}
function renderArticles(){
  const q=String($("globalQuery")?.value||"").toLowerCase();
  const items=state.articles.filter(a=>!q||[a.title,a.destination,a.writer,a.status,a.tags].join(" ").toLowerCase().includes(q));
  const article=currentArticle()||{};
  $("panel-articles").innerHTML=`
  <div class="split">
    <div class="panel scroll"><h3>Editorial article board</h3><div class="row" style="margin-bottom:8px"><button class="btn primary" data-action="new-article">New article brief</button><button class="btn" data-action="request-pr-brief">Generate PR brief</button></div>
      <div class="admin-table">${items.length?items.map(a=>`<article class="admin-row"><div><div class="news-meta">${pill(a.status)}<span class="pill">${esc(a.destination||"General")}</span><span class="pill">${esc(a.contentType||"Feature")}</span></div><div class="item-title">${esc(a.title||"Untitled article")}</div><div class="item-sub">${esc(a.writer||"Unassigned")} · ${esc((a.brief||"").slice(0,150))}</div></div><div class="row"><button class="btn" data-edit-article="${esc(a.articleId||a._id)}">Edit</button><button class="btn bad" data-delete-article="${esc(a.articleId||a._id)}">Delete</button></div></article>`).join(""):`<div class="empty">No article briefs yet.</div>`}</div>
    </div>
    <div class="panel scroll"><h3>Article brief / assignment</h3>${articleForm(article)}</div>
  </div>`;
}
function articleForm(a={}){
  return `<div class="admin-grid">
    <div class="field wide"><label class="label">Title</label><input id="articleTitle" class="input" value="${esc(a.title||"")}" placeholder="36 Hours in Palma"></div>
    <div class="field"><label class="label">Type</label><select id="articleType">${["Feature","Destination Guide","Hotel Spotlight","Advertorial","Interview","Food & Culture","Shopping","Itinerary"].map(x=>`<option ${String(a.contentType||"Feature")===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label class="label">Status</label><select id="articleStatus">${["DRAFT","IN PROGRESS","REVIEW","APPROVED","READY","PUBLISHED"].map(x=>`<option ${String(a.status||"DRAFT")===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label class="label">Writer</label><input id="articleWriter" class="input" value="${esc(a.writer||"")}"></div>
    <div class="field"><label class="label">Deadline</label><input id="articleDeadline" type="date" class="input" value="${esc(String(a.deadline||"").slice(0,10))}"></div>
    <div class="field"><label class="label">Destination</label><input id="articleDestination" class="input" value="${esc(a.destination||"")}"></div>
    <div class="field"><label class="label">Target words</label><input id="articleTargetWords" type="number" class="input" value="${esc(a.targetWords||900)}"></div>
    <div class="field wide"><label class="label">Tags</label><input id="articleTags" class="input" value="${esc(arr(a.tags).join(", "))}" placeholder="Mallorca, luxury, families"></div>
    <div class="field full"><label class="label">Editorial brief</label><textarea id="articleBrief">${esc(a.brief||"")}</textarea></div>
    <div class="field full"><label class="label">SEO title / meta description</label><textarea id="articleSeo">${esc(a.seo||"")}</textarea></div>
    <div class="field full"><label class="label">Social copy / PR hook</label><textarea id="articleSocial">${esc(a.socialCopy||"")}</textarea></div>
  </div>
  <div class="row" style="margin-top:8px"><button class="btn primary" data-action="save-article">Save article</button><button class="btn" data-action="send-approval">Send approval</button><button class="btn" data-action="request-copy-assist-article">Copy assist</button></div>`;
}
function collectArticle(){
  const a=currentArticle()||{};
  return {articleId:a.articleId||a._id||state.selectedArticleId||uid("ARTICLE"),issueId:currentIssueId(),title:$("articleTitle").value.trim(),contentType:$("articleType").value,status:$("articleStatus").value,writer:$("articleWriter").value.trim(),deadline:$("articleDeadline").value,destination:$("articleDestination").value.trim(),targetWords:Number($("articleTargetWords").value||0),tags:arr($("articleTags").value),brief:$("articleBrief").value.trim(),seo:$("articleSeo").value.trim(),socialCopy:$("articleSocial").value.trim(),updatedAt:new Date().toISOString()};
}
function renderAssets(){
  $("panel-assets").innerHTML=`
  <div class="split">
    <div class="panel scroll"><h3>External media references</h3>
      <div class="admin-grid">
        <div class="field"><label class="label">Provider</label><select id="assetProvider"><option>openverse</option><option>unsplash</option><option>pexels</option><option>pixabay</option><option>wikimedia_commons</option></select></div>
        <div class="field wide"><label class="label">Search</label><input id="assetQuery" class="input" placeholder="Mallorca beach aerial, Crete village, Nordic cabin"></div>
        <div class="field"><label class="label">License</label><select id="assetLicense"><option>commercial-safe</option><option>cc0</option><option>cc-by</option><option>public-domain</option><option>provider-standard</option></select></div>
        <div class="field"><label class="label">Orientation</label><select id="assetOrientation"><option>any</option><option>landscape</option><option>portrait</option><option>square</option></select></div>
      </div>
      <div class="row" style="margin:8px 0"><button class="btn primary" data-action="search-assets">Search assets</button><button class="btn" data-action="clear-asset-results">Clear results</button></div>
      <div class="asset-grid">${state.assetResults.length?state.assetResults.map(assetCard).join(""):`<div class="empty">No external reference results yet. External results are references only; upload an approved copy to Supabase Storage before using it in VOY.</div>`}</div>
    </div>
    <div class="panel scroll"><h3>Legacy VOY media references</h3>
      <div class="row" style="margin-bottom:8px"><button class="btn" data-action="open-asset-upload">Upload to Supabase</button><button class="btn" data-action="audit-asset-licenses">License audit</button><button class="btn primary" data-action="image-enhance">Enhance / optimize</button></div>
      <div class="asset-grid">${state.assets.length?state.assets.map(assetCard).join(""):`<div class="empty">No legacy media references. New production assets are stored in Supabase Storage above.</div>`}</div>
    </div>
  </div>`;
}
function assetCard(a){return `<div class="asset-card"><div class="asset-img" style="${a.thumbUrl||a.imageUrl?`background-image:url('${esc(a.thumbUrl||a.imageUrl)}')`:""}">${a.thumbUrl||a.imageUrl?"":"IMAGE"}</div><div class="asset-body"><div class="asset-title">${esc(a.title||a.provider||"Media reference")}</div><div class="asset-meta">${esc(a.creator||"")} · ${esc(a.license||"license")}<br>${esc(a.provider||"")}<br><b>Reference only · upload to Supabase before use</b></div><div class="row" style="margin-top:7px"><button class="btn" data-import-asset="${esc(a.assetId||a.id||a.url||"")}">Save reference</button></div></div></div>`}
function renderResearch(){
  const r=state.destinationResearch||{};
  $("panel-research").innerHTML=`
  <div class="split">
    <div class="panel scroll"><h3>Destination research desk</h3>
      <div class="admin-grid">
        <div class="field wide"><label class="label">Destination / city / country</label><input id="researchDestination" class="input" value="${esc(r.destination||"")}" placeholder="Crete, Greece"></div>
        <div class="field"><label class="label">Tone</label><select id="researchTone"><option>Luxury</option><option>Family</option><option>Adventure</option><option>Culture</option><option>Sun and beach</option></select></div>
        <div class="field"><label class="label">Language</label><select id="researchLang"><option>en</option><option>sv</option><option>no</option><option>da</option><option>fi</option><option>de</option></select></div>
      </div>
      <div class="row" style="margin:8px 0"><button class="btn primary" data-action="research-destination">Research destination</button><button class="btn" data-action="insert-research-page">Insert into page</button><button class="btn" data-action="make-travel-card-from-research">Create travel card</button></div>
      <div class="notice">Backend can combine Wikipedia/MediaWiki summaries, Wikidata facts, REST Countries, OpenTripMap POIs and licensed asset search. Editors should always verify claims before publishing.</div>
    </div>
    <div class="panel scroll"><h3>Research result</h3>
      ${r.destination?`<div class="kv"><div class="k">Destination</div><div class="v">${esc(r.destination)}</div><div class="k">Country</div><div class="v">${esc(r.country||"—")}</div><div class="k">Best for</div><div class="v">${esc(arr(r.bestFor).join(", ")||"—")}</div><div class="k">Sources</div><div class="v">${esc(arr(r.sources).join(", ")||"—")}</div></div><hr><div class="item-title">${esc(r.headline||"Suggested story angle")}</div><p class="help">${esc(r.summary||"No summary returned yet.")}</p><h4>Points of interest</h4>${arr(r.pois).map(x=>`<div class="notice" style="margin-bottom:6px">${esc(x)}</div>`).join("")}`:`<div class="empty">No destination result yet.</div>`}
    </div>
  </div>`;
}
function renderCampaign(){
  const issue=currentIssue();
  $("panel-campaign").innerHTML=`
  <div class="split">
    <div class="panel scroll"><h3>PR / marketing campaign studio</h3>
      <div class="admin-grid">
        <div class="field wide"><label class="label">Campaign name</label><input id="campName" class="input" value="${esc(issue?.title||"")}" placeholder="Summer Escapes 2026"></div>
        <div class="field"><label class="label">Audience</label><select id="campAudience"><option>Families</option><option>Couples</option><option>Luxury travellers</option><option>Students</option><option>Business travellers</option><option>Culture seekers</option></select></div>
        <div class="field"><label class="label">Channel</label><select id="campChannel"><option>Magazine + web</option><option>Email</option><option>Social</option><option>Paid ads</option><option>PR release</option><option>Travel agency window</option></select></div>
        <div class="field"><label class="label">Market</label><input id="campMarket" class="input" placeholder="Sweden, Norway, Denmark"></div>
        <div class="field"><label class="label">CTA path</label><input id="campCtaPath" class="input" placeholder="/destinations/greece"></div>
        <div class="field full"><label class="label">Campaign objective</label><textarea id="campObjective" placeholder="Increase bookings to Crete by positioning the destination as..."></textarea></div>
        <div class="field full"><label class="label">Offer / product angle</label><textarea id="campOffer" placeholder="Family package, hotel collection, route launch, shoulder-season campaign..."></textarea></div>
      </div>
      <div class="row" style="margin-top:8px"><button class="btn primary" data-action="generate-pr-brief">Generate PR brief</button><button class="btn" data-action="generate-social-pack">Social pack</button><button class="btn ok" data-action="save-campaign">Save campaign</button></div>
    </div>
    <div class="panel scroll"><h3>Campaign packages</h3>
      ${state.campaigns.length?state.campaigns.map(c=>`<article class="admin-row"><div><div class="news-meta">${pill(c.status||"DRAFT")}<span class="pill">${esc(c.channel||"Magazine")}</span></div><div class="item-title">${esc(c.name)}</div><div class="item-sub">${esc(c.objective||"")}</div></div><button class="btn" data-edit-campaign="${esc(c.campaignId)}">Edit</button></article>`).join(""):`<div class="empty">No campaigns yet.</div>`}
    </div>
  </div>`;
}
function collectCampaign(){
  return {campaignId:uid("CAMPAIGN"),issueId:currentIssueId(),name:$("campName").value.trim(),audience:$("campAudience").value,channel:$("campChannel").value,market:$("campMarket").value.trim(),ctaPath:$("campCtaPath").value.trim(),objective:$("campObjective").value.trim(),offer:$("campOffer").value.trim(),status:"DRAFT",createdAt:new Date().toISOString()};
}

function readinessStats(){
  const issue=currentIssue();
  const pages=issuePages();
  const articleDrafts=state.articles.filter(a=>String(a.status||"").toUpperCase().includes("DRAFT")||String(a.status||"").toUpperCase().includes("REVIEW")).length;
  const pageWarnings=pages.reduce((n,p)=>n+[
    !p.title,
    !p.deck,
    !p.imageUrl && !["ad","catalogue"].includes(String(p.template||"")),
    p.imageUrl && !p.imageCredit,
    String(p.body||"").length<180 && !["cover","ad"].includes(String(p.template||""))
  ].filter(Boolean).length,0);
  const assetWarnings=(state.assets||[]).filter(a=>!a.license||!a.creator||!a.sourceUrl).length;
  const score=Math.max(0,100-(articleDrafts*6)-(pageWarnings*5)-(assetWarnings*8));
  return {issue,pages,articleDrafts,pageWarnings,assetWarnings,score};
}
function printQaData(){
  const r=readinessStats();
  const pages=r.pages.map(p=>{
    const warnings=[];
    if(!p.title)warnings.push("Missing title");
    if(!p.deck&&!["cover","ad"].includes(String(p.template||"")))warnings.push("Missing deck/standfirst");
    if(!p.imageUrl&&!["ad","catalogue"].includes(String(p.template||"")))warnings.push("Missing hero image");
    if(p.imageUrl&&!p.imageCredit)warnings.push("Missing image credit");
    if(String(p.body||"").length<180&&!["cover","ad"].includes(String(p.template||"")))warnings.push("Body may be too short for print");
    if(!p.status||String(p.status).toUpperCase()==="DRAFT")warnings.push("Not approved");
    return {pageId:p.pageId||p._id,pageNo:p.pageNo,title:p.title,template:p.template,status:p.status||"DRAFT",warnings};
  });
  return {issueId:currentIssueId(),generatedAt:new Date().toISOString(),readinessScore:r.score,pageWarnings:r.pageWarnings,assetWarnings:r.assetWarnings,articleDrafts:r.articleDrafts,pages};
}
function qualityChecklist(){
  const page=currentPage()||{};
  const article=currentArticle()||{};
  return [
    ["Editorial voice",page.title||article.title?"Ready for tone check":"Missing page/article title",page.title||article.title?"ok":"warn"],
    ["Destination facts",page.destination||article.destination?"Destination present":"Destination missing",page.destination||article.destination?"ok":"warn"],
    ["SEO headline",String(page.title||article.title||"").length>=28?"Strong length":"Headline may be too short","warn"],
    ["Image licensing",(state.assets||[]).every(a=>a.license&&a.creator)?"Attribution fields present":"Run license audit before publishing",(state.assets||[]).every(a=>a.license&&a.creator)?"ok":"warn"],
    ["Print body length",String(page.body||"").length>500?"Feature depth available":"Body may need more editorial depth",String(page.body||"").length>500?"ok":"warn"],
    ["Accessibility",page.imageAlt||article.imageAlt?"Alt text present":"Alt text should be added","warn"]
  ];
}
function renderQualityLab(){
  const r=readinessStats();
  const qr=state.qualityResult||{};
  $("panel-quality").innerHTML=`
  <div class="split">
    <div class="stack">
      <div class="voy-score">
        <div class="qa-card"><small>Readiness</small><b>${r.score}%</b><span>Computed from draft, asset and page warnings.</span></div>
        <div class="qa-card"><small>Page warnings</small><b>${r.pageWarnings}</b><span>Missing images, credits, decks or body depth.</span></div>
        <div class="qa-card"><small>Asset warnings</small><b>${r.assetWarnings}</b><span>License, creator or source gaps.</span></div>
        <div class="qa-card"><small>Open editorial</small><b>${r.articleDrafts}</b><span>Draft/review article tasks.</span></div>
      </div>
      <div class="panel scroll"><h3>Quality lab</h3>
        <div class="voy-tool-grid">
          <div class="voy-tool-card"><b>Copy Chief</b><div class="help">Tone, grammar, line edit, headline alternatives and deck polish.</div><button class="btn primary" data-action="copy-chief-review">Run copy chief review</button></div>
          <div class="voy-tool-card"><b>Fact & Claim Check</b><div class="help">Flags destination claims, prices, opening times, distances and source gaps.</div><button class="btn" data-action="fact-check-claims">Check claims</button></div>
          <div class="voy-tool-card"><b>Accessibility / SEO</b><div class="help">Alt text, reading level, metadata, OpenGraph and search snippets.</div><button class="btn" data-action="accessibility-seo-check">Run accessibility + SEO</button></div>
          <div class="voy-tool-card"><b>Translation Desk</b><div class="help">Create market versions while preserving brand voice and legal disclaimers.</div><div class="row"><input id="qualityLangs" class="input" value="sv,no,da,fi,de" style="min-width:130px"><button class="btn" data-action="translate-package">Translate</button></div></div>
          <div class="voy-tool-card"><b>License Audit</b><div class="help">Validate provider, license, source URL, creator credit and usage rights.</div><button class="btn warn" data-action="audit-asset-licenses">Audit assets</button></div>
          <div class="voy-tool-card"><b>Full Quality Run</b><div class="help">Sends issue, pages, assets and brand kit to backend QA worker.</div><button class="btn ok" data-action="run-quality-lab">Run full quality lab</button></div>
        </div>
      </div>
    </div>
    <div class="panel scroll"><h3>Current checks</h3>
      <div class="qa-list">${qualityChecklist().map(c=>`<div class="qa-card"><b>${esc(c[0])} ${pill(c[2])}</b><span>${esc(c[1])}</span></div>`).join("")}</div>
      <h3 style="margin-top:12px">Backend result</h3>
      ${qr.summary?`<div class="notice">${esc(qr.summary)}</div><div class="kv" style="margin-top:8px"><div class="k">Score</div><div class="v">${esc(qr.score||"—")}</div><div class="k">Priority</div><div class="v">${esc(qr.priority||"—")}</div><div class="k">Updated</div><div class="v">${esc(qr.generatedAt||"—")}</div></div>`:`<div class="empty">No backend quality result yet.</div>`}
    </div>
  </div>`;
}
function renderBrandKit(){
  const b=state.brandKit||{};
  const colors=arr(b.colors||"#022e64,#0b3a7a,#5FC7CF,#ffffff");
  $("panel-brandkit").innerHTML=`
  <div class="split">
    <div class="panel scroll"><h3>SKANDI VOY brand kit</h3>
      <div class="admin-grid">
        <div class="field wide"><label class="label">Brand / publication name</label><input id="brandName" class="input" value="${esc(b.name||"SKANDI VOY")}"></div>
        <div class="field wide"><label class="label">Font system</label><input id="brandFonts" class="input" value="${esc(b.fonts||"Montserrat / Tahoma")}"></div>
        <div class="field full"><label class="label">Tone of voice</label><textarea id="brandTone">${esc(b.tone||"Premium, warm, practical and commercially sharp")}</textarea></div>
        <div class="field full"><label class="label">Approved colors</label><input id="brandColors" class="input" value="${esc(colors.join(", "))}"></div>
        <div class="field full"><label class="label">Required phrases / product vocabulary</label><textarea id="brandRequired">${esc(b.requiredWords||"SKANDI Travels, curated, destination, experience")}</textarea></div>
        <div class="field full"><label class="label">Blocked words / legal risk phrases</label><textarea id="brandBlocked">${esc(b.blockedWords||"cheap, guaranteed, best in the world")}</textarea></div>
        <div class="field wide"><label class="label">Default CTA</label><input id="brandCta" class="input" value="${esc(b.defaultCta||"Explore destination")}"></div>
      </div>
      <div class="brand-swatch-row">${colors.map(c=>`<span class="brand-swatch" title="${esc(c)}" style="background:${esc(c)}"></span>`).join("")}</div>
      <div class="row" style="margin-top:10px"><button class="btn primary" data-action="save-brand-kit">Save brand kit</button><button class="btn ok" data-action="run-brand-guard">Run brand guard</button></div>
    </div>
    <div class="panel scroll"><h3>Brand guard result</h3>
      ${state.brandGuardResult?.summary?`<div class="notice">${esc(state.brandGuardResult.summary)}</div>`:`<div class="empty">Run Brand Guard to check all active issue copy against voice, terms and legal risk wording.</div>`}
      <h3 style="margin-top:12px">Professional additions</h3>
      <div class="qa-list">
        <div class="qa-card"><b>Design token lock</b><span>Keep VOY colors, typography, logo clearspace and CTA style synchronized with editor and public pages.</span></div>
        <div class="qa-card"><b>Legal phrase guard</b><span>Flags absolute claims, unapproved hotel guarantees, outdated price claims and package terms requiring review.</span></div>
        <div class="qa-card"><b>Market localization</b><span>Adapts copy to Nordic, US and EU markets without changing brand tone.</span></div>
      </div>
    </div>
  </div>`;
}
function collectBrandKit(){
  return {
    name:$("brandName").value.trim(),
    fonts:$("brandFonts").value.trim(),
    tone:$("brandTone").value.trim(),
    colors:$("brandColors").value.trim(),
    requiredWords:$("brandRequired").value.trim(),
    blockedWords:$("brandBlocked").value.trim(),
    defaultCta:$("brandCta").value.trim(),
    updatedAt:new Date().toISOString()
  };
}
function renderPrintQa(){
  const qa=state.printQa||printQaData();
  $("panel-printqa").innerHTML=`
  <div class="split">
    <div class="panel scroll"><h3>Print production QA</h3>
      <div class="voy-score">
        <div class="qa-card"><small>Readiness</small><b>${esc(qa.readinessScore||0)}%</b><span>Issue level production score.</span></div>
        <div class="qa-card"><small>Pages</small><b>${qa.pages?.length||0}</b><span>Current active issue flatplan.</span></div>
        <div class="qa-card"><small>Page warnings</small><b>${esc(qa.pageWarnings||0)}</b><span>Layout and content gaps.</span></div>
        <div class="qa-card"><small>Asset warnings</small><b>${esc(qa.assetWarnings||0)}</b><span>License and credit gaps.</span></div>
      </div>
      <div class="row" style="margin-bottom:8px"><button class="btn primary" data-action="run-print-qa">Run print QA</button><button class="btn ok" data-action="prepare-print-export">Prepare press package</button><button class="btn" data-action="export-print">Export print package</button></div>
      <div class="print-flatplan">${(qa.pages||[]).map(p=>`<div class="print-page-tile"><b>Page ${esc(p.pageNo||"—")} · ${esc(p.template||"feature")}</b><span>${esc(p.title||"Untitled")}</span><div style="margin-top:6px">${(p.warnings||[]).length?pill("WARN"):pill("OK")}</div><span>${esc((p.warnings||[]).join(", ")||"Ready")}</span></div>`).join("")||`<div class="empty">No pages in active issue.</div>`}</div>
    </div>
    <div class="panel scroll"><h3>Production checklist</h3>
      <div class="qa-list">
        <div class="qa-card"><b>Bleed and safe zone</b><span>Backend renderer should check 3mm bleed, trim box, safe text area, page size and crop marks.</span></div>
        <div class="qa-card"><b>Image quality</b><span>Check DPI, aspect crop, color profile, compression artefacts and minimum size before export.</span></div>
        <div class="qa-card"><b>Rights and credits</b><span>Every external asset must have provider, license, creator, source URL and usage terms snapshot.</span></div>
        <div class="qa-card"><b>Public package</b><span>Generate web issue, PDF preview, social crops, booking CTAs and downloadable public PDF.</span></div>
      </div>
    </div>
  </div>`;
}
function renderDistribution(){
  const d=state.distributionKit||{};
  $("panel-distribution").innerHTML=`
  <div class="split">
    <div class="panel scroll"><h3>Distribution and PR launch kit</h3>
      <div class="admin-grid">
        <div class="field wide"><label class="label">Launch name</label><input id="distName" class="input" value="${esc(currentIssue()?.title||"VOY launch")}"></div>
        <div class="field"><label class="label">Primary market</label><input id="distMarket" class="input" placeholder="Sweden / Norway / US"></div>
        <div class="field"><label class="label">Campaign channel</label><select id="distChannel"><option>All channels</option><option>Press release</option><option>Email newsletter</option><option>Instagram / Facebook</option><option>Google Ads</option><option>Travel agency sales desk</option><option>Onboard magazine</option></select></div>
        <div class="field"><label class="label">Booking CTA URL</label><input id="distCta" class="input" placeholder="/destinations/greece"></div>
        <div class="field"><label class="label">UTM campaign</label><input id="distUtm" class="input" value="${esc(String(currentIssue()?.slug||"voy-launch").replace(/[^a-z0-9]+/gi,"-").toLowerCase())}"></div>
        <div class="field full"><label class="label">Commercial angle</label><textarea id="distAngle" placeholder="Why this issue should convert readers into destination interest and bookings."></textarea></div>
      </div>
      <div class="row" style="margin-top:8px"><button class="btn primary" data-action="generate-distribution-kit">Generate launch kit</button><button class="btn ok" data-action="save-distribution-kit">Save kit</button></div>
      <div class="channel-grid" style="margin-top:10px">
        ${["Press release","Newsletter","Social captions","Paid ads","Agency brief","Public web issue","PDF download","Sales CTA"].map(x=>`<div class="channel-card"><b>${x}</b><span>Generated from issue, pages, campaigns and brand kit.</span></div>`).join("")}
      </div>
    </div>
    <div class="panel scroll"><h3>Generated kit</h3>
      ${d.summary?`<div class="notice">${esc(d.summary)}</div><div class="manifest" style="margin-top:8px">${esc(d.copy||JSON.stringify(d,null,2))}</div>`:`<div class="empty">No distribution kit yet.</div>`}
    </div>
  </div>`;
}
function renderWorkflow(){
  const lanes=["BRIEF","DRAFT","REVIEW","APPROVED","PUBLISHED"];
  $("panel-workflow").innerHTML=`<div class="panel scroll"><h3>Editorial workflow / approvals</h3><div class="workflow-lane">${lanes.map(l=>`<div class="workflow-col"><h4>${esc(l)}</h4>${state.articles.filter(a=>String(a.status||"DRAFT").toUpperCase().replace("IN PROGRESS","DRAFT")===l).map(a=>`<div class="workflow-card"><b>${esc(a.title)}</b><div class="help">${esc(a.writer||"Unassigned")} · ${esc(a.deadline||"No deadline")}</div><button class="btn" data-edit-article="${esc(a.articleId||a._id)}">Open</button></div>`).join("")||`<div class="empty">Empty</div>`}</div>`).join("")}</div></div>`;
}
function renderCategories(){
  $("panel-categories").innerHTML=`<div class="split"><div class="panel scroll"><h3>Categories</h3>${categoryForm()}<div class="row" style="margin-top:8px"><button class="btn primary" data-action="save-category">Save category</button><button class="btn" data-action="clear-category">Clear</button></div></div><div class="panel scroll"><h3>Category list</h3><div class="admin-table">${state.categories.length?state.categories.map(c=>`<article class="admin-row"><div><div class="news-meta"><span class="pill ${c.active===false?"bad":"ok"}">${c.active===false?"Hidden":"Active"}</span><span class="pill">Order ${esc(c.sortOrder??"")}</span></div><div class="item-title">${esc(c.title)}</div><div class="item-sub">${esc(c.summary||"")}</div></div><div class="row"><button class="btn" data-edit-category="${esc(c.categoryId||c._id)}">Adjust</button><button class="btn bad" data-delete-category="${esc(c.categoryId||c._id)}">Delete</button></div></article>`).join(""):`<div class="empty">No categories yet.</div>`}</div></div></div>`;
}
function categoryForm(){const c=state.categories.find(x=>(x.categoryId||x._id)===state.editingCategoryId)||{};return `<div class="admin-grid"><div class="field wide"><label class="label">Category title</label><input class="input" id="catTitle" value="${esc(c.title||"")}" placeholder="Food & Culture"></div><div class="field"><label class="label">Sort order</label><input class="input" id="catSortOrder" type="number" value="${esc(c.sortOrder||10)}"></div><div class="field"><label class="label">Active</label><select id="catActive"><option value="true" ${c.active!==false?"selected":""}>Yes</option><option value="false" ${c.active===false?"selected":""}>No</option></select></div><div class="field full"><label class="label">Summary</label><textarea id="catSummary">${esc(c.summary||"")}</textarea></div></div>`}
function collectCategory(){return {categoryId:state.editingCategoryId||uid("CAT"),title:$("catTitle").value.trim(),summary:$("catSummary").value.trim(),sortOrder:Number($("catSortOrder").value||0),active:$("catActive").value==="true"}}
function renderBanners(){
  $("panel-banners").innerHTML=`<div class="split"><div class="panel scroll"><h3>Ad / campaign banners</h3>${bannerForm()}<div class="row" style="margin-top:8px"><button class="btn primary" data-action="save-banner">Save banner</button><button class="btn" data-action="clear-banner">Clear</button></div></div><div class="panel scroll"><h3>Banner list</h3><div class="admin-table">${state.banners.length?state.banners.map(b=>`<article class="admin-row"><div><div class="news-meta"><span class="pill">${esc(b.slot)}</span><span class="pill ${b.active===false?"bad":"ok"}">${b.active===false?"Hidden":"Active"}</span></div><div class="item-title">${esc(b.title)}</div><div class="item-sub">${esc(b.summary||"")}</div></div><div class="row"><button class="btn" data-edit-banner="${esc(b.bannerId||b._id)}">Adjust</button><button class="btn bad" data-delete-banner="${esc(b.bannerId||b._id)}">Delete</button></div></article>`).join(""):`<div class="empty">No banners yet.</div>`}</div></div></div>`;
}
function bannerForm(){const b=state.banners.find(x=>(x.bannerId||x._id)===state.editingBannerId)||{};return `<div class="admin-grid"><div class="field wide"><label class="label">Title</label><input class="input" id="bannerTitle" value="${esc(b.title||"")}" placeholder="SKANDI Signature Greece"></div><div class="field"><label class="label">Slot</label><select id="bannerSlot">${["top","side","bottom","article-inline","back-cover","sponsored-spread"].map(s=>`<option ${String(b.slot||"top")===s?"selected":""}>${s}</option>`).join("")}</select></div><div class="field"><label class="label">Path</label><input class="input" id="bannerPath" value="${esc(b.path||"")}" placeholder="/signature-collection"></div><div class="field"><label class="label">Active</label><select id="bannerActive"><option value="true" ${b.active!==false?"selected":""}>Yes</option><option value="false" ${b.active===false?"selected":""}>No</option></select></div><div class="field full"><label class="label">Summary</label><textarea id="bannerSummary">${esc(b.summary||"")}</textarea></div></div>`}
function collectBanner(){return {bannerId:state.editingBannerId||uid("BAN"),title:$("bannerTitle").value.trim(),slot:$("bannerSlot").value,path:$("bannerPath").value.trim(),active:$("bannerActive").value==="true",summary:$("bannerSummary").value.trim()}}
function renderTravelCards(){
  $("panel-travelcards").innerHTML=`<div class="split"><div class="panel scroll"><h3>Travel cards</h3>${travelCardForm()}<div class="row" style="margin-top:8px"><button class="btn primary" data-action="save-card">Save travel card</button><button class="btn" data-action="clear-card">Clear</button></div></div><div class="panel scroll"><h3>Travel card list</h3><div class="admin-table">${state.travelCards.length?state.travelCards.map(c=>`<article class="admin-row"><div><div class="news-meta">${arr(c.tags).slice(0,4).map(t=>`<span class="pill">${esc(t)}</span>`).join("")}<span class="pill ${c.active===false?"bad":"ok"}">${c.active===false?"Hidden":"Active"}</span></div><div class="item-title">${esc(c.title)}</div><div class="item-sub">${esc(c.summary||"")}</div></div><div class="row"><button class="btn" data-edit-card="${esc(c.cardId||c._id)}">Adjust</button><button class="btn bad" data-delete-card="${esc(c.cardId||c._id)}">Delete</button></div></article>`).join(""):`<div class="empty">No travel cards yet.</div>`}</div></div></div>`;
}
function travelCardForm(){const c=state.travelCards.find(x=>(x.cardId||x._id)===state.editingCardId)||{};return `<div class="admin-grid"><div class="field wide"><label class="label">Title</label><input class="input" id="cardTitle" value="${esc(c.title||"")}" placeholder="Explore Crete"></div><div class="field"><label class="label">Path</label><input class="input" id="cardPath" value="${esc(c.path||"")}" placeholder="/destinations/greece?area=crete"></div><div class="field"><label class="label">Image asset</label><input class="input" id="cardImageUrl" value="${esc(c.imageUrl||"")}" placeholder="Select or upload a Supabase asset" readonly></div><div class="field"><label class="label">Active</label><select id="cardActive"><option value="true" ${c.active!==false?"selected":""}>Yes</option><option value="false" ${c.active===false?"selected":""}>No</option></select></div><div class="field wide"><label class="label">Tags</label><input class="input" id="cardTags" value="${esc(arr(c.tags).join(", "))}" placeholder="Beach, Greece, Family"></div><div class="field full"><label class="label">Summary</label><textarea id="cardSummary">${esc(c.summary||"")}</textarea></div></div>`}
function collectCard(){return {cardId:state.editingCardId||uid("CARD"),title:$("cardTitle").value.trim(),path:$("cardPath").value.trim(),imageUrl:$("cardImageUrl").value.trim(),active:$("cardActive").value==="true",tags:arr($("cardTags").value),summary:$("cardSummary").value.trim()}}
function renderApi(){
  const apis=[
    ["Openverse","Openly licensed/public-domain image and audio discovery","No key for public search; verify license before publishing","VOY_ASSET_SEARCH_REQUEST"],
    ["Unsplash","High-quality travel photography","API key and attribution required","VOY_ASSET_SEARCH_REQUEST"],
    ["Pexels","Free photo/video library","API key; credit/licensing policy should be checked","VOY_ASSET_SEARCH_REQUEST"],
    ["Pixabay","Stock images/video/music search","API key; backend should store it","VOY_ASSET_SEARCH_REQUEST"],
    ["Wikimedia Commons","Open media repository","Check license/author/source per file","VOY_ASSET_SEARCH_REQUEST"],
    ["MediaWiki / Wikipedia","Destination summaries and references","Use for research, not as final unverified copy","VOY_DESTINATION_RESEARCH_REQUEST"],
    ["Wikidata SPARQL","Structured destination facts","Backend should cache and rate-limit queries","VOY_DESTINATION_RESEARCH_REQUEST"],
    ["REST Countries","Country facts, flags, currency, language, timezones","Good for catalogue fact boxes","VOY_DESTINATION_RESEARCH_REQUEST"],
    ["OpenTripMap","POIs, attractions and travel places","API key; suitable for POI suggestions","VOY_DESTINATION_RESEARCH_REQUEST"],
    ["Adobe Express Embed SDK","Embedded professional design editor, quick actions and AI-assisted editing","Use only through approved backend/session controls","VOY_ADOBE_EXPRESS_OPEN_REQUEST"],
    ["Canva Connect Brand Templates","Brand template import/listing and template-driven creative workflows","OAuth + brand template permissions; store IDs in backend","VOY_CANVA_TEMPLATE_REQUEST"],
    ["Figma REST API","Import design frames, layout references and export image/PDF previews","OAuth/token; backend should cache file metadata and export URLs","VOY_FIGMA_IMPORT_REQUEST"],
    ["Cloudinary","Image transformations, background removal, crops and optimization","Cloud/backend credentials; track derivative assets","VOY_MEDIA_ENHANCE_REQUEST"],
    ["Mapbox Static Images","Destination map art and static catalogue maps","API key; cache rendered map images","VOY_MAP_STATIC_REQUEST"],
    ["TinyPNG / Tinify","Compress AVIF, WebP, JPEG and PNG for public pages","API key; run in backend optimization worker","VOY_IMAGE_OPTIMIZE_REQUEST"],
    ["Getty Images / iStock","Licensed premium editorial visuals for campaigns","Commercial agreement + API credentials; strict rights metadata","VOY_PREMIUM_MEDIA_SEARCH_REQUEST"],
    ["OpenAI image/copy tools","Image edits, campaign copy, headline alternatives and localization","Backend only; never expose API keys in HTML","VOY_AI_CREATIVE_REQUEST"],
    ["PDF.js / pdf-lib","PDF preview, import and generated export jobs","Use backend for final press-ready PDF when possible","VOY_EXPORT_PDF_REQUEST"]
  ];
  $("panel-api").innerHTML=`<div class="panel scroll"><h3>API connector matrix</h3><div class="notice">The browser does not store API secrets. VOY sends connector requests to secure backend. The backend calls APIs, validates licensing/attribution, caches responses and returns normalized results.</div><div class="api-grid" style="margin-top:8px">${apis.map((a,i)=>`<div class="api-card"><b>${esc(a[0])}</b><div class="help">${esc(a[1])}</div><div class="kv" style="grid-template-columns:90px 1fr;margin-top:8px"><div class="k">Requirement</div><div class="v">${esc(a[2])}</div><div class="k">Event</div><div class="v mono">${esc(a[3])}</div></div><button class="btn" data-test-api="${i}" style="margin-top:8px">Test connector</button></div>`).join("")}</div><h3 style="margin-top:12px">Backend configuration aliases</h3><div class="admin-grid"><div class="field"><label class="label">Asset provider key alias</label><input id="apiAssetAlias" class="input" placeholder="VOY_ASSET_PROVIDER_KEYS"></div><div class="field"><label class="label">Research key alias</label><input id="apiResearchAlias" class="input" placeholder="VOY_RESEARCH_KEYS"></div><div class="field"><label class="label">Export webhook alias</label><input id="apiExportAlias" class="input" placeholder="VOY_EXPORT_WORKER"></div><div class="field"><label class="label">Status</label><select id="apiEnabled"><option value="true">Enabled</option><option value="false">Disabled</option></select></div></div><div class="row" style="margin-top:8px"><button class="btn primary" data-action="save-api-config">Save connector aliases</button></div></div>`;
}
function newsroomPostId(item={}){return item.postId||item.post_id||item._id||item.id||""}
function contactId(item={}){return item.contactId||item.contact_id||item._id||item.id||""}
function renderPressReleases(){
  const item=state.newsroomPosts.find(p=>String(newsroomPostId(p))===String(state.editingPostId))||{};
  const categories=state.newsroomCategories.length?state.newsroomCategories:state.categories;
  $("panel-pressreleases").innerHTML=`<div class="split">
    <div class="panel scroll"><h3>Newsroom posts and press releases</h3>
      <div class="row" style="margin-bottom:8px"><button class="btn primary" data-action="new-news-post">New press release</button><button class="btn" data-action="refresh-newsroom">Refresh</button></div>
      <div class="admin-table">${state.newsroomPosts.length?state.newsroomPosts.map(p=>`<article class="admin-row"><div><div class="news-meta">${pill(p.status||p.publishStatus)}<span class="pill">${esc(p.contentType||p.type||"Press release")}</span></div><div class="item-title">${esc(p.title||"Untitled press release")}</div><div class="item-sub">${esc(p.excerpt||p.summary||"")}</div></div><div class="row"><button class="btn" data-edit-news-post="${esc(newsroomPostId(p))}">Edit</button><button class="btn ok" data-publish-news-post="${esc(newsroomPostId(p))}">Publish</button><button class="btn bad" data-archive-news-post="${esc(newsroomPostId(p))}">Archive</button></div></article>`).join(""):`<div class="empty">No newsroom posts yet.</div>`}</div>
    </div>
    <div class="panel scroll"><h3>${state.editingPostId?"Edit":"Create"} press release</h3>
      <div class="admin-grid">
        <div class="field wide"><label class="label">Headline</label><input id="newsPostTitle" class="input" value="${esc(item.title||"")}" placeholder="SKANDI launches…"></div>
        <div class="field"><label class="label">Slug</label><input id="newsPostSlug" class="input" value="${esc(item.slug||"")}" placeholder="skandi-launches"></div>
        <div class="field"><label class="label">Type</label><select id="newsPostType">${["Press release","Company news","Media statement","VOY announcement"].map(v=>`<option ${String(item.contentType||item.type||"Press release")===v?"selected":""}>${v}</option>`).join("")}</select></div>
        <div class="field"><label class="label">Category</label><select id="newsPostCategory"><option value="">Uncategorized</option>${categories.map(c=>`<option value="${esc(c.categoryId||c._id||c.id||c.title)}" ${String(item.categoryId||item.category_id||"")===String(c.categoryId||c._id||c.id||c.title)?"selected":""}>${esc(c.title||c.name||"Category")}</option>`).join("")}</select></div>
        <div class="field"><label class="label">Publish date/time</label><input id="newsPostPublishAt" class="input" type="datetime-local" value="${esc(String(item.publishDate||item.publishAt||item.publish_at||"").slice(0,16))}"></div>
        <div class="field wide"><label class="label">Hero image asset</label><input id="newsPostImage" class="input" value="${esc(item.heroImage||item.heroImageUrl||item.hero_image_url||item.imageUrl||"")}" placeholder="Select or upload a Supabase asset" readonly></div>
        <div class="field full"><label class="label">Excerpt</label><textarea id="newsPostExcerpt">${esc(item.excerpt||item.summary||"")}</textarea></div>
        <div class="field full"><label class="label">Article body</label><textarea id="newsPostBody" style="min-height:220px">${esc(item.bodyHtml||item.body||item.content||"")}</textarea></div>
      </div>
      <div class="row" style="margin-top:8px"><button class="btn primary" data-action="save-news-post">Save draft</button><button class="btn ok" data-action="publish-current-news-post">Publish</button><button class="btn" data-action="clear-news-post">Clear</button></div>
    </div>
  </div>`;
}
function collectNewsPost(){
  const existing=state.newsroomPosts.find(p=>String(newsroomPostId(p))===String(state.editingPostId))||{};
  const bodyHtml=$("newsPostBody").value.trim();
  const summary=$("newsPostExcerpt").value.trim();
  const heroImage=$("newsPostImage").value.trim();
  return {
    ...existing,
    postId:state.editingPostId||newsroomPostId(existing)||uid("POST"),
    title:$("newsPostTitle").value.trim(),
    slug:$("newsPostSlug").value.trim(),
    contentType:$("newsPostType").value,
    categoryId:$("newsPostCategory").value,
    publishDate:$("newsPostPublishAt").value||null,
    heroImage,
    thumbnailImage:existing.thumbnailImage||heroImage,
    summary,
    bodyHtml,
    bodyPlainText:bodyHtml.replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(),
    status:existing.status||"Draft",
    active:existing.active===true,
    updatedAt:new Date().toISOString()
  };
}
function renderPressContacts(){
  const item=state.pressContacts.find(c=>String(contactId(c))===String(state.editingContactId))||{};
  $("panel-presscontacts").innerHTML=`<div class="split">
    <div class="panel scroll"><h3>Press contacts</h3><div class="admin-table">${state.pressContacts.length?state.pressContacts.map(c=>`<article class="admin-row"><div><div class="news-meta"><span class="pill ${c.active===false?"bad":"ok"}">${c.active===false?"Inactive":"Active"}</span><span class="pill">${esc(c.region||c.market||"Global")}</span></div><div class="item-title">${esc(c.name||c.fullName||"Press contact")}</div><div class="item-sub">${esc(c.roleTitle||c.title||c.position||"")} · ${esc(c.email||"")} · ${esc(c.phone||"")}</div></div><button class="btn" data-edit-press-contact="${esc(contactId(c))}">Edit</button></article>`).join(""):`<div class="empty">No press contacts yet.</div>`}</div></div>
    <div class="panel scroll"><h3>${state.editingContactId?"Edit":"Add"} press contact</h3><div class="admin-grid">
      <div class="field wide"><label class="label">Name</label><input id="pressContactName" class="input" value="${esc(item.name||item.fullName||"")}"></div>
      <div class="field wide"><label class="label">Title / position</label><input id="pressContactTitle" class="input" value="${esc(item.roleTitle||item.title||item.position||"")}"></div>
      <div class="field"><label class="label">Email</label><input id="pressContactEmail" class="input" type="email" value="${esc(item.email||"")}"></div>
      <div class="field"><label class="label">Phone</label><input id="pressContactPhone" class="input" value="${esc(item.phone||"")}"></div>
      <div class="field"><label class="label">Market</label><input id="pressContactMarket" class="input" value="${esc(item.region||item.market||"")}" placeholder="US / Nordics / Global"></div>
      <div class="field"><label class="label">Active</label><select id="pressContactActive"><option value="true" ${item.active!==false?"selected":""}>Yes</option><option value="false" ${item.active===false?"selected":""}>No</option></select></div>
      <div class="field full"><label class="label">Notes</label><textarea id="pressContactNotes">${esc(item.availabilityText||item.notes||item.summary||"")}</textarea></div>
    </div><div class="row" style="margin-top:8px"><button class="btn primary" data-action="save-press-contact">Save contact</button><button class="btn" data-action="clear-press-contact">Clear</button></div></div>
  </div>`;
}
function collectPressContact(){
  const existing=state.pressContacts.find(c=>String(contactId(c))===String(state.editingContactId))||{};
  return {
    ...existing,
    contactId:state.editingContactId||contactId(existing)||uid("CONTACT"),
    name:$("pressContactName").value.trim(),
    roleTitle:$("pressContactTitle").value.trim(),
    email:$("pressContactEmail").value.trim(),
    phone:$("pressContactPhone").value.trim(),
    region:$("pressContactMarket").value.trim(),
    active:$("pressContactActive").value==="true",
    availabilityText:$("pressContactNotes").value.trim(),
    updatedAt:new Date().toISOString()
  };
}
function upsert(listName,idField,item){
  const list=state[listName]||[];
  const id=item[idField]||item._id;
  const i=list.findIndex(x=>(x[idField]||x._id)===id);
  if(i>=0)list[i]={...list[i],...item};else list.unshift(item);
  state[listName]=list;
}
function handleAction(action){
  if(action==="refresh"){status("Refreshing VOY data...");requestLiveRefresh("manual");return}
  if(action==="public-preview"){post("VOY_PUBLIC_PREVIEW_REQUEST",{issueId:currentIssueId()});toast("Public preview requested.");return}
  if(action==="close-modal"){$("modalOverlay").style.display="none";return}
  if(action==="new-issue"){state.editingIssueId="";setPanel("issues");return}
  if(action==="new-standard-issue"){
    const issueId=uid("ISSUE");
    const issue={issueId,title:"VOY by SKANDI · The Greece Issue",edition:"Issue 01 / Summer 2026",slug:`voy-greece-${new Date().getFullYear()}`,publishDate:today(),publishStatus:"DRAFT",featured:state.issues.length===0,categories:["Destinations","Travel Guide","Airline Guide"],destinations:["Greece","Santorini","Crete","Mykonos","Skiathos"],coverImageUrl:"https://static.wixstatic.com/media/394052_df1cdfcfeb434cd1aa47ee47949309f3~mv2.png",summary:"The current VOY Greece edition loaded as a fully editable template-based issue.",searchText:"VOY Greece airline guide airport guide",printSettings:"A4, 3mm bleed, structured digital issue"};
    const pages=currentVoyBlueprint(issueId);
    state.issues.unshift(issue);state.pages.push(...pages);state.selectedIssueId=issueId;state.editingIssueId=issueId;state.selectedPageId=pages[0].pageId;
    post("VOY_ADMIN_SAVE_ISSUE_PACKAGE",{issue,pages});toast(`Created the current ${pages.length}-page VOY edition as editable templates.`,"ok");setPanel("builder");return;
  }
  if(action==="clear-issue"){state.editingIssueId="";renderIssues();return}
  if(action==="save-issue"||action==="save-issue-upload"){
    const issue=collectIssue(); if(!issue.title){toast("Issue title is required.","bad");return}
    upsert("issues","issueId",issue);state.selectedIssueId=issue.issueId;state.editingIssueId=issue.issueId;
    post(action==="save-issue-upload"?"VOY_ADMIN_SAVE_ISSUE_WITH_UPLOAD":"VOY_ADMIN_SAVE_ISSUE_METADATA",{issue});toast("Issue saved to local draft and sent to backend.","ok");refreshAfterSave("save-issue");renderAll();return;
  }
  if(action==="publish-issue"){
    const issue=currentIssue();const pages=issuePages();
    if(!issue){toast("Create or select an issue first.","bad");return}
    if(!pages.length){toast("Add at least one page before publishing.","bad");return}
    const invalid=pages.find(p=>!String(p.title||"").trim());if(invalid){toast(`Page ${invalid.pageNo||"—"} needs a title.`,"bad");return}
    post("VOY_ADMIN_PUBLISH_ISSUE",{issueId:currentIssueId(),issue,pages});status("Publishing issue to the public VOY Magazine page…");return;
  }
  if(action==="archive-issue"){
    if(!currentIssueId()){toast("Select an issue first.","bad");return}
    post("VOY_ADMIN_ARCHIVE_ISSUE",{issueId:currentIssueId()});status("Archiving issue…");return;
  }
  if(action==="load-current-voy"){
    if(!currentIssueId()){toast("Create or select an issue first.","bad");return}
    if(issuePages().length&&!confirm("Replace the selected issue pages with the current VOY edition?"))return;
    const issueId=currentIssueId();const existingIds=new Set(issuePages().map(x=>x.pageId||x._id));state.pages=state.pages.filter(x=>!existingIds.has(x.pageId||x._id));const pages=currentVoyBlueprint(issueId);state.pages.push(...pages);state.selectedPageId=pages[0].pageId;
    post("VOY_ADMIN_SAVE_PAGES",{issueId,pages,replaceIssuePages:true});toast(`Loaded ${pages.length} editable VOY pages into this issue.`,"ok");renderAll();return;
  }
  if(action==="add-standard-pages"){
    if(!currentIssueId()){toast("Create or select an issue first.","bad");return}
    const existing=new Set(issuePages().map(p=>p.template));const additions=templates.filter(t=>!existing.has(t.id)).map((t,i)=>makeTemplatePage(t,issuePages().length+i,currentIssueId()));
    if(!additions.length){toast("All layout types are already in this issue.");return}
    state.pages.push(...additions);post("VOY_ADMIN_SAVE_PAGES",{issueId:currentIssueId(),pages:additions});state.selectedPageId=additions[0].pageId;toast(`Added ${additions.length} missing page layouts.`,"ok");renderAll();return;
  }
  if(action==="new-page"){
    if(!currentIssueId()){toast("Create/select an issue first.","bad");setPanel("issues");return}
    const p=makeTemplatePage(templates[0],nextPageNo()-1,currentIssueId());p.title="New VOY page";
    state.pages.push(p);state.selectedPageId=p.pageId;setPanel("builder");return;
  }
  if(action==="add-block"){
    let page;try{page=collectPage()}catch(error){page={...currentPage(),blocks:parseBlocks(currentPage()?.blocks)}}if(!page)return;page.blocks=parseBlocks(page.blocks);const schema=BLOCK_SCHEMAS[page.template]||[];const item={};schema.forEach(([key])=>item[key]="");page.blocks.push(item);upsert("pages","pageId",page);state.selectedPageId=page.pageId;renderBuilder();return;
  }
  if(action==="save-page"||action==="save-current"){
    if(state.activePanel==="builder"){let page;try{page=collectPage()}catch(error){toast(error.message||"Check the page fields.","bad");return}if(!page.title){toast("Page title is required.","bad");return}upsert("pages","pageId",page);state.selectedPageId=page.pageId;post("VOY_ADMIN_SAVE_PAGE",{page});toast("Page saved and sent to backend.","ok");refreshAfterSave("save-page");renderAll();return}
    if(state.activePanel==="articles"){handleAction("save-article");return}
    if(state.activePanel==="issues"){handleAction("save-issue");return}
    if(state.activePanel==="brandkit"){handleAction("save-brand-kit");return}
    if(state.activePanel==="distribution"){handleAction("save-distribution-kit");return}
    if(state.activePanel==="pressreleases"){handleAction("save-news-post");return}
    if(state.activePanel==="presscontacts"){handleAction("save-press-contact");return}
    toast("Nothing active to save.");return;
  }
  if(action==="copy-page"){let p;try{p=collectPage()}catch(error){toast(error.message||"Check the page fields.","bad");return}p.pageId=uid("PAGE");p.pageNo=nextPageNo();p.title=p.title+" copy";state.pages.push(p);state.selectedPageId=p.pageId;post("VOY_ADMIN_SAVE_PAGE",{page:p});renderAll();return}
  if(action==="move-page-up"||action==="move-page-down"){
    const current=currentPage();if(!current)return;const ordered=issuePages();const index=ordered.findIndex(p=>(p.pageId||p._id)===(current.pageId||current._id));const target=action==="move-page-up"?index-1:index+1;if(index<0||target<0||target>=ordered.length)return;
    [ordered[index].pageNo,ordered[target].pageNo]=[ordered[target].pageNo,ordered[index].pageNo];post("VOY_ADMIN_REORDER_PAGES",{issueId:currentIssueId(),pages:ordered.map(p=>({pageId:p.pageId||p._id,pageNo:p.pageNo}))});renderAll();return;
  }
  if(action==="delete-current-page"){
    const p=currentPage();if(!p||!confirm("Remove this page from the issue?"))return;const id=p.pageId||p._id;state.pages=state.pages.filter(x=>(x.pageId||x._id)!==id);state.selectedPageId=issuePages()[0]?.pageId||"";post("VOY_ADMIN_DELETE_PAGE",{pageId:id,issueId:currentIssueId()});renderAll();return;
  }
  if(action==="toggle-bleed"){document.querySelectorAll(".mag-page").forEach(p=>p.classList.toggle("bleed"));return}
  if(action==="print-page"){window.print();return}
  if(action==="export-page-pdf"){let page;try{page=collectPage()}catch(error){toast(error.message||"Check the page fields.","bad");return}post("VOY_EXPORT_PDF_REQUEST",{issueId:currentIssueId(),page,mode:"single-page"});toast("PDF export request sent.");return}
  if(action==="export-print"){post("VOY_EXPORT_PRINT_PACKAGE_REQUEST",{issueId:currentIssueId(),pages:issuePages(),format:"press-ready-pdf"});toast("Print package export requested.");return}
  if(action==="new-article"){const a={articleId:uid("ARTICLE"),issueId:currentIssueId(),title:"New article brief",status:"DRAFT",contentType:"Feature",targetWords:900};state.articles.unshift(a);state.selectedArticleId=a.articleId;setPanel("articles");return}
  if(action==="save-article"){const a=collectArticle();if(!a.title){toast("Article title is required.","bad");return}upsert("articles","articleId",a);state.selectedArticleId=a.articleId;post("VOY_ADMIN_SAVE_ARTICLE",{article:a});toast("Article saved.","ok");refreshAfterSave("save-article");renderAll();return}
  if(action==="send-approval"){const a=collectArticle();post("VOY_APPROVAL_SEND_REQUEST",{article:a,issueId:currentIssueId()});toast("Approval request sent.");return}
  if(action==="request-copy-assist"||action==="request-copy-assist-article"){let payload;if(action.includes("article"))payload={article:collectArticle()};else{try{payload={page:collectPage()}}catch(error){toast(error.message||"Check the page fields.","bad");return}}post("VOY_COPY_ASSIST_REQUEST",payload);toast("Copy assist requested.");return}
  if(action==="seo-check"){let page;try{page=collectPage()}catch(error){toast(error.message||"Check the page fields.","bad");return}post("VOY_SEO_ANALYZE_REQUEST",{page,issue:currentIssue()});toast("SEO analysis requested.");return}
  if(action==="search-assets"){post("VOY_ASSET_SEARCH_REQUEST",{provider:$("assetProvider").value,query:$("assetQuery").value,license:$("assetLicense").value,orientation:$("assetOrientation").value});toast("Asset search requested.");return}
  if(action==="clear-asset-results"){state.assetResults=[];renderAssets();return}
  if(action==="open-asset-upload"){post("VOY_ASSET_UPLOAD_OPEN_REQUEST",{issueId:currentIssueId()});toast("Upload hook requested.");return}
  if(action==="audit-asset-licenses"){post("VOY_ASSET_LICENSE_AUDIT_REQUEST",{issueId:currentIssueId(),assets:state.assets});toast("License audit requested.");return}
  if(action==="research-destination"){post("VOY_DESTINATION_RESEARCH_REQUEST",{destination:$("researchDestination").value,tone:$("researchTone").value,language:$("researchLang").value,providers:["mediawiki","wikidata","restcountries","opentripmap","openverse"]});toast("Destination research requested.");return}
  if(action==="insert-research-page"){if(!state.destinationResearch){toast("Run research first.","bad");return}if(!currentPage()){handleAction("new-page")}const p=currentPage();p.destination=state.destinationResearch.destination;p.kicker="Destination guide";p.title=state.destinationResearch.headline||p.title;p.deck=state.destinationResearch.summary||p.deck;p.body=[state.destinationResearch.summary,arr(state.destinationResearch.pois).join("\\n")].filter(Boolean).join("\\n\\n");state.selectedPageId=p.pageId;setPanel("builder");return}
  if(action==="make-travel-card-from-research"){const r=state.destinationResearch;if(!r){toast("Run research first.","bad");return}const c={cardId:uid("CARD"),title:r.destination,path:`/destinations/${String(r.destination).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`,imageUrl:"",active:true,tags:arr(r.bestFor),summary:r.summary};state.travelCards.unshift(c);post("VOY_ADMIN_SAVE_TRAVEL_CARD",{card:c});refreshAfterSave("save-travel-card");setPanel("travelcards");return}
  if(action==="generate-pr-brief"||action==="request-pr-brief"){post("VOY_PR_BRIEF_GENERATE_REQUEST",{campaign:collectCampaign(),issue:currentIssue(),pages:issuePages()});toast("PR brief generation requested.");return}
  if(action==="generate-social-pack"){post("VOY_SOCIAL_PACK_GENERATE_REQUEST",{campaign:collectCampaign(),issue:currentIssue()});toast("Social pack requested.");return}
  if(action==="save-campaign"){const c=collectCampaign();state.campaigns.unshift(c);post("VOY_ADMIN_SAVE_CAMPAIGN",{campaign:c});toast("Campaign saved.");refreshAfterSave("save-campaign");renderAll();return}
  if(action==="save-category"){const c=collectCategory();if(!c.title){toast("Category title is required.","bad");return}upsert("categories","categoryId",c);post("VOY_ADMIN_SAVE_CATEGORY",{category:c});refreshAfterSave("save-category");renderAll();return}
  if(action==="clear-category"){state.editingCategoryId="";renderCategories();return}
  if(action==="save-banner"){const b=collectBanner();if(!b.title){toast("Banner title is required.","bad");return}upsert("banners","bannerId",b);post("VOY_ADMIN_SAVE_BANNER",{banner:b});refreshAfterSave("save-banner");renderAll();return}
  if(action==="clear-banner"){state.editingBannerId="";renderBanners();return}
  if(action==="save-card"){const c=collectCard();if(!c.title){toast("Travel card title is required.","bad");return}upsert("travelCards","cardId",c);post("VOY_ADMIN_SAVE_TRAVEL_CARD",{card:c});refreshAfterSave("save-travel-card");renderAll();return}
  if(action==="clear-card"){state.editingCardId="";renderTravelCards();return}
  if(action==="run-quality-lab"){
    const payload={issue:currentIssue(),pages:issuePages(),assets:state.assets,articles:state.articles.filter(a=>String(a.issueId||"")===String(currentIssueId())),brandKit:state.brandKit,localChecks:qualityChecklist(),readiness:readinessStats()};
    post("VOY_QUALITY_LAB_REQUEST",payload);toast("Quality lab request sent.");return}
  if(action==="copy-chief-review"){post("VOY_COPY_CHIEF_REVIEW_REQUEST",{page:currentPage(),article:currentArticle(),brandKit:state.brandKit});toast("Copy chief review requested.");return}
  if(action==="fact-check-claims"){post("VOY_FACT_CHECK_REQUEST",{issue:currentIssue(),page:currentPage(),article:currentArticle(),destination:currentPage()?.destination||currentArticle()?.destination||""});toast("Fact check requested.");return}
  if(action==="accessibility-seo-check"){post("VOY_ACCESSIBILITY_SEO_REQUEST",{issue:currentIssue(),page:currentPage(),article:currentArticle()});toast("Accessibility and SEO check requested.");return}
  if(action==="translate-package"){post("VOY_TRANSLATION_PACKAGE_REQUEST",{issue:currentIssue(),pages:issuePages(),languages:arr($("qualityLangs")?.value||"sv,no,da,fi,de"),brandKit:state.brandKit});toast("Translation package requested.");return}
  if(action==="save-brand-kit"){state.brandKit=collectBrandKit();post("VOY_BRAND_KIT_SAVE",{brandKit:state.brandKit});toast("Brand kit saved locally and sent to backend.","ok");refreshAfterSave("save-brand-kit");renderAll();return}
  if(action==="run-brand-guard"){const kit=document.getElementById("brandName")?collectBrandKit():state.brandKit;post("VOY_BRAND_GUARD_REQUEST",{brandKit:kit,issue:currentIssue(),pages:issuePages(),articles:state.articles});toast("Brand guard requested.");return}
  if(action==="run-print-qa"){state.printQa=printQaData();post("VOY_PRINT_QA_REQUEST",{qa:state.printQa,issue:currentIssue(),pages:issuePages(),assets:state.assets});toast("Print QA requested.");renderPrintQa();return}
  if(action==="prepare-print-export"){state.printQa=printQaData();post("VOY_PREPARE_PRINT_PACKAGE_REQUEST",{issue:currentIssue(),pages:issuePages(),assets:state.assets,qa:state.printQa,format:"press-ready-pdf"});toast("Press package preparation requested.");renderPrintQa();return}
  if(action==="generate-distribution-kit"){
    const kit={kitId:uid("DIST"),issueId:currentIssueId(),name:$("distName").value.trim(),market:$("distMarket").value.trim(),channel:$("distChannel").value,ctaPath:$("distCta").value.trim(),utmCampaign:$("distUtm").value.trim(),angle:$("distAngle").value.trim(),createdAt:new Date().toISOString()};
    post("VOY_DISTRIBUTION_KIT_REQUEST",{kit,issue:currentIssue(),pages:issuePages(),campaigns:state.campaigns,brandKit:state.brandKit});toast("Distribution kit requested.");return}
  if(action==="save-distribution-kit"){
    const kit=state.distributionKit||{kitId:uid("DIST"),issueId:currentIssueId(),summary:"Manual distribution kit placeholder",createdAt:new Date().toISOString()};
    state.distributionKits.unshift(kit);post("VOY_DISTRIBUTION_KIT_SAVE",{kit});toast("Distribution kit saved.","ok");refreshAfterSave("save-distribution-kit");renderAll();return}
  if(action==="image-enhance"){post("VOY_MEDIA_ENHANCE_REQUEST",{issueId:currentIssueId(),assets:state.assets,mode:"editorial-quality"});toast("Media enhancement request sent.");return}
  if(action==="save-api-config"){post("VOY_CONNECTOR_CONFIG_SAVE",{aliases:{asset:$("apiAssetAlias").value,research:$("apiResearchAlias").value,export:$("apiExportAlias").value},enabled:$("apiEnabled").value==="true"});toast("Connector aliases sent to backend.");refreshAfterSave("save-connector-config");return}
  if(action==="refresh-newsroom"){post("NEWSROOM_ADMIN_REFRESH",{});status("Refreshing newsroom data…");return}
  if(action==="new-news-post"){state.editingPostId="";renderPressReleases();return}
  if(action==="clear-news-post"){state.editingPostId="";renderPressReleases();return}
  if(action==="save-news-post"){
    const item=collectNewsPost();if(!item.title){toast("Press-release headline is required.","bad");return}upsert("newsroomPosts","postId",item);state.editingPostId=item.postId;post("NEWSROOM_SAVE_POST",{item});toast("Press release saved.","ok");return;
  }
  if(action==="publish-current-news-post"){
    const item=collectNewsPost();if(!item.title){toast("Press-release headline is required.","bad");return}upsert("newsroomPosts","postId",item);state.editingPostId=item.postId;post("NEWSROOM_PUBLISH_POST",{postId:item.postId,item});status("Publishing press release…");return;
  }
  if(action==="clear-press-contact"){state.editingContactId="";renderPressContacts();return}
  if(action==="save-press-contact"){
    const item=collectPressContact();if(!item.name||!item.email){toast("Contact name and email are required.","bad");return}upsert("pressContacts","contactId",item);state.editingContactId=item.contactId;post("NEWSROOM_SAVE_CONTACT",{item});toast("Press contact saved.","ok");return;
  }
}
document.addEventListener("click",e=>{
  const module=e.target.closest("[data-module]");if(module){setModule(module.dataset.module);return}
  const nav=e.target.closest("[data-panel]");if(nav){setPanel(nav.dataset.panel);return}
  const act=e.target.closest("[data-action]");if(act){handleAction(act.dataset.action);return}
  const tmpl=e.target.closest("[data-template]");if(tmpl){const p=currentPage();if(!p){handleAction("new-page");return}p.template=tmpl.dataset.template;renderBuilder();return}
  const blockRemove=e.target.closest("[data-block-remove]");if(blockRemove){let p;try{p=collectPage()}catch(_){p=currentPage()}if(p){const b=parseBlocks(p.blocks);b.splice(Number(blockRemove.dataset.blockRemove),1);p.blocks=b;upsert("pages","pageId",p);renderBuilder()}return}
  const blockMove=e.target.closest("[data-block-move]");if(blockMove){let p;try{p=collectPage()}catch(_){p=currentPage()}if(p){const b=parseBlocks(p.blocks),i=Number(blockMove.dataset.blockIndexAction),j=blockMove.dataset.blockMove==="up"?i-1:i+1;if(i>=0&&j>=0&&j<b.length){[b[i],b[j]]=[b[j],b[i]];p.blocks=b;upsert("pages","pageId",p);renderBuilder()}}return}
  const page=e.target.closest("[data-edit-page]");if(page){state.selectedPageId=page.dataset.editPage;setPanel("builder");return}
  const delPage=e.target.closest("[data-delete-page]");if(delPage&&confirm("Delete page?")){const pageId=delPage.dataset.deletePage;state.pages=state.pages.filter(p=>(p.pageId||p._id)!==pageId);post("VOY_ADMIN_DELETE_PAGE",{pageId,issueId:currentIssueId()});renderAll();return}
  const selIssue=e.target.closest("[data-select-issue]");if(selIssue){state.selectedIssueId=selIssue.dataset.selectIssue;renderAll();return}
  const editIssue=e.target.closest("[data-edit-issue]");if(editIssue){state.editingIssueId=editIssue.dataset.editIssue;setPanel("issues");return}
  const publishIssue=e.target.closest("[data-publish-issue]");if(publishIssue){state.selectedIssueId=publishIssue.dataset.publishIssue;handleAction("publish-issue");return}
  const archiveIssue=e.target.closest("[data-archive-issue]");if(archiveIssue){state.selectedIssueId=archiveIssue.dataset.archiveIssue;handleAction("archive-issue");return}
  const delIssue=e.target.closest("[data-delete-issue]");if(delIssue&&confirm("Delete issue?")){state.issues=state.issues.filter(i=>(i.issueId||i._id)!==delIssue.dataset.deleteIssue);post("VOY_ADMIN_DELETE_ISSUE",{issueId:delIssue.dataset.deleteIssue});refreshAfterSave("delete-issue");renderAll();return}
  const editPost=e.target.closest("[data-edit-news-post]");if(editPost){state.editingPostId=editPost.dataset.editNewsPost;setPanel("pressreleases");return}
  const publishPost=e.target.closest("[data-publish-news-post]");if(publishPost){const item=state.newsroomPosts.find(p=>String(newsroomPostId(p))===String(publishPost.dataset.publishNewsPost));if(item){post("NEWSROOM_PUBLISH_POST",{postId:newsroomPostId(item),item});status("Publishing press release…")}return}
  const archivePost=e.target.closest("[data-archive-news-post]");if(archivePost){post("NEWSROOM_ARCHIVE_POST",{postId:archivePost.dataset.archiveNewsPost});status("Archiving press release…");return}
  const editContact=e.target.closest("[data-edit-press-contact]");if(editContact){state.editingContactId=editContact.dataset.editPressContact;setPanel("presscontacts");return}
  const editArticle=e.target.closest("[data-edit-article]");if(editArticle){state.selectedArticleId=editArticle.dataset.editArticle;setPanel("articles");return}
  const delArticle=e.target.closest("[data-delete-article]");if(delArticle&&confirm("Delete article?")){state.articles=state.articles.filter(a=>(a.articleId||a._id)!==delArticle.dataset.deleteArticle);post("VOY_ADMIN_DELETE_ARTICLE",{articleId:delArticle.dataset.deleteArticle});refreshAfterSave("delete-article");renderAll();return}
  const importAsset=e.target.closest("[data-import-asset]");if(importAsset){const id=importAsset.dataset.importAsset;const a=state.assetResults.find(x=>String(x.assetId||x.id||x.url)===id);if(a){state.assets.unshift({...a,assetId:a.assetId||uid("ASSET"),importedAt:new Date().toISOString()});post("VOY_ASSET_IMPORT_REQUEST",{asset:a});toast("Asset imported.");refreshAfterSave("import-asset");renderAll()}return}
  const editCat=e.target.closest("[data-edit-category]");if(editCat){state.editingCategoryId=editCat.dataset.editCategory;renderCategories();return}
  const delCat=e.target.closest("[data-delete-category]");if(delCat&&confirm("Delete category?")){state.categories=state.categories.filter(c=>(c.categoryId||c._id)!==delCat.dataset.deleteCategory);post("VOY_ADMIN_DELETE_CATEGORY",{categoryId:delCat.dataset.deleteCategory});refreshAfterSave("delete-category");renderAll();return}
  const editBan=e.target.closest("[data-edit-banner]");if(editBan){state.editingBannerId=editBan.dataset.editBanner;renderBanners();return}
  const delBan=e.target.closest("[data-delete-banner]");if(delBan&&confirm("Delete banner?")){state.banners=state.banners.filter(b=>(b.bannerId||b._id)!==delBan.dataset.deleteBanner);post("VOY_ADMIN_DELETE_BANNER",{bannerId:delBan.dataset.deleteBanner});refreshAfterSave("delete-banner");renderAll();return}
  const editCard=e.target.closest("[data-edit-card]");if(editCard){state.editingCardId=editCard.dataset.editCard;renderTravelCards();return}
  const delCard=e.target.closest("[data-delete-card]");if(delCard&&confirm("Delete travel card?")){state.travelCards=state.travelCards.filter(c=>(c.cardId||c._id)!==delCard.dataset.deleteCard);post("VOY_ADMIN_DELETE_TRAVEL_CARD",{cardId:delCard.dataset.deleteCard});refreshAfterSave("delete-travel-card");renderAll();return}
  const test=e.target.closest("[data-test-api]");if(test){post("VOY_API_CONNECTOR_TEST",{index:Number(test.dataset.testApi)});toast("Connector test requested.");return}
});

document.addEventListener("click",e=>{
  const planSave=e.target.closest("[data-save-web-plan]");if(planSave){const page=currentCatalogPage("plan");if(!page){toast("Select a registered page.","bad");return}const statusValue=$("webPlanStatus")?.value||"DRAFT",existing=selectPlanRecord(page)||{};post("VOY_ADMIN_SAVE_CAMPAIGN",{campaign:{...existing,campaignId:recordId(existing)||`WEBPAGE-${page.key.toUpperCase()}`,scope:"WEBSITE",presentationKind:"PAGE_PLAN",pagePath:page.path,title:page.label,status:statusValue,notes:$("webPlanNotes")?.value||"",published:statusValue==="PUBLISHED"}});toast("Website page plan queued for save.");return}
  const copySave=e.target.closest("[data-save-web-content]");if(copySave){const page=currentCatalogPage("copy"),section=sectionById(page,state.editorialSelection.copySectionId),field=(section?.fields||[]).find(x=>x.id===state.editorialSelection.copyFieldId);if(!page||!field){toast("Select a registered page, section and field.","bad");return}const statusValue=$("webContentStatus")?.value||"DRAFT",value=$("webContentValue")?.value||"",existing=selectCopyRecord(page,field.id)||{};post("VOY_ADMIN_SAVE_ARTICLE",{article:{...existing,articleId:recordId(existing)||`WEBCOPY-${page.key}-${field.id}`.replace(/[^a-z0-9._:-]+/gi,"-").slice(0,170),scope:"WEBSITE",presentationKind:"CONTENT_BLOCK",pagePath:page.path,sectionId:section.id,contentId:field.id,title:field.label||field.id,value,body:value,status:statusValue,published:statusValue==="PUBLISHED"}});toast("Page copy queued for save.");return}
  const mediaSave=e.target.closest("[data-save-web-media]");if(mediaSave){const page=currentCatalogPage("media"),section=sectionById(page,state.editorialSelection.mediaSectionId),slot=(section?.mediaSlots||[]).find(x=>x.id===state.editorialSelection.mediaSlotId),assetUrl=$("webMediaUrl")?.value.trim(),statusValue=$("webMediaStatus")?.value||"DRAFT",alt=$("webMediaAlt")?.value.trim()||"";if(!page||!slot||!isHttpUrl(assetUrl)){toast("Select a registered media slot and a public Asset Library image.","bad");return}if(statusValue==="PUBLISHED"&&!alt){toast("Alt text is required before publishing presentation media.","bad");return}const existing=selectMediaRecord(page,slot.id)||{};post("VOY_ADMIN_SAVE_BANNER",{banner:{...existing,bannerId:recordId(existing)||`WEBMEDIA-${page.key}-${slot.id}`.replace(/[^a-z0-9._:-]+/gi,"-").slice(0,170),scope:"WEBSITE",presentationKind:"MEDIA_SLOT",pagePath:page.path,sectionId:section.id,slotId:slot.id,title:slot.label||slot.id,assetUrl,imageUrl:assetUrl,alt,status:statusValue,published:statusValue==="PUBLISHED",ownership:"MEDIA_CONTROL"}});toast("Presentation media queued for save.");return}
  const planPage=e.target.closest("[data-web-plan-page]");if(planPage){state.editorialSelection.planPageKey=planPage.dataset.webPlanPage;renderSitePlanner();return}
  const editCopy=e.target.closest("[data-edit-web-content]");if(editCopy){const r=websiteRecords("article","CONTENT_BLOCK").find(x=>String(recordId(x))===String(editCopy.dataset.editWebContent));if(r){const p=catalogPages().find(x=>x.path===r.pagePath);if(p){state.editorialSelection.copyPageKey=p.key;const sec=(p.sections||[]).find(x=>(x.fields||[]).some(f=>f.id===r.contentId));state.editorialSelection.copySectionId=sec?.id||"";state.editorialSelection.copyFieldId=r.contentId;setPanel("webcontent")}}return}
  const editMedia=e.target.closest("[data-edit-web-media]");if(editMedia){const r=websiteRecords("banner","MEDIA_SLOT").find(x=>String(recordId(x))===String(editMedia.dataset.editWebMedia));if(r){const p=catalogPages().find(x=>x.path===r.pagePath);if(p){state.editorialSelection.mediaPageKey=p.key;const sec=(p.sections||[]).find(x=>(x.mediaSlots||[]).some(f=>f.id===r.slotId));state.editorialSelection.mediaSectionId=sec?.id||"";state.editorialSelection.mediaSlotId=r.slotId;setPanel("webmedia")}}return}
  const delPlan=e.target.closest("[data-delete-web-plan]");if(delPlan&&confirm("Delete this page-plan record?")){post("VOY_ADMIN_DELETE_CAMPAIGN",{campaignId:delPlan.dataset.deleteWebPlan});toast("Page-plan deletion queued.");return}
  const delCopy=e.target.closest("[data-delete-web-content]");if(delCopy&&confirm("Delete this page-copy record?")){post("VOY_ADMIN_DELETE_ARTICLE",{articleId:delCopy.dataset.deleteWebContent});toast("Page-copy deletion queued.");return}
  const delMedia=e.target.closest("[data-delete-web-media]");if(delMedia&&confirm("Delete this presentation-media record?")){post("VOY_ADMIN_DELETE_BANNER",{bannerId:delMedia.dataset.deleteWebMedia});toast("Presentation-media deletion queued.");return}
  const release=e.target.closest("[data-release-status]");if(release){releasePageTo(release.dataset.releaseStatus);return}
  const open=e.target.closest("[data-open-public-page]");if(open){post("MEDIA_CONTROL_OPEN_PUBLIC_PAGE",{pageKey:open.dataset.openPublicPage});return}
  if(e.target.closest("[data-run-content-audit]")){renderContentAudit();toast("Editorial audit refreshed.","ok");return}
  if(e.target.closest("[data-export-editorial-snapshot]")){exportEditorialSnapshot();return}
});

document.addEventListener("change",e=>{
  if(e.target.id==="builderIssueSelect"){state.selectedIssueId=e.target.value;state.selectedPageId="";renderAll()}
  if(e.target.id==="pageTemplate"){const p=currentPage();if(p){p.template=e.target.value;if(!parseBlocks(p.blocks).length)p.blocks=defaultBlocksForTemplate(p.template);renderBuilder()}}
  if(e.target.id==="webPlanPage"){state.editorialSelection.planPageKey=e.target.value;renderSitePlanner()}
  if(e.target.id==="webContentPage"){state.editorialSelection.copyPageKey=e.target.value;state.editorialSelection.copySectionId="";state.editorialSelection.copyFieldId="";renderWebContent()}
  if(e.target.id==="webContentSection"){state.editorialSelection.copySectionId=e.target.value;state.editorialSelection.copyFieldId="";renderWebContent()}
  if(e.target.id==="webContentField"){state.editorialSelection.copyFieldId=e.target.value;renderWebContent()}
  if(e.target.id==="webMediaPage"){state.editorialSelection.mediaPageKey=e.target.value;state.editorialSelection.mediaSectionId="";state.editorialSelection.mediaSlotId="";renderWebMedia()}
  if(e.target.id==="webMediaSection"){state.editorialSelection.mediaSectionId=e.target.value;state.editorialSelection.mediaSlotId="";renderWebMedia()}
  if(e.target.id==="webMediaSlotSelect"){state.editorialSelection.mediaSlotId=e.target.value;renderWebMedia()}
  if(e.target.id==="releasePage"){state.editorialSelection.releasePageKey=e.target.value;renderReleaseCenter()}
});
document.addEventListener("input",e=>{
  if(e.target.matches("[data-block-field]")){const box=$("pageBlocks");if(box){const blocks=collectVisualBlocks();if(blocks)box.value=JSON.stringify(blocks,null,2)}}
  if(e.target.id==="webContentValue"&&$("webContentCount"))$("webContentCount").textContent=String(e.target.value||"").length;
});
$("globalQuery").addEventListener("input",()=>renderAll());
$("mobileMenuBtn").addEventListener("click",()=>document.body.classList.add("mobile-drawer-open"));
$("drawerOverlay").addEventListener("click",()=>document.body.classList.remove("mobile-drawer-open"));
window.addEventListener("message",e=>{
  const m=e.data||{};if(m.source&&m.source!==PARENT)return;const p=m.payload||{};
  if(m.type==="INTERNAL_CHROME_BOOTSTRAP"){
    const profile=p.profile||{};const name=profile.name||profile.fullName||[profile.firstName,profile.lastName].filter(Boolean).join(" ")||profile.email||"SKANDI Editor";
    if($("mmUserName"))$("mmUserName").textContent=name;if($("mmUserRole"))$("mmUserRole").textContent=profile.position||profile.jobTitle||profile.role||"Editorial access";if($("mmUserInitials"))$("mmUserInitials").textContent=name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"SK";return;
  }
  if(m.type==="MEDIA_CONTROL_EDITORIAL_CATALOG"){state.catalog=Array.isArray(p.pages)?p.pages:[];ensureCatalogSelections();if($("mmSyncState"))$("mmSyncState").textContent="Catalog";renderAll();return}
  if(m.type==="MEDIA_CONTROL_LIBRARY"){state.assets=p.assets||state.assets;renderAssets();return}
  if(m.type==="MEDIA_CONTROL_ERROR"){status(p.message||"Media Control action failed.","bad");return}
  if(m.type==="VOY_ADMIN_BOOTSTRAP_RESULT"){state={...state,...p};status("Loaded VOY data.","ok");if($("mmSyncState"))$("mmSyncState").textContent="Live";renderAll();return}
  if(m.type==="NEWSROOM_ADMIN_BOOTSTRAP"||m.type==="NEWSROOM_ADMIN_DATA"){
    const d=p.data||p;
    state.newsroomPosts=d.posts||d.newsroomPosts||state.newsroomPosts;
    state.newsroomCategories=d.categories||d.newsroomCategories||state.newsroomCategories;
    state.newsroomMedia=d.mediaAssets||d.media||d.assets||state.newsroomMedia;
    state.pressContacts=d.pressContacts||d.contacts||state.pressContacts;
    if($("mmSyncState"))$("mmSyncState").textContent="Live";renderAll();return;
  }
  if(m.type==="VOY_ADMIN_SAVED"){status("Saved. Refreshing live data.","ok");requestLiveRefresh("backend-saved");return}
  if(m.type==="VOY_ADMIN_PUBLISHED"){
    const result=p.result||p;const issue=state.issues.find(i=>String(i.issueId||i._id)===String(result.issueId||result.issue_id||currentIssueId()));if(issue){issue.publishStatus="PUBLISHED";issue.publicUrl=result.publicUrl||result.public_url||issue.publicUrl;issue.publishedAt=result.publishedAt||result.published_at||new Date().toISOString()}
    status("Published. This issue is now available on the public VOY Magazine page.","ok");if($("mmSyncState"))$("mmSyncState").textContent="Published";renderAll();return;
  }
  if(m.type==="VOY_ADMIN_ARCHIVED"){const issue=state.issues.find(i=>String(i.issueId||i._id)===String(p.issueId||p.issue_id||currentIssueId()));if(issue)issue.publishStatus="ARCHIVED";status("Issue archived and removed from the public reader.","ok");renderAll();return}
  if(m.type==="NEWSROOM_ADMIN_SAVED"){status("Newsroom record saved.","ok");post("NEWSROOM_ADMIN_REFRESH",{});return}
  if(m.type==="VOY_ADMIN_ERROR"){status(m.message||p.message||"VOY backend error.","bad");return}
  if(m.type==="NEWSROOM_ADMIN_ERROR"){status(m.message||p.message||"Newsroom action failed.","bad");return}
  if(m.type==="VOY_ASSET_SEARCH_RESULT"){state.assetResults=p.results||p.assets||[];status(`${state.assetResults.length} asset results loaded.`,"ok");setPanel("assets");return}
  if(m.type==="VOY_DESTINATION_RESEARCH_RESULT"){state.destinationResearch=p.result||p;status("Destination research loaded.","ok");setPanel("research");return}
  if(m.type==="VOY_COPY_ASSIST_RESULT"){const text=p.text||p.copy||"";if(currentPage()&&text){currentPage().body=text;setPanel("builder")}toast("Copy assist result received.");return}
  if(m.type==="VOY_SEO_ANALYZE_RESULT"){state.seoResult=p.result||p;toast("SEO analysis received.","ok");renderDashboard();return}
  if(m.type==="VOY_PR_BRIEF_RESULT"){const c=p.campaign||p.result;if(c){state.campaigns.unshift({...c,campaignId:c.campaignId||uid("CAMPAIGN")});setPanel("campaign")}return}
  if(m.type==="VOY_QUALITY_LAB_RESULT"){state.qualityResult=p.result||p;status("Quality lab result received.","ok");setPanel("quality");return}
  if(m.type==="VOY_BRAND_GUARD_RESULT"){state.brandGuardResult=p.result||p;status("Brand guard result received.","ok");setPanel("brandkit");return}
  if(m.type==="VOY_PRINT_QA_RESULT"){state.printQa=p.result||p;status("Print QA result received.","ok");setPanel("printqa");return}
  if(m.type==="VOY_DISTRIBUTION_KIT_RESULT"){state.distributionKit=p.result||p;status("Distribution kit received.","ok");setPanel("distribution");return}
  if(m.type==="VOY_TRANSLATION_PACKAGE_RESULT"){state.translationResult=p.result||p;status("Translation package received.","ok");setPanel("quality");return}
  if(m.type==="VOY_MEDIA_ENHANCE_RESULT"){state.assets=p.assets||state.assets;status("Media enhancement result received.","ok");setPanel("assets");return}
});
init();
})();
