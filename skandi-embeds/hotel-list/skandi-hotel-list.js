(() => {
  const root=document.getElementById("hotelListApp");
  if(!root)return;
  const find=id=>document.getElementById(id);
  const form=find("hotelBookingForm");
  const field=name=>form.elements.namedItem(name);
  const status=find("hotelStatus"), retry=find("hotelRetry");
  const escape=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const safeImage=value=>typeof value==="string"&&/^https:\/\//i.test(value)?escape(value):"";
  const rows=value=>Array.isArray(value)?value:[];
  const link=path=>new URL(path,"https://www.skanditravels.com").href;
  const source="SKANDI_AREA_HOTEL_SEARCH";
  let hotels=[],selected=null,routes={},settings={},pending,timer,booted=false;

  function post(type,payload={},requestId=""){
    window.parent.postMessage({source,type,payload,requestId},"*");
  }
  function request(type,payload={},message="Loading hotels…"){
    clearTimeout(timer);
    pending=Date.now().toString(36)+Math.random().toString(36).slice(2,9);
    status.textContent=message;
    if(type==="HOTEL_SEARCH_RUN")status.scrollIntoView?.({block:"nearest"});
    retry.hidden=true;
    find("hotelBook").disabled=true;
    post(type,payload,pending);
    timer=setTimeout(()=>{pending=null;status.textContent="We couldn’t load this request. Try again.";retry.hidden=false;updateBooking();},26000);
  }
  function load(force=false){request("HOTEL_SEARCH_READY",{settings,force});}
  function nav(path){post("HOTEL_SEARCH_NAVIGATE",{path});}
  function anchor(path,label,className="",description=""){
    if(typeof path!=="string"||!path.startsWith("/")||path.startsWith("//"))return "";
    return `<a class="${className}" target="_top" href="${escape(link(path))}" data-path="${escape(path)}"${description?` aria-label="${escape(description)}"`:""}>${escape(label)}</a>`;
  }
  function shortCopy(value,limit=300){
    const text=String(value||"").trim().split(/\n/)[0];
    return text.length>limit?text.slice(0,limit).replace(/\s+\S*$/,"")+"…":text;
  }
  function filterHotels(){
    const term=find("hotelFilter").value.trim().toLowerCase();
    const visible=hotels.filter(h=>[h.name,h.location].join(" ").toLowerCase().includes(term));
    const sort=find("hotelSort").value;
    if(sort==="name")visible.sort((a,b)=>a.name.localeCompare(b.name));
    if(sort==="rating")visible.sort((a,b)=>(b.guestRating||0)-(a.guestRating||0)||a.name.localeCompare(b.name));
    find("hotelCount").textContent=visible.length?`${visible.length} ${visible.length===1?"hotel":"hotels"}`:
      hotels.length?"No hotels match your search.":"No hotels are listed for this place yet.";
    find("hotelCards").innerHTML=visible.map(h=>{
      const image=safeImage(h.image),summary=shortCopy(h.summary,170);
      const ratings=[h.classification?`${h.classification}-star hotel`:"",h.guestRating?`Guest rating ${h.guestRating}`:""].filter(Boolean).join(" · ");
      return `<article class="sj-card hs-card">${image?`<img class="sj-card-img" src="${image}" alt="" loading="lazy">`:""}
        <div class="hs-card-copy">${h.location?`<p class="hs-location">${escape(h.location)}</p>`:""}<h2>${escape(h.name)}</h2>
        ${ratings?`<p class="hs-grid-meta">${escape(ratings)}</p>`:""}${summary?`<p class="hs-summary">${escape(summary)}</p>`:""}
        ${anchor(h.path,"View hotel","sj-button primary","View "+h.name)}</div></article>`;
    }).join("");
  }
  function section(title,body){return body?`<section class="sj-section"><h2 class="sj-heading">${escape(title)}</h2>${body}</section>`:"";}
  function subSection(title,body){return body?`<div><h3>${escape(title)}</h3>${body}</div>`:"";}
  function display(value,depth=0){
    if(depth>6||value===null||value===undefined||value==="")return "";
    if(typeof value==="string"){
      const raw=value.trim();
      if((raw.startsWith("{")&&raw.endsWith("}"))||(raw.startsWith("[")&&raw.endsWith("]"))){try{return display(JSON.parse(raw),depth+1)}catch(_){}}
      return raw;
    }
    if(typeof value==="boolean")return value?"Yes":"No";
    if(typeof value==="number")return String(value);
    if(Array.isArray(value))return value.map(v=>display(v,depth+1)).filter(Boolean).join(" · ");
    if(typeof value==="object")return Object.values(value).map(v=>display(v,depth+1)).filter(Boolean).join(" · ");
    return "";
  }
  function paragraph(value){const result=display(value);return result?result.split(/\n\s*\n/).map(part=>`<p>${escape(part).replace(/\n/g,"<br>")}</p>`).join(""):"";}
  function bullets(values){const items=rows(values).map(v=>display(v)).filter(Boolean);return items.length?`<ul>${items.map(value=>`<li>${escape(value)}</li>`).join("")}</ul>`:"";}
  function fieldLabel(key){return key.replace(/[_-]+/g," ").replace(/([a-z])([A-Z])/g,"$1 $2").replace(/^./,c=>c.toUpperCase());}
  function contentFacts(value){
    if(typeof value==="string"){const str=value.trim();if((str.startsWith("{")&&str.endsWith("}"))||(str.startsWith("[")&&str.endsWith("]"))){try{return contentFacts(JSON.parse(str))}catch(_){}}return paragraph(str)}
    if(Array.isArray(value))return bullets(value);
    if(value&&typeof value==="object")return facts(Object.entries(value).map(([key,item])=>[fieldLabel(key),display(item)]));
    return paragraph(value);
  }
  function facts(entries){
    const items=entries.map(([label,value])=>[display(label),display(value)]).filter(([label,value])=>label&&value);
    return items.length?`<dl>${items.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl>`:"";
  }
  function selectHotelSection(key){
    find("hotelSections").querySelectorAll("button").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.section===key)));
    find("hotelPanels").querySelectorAll("[data-panel]").forEach(panel=>{panel.hidden=panel.dataset.panel!==key});
  }
  function renderDetail(page){
    const current=find("hotelSections").querySelector('[aria-pressed="true"]')?.dataset.section;
    const place=page.locationTransfer||{},policies=page.policies||{};
    const metadata=rows(page.galleryMedia);
    const gallery=rows(page.gallery).map(url=>({url:safeImage(url),meta:metadata.find(item=>item.url===url)||{}})).filter(item=>item.url);
    const roomInfo=rows(page.rooms).map(room=>{
      const image=safeImage(room.image);
      const name=display(room.name)||"Room";
      const labels=[display(room.roomType),display(room.bedType),display(room.size),room.capacity?`Sleeps ${room.capacity}`:""].filter(Boolean);
      return `<details class="hs-room"><summary><span>${escape(name)}</span>${labels.length?`<small>${escape(labels.join(" · "))}</small>`:""}</summary>
        <div>${image?`<img src="${image}" alt="${escape(name)}" loading="lazy">`:""}${paragraph(room.description)}${bullets(room.features)}</div></details>`;
    }).join("");
    const moreFacts=facts(rows(page.facts).map(fact=>[fact.label,fact.value]));
    const about=display(page.about);
    const facilities=bullets(rows(page.facilities).map(value=>typeof value==="string"?value.replace(/_/g," "):value));
    const amenityDetails=[
      ["Food and drink",page.food],["Pool and beach",page.poolBeach],["Activities",page.activities],["Accessibility",page.accessibility]
    ].map(([title,value])=>section(title,contentFacts(value))).join("");
    const locationFacts=facts([["Address",place.address],["Distance to airport",place.airportDistance],["Transfer time",place.transferTime],
      ["Distance to city centre",place.centerDistance],["Distance to beach",place.beachDistance],["Phone",place.phone],["Email",place.email]]);
    const stayPolicies=facts([["Minimum check-in age",policies.minimumAge],["Pets allowed",policies.petsAllowed],["Smoking",policies.smoking]]);
    const panels=[
      ["overview","Overview",section("About the hotel",
        facts([["Official rating",page.classification?`${page.classification} stars`:""],["Guest rating",page.guestRating],
          ["Check-in",policies.checkIn],["Check-out",policies.checkOut]])+
        (about&&about!==display(page.summary)?paragraph(about):"")+subSection("Highlights",bullets(page.highlights)))+
        section("Property details",moreFacts?`<details><summary>See more about the property</summary>${moreFacts}</details>`:"")],
      ["rooms","Rooms",section("Rooms",paragraph(page.roomsIntro)+roomInfo)],
      ["facilities","Facilities",section("Facilities",facilities)+amenityDetails+section("Meal plans",bullets(page.boardOptions))],
      ["location","Location & policies",section("Location",paragraph(place.text)+locationFacts)+
        section("Policies and useful information",paragraph(page.important)+stayPolicies+subSection("Included",bullets(page.included))+subSection("Not included",bullets(page.notIncluded)))],
      ["photos","Photos",section("Photos",gallery.length?`<div class="hs-gallery">${gallery.map(image=>`<figure><img src="${image.url}" alt="${escape(display(image.meta.alt)||page.name)}" loading="lazy">${image.meta.caption?`<figcaption>${escape(display(image.meta.caption))}</figcaption>`:""}</figure>`).join("")}</div>`:"")]
    ].filter(([, ,body])=>body);
    find("hotelSections").hidden=panels.length<2;
    find("hotelSections").innerHTML=panels.map(([key,title])=>
      `<button type="button" data-section="${key}" aria-controls="hotel-section-${key}" aria-pressed="false">${escape(title)}</button>`
    ).join("");
    find("hotelPanels").innerHTML=panels.map(([key,,body])=>`<div class="hs-panel" id="hotel-section-${key}" data-panel="${key}" hidden>${body}</div>`).join("");
    selectHotelSection(panels.some(([key])=>key===current)?current:panels[0]?.[0]);
  }
  function renderBreadcrumb(page,detail){
    const parts=[anchor(routes.destinations||"/destinations","Destinations")];
    rows(page.breadcrumbs).forEach(place=>parts.push(anchor(place.path,place.name)));
    if(detail){
      const query=new URLSearchParams();
      ["country","region","destination","area"].forEach(level=>{if(page[level+"Slug"])query.set(level,page[level+"Slug"])});
      const directory=(routes.hotelList||"/destinations/explore/hotel-list")+(query.size?"?"+query:"");
      parts.push(anchor(page.hotelsPath||directory,"Hotels"));
    }
    parts.push(`<span aria-current="page">${escape(detail?page.name:"Hotels")}</span>`);
    find("hotelBreadcrumb").innerHTML=parts.filter(Boolean).join('<span aria-hidden="true">›</span>');
  }
  function updateBooking(){
    const hotel=selected||hotels.find(h=>h.id===find("hotelProperty").value);
    const bookable=hotel?.bookable===true;
    find("hotelBooking").hidden=!bookable;
    find("hotelHeroActions").hidden=!selected;
    find("hotelAvailabilityLink").hidden=!selected||!bookable;
    find("hotelUnavailable").hidden=!selected||bookable;
    find("hotelBook").disabled=!bookable||Boolean(pending);
    find("hotelFlightsField").hidden=!hotel?.flightsAvailable;
    if(!hotel?.flightsAvailable)field("addFlights").checked=false;
    find("hotelOriginField").hidden=!field("addFlights").checked;
    field("originIata").required=field("addFlights").checked;
  }
  function render(page,detail){
    selected=detail?page:null;
    hotels=detail?[]:rows(page.previewHotels);
    const scope=page.areaName||page.destinationName||page.regionName||page.countryName||"";
    const title=detail?page.name:scope?`Hotels in ${scope}`:"Explore hotels";
    const location=detail?[page.destinationName||page.areaName||page.regionName,page.countryName].filter(Boolean).join(" · "):"";
    const intro=detail?shortCopy(page.summary):"";
    find("hotelTitle").textContent=title;
    document.title=`${title} · SKANDI Travels`;
    find("hotelIntro").textContent=intro;
    find("hotelIntro").hidden=!intro;
    find("hotelLocation").textContent=location;
    find("hotelLocation").hidden=!location;
    const image=find("hotelHeroImage"),url=safeImage(page.heroImage);
    find("hotelVisual").hidden=!url;
    if(url)image.src=page.heroImage;
    else image.removeAttribute("src");
    renderBreadcrumb(page,detail);
    root.setAttribute("aria-busy","false");
    find("hotelDirectory").hidden=detail;
    find("hotelDetail").hidden=!detail;
    find("hotelPropertyField").hidden=detail;
    find("hotelProperty").innerHTML=hotels.filter(h=>h.bookable).map(h=>`<option value="${escape(h.id)}">${escape(h.name)}</option>`).join("");
    field("originIata").innerHTML='<option value="">Choose an airport</option>'+rows(page.airports).map(a=>`<option value="${escape(a.iata)}">${escape(a.city||a.name)} (${escape(a.iata)})</option>`).join("");
    find("hotelContent").hidden=false;
    if(detail)renderDetail(page);else filterHotels();
    updateBooking();
  }
  find("hotelSections").addEventListener("click",event=>{
    const button=event.target.closest("[data-section]");
    if(button)selectHotelSection(button.dataset.section);
  });
  find("hotelAvailabilityLink").addEventListener("click",()=>{
    const booking=find("hotelBooking");
    booking.open=true;
    booking.scrollIntoView({block:"nearest"});
    field("checkInDate").focus({preventScroll:true});
  });
  find("hotelFilter").addEventListener("input",filterHotels);
  find("hotelSort").addEventListener("change",filterHotels);
  find("hotelProperty").addEventListener("change",updateBooking);
  field("addFlights").addEventListener("change",updateBooking);
  field("children").addEventListener("change",()=>{
    const ages=[...find("hotelChildAges").querySelectorAll("input")].map(input=>input.value);
    const count=Math.max(0,Math.min(8,Number(field("children").value)||0));
    find("hotelChildAges").innerHTML=Array.from({length:count},(_,index)=>`<label>Child ${index+1} age<input type="number" min="0" max="17" value="${escape(ages[index]||"")}" required></label>`).join("");
  });
  field("checkInDate").min=new Date().toISOString().slice(0,10);
  field("checkInDate").addEventListener("change",()=>{field("checkOutDate").min=field("checkInDate").value;});
  form.addEventListener("submit",event=>{
    event.preventDefault();
    const hotel=selected||hotels.find(h=>h.id===find("hotelProperty").value);
    if(!hotel?.bookable||pending)return;
    const data=new FormData(form);
    request("HOTEL_SEARCH_RUN",{hotelId:hotel.id,settings,search:{...Object.fromEntries(data),
      addFlights:field("addFlights").checked,childAges:[...find("hotelChildAges").querySelectorAll("input")].map(input=>Number(input.value))
    }},"Opening your booking…");
  });
  root.addEventListener("click",event=>{
    const a=event.target.closest("a[data-path]");
    if(!a||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||window.parent===window)return;
    event.preventDefault();
    nav(a.dataset.path);
  });
  retry.addEventListener("click",()=>load(true));
  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;
    const message=event.data;
    if(message?.source!=="SKANDI_WIX_PARENT")return;
    const payload=message.payload||{};
    if(message.type==="DESTINATION_BRIDGE_READY"&&!booted){booted=true;load();return;}
    if(["SKANDI_MASTER_CONFIG","CUSTOMER_SETTINGS_STATE","CUSTOMER_SETTINGS_SAVED"].includes(message.type)){
      const next=payload.settings||payload.state||payload;
      const changed=(next.language&&next.language!==settings.language)||(next.currency&&next.currency!==settings.currency);
      settings={language:next.language||settings.language,currency:next.currency||settings.currency};
      if(changed&&booted&&!pending)load();
      return;
    }
    if(!pending||message.requestId!==pending)return;
    if(message.type==="BOOKING_SEARCH_NAVIGATING")return;
    const detail=message.type==="HOTEL_DETAIL_DATA";
    if(detail||message.type==="HOTEL_SEARCH_PAGE_RESULT"){
      clearTimeout(timer);pending=null;routes=payload.routes||routes;settings=payload.settings||settings;
      status.textContent="";
      render(payload.page,detail);
    }else if(["HOTEL_SEARCH_ERROR","HOTEL_DETAIL_ERROR"].includes(message.type)){
      clearTimeout(timer);pending=null;status.textContent=payload.message||"We couldn’t load this request. Try again.";
      retry.hidden=false;updateBooking();
    }
  });
  booted=true;
  load();
  const bootstrapRetry=setInterval(()=>{if(!pending||!find("hotelContent").hidden||!retry.hidden){clearInterval(bootstrapRetry);return;}post("HOTEL_SEARCH_READY",{settings},pending);},1500);
})();
