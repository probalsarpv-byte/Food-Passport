
(() => {
"use strict";
const GEO_URLS=[
 "https://cdn.jsdelivr.net/gh/HedaetShahriar/bangladesh-locations-dataset@main/data/exports/geojson/boundaries/districts.geojson",
 "https://raw.githubusercontent.com/HedaetShahriar/bangladesh-locations-dataset/main/data/exports/geojson/boundaries/districts.geojson"
];
const STORE="taste_bangladesh_food_passport_v1_6_2", OLDS=["taste_bangladesh_food_passport_v1_6_1_stable","taste_bangladesh_food_passport_v1_7_2","taste_bangladesh_food_passport_v1_7_1","taste_bangladesh_food_passport_v1_7","taste_bangladesh_food_passport_v1_6","taste_bangladesh_food_passport_v1_5","taste_bangladesh_food_passport_v1_4","taste_bangladesh_food_passport_v1_3","taste_bangladesh_food_passport_v1_2","taste_bangladesh_food_passport_v1_1","taste_bangladesh_food_passport_v1"];
let DISTRICTS=[],CATS={},bySlug={},order=[],selected=new Set(),wishlist=new Set(),geo=null;
let state={selected:[],wishlist:[],name:"",current:null,category:"all"};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const CORRECTION_EMAIL="probalofficial007@gmail.com";
const alias={"barisal":"barishal","bogra":"bogura","comilla":"cumilla","chittagong":"chattogram","coxs bazar":"coxs-bazar","cox s bazar":"coxs-bazar","jessore":"jashore","chapai nawabganj":"chapainawabganj","nawabganj":"chapainawabganj","jhalokati":"jhalokathi","khagrachari":"khagrachhari","maulvibazar":"moulvibazar","netrakona":"netrokona","coxsbazar":"coxs-bazar","jhalakathi":"jhalokathi"};

function norm(s){return String(s||"").toLowerCase().normalize("NFKD").replace(/[’'().,_-]/g," ").replace(/\s+/g," ").trim()}
function loadState(){
  let raw=localStorage.getItem(STORE); if(!raw){for(const k of OLDS){raw=localStorage.getItem(k);if(raw)break}}
  try{const s=JSON.parse(raw||"null");if(s&&Array.isArray(s.selected))state={...state,...s}}catch(_){}
  selected=new Set(state.selected||[]);wishlist=new Set(state.wishlist||[]);
}
function save(){state.selected=[...selected];state.wishlist=[...wishlist];localStorage.setItem(STORE,JSON.stringify(state))}
function sanitizeState(){
 const valid=new Set(DISTRICTS.flatMap(d=>d.foods.map(f=>f.id)));
 selected=new Set([...selected].filter(id=>valid.has(id)));
 wishlist=new Set([...wishlist].filter(id=>valid.has(id)&&!selected.has(id)));
 state.selected=[...selected];state.wishlist=[...wishlist];
 if(state.current&&!bySlug[state.current])state.current=null;
 save();
}
function catLabel(c){return CATS[c]?CATS[c][0]:c}
function foodPool(d){return state.category==="all"?d.foods:d.foods.filter(x=>x.category===state.category)}
function distProgress(d){const foods=foodPool(d),hit=foods.filter(x=>selected.has(x.id)).length;return{hit,total:foods.length,ratio:foods.length?hit/foods.length:0}}
function allDistProgress(d){const hit=d.foods.filter(x=>selected.has(x.id)).length;return{hit,total:d.foods.length,ratio:d.foods.length?hit/d.foods.length:0}}
const DIVISION_COLORS={"ঢাকা":"#16a085","চট্টগ্রাম":"#2f80ed","রাজশাহী":"#e59d23","খুলনা":"#7ca54c","রংপুর":"#8f67d8","সিলেট":"#00a878","বরিশাল":"#de6f92","ময়মনসিংহ":"#e57b25"};
function hexRgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function mix(a,b,t){const A=hexRgb(a),B=hexRgb(b);return "#"+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,"0")).join("")}
function districtFill(d,ratio){const base=DIVISION_COLORS[d.division]||"#16a085";if(ratio>=1)return mix(base,"#0b3f31",.35);if(ratio>0)return mix("#e9eee9",base,.38+.48*ratio);return mix("#f1eee6",base,.22)}
function toast(t){const el=$("#tbToast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),1800)}
function stats(){const tasted=DISTRICTS.filter(d=>d.foods.some(x=>selected.has(x.id)));const divisions=new Set(tasted.map(d=>d.division));return{tasted,divisions,pct:Math.round(tasted.length/64*100)}}
function tasteTier(){
 const s=stats(),n=selected.size;
 if(s.tasted.length>=50||n>=120)return"Legend · Level 6";
 if(s.tasted.length>=35||n>=90)return"Connoisseur · Level 5";
 if(s.tasted.length>=24||n>=60)return"Food Hunter · Level 4";
 if(s.tasted.length>=14||n>=35)return"Trailblazer · Level 3";
 if(s.tasted.length>=6||n>=15)return"Taster · Level 2";
 return"Explorer · Level 1";
}
function renderStats(){
 const s=stats(),verified=DISTRICTS.flatMap(d=>d.foods).filter(f=>f.verified).length,total=DISTRICTS.flatMap(d=>d.foods).length;
 $("#tbDistrictCount").textContent=s.tasted.length;$("#tbFoodCount").textContent=selected.size;$("#tbDivisionCount").textContent=s.divisions.size;$("#tbPct").textContent=s.pct+"%";
 $("#tbWishCount").textContent=wishlist.size;$("#tbVerifiedCount").textContent=verified;
 if($("#tbHeroPct"))$("#tbHeroPct").textContent=s.pct+"%";
 if($("#tbHeroDistricts"))$("#tbHeroDistricts").textContent=s.tasted.length;
 if($("#tbHeroFoods"))$("#tbHeroFoods").textContent=selected.size;
 if($("#tbHeroWish"))$("#tbHeroWish").textContent=wishlist.size;
 if($("#tbDbCount"))$("#tbDbCount").textContent=total;
 if($("#tbSourceCount"))$("#tbSourceCount").textContent=verified;if($("#tbTasteTier"))$("#tbTasteTier").textContent=tasteTier();
 renderDivisionNav();paintMap();if(state.current)renderDistrict(state.current)
}
function slugFromGeo(name){const n=norm(name);if(alias[n])return alias[n];const direct=DISTRICTS.find(d=>norm(d.en)===n);if(direct)return direct.slug;const fuzzy=DISTRICTS.find(d=>norm(d.en).includes(n)||n.includes(norm(d.en)));return fuzzy?fuzzy.slug:null}

function renderDivisionNav(){
 const box=$("#tbDivisionNav");if(!box)return;
 const divisions=[...new Set(DISTRICTS.map(d=>d.division))];
 box.innerHTML="";
 divisions.forEach(div=>{
   const ds=DISTRICTS.filter(d=>d.division===div);
   const tasted=ds.filter(d=>d.foods.some(f=>selected.has(f.id))).length;
   const current=state.current&&bySlug[state.current]?.division===div;
   const b=document.createElement("button");
   b.className="tb-division-btn"+(current?" active":"");
   b.innerHTML="<span>"+div+"</span><small>"+tasted+"/"+ds.length+" জেলা</small>";
   b.onclick=()=>{
     const next=ds.find(d=>!d.foods.some(f=>selected.has(f.id)))||ds[0];
     selectDistrict(next.slug);
   };
   box.appendChild(b);
 });
}
function renderCats(){const el=$("#tbCats");el.innerHTML="";Object.entries(CATS).forEach(([k,v])=>{const b=document.createElement("button");b.className="tb-chip"+(state.category===k?" active":"");b.textContent=v[1]+" "+v[0];b.onclick=()=>{state.category=k;save();renderCats();paintMap();if(state.current)renderDistrict(state.current)};el.appendChild(b)})}
function paintMap(){
 $$(".tb-district").forEach(p=>{
   const d=bySlug[p.dataset.slug];if(!d)return;const pr=distProgress(d);
   p.setAttribute("fill",districtFill(d,pr.ratio));p.style.opacity=(state.category!=="all"&&pr.total===0)?".24":"1";
   p.classList.toggle("selected",p.dataset.slug===state.current);p.classList.toggle("completed",pr.total>0&&pr.hit===pr.total);
 });
 $$(".tb-map-label").forEach(t=>{const d=bySlug[t.dataset.slug];if(!d)return;const pr=distProgress(d);t.classList.toggle("selected",t.dataset.slug===state.current);t.classList.toggle("dimmed",state.category!=="all"&&pr.total===0)});
}
function renderFallback(){const f=$("#tbFallback");f.innerHTML="";DISTRICTS.forEach(d=>{const b=document.createElement("button");b.innerHTML="<b>"+d.name+"</b><br><small>"+d.en+"</small>";b.onclick=()=>selectDistrict(d.slug);f.appendChild(b)})}

function setMapStatus(text,kind=""){
 const el=$("#tbMapStatus");if(!el)return;
 el.textContent=text;el.className="tb-map-status"+(kind?" "+kind:"");
}
async function fetchGeoSource(url){
 const ctl=new AbortController();
 const timer=setTimeout(()=>ctl.abort(),4500);
 try{
   const res=await fetch(url,{cache:"no-store",signal:ctl.signal});
   if(!res.ok)throw new Error("HTTP "+res.status);
   const data=await res.json();
   if(!data||!Array.isArray(data.features)||data.features.length!==64)throw new Error("Expected 64 districts");
   return data;
 }finally{clearTimeout(timer)}
}
async function fetchGeo(){
 try{return await Promise.any(GEO_URLS.map(fetchGeoSource))}
 catch(_){throw new Error("Map data unavailable")}
}

/* v1.3: draw GeoJSON ourselves instead of relying on D3.
   Bangladesh spans a small geographic area, so a fitted linear lon/lat
   projection is visually accurate enough and much more reliable here. */
function collectCoords(node,out){
 if(!Array.isArray(node))return;
 if(node.length>=2 && typeof node[0]==="number" && typeof node[1]==="number"){
   out.push(node);return;
 }
 for(const x of node)collectCoords(x,out);
}
function buildProjection(features){
 const pts=[];
 for(const f of features)collectCoords(f.geometry?.coordinates,pts);
 if(!pts.length)throw new Error("No coordinates");
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const p of pts){minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);}
 const W=620,H=780,pad=28;
 const scale=Math.min((W-pad*2)/(maxX-minX),(H-pad*2)/(maxY-minY));
 const mapW=(maxX-minX)*scale,mapH=(maxY-minY)*scale;
 const ox=(W-mapW)/2,oy=(H-mapH)/2;
 return p=>[ox+(p[0]-minX)*scale,oy+(maxY-p[1])*scale];
}
function ringToPath(ring,project){
 if(!Array.isArray(ring)||ring.length<2)return"";
 let d="";
 ring.forEach((p,i)=>{
   const q=project(p);
   d+=(i?"L":"M")+q[0].toFixed(2)+","+q[1].toFixed(2);
 });
 return d+"Z";
}
function geometryToPath(geometry,project){
 if(!geometry)return"";
 const c=geometry.coordinates;
 if(geometry.type==="Polygon"){
   return c.map(r=>ringToPath(r,project)).join("");
 }
 if(geometry.type==="MultiPolygon"){
   return c.map(poly=>poly.map(r=>ringToPath(r,project)).join("")).join("");
 }
 return"";
}
function bindMapPath(pathEl,feature,slug){
 pathEl.addEventListener("click",()=>slug&&selectDistrict(slug));
 pathEl.addEventListener("keydown",e=>{
   if((e.key==="Enter"||e.key===" ")&&slug){e.preventDefault();selectDistrict(slug)}
 });
 pathEl.addEventListener("mousemove",e=>showTip(e,slug));
 pathEl.addEventListener("mouseleave",hideTip);
}
function featureCenter(feature,project){
 const pts=[];collectCoords(feature.geometry?.coordinates,pts);if(!pts.length)return[0,0];
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of pts){const q=project(p);minX=Math.min(minX,q[0]);maxX=Math.max(maxX,q[0]);minY=Math.min(minY,q[1]);maxY=Math.max(maxY,q[1])}
 return[(minX+maxX)/2,(minY+maxY)/2,Math.max(0,(maxX-minX)*(maxY-minY))];
}
function renderGeoMap(data){
 const mapped=data.features.map(f=>slugFromGeo(f.properties?.name||f.properties?.NAME_2||f.properties?.shapeName||""));
 const unique=new Set(mapped.filter(Boolean));if(unique.size!==64){const missing=DISTRICTS.filter(d=>!unique.has(d.slug)).map(d=>d.en);throw new Error("District mapping "+unique.size+"/64; missing: "+missing.join(", "))}
 const svg=$("#tbMap");while(svg.firstChild)svg.removeChild(svg.firstChild);const project=buildProjection(data.features),NS="http://www.w3.org/2000/svg";let validPaths=0;
 const pathLayer=document.createElementNS(NS,"g"),labelLayer=document.createElementNS(NS,"g");pathLayer.setAttribute("class","tb-map-path-layer");labelLayer.setAttribute("class","tb-map-label-layer");svg.append(pathLayer,labelLayer);
 data.features.forEach((feature,i)=>{const slug=mapped[i],d=geometryToPath(feature.geometry,project);if(!d||d.length<20)return;const p=document.createElementNS(NS,"path");p.setAttribute("d",d);p.setAttribute("class","tb-district");p.setAttribute("fill-rule","evenodd");p.setAttribute("data-slug",slug);p.setAttribute("role","button");p.setAttribute("tabindex","0");p.setAttribute("aria-label",(bySlug[slug]?.name||feature.properties?.name||"জেলা")+" জেলা");bindMapPath(p,feature,slug);pathLayer.appendChild(p);validPaths++;
   const [cx,cy,area]=featureCenter(feature,project),t=document.createElementNS(NS,"text");t.setAttribute("x",cx.toFixed(1));t.setAttribute("y",cy.toFixed(1));t.setAttribute("class","tb-map-label");t.setAttribute("data-slug",slug);t.setAttribute("font-size",area<550?"6.2":area<1000?"7.2":"8.4");t.textContent=bySlug[slug]?.name||feature.properties?.name||"";labelLayer.appendChild(t);
 });
 if(validPaths!==64)throw new Error("Rendered "+validPaths+"/64 district paths");return validPaths;
}
async function loadMap(){
 setMapStatus("Map: loading…","");
 $("#tbLoading").textContent="বাংলাদেশের ৬৪ জেলার ম্যাপ তৈরি হচ্ছে…";
 $("#tbLoading").style.display="flex";
 $("#tbMap").style.display="block";
 $("#tbFallback").style.display="none";
 try{
   geo=await fetchGeo();
   const count=renderGeoMap(geo);
   $("#tbLoading").style.display="none";
   setMapStatus("✓ "+count+"/64 জেলা visible","ok");
   paintMap();
 }catch(e){
   console.error("Map load error:",e);
   $("#tbLoading").style.display="none";
   $("#tbMap").style.display="none";
   $("#tbFallback").style.display="grid";
   setMapStatus("Map unavailable · 64-district fallback","error");
 }
}
function showTip(e,slug){if(!bySlug[slug])return;const d=bySlug[slug],pr=allDistProgress(d),t=$("#tbTip");t.innerHTML="<b>"+d.name+"</b> · "+pr.hit+"/"+pr.total+" খাবার";t.style.left=(e.clientX+13)+"px";t.style.top=(e.clientY+13)+"px";t.style.display="block"}function hideTip(){$("#tbTip").style.display="none"}

function openDistrictSheet(){if(innerWidth<=900){$("#tbPanel").classList.add("mobile-open");$("#tbSheetBackdrop").classList.add("open");document.body.style.overflow="hidden"}}
function closeDistrictSheet(){$("#tbPanel").classList.remove("mobile-open");$("#tbSheetBackdrop").classList.remove("open");document.body.style.overflow=""}
function selectDistrict(slug,{scroll=true}={}){
 if(!bySlug[slug])return;state.current=slug;save();history.replaceState(null,"","#district="+encodeURIComponent(slug));$("#tbAtlas").classList.add("has-district");$("#tbDistrictView").hidden=false;renderDistrict(slug);paintMap();renderDivisionNav();
 if(innerWidth<=900)openDistrictSheet();else if(scroll)$("#tbPanel").scrollIntoView({behavior:"smooth",block:"nearest"});
}
function visualInfo(food){
 const exact=food.photo_status==="verified_food_photo"&&food.photo_scope==="regional_exact"&&!!food.image;
 return{url:exact?food.image:"",exact,label:exact?"✓ যাচাইকৃত নির্দিষ্ট খাবারের ছবি":"Illustrated icon"};
}
function iconArt(food,compact=false){
 return '<div class="tb-icon-art tb-cat-'+food.category+(compact?' compact':'')+'"><span>'+food.emoji+'</span><small>'+catLabel(food.category)+'</small></div>';
}
function provenanceBadge(food){
 if(food.verified&&food.source)return '<span class="tb-provenance source">✓ সূত্র সংযুক্ত</span>';
 return '<span class="tb-provenance community">◎ Curated regional</span>';
}
function visual(food){
 const v=visualInfo(food);
 return v.exact?'<img src="'+v.url+'" alt="'+food.name+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(document.createTextNode(\''+food.emoji+'\'))">':iconArt(food,true);
}
function correctionMailto(d,f){
 const subject='Food Passport correction — '+d.name+' — '+f.name;
 const body='জেলা: '+d.name+'\nখাবার: '+f.name+'\n\nসমস্যার ধরন: [ভুল তথ্য / ভুল জেলা / ভুল ছবি / নতুন সঠিক ছবি / অন্যান্য]\n\nসঠিক তথ্য বা প্রস্তাব:\n\nনির্ভরযোগ্য সূত্র/ছবির লিংক (যদি থাকে):\n';
 return 'mailto:'+CORRECTION_EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}
function renderDistrict(slug){
 const d=bySlug[slug];if(!d)return;
 const all=allDistProgress(d),list=foodPool(d);if($("#tbPanelCount"))$("#tbPanelCount").textContent=list.length+"টি item";
 $("#tbDistrictName").textContent=d.name;
 $("#tbDistrictMeta").innerHTML=d.division+" বিভাগ · "+all.hit+"/"+all.total+" খাবার খেয়েছেন"+
   (state.category!=="all"?" · ফিল্টার: "+catLabel(state.category):"")+
   (list.length>2?'<div class="tb-scroll-hint">↓ সব '+list.length+'টি খাবার দেখতে এই তালিকায় স্ক্রল করুন</div>':"");
 $("#tbDistrictBar").style.width=(all.ratio*100)+"%";
 renderDistrictCovers(d);
 const box=$("#tbFoods");box.innerHTML="";
 if(!list.length){box.innerHTML='<div class="tb-empty" style="min-height:240px"><div>এই ক্যাটাগরিতে খাবার নেই।<br><small>উপরে “সব” নির্বাচন করুন।</small></div></div>';return}
 list.forEach(food=>{
   const on=selected.has(food.id),wish=wishlist.has(food.id),v=visualInfo(food),el=document.createElement("article");
   el.className="tb-food"+(on?" on":"")+(wish?" wished":"");el.dataset.cat=food.category;
   const prov=provenanceBadge(food);
   el.innerHTML='<div class="tb-food-visual"><span class="tb-photo-loading">'+food.emoji+'</span>'+visual(food)+'</div><div><h3>'+food.name+'</h3><p>'+(food.note||food.en)+'</p><span class="tb-tag">'+catLabel(food.category)+'</span>'+prov+'<span class="tb-photo-kind '+(v.exact?'exact':'icon')+'">'+v.label+'</span></div><div class="tb-food-actions"><button class="tb-check" title="খেয়েছি" aria-label="'+food.name+' খেয়েছি">'+(on?"✓":"＋")+'</button><button class="tb-wish" title="খেতে চাই" aria-label="'+food.name+' খেতে চাই">'+(wish?"★":"☆")+'</button></div>';
   el.querySelector(".tb-check").onclick=e=>{e.stopPropagation();toggleFood(food.id)};
   el.querySelector(".tb-wish").onclick=e=>{e.stopPropagation();toggleWish(food.id)};
   el.onclick=()=>openFood(d,food);box.appendChild(el);
 });
 box.scrollTop=0;
}
function renderDistrictCovers(d){
 const box=$("#tbDistrictCoverStrip");if(!box)return;box.innerHTML="";
 const picks=[...d.foods].sort((a,b)=>Number(!!b.image)-Number(!!a.image)).slice(0,3);
 picks.forEach(f=>{
   const v=visualInfo(f),c=document.createElement("div");c.className="cover"+(v.exact?" has-photo":" icon-cover");
   c.innerHTML=(v.exact?'<img src="'+v.url+'" alt="'+f.name+'" referrerpolicy="no-referrer">':iconArt(f,true))+'<span>'+f.name+'</span>';
   box.appendChild(c);
 });
}
function toggleFood(id){if(selected.has(id)){selected.delete(id)}else{selected.add(id);wishlist.delete(id)}save();renderStats();renderFeatured();toast(selected.has(id)?"খেয়েছি হিসেবে যোগ হয়েছে ✓":"খাওয়া তালিকা থেকে বাদ হয়েছে")}
function toggleWish(id){if(selected.has(id)){toast("এটা ইতিমধ্যে খেয়েছেন ✓");return}wishlist.has(id)?wishlist.delete(id):wishlist.add(id);save();renderStats();renderFeatured();toast(wishlist.has(id)?"খেতে চাই তালিকায় যোগ হয়েছে ★":"Wishlist থেকে বাদ হয়েছে")}
function go(step){if(!state.current)return;let i=order.indexOf(state.current);selectDistrict(order[(i+step+order.length)%order.length])}

function search(q){const n=norm(q);if(!n)return[];return DISTRICTS.map(d=>{let score=0;if(norm(d.name).includes(n)||norm(d.en).includes(n))score+=10;const matches=d.foods.filter(x=>[x.name,x.en,...(x.aliases||[])].some(v=>norm(v).includes(n)));score+=matches.length*4;return{d,score,matches}}).filter(x=>x.score).sort((a,b)=>b.score-a.score).slice(0,8)}
function renderSearch(){const q=$("#tbSearch").value,r=search(q),box=$("#tbSearchResults");box.innerHTML="";if(!q.trim()||!r.length){box.classList.remove("open");return}r.forEach(x=>{const b=document.createElement("button");b.className="tb-result";b.innerHTML="<span><b>"+x.d.name+"</b> <small>"+x.d.en+"</small></span><small>"+(x.matches[0]?x.matches[0].name:"জেলা")+"</small>";b.onclick=()=>{selectDistrict(x.d.slug);box.classList.remove("open");$("#tbSearch").value=""};box.appendChild(b)});box.classList.add("open")}

function badge(){const s=stats(),cc={};DISTRICTS.flatMap(d=>d.foods).forEach(x=>{if(selected.has(x.id))cc[x.category]=(cc[x.category]||0)+1});if(s.tasted.length===64)return"🏆 বাংলাদেশ স্বাদসম্রাট";if(s.divisions.size===8)return"🗺️ ৮ বিভাগ অভিযাত্রী";if(selected.size>=50)return"✨ ৫০+ স্বাদের মাইলফলক";if((cc.sweet||0)>=10)return"🍬 মিষ্টি শিকারি";if((cc.fish||0)>=10)return"🐟 মাছের দেশ অভিযাত্রী";if((cc.pitha||0)>=8)return"🥮 পিঠা প্রেমী";if(s.tasted.length>=10)return"🚩 জেলা Food Explorer";return"🌱 নতুন স্বাদযাত্রা"}

function renderFeatured(){
 const wrap=$("#tbFeatured");wrap.innerHTML="";
 let items=[];
 DISTRICTS.forEach(d=>d.foods.filter(f=>f.featured||f.image).forEach(f=>items.push({d,f})));
 if(items.length<10){DISTRICTS.forEach(d=>d.foods.forEach(f=>{if(!items.some(x=>x.f.id===f.id))items.push({d,f})}))}
 items.sort((a,b)=>Number(selected.has(a.f.id))-Number(selected.has(b.f.id)));
 items.slice(0,10).forEach(({d,f})=>{
   const v=visualInfo(f),b=document.createElement("button");
   b.className="tb-feature-card "+(v.exact?"has-photo":"icon-card tb-cat-"+f.category);
   if(v.exact)b.style.backgroundImage='url("'+v.url+'")';
   b.innerHTML=(v.exact?'<span class="emoji">'+f.emoji+'</span>':iconArt(f,false))+'<b>'+f.name+'</b><small>'+d.name+' · '+(selected.has(f.id)?"✓ খেয়েছেন":wishlist.has(f.id)?"★ Wishlist":"বিস্তারিত দেখুন")+'</small>';
   b.onclick=()=>openFood(d,f);wrap.appendChild(b);
 });
}
function openFood(d,f){
 const modal=$("#tbFoodModal"),detail=$("#tbFoodDetail"),v=visualInfo(f);
 $("#tbFoodModalTitle").textContent=d.name+" · "+f.name;
 const hero=v.exact?'<img src="'+v.url+'" alt="'+f.name+'" referrerpolicy="no-referrer">':iconArt(f,false);
 const source=f.source?'<a class="tb-detail-link" href="'+f.source+'" target="_blank" rel="noopener">↗ সূত্র দেখুন'+(f.source_label?" · "+f.source_label:"")+'</a>':'';
 const evidenceNote=(!f.verified||!f.source)?'<div class="tb-curation-note">এই খাবারটি আঞ্চলিক curated তালিকা থেকে যোগ করা হয়েছে। নির্দিষ্ট প্রকাশিত reference পাওয়া গেলে সেটি পরে যুক্ত করা হবে।</div>':'';
 const prov=provenanceBadge(f);
 let credit=v.exact&&f.image_source?'<div class="tb-credit">ছবি: '+(f.image_credit||"Wikimedia Commons")+(f.image_license?" · "+f.image_license:"")+' · <a href="'+f.image_source+'" target="_blank" rel="noopener">মূল ফাইল/লাইসেন্স</a></div>':'<div class="tb-representative-note quality-safe">এই খাবারের যাচাইকৃত নির্দিষ্ট photo এখনো যোগ করা হয়নি। ভুল ছবি দেখানোর বদলে category icon ব্যবহার করা হয়েছে।</div>';
 const correct='<a class="tb-correction-link" href="'+correctionMailto(d,f)+'">✉️ তথ্য/ছবি সংশোধন জানান</a>';
 detail.innerHTML='<div class="tb-detail-hero '+(v.exact?'has-photo':'icon-hero')+'">'+hero+'</div><div class="tb-detail-copy"><h2>'+f.name+'</h2><div class="en">'+f.en+' · '+d.name+', '+d.division+'</div><p>'+f.note+'</p><div class="tb-detail-meta"><span class="tb-tag">'+catLabel(f.category)+'</span>'+prov+'<span class="tb-photo-kind '+(v.exact?'exact':'icon')+'">'+v.label+'</span></div>'+source+evidenceNote+'<div class="tb-detail-actions"><button class="tb-btn primary" data-do="tried">'+(selected.has(f.id)?"✓ খেয়েছি — Undo":"✓ আমি এটা খেয়েছি")+'</button><button class="tb-btn" data-do="wish">'+(wishlist.has(f.id)?"★ Wishlist থেকে বাদ":"☆ খেতে চাই")+'</button></div>'+credit+correct+'</div>';
 detail.querySelector('[data-do="tried"]').onclick=()=>{toggleFood(f.id);openFood(d,f)};
 detail.querySelector('[data-do="wish"]').onclick=()=>{toggleWish(f.id);openFood(d,f)};
 modal.classList.add("open");
}
function closeFood(){$("#tbFoodModal").classList.remove("open")}

function suggestNext(){
 let pool=DISTRICTS.flatMap(d=>d.foods.map(f=>({d,f}))).filter(x=>wishlist.has(x.f.id)&&!selected.has(x.f.id));
 if(!pool.length)pool=DISTRICTS.flatMap(d=>d.foods.map(f=>({d,f}))).filter(x=>!selected.has(x.f.id)&&x.f.verified);
 if(!pool.length)pool=DISTRICTS.flatMap(d=>d.foods.map(f=>({d,f}))).filter(x=>!selected.has(x.f.id));
 if(!pool.length){toast("আপনি সব খাবারই খেয়ে ফেলেছেন! 🏆");return}
 const pick=pool[Math.floor(Math.random()*pool.length)];openFood(pick.d,pick.f)
}
function openJourney(){
 const s=stats(),rows=[];
 DISTRICTS.forEach(d=>{const tried=d.foods.filter(f=>selected.has(f.id)),wish=d.foods.filter(f=>wishlist.has(f.id));if(tried.length||wish.length)rows.push({d,tried,wish})});
 $("#tbJourneyBody").innerHTML='<div class="tb-journey-summary"><div><b>'+s.tasted.length+'/64</b><small>জেলা tasted</small></div><div><b>'+selected.size+'</b><small>খাবার খেয়েছেন</small></div><div><b>'+wishlist.size+'</b><small>খেতে চান</small></div></div><div class="tb-journey-list">'+(rows.map(x=>'<div class="tb-journey-row"><div><b>'+x.d.name+'</b><br><small>'+(x.tried.length?'✓ '+x.tried.map(f=>f.name).join(" · "):'')+(x.tried.length&&x.wish.length?'<br>':'')+(x.wish.length?'★ '+x.wish.map(f=>f.name).join(" · "):'')+'</small></div><button class="tb-btn" data-slug="'+x.d.slug+'">খুলুন</button></div>').join("")||'<div class="tb-empty" style="min-height:220px">এখনও Food Trail শুরু হয়নি।</div>')+'</div>';
 $$("#tbJourneyBody [data-slug]").forEach(b=>b.onclick=()=>{$("#tbJourneyModal").classList.remove("open");selectDistrict(b.dataset.slug)});
 $("#tbJourneyModal").classList.add("open")
}

function categoryCounts(){const c={};DISTRICTS.flatMap(d=>d.foods).forEach(f=>{if(selected.has(f.id))c[f.category]=(c[f.category]||0)+1});return c}
function renderEditPassport(q=""){
 const box=$("#tbEditList"),term=norm(q);box.innerHTML="";let total=0;
 DISTRICTS.forEach(d=>{const foods=d.foods.filter(f=>selected.has(f.id)&&(!term||norm(f.name).includes(term)||norm(f.en).includes(term)));if(!foods.length)return;total+=foods.length;const g=document.createElement("section");g.className="tb-edit-group";g.innerHTML="<h4>"+d.name+" <small>· "+foods.length+"</small></h4>";foods.forEach(f=>{const row=document.createElement("div");row.className="tb-edit-item";row.innerHTML="<div><b>"+f.name+"</b><br><small>"+catLabel(f.category)+" · "+f.en+"</small></div><button class=\"tb-btn danger\" data-id=\""+f.id+"\">Remove</button>";row.querySelector("button").onclick=()=>{selected.delete(f.id);save();renderStats();renderFeatured();renderEditPassport($("#tbEditSearch").value);toast(f.name+" বাদ হয়েছে")};g.appendChild(row)});box.appendChild(g)});
 $("#tbEditCount").textContent=total+"টি selected";if(!total)box.innerHTML='<div class="tb-empty" style="min-height:220px">কোনো খাওয়া খাবার পাওয়া যায়নি।</div>';
}
function openEditPassport(){closeReport();renderEditPassport();$("#tbEditSearch").value="";$("#tbEditModal").classList.add("open")}
function resetTasted(){if(confirm("শুধু খাওয়া খাবারের selection reset করবেন? Wishlist থাকবে।")){selected.clear();save();renderStats();renderFeatured();renderReport();toast("খাওয়া খাবার reset হয়েছে")}}
function clearWishlist(){if(confirm("Wishlist-এর সব খাবার মুছে ফেলবেন?")){wishlist.clear();save();renderStats();renderFeatured();renderReport();toast("Wishlist clear হয়েছে")}}
function resetEverything(){if(confirm("খাওয়া খাবার, Wishlist এবং নাম—সব reset করবেন?")){selected.clear();wishlist.clear();state.name="";state.current=null;save();history.replaceState(null,"",location.pathname);$("#tbAtlas").classList.remove("has-district");$("#tbDistrictView").hidden=true;$("#tbName").value="";closeDistrictSheet();renderStats();renderFeatured();closeReport();toast("Food Passport সম্পূর্ণ reset হয়েছে")}}
function renderReport(){
 const s=stats(),cc=categoryCounts();$("#tbRdistrict").textContent=s.tasted.length;$("#tbRfood").textContent=selected.size;$("#tbRpct").textContent=s.pct+"%";$("#tbBadge").textContent=tasteTier()+" · "+badge();$("#tbRTier").textContent=tasteTier();$("#tbRdivision").textContent=s.divisions.size+"/8 বিভাগ";$("#tbReportName").textContent=state.name?state.name+"-এর স্বাদযাত্রা":"আমার ব্যক্তিগত স্বাদযাত্রা";
 const names=[];DISTRICTS.forEach(d=>d.foods.forEach(x=>{if(selected.has(x.id))names.push(x.name)}));$("#tbRfoods").innerHTML=names.slice(-7).reverse().map(x=>"<div>✓ "+x+"</div>").join("")||"<div>এখনও কোনো খাবার মার্ক করা হয়নি</div>";
 const prof=Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,6);$("#tbReportProfile").innerHTML=prof.map(([k,v])=>"<span>"+catLabel(k)+" · "+v+"</span>").join("")||"<span>যাত্রা শুরু করুন</span>";
 const target=$("#tbReportMap");target.innerHTML="";const src=$("#tbMap");if(src&&src.children.length&&src.style.display!=="none"){const c=src.cloneNode(true);c.removeAttribute("id");c.querySelectorAll("path.tb-district").forEach(p=>{p.removeAttribute("tabindex");p.removeAttribute("role");p.classList.remove("selected");const d=bySlug[p.dataset.slug],pr=allDistProgress(d);p.setAttribute("fill",pr.hit?districtFill(d,Math.max(.25,pr.ratio)):"#dfe9e4");p.setAttribute("stroke",pr.hit?(pr.ratio>=1?"#d6a22f":"#ffffff"):"#f7fbf9");p.setAttribute("stroke-width",pr.ratio>=1?"2.5":"1.1")});c.querySelectorAll(".tb-map-label").forEach(t=>{const d=bySlug[t.dataset.slug],pr=allDistProgress(d);t.classList.remove("selected","dimmed");t.style.opacity=pr.hit?"1":".48"});target.appendChild(c)}else target.innerHTML='<div style="text-align:center;font-size:90px">🇧🇩</div>'
}
function openReport(){renderReport();$("#tbReportModal").classList.add("open")}function closeReport(){$("#tbReportModal").classList.remove("open")}
async function cardCanvas(){renderReport();if(typeof html2canvas==="undefined")throw new Error("export");return await html2canvas($("#tbReportCard"),{scale:1.35,backgroundColor:null,useCORS:true,logging:false})}
async function download(){try{const c=await cardCanvas(),a=document.createElement("a");a.download="bangladesh-food-passport-1080x1350.png";a.href=c.toDataURL("image/png");a.click();toast("PNG তৈরি হয়েছে")}catch(e){toast("PNG তৈরি করা যায়নি")}}
async function share(){try{const c=await cardCanvas();const blob=await new Promise(r=>c.toBlob(r,"image/png"));const file=new File([blob],"bangladesh-food-passport.png",{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:"আমার Bangladesh Food Passport",text:"বাংলাদেশের কতটুকু আমি খেয়ে দেখেছি",files:[file]})}else download()}catch(e){if(e.name!=="AbortError")toast("শেয়ার সম্ভব হয়নি—PNG ডাউনলোড করুন")}}
function wire(){
 $("#tbSearch").addEventListener("input",renderSearch);document.addEventListener("click",e=>{if(!e.target.closest(".tb-map-top"))$("#tbSearchResults").classList.remove("open")});
 $("#tbRandom").onclick=()=>selectDistrict(order[Math.floor(Math.random()*order.length)]);$("#tbRetryMap").onclick=()=>loadMap();$("#tbStartExplore").onclick=()=>$("#tbAtlas").scrollIntoView({behavior:"smooth",block:"start"});$("#tbHeroTrail").onclick=openJourney;$("#tbPrev").onclick=()=>go(-1);$("#tbNext").onclick=()=>go(1);
 $("#tbOpenReport").onclick=openReport;$("#tbFab").onclick=openReport;$("#tbCloseReport").onclick=closeReport;$("#tbReportModal").addEventListener("click",e=>{if(e.target.id==="tbReportModal")closeReport()});$("#tbEditPassport").onclick=openEditPassport;$("#tbCloseEdit").onclick=()=>$("#tbEditModal").classList.remove("open");$("#tbEditSearch").addEventListener("input",e=>renderEditPassport(e.target.value));$("#tbEditModal").addEventListener("click",e=>{if(e.target.id==="tbEditModal")e.currentTarget.classList.remove("open")});$("#tbResetTasted").onclick=resetTasted;$("#tbClearWishlist").onclick=clearWishlist;$("#tbResetAllReport").onclick=resetEverything;$("#tbCloseDistrict").onclick=closeDistrictSheet;$("#tbSheetBackdrop").onclick=closeDistrictSheet;
 $("#tbCloseFood").onclick=closeFood;$("#tbFoodModal").addEventListener("click",e=>{if(e.target.id==="tbFoodModal")closeFood()});
 $("#tbJourney").onclick=openJourney;$("#tbCloseJourney").onclick=()=>$("#tbJourneyModal").classList.remove("open");$("#tbJourneyModal").addEventListener("click",e=>{if(e.target.id==="tbJourneyModal")e.currentTarget.classList.remove("open")});
 $("#tbNextWish").onclick=suggestNext;
 $("#tbName").value=state.name||"";$("#tbName").addEventListener("input",e=>{state.name=e.target.value;save();$("#tbReportName").textContent=state.name?state.name+"-এর স্বাদযাত্রা":"আমার ব্যক্তিগত স্বাদযাত্রা"});
 $("#tbDownload").onclick=download;$("#tbShare").onclick=share;
 $("#tbReset").onclick=resetEverything;
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){$$(".tb-modal.open").forEach(m=>m.classList.remove("open"));closeDistrictSheet()}})
}
async function boot(){
 try{
  const [fd,cd]=await Promise.all([fetch("./data/foods.json").then(r=>r.json()),fetch("./data/categories.json").then(r=>r.json())]);
  DISTRICTS=fd.districts;CATS=cd;bySlug=Object.fromEntries(DISTRICTS.map(d=>[d.slug,d]));order=DISTRICTS.map(d=>d.slug);loadState();sanitizeState();renderCats();renderFallback();renderStats();renderFeatured();wire();await loadMap();
  const hash=new URLSearchParams(location.hash.replace(/^#/,""));const h=hash.get("district");if(h&&bySlug[h])selectDistrict(h,{scroll:false});else if(state.current&&bySlug[state.current])selectDistrict(state.current,{scroll:false});
  if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{})
 }catch(e){$("#tbLoading").textContent="Data load হয়নি। GitHub Pages/HTTP server দিয়ে চালু করুন; file:// দিয়ে নয়।";console.error(e)}
}
document.addEventListener("DOMContentLoaded",boot);
})();
