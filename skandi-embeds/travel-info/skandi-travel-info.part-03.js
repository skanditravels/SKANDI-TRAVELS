import React, {useEffect,useLayoutEffect,useMemo,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import htm from "htm";

const html=htm.bind(React.createElement);
const roots=new WeakMap();
const list=value=>Array.isArray(value)?value:[];
const text=value=>String(value??"").trim();
const key=value=>text(value).toUpperCase();
const number=(value,fallback)=>value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const read=(record,...fields)=>fields.map(field=>record?.[field]).find(value=>value!==null&&value!==undefined&&value!=="");
const order=(a,b)=>number(read(a,"sort_order","sortOrder"),100)-number(read(b,"sort_order","sortOrder"),100);
const initialCamera={zoom:1,x:.5,y:.5,yaw:0,pitch:0};
const radians=deg=>deg*Math.PI/180;

function mediaUrl(value){
  try{const url=new URL(text(value));return url.protocol==="https:"?url.href:""}catch(_){return ""}
}

function stopRecord(record,kind){
  const code=key(read(record,"scene_code","sceneCode","view_code","viewCode"));
  const id=key(record.id||code);
  const scene=kind==="SCENE";
  const title=text(scene?read(record,"short_title","shortTitle","title"):read(record,"label","title","view_code"));
  const image=mediaUrl(read(record,"image_url","imageUrl","image"));
  const mobile=mediaUrl(read(record,"mobile_image_url","mobileImageUrl"));
  return {
    id,code,kind,ref:`${kind}:${id}`,title:title||"Cabin",
    image,mobile,alt:text(read(record,"alt_text","altText")),caption:text(read(record,"summary","caption")),credit:text(record.credit),
    forward:key(read(record,"forward_scene_code","forwardSceneCode")),
    backward:key(read(record,"back_scene_code","backSceneCode")),
    forwardLabel:text(read(record,"forward_label","forwardLabel")),
    backwardLabel:text(read(record,"back_label","backLabel")),
    cabinId:key(read(record,"cabin_id","cabinId")),viewType:key(read(record,"view_type","viewType")),
    isDefault:read(record,"is_default","isDefault")===true,
    panorama:/^(360|PANO|PANORAMA|EQUIRECTANGULAR|SPHERICAL)$/i.test(text(read(record,"view_type","viewType","projection"))) ||
      /(?:^|[\/_.-])(?:360|equirectangular|panorama)(?:[\/_.-]|$)/i.test((image||mobile).split("?")[0])
  };
}

function stopPoint(record,index,stop,stops,cabins){
  const action=key(record.action);
  const move=action.match(/^MOVE:((?:SCENE|VIEW):[A-Z0-9_-]+)$/);
  const cabinCode=key(read(record,"target_cabin_code","targetCabinCode"));
  const cabin=cabins.find(c=>key(read(c,"cabin_code","cabinCode"))===cabinCode);
  const target=move ? stops.find(s=>s.ref===move[1]) : action==="CABIN"&&cabin ? stops.find(s=>s.cabinId===key(cabin.id)&&s.ref!==stop.ref) : null;
  const inspect=action==="SEAT_ROW"||action==="ZOOM"||action==="FOCUS"||key(record.hotspot_type)==="SEAT_ROW";
  const title=text(read(record,"title","label"))||target?.title||text(read(cabin,"cabin_name","cabinName"))||(inspect?"seat row":"Cabin information");
  const description=text(read(record,"description","summary"))||text(read(cabin,"summary","description"));
  const thumbnail=mediaUrl(read(record,"thumbnail_url","thumbnailUrl"));
  if((action.startsWith("MOVE:")&&!target)||target?.ref===stop.ref)return null;
  if(!target&&!inspect&&!description&&!thumbnail&&!read(record,"label","title"))return null;
  return {
    id:text(read(record,"id","hotspot_code","hotspotCode"))||String(index), title, description, thumbnail,
    target:target?.ref, kind:target?"move":inspect?"inspect":"note",
    x:clamp(number(record.x,50),0,100)/100,y:clamp(number(record.y,50),0,100)/100,
    focusX:clamp(number(read(record,"focus_x","focusX"),number(record.x,50)),0,100)/100,
    focusY:clamp(number(read(record,"focus_y","focusY"),number(record.y,50)),0,100)/100,
    focusZoom:clamp(number(read(record,"focus_zoom","focusZoom"),2),1,3)
  };
}

function makeWalkaround(bundle,aircraft,airline){
  const belongs=record=>record.active!==false&&key(read(record,"aircraft_id","aircraftId"))===key(aircraft.id);
  const cabins=list(bundle.cabins).filter(belongs).slice().sort(order);
  const scenes=list(bundle.walkScenes||bundle.scenes).filter(belongs).slice().sort(order).map(record=>stopRecord(record,"SCENE")).filter(s=>s.id&&(s.image||s.mobile));
  const views=list(bundle.views).filter(belongs).slice().sort(order).map(record=>stopRecord(record,"VIEW")).filter(s=>s.id&&(s.image||s.mobile));
  const legacy=airline?.sections?.inflightExperience||airline?.inflightExperience;
  const legacyViews=!scenes.length&&!views.length&&legacy&&(list(bundle.aircraft).length===1)
    ? list((legacy.data||legacy).classes).flatMap((c,i)=>list(c.views).map((view,j)=>{
      const stop=stopRecord({...view,id:`LEGACY_${i}_${j}`},"VIEW");
      return {...stop,legacyPoints:list(view.hotspots)};
    })).filter(s=>s.image||s.mobile) : [];
  const exterior=mediaUrl(read(aircraft,"exterior_image_url","exteriorImageUrl","hero_image_url","heroImageUrl"));
  const seatmap=mediaUrl(read(aircraft,"seatmap_image_url","seatmapImageUrl"));
  const stops=[...scenes,...views,...legacyViews];
  for(const [id,label,image_url] of [["EXTERIOR","Aircraft exterior",exterior],["SEATMAP","Seat map",seatmap]]){
    if(image_url&&!stops.some(s=>s.image===image_url))stops.push(stopRecord({id,label,image_url},"AIRCRAFT"));
  }
  const findScene=code=>code?scenes.find(s=>s.code===code):null;
  const defaultScene=findScene(key(read(aircraft,"walkthrough_start_scene_code","walkthroughStartSceneCode")));
  // An unlinked neighboring record is a separate viewpoint. Only saved links move the camera.
  const routes=scenes.filter(s=>findScene(s.forward)&&s.forward!==s.code);
  const firstConnected=routes.find(s=>!routes.some(other=>other.forward===s.code));
  const defaultCabin=cabins.find(c=>key(read(c,"cabin_code","cabinCode"))===key(read(aircraft,"default_cabin_code","defaultCabinCode")));
  const defaultView=views.find(s=>s.isDefault&&s.cabinId===key(defaultCabin?.id))||views.find(s=>s.isDefault)||
    views.find(s=>s.viewType===key(read(aircraft,"default_view_type","defaultViewType"))&&s.cabinId===key(defaultCabin?.id));
  const start=defaultScene||firstConnected||scenes[0]||defaultView||stops[0];
  const resolved=stops.map(stop=>{
    const source=stop.legacyPoints||(stop.kind==="SCENE"?bundle.sceneHotspots:bundle.hotspots);
    const points=list(source).filter(p=>p.active!==false&&(stop.legacyPoints||key(read(p,stop.kind==="SCENE"?"scene_id":"view_id",stop.kind==="SCENE"?"sceneId":"viewId"))===stop.id))
      .slice().sort(order).map((p,i)=>stopPoint(p,i,stop,stops,cabins)).filter(Boolean);
    const moves=[["back",findScene(stop.backward),stop.backwardLabel],["forward",findScene(stop.forward),stop.forwardLabel]]
      .filter(([,target])=>target&&target.ref!==stop.ref).map(([direction,target,label])=>({
        direction,target:target.ref,title:label||target.title
      })).filter(move=>!points.some(p=>p.target===move.target));
    return {...stop,points,moves};
  });
  return {stops:resolved,start:start?.ref,cabins};
}

// Project saved image coordinates into the sphere used by the panorama shader.
function projectPanorama(x,y,camera,aspect){
  const longitude=(x-.5)*2*Math.PI,latitude=(.5-y)*Math.PI;
  const yaw=radians(camera.yaw),pitch=radians(camera.pitch);
  const tx=Math.cos(latitude)*Math.sin(longitude-yaw),ty=Math.sin(latitude),tz=Math.cos(latitude)*Math.cos(longitude-yaw);
  const yCamera=ty*Math.cos(pitch)-tz*Math.sin(pitch),zCamera=ty*Math.sin(pitch)+tz*Math.cos(pitch);
  if(zCamera<=0)return null;
  const scale=zCamera*Math.tan(radians(75/camera.zoom)/2);
  return {x:.5+tx/(2*scale*aspect),y:.5-yCamera/(2*scale)};
}

function PanoramaCanvas({image,yaw,pitch,zoom,onFailure}){
  const canvasRef=React.useRef(null),rendererRef=React.useRef(null),cameraRef=React.useRef({yaw,pitch,zoom});
  cameraRef.current={yaw,pitch,zoom};
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas||!image)return;
    let disposed=false,observer=null,texture=null,program=null,buffer=null;
    const gl=canvas.getContext("webgl",{alpha:false,antialias:false,preserveDrawingBuffer:false});
    if(!gl){onFailure();return}
    const vert=`attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.0,1.0);}`;
    const frag=`precision highp float;
    uniform sampler2D uImage;uniform vec2 uResolution;uniform float uYaw;uniform float uPitch;uniform float uFov;
    const float PI=3.141592653589793;
    void main(){
      vec2 p=(gl_FragCoord.xy/uResolution)*2.0-1.0;
      p.x*=uResolution.x/uResolution.y;
      vec3 ray=normalize(vec3(p*tan(uFov*0.5),1.0));
      float cp=cos(uPitch),sp=sin(uPitch),cy=cos(uYaw),sy=sin(uYaw);
      vec3 t=vec3(ray.x,ray.y*cp+ray.z*sp,-ray.y*sp+ray.z*cp);
      vec3 d=normalize(vec3(t.x*cy+t.z*sy,t.y,-t.x*sy+t.z*cy));
      vec2 uv=vec2(fract(0.5+atan(d.x,d.z)/(2.0*PI)),0.5+asin(clamp(d.y,-1.0,1.0))/PI);
      gl_FragColor=texture2D(uImage,uv);
    }`;
    const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);throw Error("WEBGL_SHADER_UNSUPPORTED")}return sh};
    try{
      const v=shader(gl.VERTEX_SHADER,vert),f=shader(gl.FRAGMENT_SHADER,frag);program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("WEBGL_LINK_UNSUPPORTED");
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      gl.useProgram(program);const pos=gl.getAttribLocation(program,"aPosition");gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      gl.uniform1i(gl.getUniformLocation(program,"uImage"),0);
    }catch(_){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);onFailure();return}
    let ready=false;
    const imageEl=new Image();imageEl.crossOrigin="anonymous";imageEl.decoding="async";
    const draw=(y,p,z)=>{
      if(!ready||disposed||gl.isContextLost())return;
      const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),d=Math.min(window.devicePixelRatio||1,2);
      const pw=Math.max(1,Math.floor(w*d)),ph=Math.max(1,Math.floor(h*d));
      if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
      gl.viewport(0,0,pw,ph);gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform2f(gl.getUniformLocation(program,"uResolution"),pw,ph);
      gl.uniform1f(gl.getUniformLocation(program,"uYaw"),y*Math.PI/180);
      gl.uniform1f(gl.getUniformLocation(program,"uPitch"),p*Math.PI/180);
      gl.uniform1f(gl.getUniformLocation(program,"uFov"),(75/z)*Math.PI/180);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    };
    imageEl.onload=()=>{
      if(disposed)return;
      try{
        texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,imageEl);
        ready=true;rendererRef.current=draw;
        draw(cameraRef.current.yaw,cameraRef.current.pitch,cameraRef.current.zoom);
        if(typeof ResizeObserver!=="undefined"){observer=new ResizeObserver(()=>draw(cameraRef.current.yaw,cameraRef.current.pitch,cameraRef.current.zoom));observer.observe(canvas)}
      }catch(_){if(!disposed)onFailure?.()}
    };
    const lost=event=>{event.preventDefault();onFailure()};
    canvas.addEventListener("webglcontextlost",lost);
    imageEl.onerror=()=>{if(!disposed)onFailure()};imageEl.src=image;
    return()=>{disposed=true;rendererRef.current=null;canvas.removeEventListener("webglcontextlost",lost);observer?.disconnect();imageEl.onload=null;imageEl.onerror=null;if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program)};
  },[image]);
  useEffect(()=>{rendererRef.current?.(yaw,pitch,zoom)},[yaw,pitch,zoom]);
  return html`<canvas ref=${canvasRef} className="ti-walkaround-panorama" aria-hidden="true"/>`;
}

