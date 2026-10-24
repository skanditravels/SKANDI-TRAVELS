
(()=>{
  const back=document.getElementById("backToTravelInfo");
  if(!back)return;
  back.addEventListener("click",()=>{
    window.parent.postMessage({
      source:"SKANDI_INSURANCE_PAGE",
      type:"INSURANCE_NAVIGATE",
      payload:{path:"/travel-info"},
      timestamp:new Date().toISOString()
    },"*");
  });
})();
