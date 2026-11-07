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
    status.scrollIntoView?.({block:"nearest"});
    retry.hidden=true;
    find("hotelBook").disabled=true;
    post(type,payload,pending);
    timer=setTimeout(()=>{pending=null;status.textContent="We couldn’t load this request. Try again.";retry.hidden=false;updateBooking();},26000);
  }
  function load(force=false){request("HOTEL_SEARCH_READY",{settings,force});}
  function nav(path){post("HOTEL_SEARCH_NAVIGATE",{path});}
  function anchor(path,label,className=""){
    return `<a class="${className}" target="_top" href="${escape(link(path))}" data-path="${escape(path)}">${escape(label)}</a>`;
  }
  function filterHotels(){
    const term=find("hotelFilter").value.trim().toLowerCase();
    const visible=hotels.filter(h=>[h.name,h.location].join(" ").toLowerCase().includes(term));
    const sort=find("hotelSort").value;
    if(sort==="name")visible.sort((a,b)=>a.name.localeCompare(b.name));
    if(sort==="rating")visible.sort((a,b)=>(b.guestRating||0)-(a.guestRating||0)||a.name.localeCompare(b.name));
    find("hotelCount").textContent=visible.length?`${visible.length} ${visible.length===1?"hotel":"hotels"}`:"No hotels match this selection.";
    find("hotelCards").innerHTML=visible.map(h=>{
      const image=safeImage(h.image);
      return `<article class="hs-card">${image?`<img src="${image}" alt="" loading="lazy">`:""}<div><p>${escape(h.location)}</p><h2>${escape(h.name)}</h2>${h.guestRating?`<p>Guest rating ${escape(h.guestRating)}</p>`:""}<p>${escape(h.summary)}</p>${anchor(h.path,"View hotel","hs-button")}${h.bookable?"":'<p>Booking not available</p>'}</div></article>`;
    }).join("");
  }
  function section(title,body){return body?`<section><h2>${escape(title)}</h2>${body}</section>`:"";}
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
  function renderDetail(page){
    const metadata=rows(page.galleryMedia);
    const gallery=rows(page.gallery).map(url=>({url:safeImage(url),meta:metadata.find(item=>item.url===url)||{}})).filter(item=>item.url);
    const roomInfo=rows(page.rooms).map(room=>`<details class="hs-room"><summary><span>${escape(display(room.name)||"Room")}</span><small>${escape([display(room.roomType),display(room.bedType),display(room.size),room.capacity?`Sleeps ${room.capacity}`:""].filter(Boolean).join(" · "))}</small></summary><div>${paragraph(room.description)}${bullets(room.features)}</div></details>`).join("");
    const place=page.locationTransfer||{};
    const policies=page.policies||{};
    find("hotelDetail").innerHTML=[
      section("About the hotel",paragraph(page.about)+paragraph(page.important)+facts(rows(page.facts).map(f=>[f.label,f.value]))),
      section("Photos",gallery.length?`<div class="hs-gallery">${gallery.map(image=>`<figure><img src="${image.url}" alt="${escape(display(image.meta.alt)||page.name)}" loading="lazy">${image.meta.caption?`<figcaption>${escape(display(image.meta.caption))}</figcaption>`:""}</figure>`).join("")}</div>`:""),
      section("Highlights",bullets(page.highlights)),
      section("Facilities",bullets(rows(page.facilities).map(value=>typeof value==="string"?value.replace(/_/g," "):value))),
      section("Rooms",paragraph(page.roomsIntro)+roomInfo),
      ...[["Food and drink",page.food],["Pool and beach",page.poolBeach],["Activities",page.activities],["Accessibility",page.accessibility]].map(([title,value])=>
        section(title,contentFacts(value))),
      section("Board options",bullets(page.boardOptions)),
      section("Good to know",facts([["Check-in",policies.checkIn],["Check-out",policies.checkOut],["Minimum check-in age",policies.minimumAge],["Pets allowed",policies.petsAllowed],["Smoking",policies.smoking]])+(rows(page.included).length?`<h3>Included</h3>${bullets(page.included)}`:"")+(rows(page.notIncluded).length?`<h3>Not included</h3>${bullets(page.notIncluded)}`:"")),
      section("Location",paragraph(place.text)+facts([["Address",place.address],["Airport",place.airportDistance],["Transfer",place.transferTime],["City centre",place.centerDistance],["Beach",place.beachDistance],["Phone",place.phone],["Email",place.email]]))
    ].join("");
  }
  function updateBooking(){
    const hotel=selected||hotels.find(h=>h.id===find("hotelProperty").value);
    const bookable=hotel?.bookable===true;
    find("hotelBooking").hidden=!bookable;
    find("hotelUnavailable").hidden=bookable||(!selected&&!hotels.length);
    find("hotelBook").disabled=!bookable||Boolean(pending);
    find("hotelFlightsField").hidden=!hotel?.flightsAvailable;
    if(!hotel?.flightsAvailable)field("addFlights").checked=false;
    find("hotelOriginField").hidden=!field("addFlights").checked;
    field("originIata").required=field("addFlights").checked;
  }
  function render(page,detail){
    selected=detail?page:null;
    hotels=detail?[]:rows(page.previewHotels);
    const scope=page.areaName||page.destinationName||page.countryName||"";
    find("hotelTitle").textContent=detail?page.name:scope?`Hotels in ${scope}`:"Explore hotels";
    find("hotelIntro").textContent=detail?page.summary||scope:page.intro||"Find a stay in a SKANDI destination.";
    const image=find("hotelHeroImage"), url=safeImage(page.heroImage);
    image.hidden=!url;
    if(url)image.src=page.heroImage;
    else image.removeAttribute("src");
    const query=new URLSearchParams();
    if(page.countrySlug)query.set("country",page.countrySlug);
    if(page.destinationSlug)query.set("destination",page.destinationSlug);
    if(page.areaSlug)query.set("area",page.areaSlug);
    const directory=routes.hotelList+(query.size?"?"+query.toString():"");
    find("hotelBreadcrumb").innerHTML=anchor(routes.destinations,"Destinations")+(detail?" › "+anchor(directory,"Hotels"):"");
    find("hotelDirectory").hidden=detail;
    find("hotelDetail").hidden=!detail;
    find("hotelPropertyField").hidden=detail;
    find("hotelProperty").innerHTML=hotels.filter(h=>h.bookable).map(h=>`<option value="${escape(h.id)}">${escape(h.name)}</option>`).join("");
    field("originIata").innerHTML='<option value="">Choose an airport</option>'+rows(page.airports).map(a=>`<option value="${escape(a.iata)}">${escape(a.city||a.name)} (${escape(a.iata)})</option>`).join("");
    find("hotelContent").hidden=false;
    if(detail)renderDetail(page);else filterHotels();
    updateBooking();
  }
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
