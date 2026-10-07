
(() => {
"use strict";
const GEO_URLS=[
 "https://cdn.jsdelivr.net/gh/HedaetShahriar/bangladesh-locations-dataset@main/data/exports/geojson/boundaries/districts.geojson",
 "https://raw.githubusercontent.com/HedaetShahriar/bangladesh-locations-dataset/main/data/exports/geojson/boundaries/districts.geojson"
];
const STORE="taste_bangladesh_food_passport_v1_2", OLDS=["taste_bangladesh_food_passport_v1_1","taste_bangladesh_food_passport_v1"];
let DISTRICTS=[],CATS={},bySlug={},order=[],selected=new Set(),wishlist=new Set(),geo=null;
let state={selected:[],wishlist:[],name:"",current:null,category:"all"};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const alias={"barisal":"barishal","bogra":"bogura","comilla":"cumilla","chittagong":"chattogram","coxs bazar":"coxs-bazar","cox s bazar":"coxs-bazar","jessore":"jashore","chapai nawabganj":"chapainawabganj","nawabganj":"chapainawabganj","jhalokati":"jhalokathi","khagrachari":"khagrachhari","maulvibazar":"moulvibazar","netrakona":"netrokona","coxsbazar":"coxs-bazar","jhalakathi":"jhalokathi"};

function norm(s){return String(s||"").toLowerCase().normalize("NFKD").replace(/[’'().,_-]/g," ").replace(/\s+/g," ").trim()}
function loadState(){
  let raw=localStorage.getItem(STORE); if(!raw){for(const k of OLDS){raw=localStorage.getItem(k);if(raw)break}}
  try{const s=JSON.parse(raw||"null");if(s&&Array.isArray(s.selected))state={...state,...s}}catch(_){}
  selected=new Set(state.selected||[]);wishlist=new Set(state.wishlist||[]);
}
function save(){state.selected=[...selected];state.wishlist=[...wishlist];localStorage.setItem(STORE,JSON.stringify(state))}
function catLabel(c){return CATS[c]?CATS[c][0]:c}
function foodPool(d){return state.category==="all"?d.foods:d.foods.filter(x=>x.category===state.category)}
function distProgress(d){const foods=foodPool(d),hit=foods.filter(x=>selected.has(x.id)).length;return{hit,total:foods.length,ratio:foods.length?hit/foods.length:0}}
function allDistProgress(d){const hit=d.foods.filter(x=>selected.has(x.id)).length;return{hit,total:d.foods.length,ratio:d.foods.length?hit/d.foods.length:0}}
function color(r){if(r>=1)return"#075e45";if(r>=.66)return"#26906a";if(r>=.33)return"#72bd99";if(r>0)return"#b8dfcd";return"#e5e1d8"}
function toast(t){const el=$("#tbToast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),1800)}
function stats(){const tasted=DISTRICTS.filter(d=>d.foods.some(x=>selected.has(x.id)));const divisions=new Set(tasted.map(d=>d.division));return{tasted,divisions,pct:Math.round(tasted.length/64*100)}}
function renderStats(){const s=stats();$("#tbDistrictCount").textContent=s.tasted.length;$("#tbFoodCount").textContent=selected.size;$("#tbDivisionCount").textContent=s.divisions.size;$("#tbPct").textContent=s.pct+"%";$("#tbWishCount").textContent=wishlist.size;$("#tbVerifiedCount").textContent=DISTRICTS.flatMap(d=>d.foods).filter(f=>f.verified).length;paintMap();if(state.current)renderDistrict(state.current)}
function slugFromGeo(name){const n=norm(name);if(alias[n])return alias[n];const direct=DISTRICTS.find(d=>norm(d.en)===n);if(direct)return direct.slug;const fuzzy=DISTRICTS.find(d=>norm(d.en).includes(n)||n.includes(norm(d.en)));return fuzzy?fuzzy.slug:null}

function renderCats(){const el=$("#tbCats");el.innerHTML="";Object.entries(CATS).forEach(([k,v])=>{const b=document.createElement("button");b.className="tb-chip"+(state.category===k?" active":"");b.textContent=v[1]+" "+v[0];b.onclick=()=>{state.category=k;save();renderCats();paintMap();if(state.current)renderDistrict(state.current)};el.appendChild(b)})}
function paintMap(){$$(".tb-district").forEach(p=>{const d=bySlug[p.dataset.slug];if(!d)return;const pr=distProgress(d);p.setAttribute("fill",color(pr.ratio));p.style.opacity=(state.category!=="all"&&pr.total===0)?".25":"1";p.classList.toggle("selected",p.dataset.slug===state.current)})}
function renderFallback(){const f=$("#tbFallback");f.innerHTML="";DISTRICTS.forEach(d=>{const b=document.createElement("button");b.innerHTML="<b>"+d.name+"</b><br><small>"+d.en+"</small>";b.onclick=()=>selectDistrict(d.slug);f.appendChild(b)})}
function setMapStatus(text,kind=""){const el=$("#tbMapStatus");if(!el)return;el.textContent=text;el.className="tb-map-status"+(kind?" "+kind:"")}
function loadScriptOnce(src,test){
 return new Promise((resolve,reject)=>{
   if(test())return resolve();
   const s=document.createElement("script");s.src=src;s.async=true;
   s.onload=()=>test()?resolve():reject(new Error("script loaded but global missing"));
   s.onerror=()=>reject(new Error("script load failed"));
   document.head.appendChild(s)
 })
}
async function ensureD3(){
 if(window.d3)return true;
 for(const u of ["https://unpkg.com/d3@7/dist/d3.min.js","https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"]){
   try{await loadScriptOnce(u,()=>!!window.d3);if(window.d3)return true}catch(_){}
 }
 return false
}
async function fetchGeo(){
 let last=null;
 for(const url of GEO_URLS){
   try{
     const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),12000);
     const res=await fetch(url,{cache:"no-store",signal:ctl.signal});clearTimeout(timer);
     if(!res.ok)throw new Error("HTTP "+res.status);
     const data=await res.json();
     if(!data||!Array.isArray(data.features)||data.features.length!==64)throw new Error("Expected 64 districts");
     return data
   }catch(e){last=e}
 }
 throw last||new Error("Map data unavailable")
}
async function loadMap(){
 setMapStatus("Map: loading…","");
 $("#tbLoading").style.display="flex";$("#tbMap").style.display="block";$("#tbFallback").style.display="none";
 try{
   if(!(await ensureD3()))throw new Error("D3 library unavailable");
   geo=await fetchGeo();
   const mapped=geo.features.map(f=>slugFromGeo(f.properties?.name||f.properties?.NAME_2||f.properties?.shapeName||""));
   const unique=new Set(mapped.filter(Boolean));
   if(unique.size!==64){
     const missing=DISTRICTS.filter(d=>!unique.has(d.slug)).map(d=>d.en);
     throw new Error("District mapping "+unique.size+"/64; missing: "+missing.join(", "));
   }
   const svg=d3.select("#tbMap");svg.selectAll("*").remove();
   const proj=d3.geoMercator().fitExtent([[26,18],[594,760]],geo),path=d3.geoPath(proj);
   svg.selectAll("path").data(geo.features).join("path")
     .attr("d",path).attr("class","tb-district").attr("fill-rule","evenodd")
     .attr("data-slug",d=>slugFromGeo(d.properties?.name||d.properties?.NAME_2||d.properties?.shapeName||"")||"")
     .attr("role","button").attr("tabindex","0")
     .attr("aria-label",d=>{const s=slugFromGeo(d.properties?.name||"");return bySlug[s]?bySlug[s].name+" জেলা":(d.properties?.name||"জেলা")})
     .on("click",(e,d)=>{const s=slugFromGeo(d.properties?.name||"");if(s)selectDistrict(s)})
     .on("keydown",(e,d)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();const s=slugFromGeo(d.properties?.name||"");if(s)selectDistrict(s)}})
     .on("mousemove",(e,d)=>showTip(e,slugFromGeo(d.properties?.name||"")))
     .on("mouseleave",hideTip);
   $("#tbLoading").style.display="none";setMapStatus("✓ 64/64 জেলা loaded","ok");paintMap();
 }catch(e){
   console.error("Map load error:",e);
   $("#tbLoading").style.display="none";$("#tbMap").style.display="none";$("#tbFallback").style.display="grid";
   setMapStatus("Map unavailable · 64-district fallback","error");
 }
}
function showTip(e,slug){if(!bySlug[slug])return;const d=bySlug[slug],pr=allDistProgress(d),t=$("#tbTip");t.innerHTML="<b>"+d.name+"</b> · "+pr.hit+"/"+pr.total+" খাবার";t.style.left=(e.clientX+13)+"px";t.style.top=(e.clientY+13)+"px";t.style.display="block"}function hideTip(){$("#tbTip").style.display="none"}

function selectDistrict(slug,{scroll=true}={}){
 if(!bySlug[slug])return;state.current=slug;save();history.replaceState(null,"","#district="+encodeURIComponent(slug));renderDistrict(slug);paintMap();$("#tbEmpty").hidden=true;$("#tbDistrictView").hidden=false;if(scroll&&innerWidth<981)$("#tbPanel").scrollIntoView({behavior:"smooth",block:"start"})
}
function visual(food){if(food.image)return '<img src="'+food.image+'" alt="'+food.name+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.textContent=\''+food.emoji+'\'">';return food.emoji}
function renderDistrict(slug){
 const d=bySlug[slug];if(!d)return;const all=allDistProgress(d),list=foodPool(d);$("#tbDistrictName").textContent=d.name;$("#tbDistrictMeta").textContent=d.division+" বিভাগ · "+all.hit+"/"+all.total+" খাবার খেয়েছেন"+(state.category!=="all"?" · ফিল্টার: "+catLabel(state.category):"");$("#tbDistrictBar").style.width=(all.ratio*100)+"%";
 const box=$("#tbFoods");box.innerHTML="";if(!list.length){box.innerHTML='<div class="tb-empty" style="min-height:240px"><div>এই ক্যাটাগরিতে খাবার নেই।<br><small>উপরে “সব” নির্বাচন করুন।</small></div></div>';return}
 list.forEach(food=>{const on=selected.has(food.id),wish=wishlist.has(food.id),el=document.createElement("article");el.className="tb-food"+(on?" on":"")+(wish?" wished":"");const badges=(food.verified?'<span class="tb-source-chip ok">✓ Source checked</span>':'')+(food.image?'<span class="tb-source-chip photo">📷 Photo</span>':'');
 el.innerHTML='<div class="tb-food-visual">'+visual(food)+'</div><div><h3>'+food.name+'</h3><p>'+(food.note||food.en)+'</p><span class="tb-tag">'+catLabel(food.category)+'</span>'+badges+'</div><div class="tb-food-actions"><button class="tb-check" title="খেয়েছি" aria-label="'+food.name+' খেয়েছি">'+(on?"✓":"＋")+'</button><button class="tb-wish" title="খেতে চাই" aria-label="'+food.name+' খেতে চাই">'+(wish?"★":"☆")+'</button></div>';
 el.querySelector(".tb-check").onclick=e=>{e.stopPropagation();toggleFood(food.id)};el.querySelector(".tb-wish").onclick=e=>{e.stopPropagation();toggleWish(food.id)};el.onclick=()=>openFood(d,food);box.appendChild(el)})
}
function toggleFood(id){if(selected.has(id)){selected.delete(id)}else{selected.add(id);wishlist.delete(id)}save();renderStats();renderFeatured();toast(selected.has(id)?"খেয়েছি হিসেবে যোগ হয়েছে ✓":"খাওয়া তালিকা থেকে বাদ হয়েছে")}
function toggleWish(id){if(selected.has(id)){toast("এটা ইতিমধ্যে খেয়েছেন ✓");return}wishlist.has(id)?wishlist.delete(id):wishlist.add(id);save();renderStats();renderFeatured();toast(wishlist.has(id)?"খেতে চাই তালিকায় যোগ হয়েছে ★":"Wishlist থেকে বাদ হয়েছে")}
function go(step){if(!state.current)return;let i=order.indexOf(state.current);selectDistrict(order[(i+step+order.length)%order.length])}

function search(q){const n=norm(q);if(!n)return[];return DISTRICTS.map(d=>{let score=0;if(norm(d.name).includes(n)||norm(d.en).includes(n))score+=10;const matches=d.foods.filter(x=>[x.name,x.en,...(x.aliases||[])].some(v=>norm(v).includes(n)));score+=matches.length*4;return{d,score,matches}}).filter(x=>x.score).sort((a,b)=>b.score-a.score).slice(0,8)}
function renderSearch(){const q=$("#tbSearch").value,r=search(q),box=$("#tbSearchResults");box.innerHTML="";if(!q.trim()||!r.length){box.classList.remove("open");return}r.forEach(x=>{const b=document.createElement("button");b.className="tb-result";b.innerHTML="<span><b>"+x.d.name+"</b> <small>"+x.d.en+"</small></span><small>"+(x.matches[0]?x.matches[0].name:"জেলা")+"</small>";b.onclick=()=>{selectDistrict(x.d.slug);box.classList.remove("open");$("#tbSearch").value=""};box.appendChild(b)});box.classList.add("open")}

function badge(){const s=stats(),cc={};DISTRICTS.flatMap(d=>d.foods).forEach(x=>{if(selected.has(x.id))cc[x.category]=(cc[x.category]||0)+1});if(s.tasted.length===64)return"🏆 বাংলাদেশ স্বাদসম্রাট";if(s.divisions.size===8)return"🗺️ ৮ বিভাগ অভিযাত্রী";if(selected.size>=50)return"✨ ৫০+ স্বাদের মাইলফলক";if((cc.sweet||0)>=10)return"🍬 মিষ্টি শিকারি";if((cc.fish||0)>=10)return"🐟 মাছের দেশ অভিযাত্রী";if((cc.pitha||0)>=8)return"🥮 পিঠা প্রেমী";if(s.tasted.length>=10)return"🚩 জেলা Food Explorer";return"🌱 নতুন স্বাদযাত্রা"}

function renderFeatured(){const wrap=$("#tbFeatured");wrap.innerHTML="";let items=[];DISTRICTS.forEach(d=>d.foods.filter(f=>f.featured||f.image).forEach(f=>items.push({d,f})));items.sort((a,b)=>Number(selected.has(a.f.id))-Number(selected.has(b.f.id)));items.slice(0,10).forEach(({d,f})=>{const b=document.createElement("button");b.className="tb-feature-card"+(f.image?" has-photo":"");if(f.image)b.style.backgroundImage='url("'+f.image+'")';b.innerHTML='<span class="emoji">'+f.emoji+'</span><b>'+f.name+'</b><small>'+d.name+' · '+(selected.has(f.id)?"✓ খেয়েছেন":wishlist.has(f.id)?"★ Wishlist":"বিস্তারিত দেখুন")+'</small>';b.onclick=()=>openFood(d,f);wrap.appendChild(b)})}

function openFood(d,f){
 const modal=$("#tbFoodModal"),detail=$("#tbFoodDetail");$("#tbFoodModalTitle").textContent=d.name+" · "+f.name;
 const img=f.image?'<img src="'+f.image+'" alt="'+f.name+'" referrerpolicy="no-referrer" onerror="this.parentElement.textContent=\''+f.emoji+'\'">':f.emoji;
 const source=f.source?'<a class="tb-detail-link" href="'+f.source+'" target="_blank" rel="noopener">↗ উৎস দেখুন'+(f.source_label?" · "+f.source_label:"")+'</a>':'';
 const credit=f.image_source?'<div class="tb-credit">ছবি: '+(f.image_credit||"Wikimedia Commons")+(f.image_license?" · "+f.image_license:"")+' · <a href="'+f.image_source+'" target="_blank" rel="noopener">মূল ফাইল/লাইসেন্স</a><br><em>ছবি খাবারটির visual reference; পরিবেশন/রূপ ভিন্ন হতে পারে।</em></div>':'';
 detail.innerHTML='<div class="tb-detail-hero">'+img+'</div><div class="tb-detail-copy"><h2>'+f.name+'</h2><div class="en">'+f.en+' · '+d.name+', '+d.division+'</div><p>'+f.note+'</p><div class="tb-detail-meta"><span class="tb-tag">'+catLabel(f.category)+'</span>'+(f.verified?'<span class="tb-source-chip ok">✓ Source checked</span>':'<span class="tb-source-chip photo">Community-curated</span>')+'</div>'+source+'<div class="tb-detail-actions"><button class="tb-btn primary" data-do="tried">'+(selected.has(f.id)?"✓ খেয়েছি — Undo":"✓ আমি এটা খেয়েছি")+'</button><button class="tb-btn" data-do="wish">'+(wishlist.has(f.id)?"★ Wishlist থেকে বাদ":"☆ খেতে চাই")+'</button></div>'+credit+'</div>';
 detail.querySelector('[data-do="tried"]').onclick=()=>{toggleFood(f.id);openFood(d,f)};
 detail.querySelector('[data-do="wish"]').onclick=()=>{toggleWish(f.id);openFood(d,f)};
 modal.classList.add("open")
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

function renderReport(){
 const s=stats();$("#tbRdistrict").textContent=s.tasted.length;$("#tbRfood").textContent=selected.size;$("#tbRpct").textContent=s.pct+"%";$("#tbBadge").textContent=badge();$("#tbReportName").textContent=state.name?state.name+"-এর স্বাদযাত্রা":"আমার ব্যক্তিগত স্বাদযাত্রা";
 const names=[];DISTRICTS.forEach(d=>d.foods.forEach(x=>{if(selected.has(x.id))names.push(x.name)}));$("#tbRfoods").innerHTML=names.slice(-7).reverse().map(x=>"<div>✓ "+x+"</div>").join("")||"<div>এখনও কোনো খাবার মার্ক করা হয়নি</div>";
 const target=$("#tbReportMap");target.innerHTML="";const src=$("#tbMap");if(src&&src.children.length&&src.style.display!=="none"){const c=src.cloneNode(true);c.removeAttribute("id");c.querySelectorAll("path").forEach(p=>{p.removeAttribute("tabindex");p.removeAttribute("role");p.classList.remove("selected")});target.appendChild(c)}else target.innerHTML='<div style="text-align:center;font-size:90px">🇧🇩</div>'
}
function openReport(){renderReport();$("#tbReportModal").classList.add("open")}function closeReport(){$("#tbReportModal").classList.remove("open")}
async function cardCanvas(){renderReport();if(typeof html2canvas==="undefined")throw new Error("export");return await html2canvas($("#tbReportCard"),{scale:1.35,backgroundColor:null,useCORS:true,logging:false})}
async function download(){try{const c=await cardCanvas(),a=document.createElement("a");a.download="bangladesh-food-passport-1080x1350.png";a.href=c.toDataURL("image/png");a.click();toast("PNG তৈরি হয়েছে")}catch(e){toast("PNG তৈরি করা যায়নি")}}
async function share(){try{const c=await cardCanvas();const blob=await new Promise(r=>c.toBlob(r,"image/png"));const file=new File([blob],"bangladesh-food-passport.png",{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:"আমার Bangladesh Food Passport",text:"বাংলাদেশের কতটুকু আমি খেয়ে দেখেছি",files:[file]})}else download()}catch(e){if(e.name!=="AbortError")toast("শেয়ার সম্ভব হয়নি—PNG ডাউনলোড করুন")}}
function backup(){const blob=new Blob([JSON.stringify({version:"1.2.1",exportedAt:new Date().toISOString(),selected:[...selected],wishlist:[...wishlist],name:state.name},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="taste-bangladesh-v1.2-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importData(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x.selected))throw 0;const valid=new Set(DISTRICTS.flatMap(d=>d.foods.map(f=>f.id)));selected=new Set(x.selected.filter(id=>valid.has(id)));wishlist=new Set((x.wishlist||[]).filter(id=>valid.has(id)&&!selected.has(id)));state.name=String(x.name||"").slice(0,40);save();renderStats();renderFeatured();toast("ব্যাকআপ ইমপোর্ট হয়েছে")}catch(e){toast("সঠিক backup JSON নয়")}};r.readAsText(file)}

function wire(){
 $("#tbSearch").addEventListener("input",renderSearch);document.addEventListener("click",e=>{if(!e.target.closest(".tb-map-top"))$("#tbSearchResults").classList.remove("open")});
 $("#tbRandom").onclick=()=>selectDistrict(order[Math.floor(Math.random()*order.length)]);$("#tbRetryMap").onclick=()=>loadMap();$("#tbPrev").onclick=()=>go(-1);$("#tbNext").onclick=()=>go(1);
 $("#tbOpenReport").onclick=openReport;$("#tbFab").onclick=openReport;$("#tbCloseReport").onclick=closeReport;$("#tbReportModal").addEventListener("click",e=>{if(e.target.id==="tbReportModal")closeReport()});
 $("#tbCloseFood").onclick=closeFood;$("#tbFoodModal").addEventListener("click",e=>{if(e.target.id==="tbFoodModal")closeFood()});
 $("#tbJourney").onclick=openJourney;$("#tbCloseJourney").onclick=()=>$("#tbJourneyModal").classList.remove("open");$("#tbJourneyModal").addEventListener("click",e=>{if(e.target.id==="tbJourneyModal")e.currentTarget.classList.remove("open")});
 $("#tbNextWish").onclick=suggestNext;
 $("#tbName").value=state.name||"";$("#tbName").addEventListener("input",e=>{state.name=e.target.value;save();$("#tbReportName").textContent=state.name?state.name+"-এর স্বাদযাত্রা":"আমার ব্যক্তিগত স্বাদযাত্রা"});
 $("#tbDownload").onclick=download;$("#tbShare").onclick=share;$("#tbBackup").onclick=backup;$("#tbImportBtn").onclick=()=>$("#tbImport").click();$("#tbImport").onchange=e=>{if(e.target.files[0])importData(e.target.files[0])};
 $("#tbReset").onclick=()=>{if(confirm("আপনার খাওয়া ও Wishlist—দুই তালিকাই মুছে ফেলবেন?")){selected.clear();wishlist.clear();state.current=null;history.replaceState(null,"",location.pathname);save();$("#tbEmpty").hidden=false;$("#tbDistrictView").hidden=true;renderStats();renderFeatured();toast("Food Passport রিসেট হয়েছে")}};
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){$$(".tb-modal.open").forEach(m=>m.classList.remove("open"))}})
}
async function boot(){
 try{
  const [fd,cd]=await Promise.all([fetch("./data/foods.json").then(r=>r.json()),fetch("./data/categories.json").then(r=>r.json())]);
  DISTRICTS=fd.districts;CATS=cd;bySlug=Object.fromEntries(DISTRICTS.map(d=>[d.slug,d]));order=DISTRICTS.map(d=>d.slug);loadState();renderCats();renderFallback();renderStats();renderFeatured();wire();await loadMap();
  const hash=new URLSearchParams(location.hash.replace(/^#/,""));const h=hash.get("district");if(h&&bySlug[h])selectDistrict(h,{scroll:false});else if(state.current&&bySlug[state.current])selectDistrict(state.current,{scroll:false});
  if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{})
 }catch(e){$("#tbLoading").textContent="Data load হয়নি। GitHub Pages/HTTP server দিয়ে চালু করুন; file:// দিয়ে নয়।";console.error(e)}
}
document.addEventListener("DOMContentLoaded",boot);
})();