function useMobile(){
  const query="(max-width:620px)";
  const [mobile,setMobile]=useState(()=>matchMedia(query).matches);
  useEffect(()=>{
    const media=matchMedia(query);
    const change=()=>setMobile(media.matches);
    media.addEventListener("change",change);
    return()=>media.removeEventListener("change",change);
  },[]);
  return mobile;
}

function WalkaroundCamera({stop,camera,setCamera,onVisit}){
  const viewport=useRef(null),gestures=useRef(null),returnFocus=useRef(null),detailClose=useRef(null);
  const detailCamera=useRef(null);
  const [size,setSize]=useState({width:0,height:0});
  const [imageSize,setImageSize]=useState(null),[failed,setFailed]=useState(""),[panoFailed,setPanoFailed]=useState(false);
  const [detail,setDetail]=useState(null);
  const mobile=useMobile();
  // Points are placed against the uncropped primary image in Inventory Control.
  const source=(mobile&&!stop.points.length&&!stop.panorama&&failed!==stop.mobile&&stop.mobile)||stop.image||stop.mobile;
  const image=imageSize?.source===source?imageSize:null;
  const pano=!panoFailed&&stop.panorama&&image&&Math.abs(image.width/image.height-2)<.06;
  useLayoutEffect(()=>{
    const node=viewport.current;
    const resize=()=>setSize({width:node.clientWidth,height:node.clientHeight});
    resize();
    const observer=new ResizeObserver(resize);
    observer.observe(node);
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{if(detail)detailClose.current?.focus({preventScroll:true})},[detail]);

  const zoom=camera.zoom;
  const fit=image?Math.min(size.width/image.width,size.height/image.height):0;
  const width=(image?.width||0)*fit*zoom,height=(image?.height||0)*fit*zoom;
  function offset(center,dim,frame){
    return dim<=frame?(frame-dim)/2:clamp(frame/2-center*dim,frame-dim,0);
  }
  const left=offset(camera.x,width,size.width),top=offset(camera.y,height,size.height);
  const zoomBy=delta=>setCamera({...camera,zoom:clamp(zoom+delta,1,3)});
  function usePoint(point,returnTo){
    if(point.target){onVisit(point.target);return}
    returnFocus.current=returnTo;
    if(point.kind==="inspect"){
      detailCamera.current=camera;
      setCamera({...camera,x:point.focusX,y:point.focusY,yaw:(point.focusX-.5)*360,pitch:clamp((.5-point.focusY)*180,-82,82),zoom:point.focusZoom});
    }
    setDetail(point);
  }
  function closeDetail(){
    if(detailCamera.current)setCamera(detailCamera.current);
    detailCamera.current=null;
    setDetail(null);
    const target=returnFocus.current;
    requestAnimationFrame(()=>(target?.isConnected&&target.offsetParent?target:viewport.current)?.focus({preventScroll:true}));
  }
  function onKey(event){
    if(event.key==="Escape"&&detail){event.stopPropagation();closeDetail();return}
    if(event.target!==viewport.current||!image)return;
    const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(event.key==="+"||event.key==="="){event.preventDefault();zoomBy(.25);return}
    if(event.key==="-"){event.preventDefault();zoomBy(-.25);return}
    if(event.key==="0"){event.preventDefault();setCamera(initialCamera);return}
    const direction=directions[event.key];
    if(!direction||!pano&&zoom<=1)return;
    event.preventDefault();
    const [x,y]=direction;
    setCamera(pano?{...camera,yaw:(camera.yaw+x*12)%360,pitch:clamp(camera.pitch-y*10,-82,82)}
      :{...camera,x:clamp(camera.x+x*.09,0,1),y:clamp(camera.y+y*.09,0,1)});
  }
  function pointerDown(event){
    if(event.button!==0||!image||!pano&&zoom<=1||event.target.closest("button,.ti-walkaround-detail"))return;
    viewport.current.setPointerCapture(event.pointerId);
    gestures.current={id:event.pointerId,x:event.clientX,y:event.clientY,camera};
  }
  function pointerMove(event){
    const gesture=gestures.current;
    if(gesture?.id!==event.pointerId)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y,start=gesture.camera;
    if(pano)setCamera({...start,yaw:(start.yaw-dx*100/Math.max(size.width,1))%360,pitch:clamp(start.pitch+dy*68/Math.max(size.height,1),-82,82)});
    else setCamera({...start,x:clamp(start.x-dx/Math.max(width,1),0,1),y:clamp(start.y-dy/Math.max(height,1),0,1)});
  }
  const pointSymbol=point=>point.kind==="move"?"→":point.kind==="inspect"?"+":"i";
  const pointLabel=point=>point.kind==="move"?`Go to ${point.title}`:point.kind==="inspect"?`Inspect ${point.title}`:point.title;
  const showError=failed===source;

  return html`<div className="ti-walkaround-camera">
    <div className="ti-walkaround-frame" ref=${viewport} role="region" aria-label=${stop.title} tabIndex="0"
      data-draggable=${Boolean(image&&(pano||zoom>1))} onKeyDown=${onKey} onPointerDown=${pointerDown} onPointerMove=${pointerMove}
      onPointerUp=${()=>{gestures.current=null}} onLostPointerCapture=${()=>{gestures.current=null}}>
      ${!showError?html`<img key=${source} src=${source} alt=${stop.alt||stop.title} draggable="false" referrerPolicy="no-referrer"
        className="ti-walkaround-photo" style=${{width,height,left,top,visibility:pano?"hidden":undefined}}
        onLoad=${event=>{const {naturalWidth,naturalHeight}=event.currentTarget;setImageSize({source,width:naturalWidth,height:naturalHeight})}}
        onError=${()=>setFailed(source)}/>`:html`<p role="status" className="ti-walkaround-message">This cabin image is unavailable.</p>`}
      ${!image&&!showError?html`<p role="status" className="ti-walkaround-message">Loading cabin image…</p>`:null}
      ${pano&&!showError?html`<${PanoramaCanvas} image=${source} yaw=${camera.yaw} pitch=${camera.pitch} zoom=${zoom} onFailure=${()=>setPanoFailed(true)}/>`:null}
      ${image&&!showError?stop.points.map(point=>{
        const p=pano?projectPanorama(point.x,point.y,camera,size.width/size.height):{x:(left+point.x*width)/size.width,y:(top+point.y*height)/size.height};
        if(!p||!(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1))return null;
        return html`<button key=${point.id} className="ti-walkaround-pin" type="button" data-kind=${point.kind}
          title=${pointLabel(point)} aria-label=${pointLabel(point)} style=${{left:`clamp(22px, ${p.x*100}%, calc(100% - 22px))`,top:`clamp(22px, ${p.y*100}%, calc(100% - 22px))`}}
          onClick=${event=>usePoint(point,event.currentTarget)}><span aria-hidden="true">${pointSymbol(point)}</span></button>`;
      }):null}
      ${image&&!showError?html`<div className="ti-walkaround-tools">
        <button type="button" disabled=${zoom<=1} aria-label="Zoom out" onClick=${()=>zoomBy(-.25)}>−</button>
        <button type="button" disabled=${zoom>=3} aria-label="Zoom in" onClick=${()=>zoomBy(.25)}>+</button>
        <button type="button" aria-label="Reset camera" onClick=${()=>setCamera(initialCamera)}>↺</button>
      </div>`:null}
      ${detail?html`<section className="ti-walkaround-detail" aria-label=${detail.title}>
      <div><h3>${detail.title}</h3>${detail.description?html`<p>${detail.description}</p>`:null}
      ${detail.thumbnail?html`<img src=${detail.thumbnail} alt=${detail.title} referrerPolicy="no-referrer"/>`:null}</div>
      <button ref=${detailClose} type="button" aria-label="Close point details" onClick=${closeDetail}>×</button>
    </section>`:null}
    </div>
    ${stop.moves.length?html`<nav className="ti-walkaround-moves" aria-label="Move through the aircraft">${stop.moves.map(move=>html`
      <button key=${move.direction} type="button" onClick=${()=>onVisit(move.target)}><span aria-hidden="true">${move.direction==="back"?"←":"→"}</span> ${move.title}</button>
    `)}</nav>`:null}
    ${stop.points.length?html`<details className="ti-walkaround-point-list"><summary>Points in this scene</summary><ul>${stop.points.map(point=>html`
      <li key=${point.id}><button type="button" onClick=${event=>usePoint(point,event.currentTarget)}>${pointLabel(point)}</button></li>`)}</ul></details>`:null}
    ${stop.caption||stop.credit?html`<p className="ti-walkaround-credit">${[stop.caption,stop.credit].filter(Boolean).join(" · ")}</p>`:null}
  </div>`;
}

function Walkaround({model,aircraft,onSelect,aircrafts}){
  const [route,setRoute]=useState([]);
  const [cameras,setCameras]=useState({});
  const heading=useRef(null);
  const focusAfterVisit=useRef(false);
  const {stops,start,cabins}=model;
  const active=stops.find(stop=>stop.ref===route.at(-1))||stops.find(stop=>stop.ref===start);
  useEffect(()=>{
    if(focusAfterVisit.current)heading.current?.focus({preventScroll:true});
    focusAfterVisit.current=false;
  },[active?.ref]);
  function visit(ref,focus=true){
    if(!ref||active?.ref===ref||!stops.some(s=>s.ref===ref))return;
    focusAfterVisit.current=focus;
    setRoute(path=>[...path,ref]);
  }
  function goBack(){
    focusAfterVisit.current=true;
    setRoute(path=>path.slice(0,-1));
  }
  const name=a=>text(read(a,"aircraftName","aircraft_name","displayTitle","display_title","aircraftCode","aircraft_code"))||"Aircraft";
  const accuracy=text(read(aircraft,"walkthrough_accuracy_label","walkthroughAccuracyLabel"));
  return html`<section className="ti-walkaround" aria-label="Aircraft walkaround">
    <header className="ti-walkaround-bar">
      <h2>Walkaround</h2>
      <label>Aircraft<select value=${aircraft.id} onChange=${event=>onSelect(event.target.value)}>${aircrafts.map(item=>html`<option key=${item.id} value=${item.id}>${name(item)}</option>`)}</select></label>
      ${active?html`<label>Scene<select value=${active.ref} onChange=${event=>visit(event.target.value,false)}>${stops.map(stop=>html`<option key=${stop.ref} value=${stop.ref}>${stop.title}</option>`)}</select></label>`:null}
    </header>
    ${active?html`<div className="ti-walkaround-location"><h3 ref=${heading} tabIndex="-1">${active.title}</h3>${route.length?html`<button type="button" onClick=${goBack}>← Previous view</button>`:null}</div>
      <${WalkaroundCamera} key=${active.ref} stop=${active} camera=${cameras[active.ref]||initialCamera} setCamera=${camera=>setCameras(previous=>({...previous,[active.ref]:camera}))} onVisit=${visit}/>
    `:html`<p className="ti-walkaround-empty">Cabin images are unavailable for this aircraft.</p>`}
    ${cabins.length?html`<details className="ti-walkaround-cabins"><summary>Cabins on this aircraft</summary><dl>${cabins.map(cabin=>html`
      <div key=${cabin.id}><dt>${read(cabin,"cabin_name","cabinName","cabin_code","cabinCode")}</dt><dd>${number(read(cabin,"seat_count","seatCount"),0)>0?`${read(cabin,"seat_count","seatCount")} seats`:text(read(cabin,"summary","description"))}</dd></div>`)}</dl></details>`:null}
    ${active?html`<p className="ti-walkaround-credit">${accuracy||"Cabin layouts can vary by configuration. Check seat availability when you book."}</p>`:null}
  </section>`;
}

function App({bundle,airline}){
  const aircrafts=list(bundle.aircraft).filter(a=>a.id&&a.active!==false).slice().sort(order);
  const [aircraftId,setAircraftId]=useState("");
  const aircraft=aircrafts.find(a=>a.id===aircraftId)||aircrafts[0];
  const model=useMemo(()=>aircraft?makeWalkaround(bundle,aircraft,airline):null,[bundle,aircraft,airline]);
  if(!aircraft)return html`<p className="ti-walkaround-empty">No aircraft walkaround is available for this airline.</p>`;
  return html`<${Walkaround} key=${aircraft.id} model=${model} aircraft=${aircraft} aircrafts=${aircrafts} onSelect=${setAircraftId}/>`;
}
function mount(element,bundle,airline){
  if(!element)return;
  let root=roots.get(element);
  if(!root){root=createRoot(element);roots.set(element,root)}
  root.render(html`<${App} bundle=${bundle||{}} airline=${airline||{}}/>`);
}
function unmount(element){
  if(!element)return;
  roots.get(element)?.unmount();
  roots.delete(element);
}
window.SKANDIOnboardReact={mount,unmount,version:"SKANDI V12 Walkaround"};
window.dispatchEvent(new Event("SKANDI_ONBOARD_REACT_READY"));
