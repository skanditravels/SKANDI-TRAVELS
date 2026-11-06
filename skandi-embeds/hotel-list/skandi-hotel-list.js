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
  function paragraph(value){return value?`<p>${escape(value)}</p>`:"";}
  function facts(entries){
    const items=entries.filter(([,value])=>value);
    return items.length?`<dl>${items.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl>`:"";
  }
  function renderDetail(page){
    const gallery=rows(page.gallery).map(safeImage).filter(Boolean);
    const roomInfo=rows(page.rooms).map(room=>`<h3>${escape(room.name)}</h3>${paragraph(room.description)}${paragraph([room.bedType,room.size,room.capacity?`Sleeps ${room.capacity}`:""].filter(Boolean).join(" · "))}`).join("");
    const place=page.locationTransfer||{};
    const highlights=rows(page.highlights);
    find("hotelDetail").innerHTML=[
      section("About the hotel",paragraph(page.about)+paragraph(page.important)+facts(rows(page.facts).map(f=>[f.label,f.value]))),
      section("Photos",gallery.length?`<div class="hs-gallery">${gallery.map(image=>`<img src="${image}" alt="" loading="lazy">`).join("")}</div>`:""),
      section("Highlights",highlights.length?`<ul>${highlights.map(text=>`<li>${escape(text)}</li>`).join("")}</ul>`:""),
      section("Rooms",paragraph(page.roomsIntro)+roomInfo),
      ...[["Food and drink",page.food],["Pool and beach",page.poolBeach],["Activities",page.activities],["Accessibility",page.accessibility]].map(([title,value])=>
        section(title,facts(Object.entries(value||{}).filter(([,text])=>typeof text==="string"&&text).map(([key,text])=>[key.replace(/([a-z])([A-Z])/g,"$1 $2"),text])))),
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
