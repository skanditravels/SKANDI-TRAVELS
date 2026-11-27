// Canvas overview for browsers where the WebGL basemap cannot start.
function createNetworkOverview(container, pinLayer, onSelect) {
  if (!("Path2D" in window)) return null;
  const canvas = container.querySelector("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;

  const {scale: units, translate} = networkLand.transform;
  const arcs = networkLand.arcs.map(arc => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * units[0] + translate[0], -(y * units[1] + translate[1])];
    });
  });
  const land = new Path2D();
  for (const geometry of networkLand.objects.land.geometries) {
    const polygons = geometry.type === "Polygon" ? [geometry.arcs] : geometry.arcs;
    for (const rings of polygons) for (const ring of rings) {
      const outline=[];
      for (const index of ring) {
        const points = index < 0 ? [...arcs[~index]].reverse() : arcs[index];
        for (const [x, y] of points) {
          const last=outline.at(-1)?.[0];
          const longitude=last===undefined?x:x+360*Math.round((last-x)/360);
          outline.push([longitude,y]);
        }
      }
      const first=outline[0],last=outline.at(-1);
      if(!first)continue;
      // A ring that closes around a pole reaches the same meridian one world
      // width away. Close at the pole before clipping it to the visible world.
      if(Math.abs(last[0]-first[0])>180) {
        const pole=first[1]>0?90:-90;
        outline.push([last[0],pole],[first[0],pole]);
      }
      const longitude=outline.map(([x])=>x);
      const west=Math.min(...longitude),east=Math.max(...longitude);
      for(const shift of [-360,0,360]) {
        if(west+shift>180||east+shift< -180)continue;
        land.moveTo(first[0]+shift,first[1]);
        for(const [x,y] of outline.slice(1))land.lineTo(x+shift,y);
        land.closePath();
      }
    }
  }

  let x = 10, y = -25, scale = 1, padding = {};
  let width = 0, height = 0, frame = 0, markers = [], lines = [];
  const pointers = new Map();
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const midpoint = () => [
    ((padding.left || 0) + width - (padding.right || 0)) / 2,
    ((padding.top || 0) + height - (padding.bottom || 0)) / 2
  ];
  function draw() {
    frame = 0;
    width = container.clientWidth;
    height = container.clientHeight;
    if (!width || !height) return;
    const resolution = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(width * resolution), pixelHeight = Math.round(height * resolution);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const [cx, cy] = midpoint();
    context.setTransform(resolution, 0, 0, resolution, 0, 0);
    context.fillStyle = "#d6e9f2";
    context.fillRect(0, 0, width, height);
    context.translate(cx - x * scale, cy - y * scale);
    context.scale(scale, scale);
    context.fillStyle = "#f4f4e9";
    context.strokeStyle = "#b2c8c8";
    context.lineWidth = 1 / scale;
    context.save();
    context.beginPath();
    context.rect(-180,-90,360,180);
    context.clip();
    context.fill(land, "evenodd");
    context.stroke(land);
    context.restore();

    context.strokeStyle = "#2c6999";
    context.lineWidth = 2 / scale;
    for (const line of lines) {
      context.beginPath();
      line.forEach(([lng, lat], index) => {
        if (index) context.lineTo(lng, -lat);
        else context.moveTo(lng, -lat);
      });
      context.stroke();
    }
    const labels=[];
    for (const {item, pin} of markers) {
      const px = cx + (item.lng - x) * scale, py = cy + (-item.lat - y) * scale;
      pin.hidden = px < 0 || py < 0 || px > width || py > height;
      pin.style.left = px + "px";
      pin.style.top = py + "px";
      const showLabel=!pin.hidden&&px>70&&px<width-70&&py<height-45
        &&(markers.length<=12||scale>=4)&&!labels.some(([lx,ly])=>Math.abs(lx-px)<125&&Math.abs(ly-py)<30);
      pin.classList.toggle("with-label",showLabel);
      if(showLabel)labels.push([px,py]);
    }
  }
  function redraw() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function pan(dx, dy) {
    x = clamp(x - dx / scale, -180, 180);
    y = clamp(y - dy / scale, -85, 85);
    redraw();
  }
  function zoom(ratio, anchorX, anchorY) {
    const [cx, cy] = midpoint();
    const dx = (anchorX ?? cx) - cx, dy = (anchorY ?? cy) - cy;
    const nextScale = clamp(scale * ratio, Math.max(0.6, width / 650), 120);
    x = clamp(x + dx * (1 / scale - 1 / nextScale), -180, 180);
    y = clamp(y + dy * (1 / scale - 1 / nextScale), -85, 85);
    scale = nextScale;
    redraw();
  }
  function fit(items, nextPadding, zoomLimit = 15) {
    padding = nextPadding;
    width = container.clientWidth;
    height = container.clientHeight;
    const nodes = items.filter(item => item?.mappable);
    const lng = nodes.map(item => item.lng), lat = nodes.map(item => item.lat);
    const west = nodes.length ? Math.min(...lng) : -155, east = nodes.length ? Math.max(...lng) : 155;
    const south = nodes.length ? Math.min(...lat) : -55, north = nodes.length ? Math.max(...lat) : 78;
    const horizontal = width - (padding.left || 0) - (padding.right || 0);
    const vertical = height - (padding.top || 0) - (padding.bottom || 0);
    scale = clamp(Math.min(horizontal / Math.max(2, east - west), vertical / Math.max(2, north - south)) * 0.9, 0.6, zoomLimit);
    x = (west + east) / 2;
    y = -(north + south) / 2;
    redraw();
  }

  const resize = "ResizeObserver" in window ? new ResizeObserver(redraw) : null;
  resize?.observe(container);
  container.addEventListener("wheel", event => {
    event.preventDefault();
    const rect = container.getBoundingClientRect();
    zoom(event.deltaY < 0 ? 1.2 : 1 / 1.2, event.clientX - rect.left, event.clientY - rect.top);
  }, {passive: false});
  container.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest("button")) return;
    pointers.set(event.pointerId, [event.clientX, event.clientY]);
    container.setPointerCapture?.(event.pointerId);
  });
  container.addEventListener("pointermove", event => {
    const before = pointers.get(event.pointerId);
    if (!before) return;
    const after = [event.clientX, event.clientY];
    const other = [...pointers].find(([id]) => id !== event.pointerId)?.[1];
    pointers.set(event.pointerId, after);
    if (!other) {
      pan(after[0] - before[0], after[1] - before[1]);
      return;
    }
    const previous = Math.hypot(before[0] - other[0], before[1] - other[1]);
    if (previous < 1) return;
    const rect = container.getBoundingClientRect();
    pan((after[0] - before[0]) / 2, (after[1] - before[1]) / 2);
    zoom(Math.hypot(after[0] - other[0], after[1] - other[1]) / previous,
      (after[0] + other[0]) / 2 - rect.left, (after[1] + other[1]) / 2 - rect.top);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    container.addEventListener(type, event => pointers.delete(event.pointerId));
  }
  container.addEventListener("keydown", event => {
    if (event.target !== container) return;
    const deltas = {ArrowLeft:[48,0], ArrowRight:[-48,0], ArrowUp:[0,48], ArrowDown:[0,-48]};
    if (deltas[event.key]) pan(...deltas[event.key]);
    else if (event.key === "+" || event.key === "=") zoom(1.5);
    else if (event.key === "-") zoom(1 / 1.5);
    else return;
    event.preventDefault();
  });

  return {
    fit,
    zoom,
    setFeatures(points, routeLines) {
      lines = routeLines;
      const previous = new Map(markers.map(marker => [marker.key, marker]));
      markers = points.map(({type, item, selected}) => {
        const key = type + ":" + item.id;
        const existing = previous.get(key);
        const pin = existing?.pin || document.createElement("button");
        if (!existing) {
          pin.type = "button";
          pin.className = "fallback-pin " + type;
          const name = document.createElement("span");
          name.textContent = item.iata && type === "airport" ? item.iata : item.name;
          pin.append(name);
          pin.setAttribute("aria-label", [name.textContent, item.country].filter(Boolean).join(", "));
          pin.addEventListener("click", event => onSelect(type, item.id, event.detail === 0));
          pinLayer.append(pin);
        }
        pin.setAttribute("aria-pressed", String(selected));
        previous.delete(key);
        return {key, item, pin};
      });
      previous.forEach(({pin}) => pin.remove());
      redraw();
    },
    destroy() {
      resize?.disconnect();
      cancelAnimationFrame(frame);
    }
  };
}
