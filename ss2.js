'use strict';
const $=s=>document.querySelector(s),KEY='clipdesk_v3',uid=()=>Math.random().toString(36).slice(2,9),today=()=>new Date().toISOString().slice(0,10);
const PAGES=[['overview','Overview'],['clips','All Clips'],['unpaid','Unpaid Clips'],['paid','Paid Clips'],['club','10K+ Club'],['payments','Payments & Earnings'],['analytics','Analytics'],['settings','Settings']];
const PLAT=['TikTok','YouTube Shorts','Instagram Reels','X','Other'],METHODS=['BaridiMob','CCP','Bank transfer','Crypto','Other'],OPEN=['Unpaid','Pending','Disputed'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r2=n=>Math.round(n*100)/100;
function seed(){
 const d=n=>{const x=new Date();x.setDate(x.getDate()-n);return x.toISOString().slice(0,10)};
 const mk=(i,t,p,n,v,bs)=>({id:'d'+i,title:t,url:'https://example.com/clip'+i,platform:p,date:d(n),views:v,likes:Math.round(v/12),comments:Math.round(v/90),base:400,bonus:null,baseStatus:bs||'Unpaid',bonusStatus:'Unpaid',notes:'',demo:true,crossedAt:v>10000?d(Math.max(0,n-2)):''});
 const clips=[mk(1,'Funny fail compilation','TikTok',40,48200),mk(2,'Crowd goes wild','YouTube Shorts',33,12750),mk(3,'Best moment (exactly 20,000)','TikTok',21,20000),mk(4,'Unexpected plot twist (exactly 10,000)','Instagram Reels',14,10000),mk(5,'Reaction you cannot miss','TikTok',9,10001),mk(6,'Quick tip clip','X',5,2300),mk(7,'Behind the scenes','Instagram Reels',3,15400),mk(8,'Fresh upload','TikTok',1,560,'Pending')];
 clips[6].bonusStatus='Pending';
 const al=(id,k,a)=>({clipId:id,title:clips.find(c=>c.id==id).title,kind:k,amt:a});
 return{settings:{user:'Clipper',manager:'Manager',currency:'DA',payInfo:'',defaultBase:400,threshold:10000,defaultBonus:1000,threshold2:20000,bonus2:2000},clips,payments:[{id:'dp1',amount:2200,date:d(12),method:'BaridiMob',ref:'Demo payment',notes:'',demo:true,alloc:[al('d1','base',400),al('d1','bonus',1000),al('d2','base',400),al('d3','base',400)]}]};
}
function load(){const ok=d=>d&&Array.isArray(d.clips)&&Array.isArray(d.payments)&&d.settings;
 for(const k of [KEY,'clipdesk_v2']){try{const d=JSON.parse(localStorage.getItem(k));if(ok(d)){if(k!=KEY){if(!d.clips.some(c=>!c.demo))continue;const old=d.settings.defaultBonus;d.clips.forEach(c=>{if(c.bonus===old)c.bonus=null});Object.assign(d.settings,{defaultBonus:1000,threshold2:20000,bonus2:2000})}return d}}catch(e){}}
 return seed()}
let S=load(),page='overview';
const F={platform:'',status:'',sort:'new',from:'',to:'',min:'',mode:'table'};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('Could not save in this browser',1)}};
function fmt(n){return (Math.round((n||0)*100)/100).toLocaleString('en-US',{maximumFractionDigits:2})+' '+(S.settings.currency||'DA')}
function toast(m,bad){const t=$('#toast');t.textContent=m;t.className='show'+(bad?' bad':'');clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',2800)}
/* business rules */
const th=()=>+S.settings.threshold||10000,th2=()=>+S.settings.threshold2||20000;
const tierAmt=v=>v>th2()?(S.settings.bonus2!=null?+S.settings.bonus2:2000):v>th()?(+S.settings.defaultBonus||0):0;
const tag=c=>compact(c.views>th2()?th2():th())+'+';
const qual=c=>c.views>th();
const owed=(c,k)=>k=='base'?c.base:(qual(c)?(c.bonus==null||c.bonus===''?tierAmt(c.views):+c.bonus):0);
const paid=(c,k)=>r2(S.payments.reduce((a,p)=>a+p.alloc.filter(x=>x.clipId==c.id&&x.kind==k).reduce((b,x)=>b+x.amt,0),0));
const left=(c,k)=>r2(Math.max(0,owed(c,k)-paid(c,k)));
function status(c,k){const o=owed(c,k),p=paid(c,k);if(!o)return k=='bonus'?'None':'Unpaid';if(p>=o)return 'Paid';if(p>0)return 'Partial';return c[k+'Status']||'Unpaid'}
const owedAll=c=>owed(c,'base')+owed(c,'bonus'),leftAll=c=>r2(left(c,'base')+left(c,'bonus'));
const isPaid=c=>owedAll(c)>0&&leftAll(c)==0;
function applyViews(c,v){const was=qual(c);c.views=v;if(qual(c)&&!was){c.crossedAt=today();return true}if(!qual(c))c.crossedAt='';return false}
function T(){const t={n:S.clips.length,views:0,paidC:0,unpaidC:0,club:0,base:0,bonus:0,out:0,disp:0};
 S.clips.forEach(c=>{t.views+=c.views;t.base+=c.base;t.bonus+=owed(c,'bonus');if(qual(c))t.club++;isPaid(c)?t.paidC++:t.unpaidC++;
  ['base','bonus'].forEach(k=>{status(c,k)=='Disputed'?t.disp+=left(c,k):t.out+=left(c,k)})});
 t.recv=r2(S.payments.reduce((a,p)=>a+p.amount,0));t.total=t.base+t.bonus;return t}
/* ui helpers */
const chip=s=>s=='None'?'<span class="mu">—</span>':`<span class="chip ${s.toLowerCase()}">${s}</span>`;
const stat=(l,v,hot)=>`<div class="stat${hot?' hot':''}"><span>${l}</span><b>${v}</b></div>`;
const fld=(l,n,t,v,x='',cls='')=>`<label class="${cls}">${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x}></label>`;
const sel=(l,n,opts,v,cls='')=>`<label class="${cls}">${l}<select name="${n}">${opts.map(o=>`<option ${o==v?'selected':''}>${o}</option>`).join('')}</select></label>`;
const dlg=h=>{const d=$('#dlg');d.innerHTML=h;d.showModal()};
const empty=m=>`<div class="empty"><b>${m}</b><p>Add a clip link to start tracking views and payments.</p><button class="btn pri" data-act="add">+ Add clip</button></div>`;
function stCell(c,k){const s=status(c,k);if(s=='None')return chip(s);if(s=='Paid'||s=='Partial')return chip(s)+(s=='Partial'?` <small>${fmt(left(c,k))} left</small>`:'');
 return `<select class="mini" aria-label="${k} status" data-chg="${k}st" data-id="${c.id}">${OPEN.map(o=>`<option ${o==s?'selected':''}>${o}</option>`).join('')}</select>`}
const acts=c=>`<a class="btn sm" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Open</a> <button class="btn sm" data-act="edit" data-id="${c.id}">Edit</button>${leftAll(c)>0?` <button class="btn sm" data-act="pay" data-id="${c.id}">Mark paid</button>`:''} <button class="btn sm dng" data-act="del" data-id="${c.id}">Delete</button>`;
const viewIn=c=>`<input class="mini" type="number" min="0" step="1" value="${c.views}" aria-label="Views for ${esc(c.title)}" data-chg="views" data-id="${c.id}">`;
/* clip list */
function list(pg){const q=($('#q').value||'').toLowerCase();
 const a=S.clips.filter(c=>{if(q&&!(c.title+' '+c.url).toLowerCase().includes(q))return false;
  if(F.platform&&c.platform!==F.platform)return false;if(F.from&&c.date<F.from)return false;if(F.to&&c.date>F.to)return false;if(F.min&&c.views<+F.min)return false;
  if(pg=='unpaid'&&leftAll(c)==0)return false;if(pg=='paid'&&!isPaid(c))return false;
  if(F.status&&![status(c,'base'),status(c,'bonus')].includes(F.status))return false;return true});
 const s={new:(x,y)=>y.date.localeCompare(x.date),old:(x,y)=>x.date.localeCompare(y.date),hi:(x,y)=>y.views-x.views,lo:(x,y)=>x.views-y.views,earn:(x,y)=>owedAll(y)-owedAll(x),unpaid:(x,y)=>leftAll(y)-leftAll(x)}[F.sort];return a.sort(s)}
function filterBar(){const o=(n,opts,v)=>`<select data-flt="${n}" aria-label="${n}">${opts.map(([k,l])=>`<option value="${k}" ${k==v?'selected':''}>${l}</option>`).join('')}</select>`;
 return `<div class="tools">${o('platform',[['','All platforms'],...PLAT.map(p=>[p,p])],F.platform)}${o('status',[['','Any status'],['Paid','Paid'],['Partial','Partial'],['Unpaid','Unpaid'],['Pending','Pending'],['Disputed','Disputed']],F.status)}${o('sort',[['new','Newest'],['old','Oldest'],['hi','Highest views'],['lo','Lowest views'],['earn','Highest earnings'],['unpaid','Unpaid first']],F.sort)}
 <input type="date" data-flt="from" value="${F.from}" aria-label="From date"><input type="date" data-flt="to" value="${F.to}" aria-label="To date"><input type="number" min="0" data-flt="min" value="${F.min}" placeholder="Min views" class="mini" aria-label="Minimum views">
 <span class="gap"></span><button class="btn sm" data-act="mode" data-v="table" aria-pressed="${F.mode=='table'}">Table</button><button class="btn sm" data-act="mode" data-v="cards" aria-pressed="${F.mode=='cards'}">Cards</button></div>`}
function clipsPage(pg){const a=list(pg);let h=filterBar();if(!a.length)return h+empty(S.clips.length?'No clips match these filters':'No clips yet');
 if(F.mode=='cards')return h+`<div class="cards">${a.map(c=>`<article class="card"><b>${esc(c.title)}</b>${qual(c)?' <span class="chip new">'+tag(c)+'</span>':''}<a class="url" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${esc(c.url)}</a><div class="kv"><span>${esc(c.platform)} · ${c.date}</span>${viewIn(c)}</div><div class="kv"><span>Base ${fmt(c.base)}</span>${stCell(c,'base')}</div><div class="kv"><span>Bonus ${fmt(owed(c,'bonus'))}</span>${stCell(c,'bonus')}</div><div class="act">${acts(c)}</div></article>`).join('')}</div>`;
 return h+`<div class="tw"><table><thead><tr><th>Clip</th><th>Platform</th><th>Posted</th><th>Views</th><th>Base</th><th>Base status</th><th>Bonus</th><th>Bonus status</th><th></th></tr></thead><tbody>${a.map(c=>`<tr><td><span class="t">${esc(c.title)}</span>${qual(c)?' <span class="chip new">'+tag(c)+'</span>':''}<br><a class="url" style="max-width:240px" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${esc(c.url)}</a></td><td>${esc(c.platform)}</td><td>${c.date}</td><td>${viewIn(c)}</td><td>${fmt(c.base)}</td><td>${stCell(c,'base')}</td><td>${fmt(owed(c,'bonus'))}</td><td>${stCell(c,'bonus')}</td><td>${acts(c)}</td></tr>`).join('')}</tbody></table></div>`}
/* charts */
function lineChart(p){if(p.length<2)return '<p class="mu">Add at least two clips to see views over time.</p>';const m=Math.max(...p.map(x=>x[1]))||1,xy=p.map((x,i)=>[20+i*560/(p.length-1),160-x[1]/m*140]);
 return `<svg class="chart" viewBox="0 0 600 190" role="img" aria-label="Views over time"><polyline points="${xy.map(a=>a.join(',')).join(' ')}" fill="none" stroke="#25f4ee" stroke-width="3"/>${xy.map((a,i)=>`<circle cx="${a[0]}" cy="${a[1]}" r="4" fill="#fe2c55"><title>${p[i][0]}: ${p[i][1].toLocaleString()} views</title></circle>`).join('')}<text class="ax" x="20" y="14">${m.toLocaleString()} views</text><text class="ax" x="20" y="184">${p[0][0]}</text><text class="ax" x="580" y="184" text-anchor="end">${p[p.length-1][0]}</text></svg>`}
function bars(items,f){if(!items.length)return '<p class="mu">No data yet.</p>';const m=Math.max(...items.map(x=>x[1]))||1;return `<div class="bars">${items.map(([l,v])=>`<div class="bar"><em>${f(v)}</em><i style="height:${v/m*70}%"></i><span>${l}</span></div>`).join('')}</div>`}
function months(){const m={};const g=k=>m[k]=m[k]||{k,clips:0,views:0,earned:0,recv:0};
 S.clips.forEach(c=>{const x=g(c.date.slice(0,7));x.clips++;x.views+=c.views;x.earned+=owedAll(c)});S.payments.forEach(p=>g(p.date.slice(0,7)).recv+=p.amount);return Object.values(m).sort((a,b)=>a.k.localeCompare(b.k))}
const compact=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n;
/* pages */
const VIEWS={
overview(){const t=T(),d=S.clips.some(c=>c.demo)||S.payments.some(p=>p.demo);
 const ev=[...S.clips.map(c=>[c.date,`Added “${esc(c.title)}”`]),...S.clips.filter(c=>c.crossedAt).map(c=>[c.crossedAt,`🔥 “${esc(c.title)}” passed ${th().toLocaleString()} views`]),...S.payments.map(p=>[p.date,`Payment received: ${fmt(p.amount)}`])].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,7);
 const pts=[...S.clips].sort((a,b)=>a.date.localeCompare(b.date)).map(c=>[c.date,c.views]);
 return (d?`<div class="note"><span>You are viewing demo data. Clear it before adding your real clips.</span><button class="btn sm dng" data-act="cleardemo">Clear demo data</button></div>`:'')+
 `<div class="stats">${stat('Clips posted',t.n)}${stat('Total views',t.views.toLocaleString())}${stat('Paid clips',t.paidC)}${stat('Unpaid clips',t.unpaidC)}${stat('10K+ bonus clips',t.club,1)}${stat('Base earnings',fmt(t.base))}${stat('Bonus earnings',fmt(t.bonus))}${stat('Total earnings',fmt(t.total))}${stat('Received',fmt(t.recv))}${stat('Outstanding',fmt(t.out))}</div>
 <div class="two"><div class="card"><h3>Views by posting date</h3>${lineChart(pts)}</div><div class="card"><h3>Earnings by month</h3>${bars(months().map(m=>[m.k,m.earned]),fmt)}</div></div>
 <div class="card"><h3>Recent activity</h3>${ev.length?`<ul class="log">${ev.map(e=>`<li><span>${e[1]}</span><span class="mu">${e[0]}</span></li>`).join('')}</ul>`:'<p class="mu">Nothing yet.</p>'}</div>`},
clips:()=>clipsPage('clips'),unpaid:()=>clipsPage('unpaid'),paid:()=>clipsPage('paid'),
club(){const a=S.clips.filter(c=>qual(c)&&(!$('#q').value||(c.title+c.url).toLowerCase().includes($('#q').value.toLowerCase()))).sort((x,y)=>y.views-x.views);
 const all=S.clips.filter(qual),tb=all.reduce((s,c)=>s+owed(c,'bonus'),0),pb=all.reduce((s,c)=>s+paid(c,'bonus'),0);
 const L={Paid:'Bonus paid',Partial:'Partly paid',Pending:'Bonus pending',Disputed:'Disputed',Unpaid:'Bonus earned'};
 return `<div class="stats">${stat('Clips over '+th().toLocaleString(),all.length,1)}${stat('Clips over '+th2().toLocaleString(),S.clips.filter(c=>c.views>th2()).length)}${stat('Total bonus',fmt(tb))}${stat('Bonus paid',fmt(pb))}${stat('Bonus still owed',fmt(tb-pb))}</div>`+(a.length?`<div class="cards">${a.map(c=>{const s=status(c,'bonus'),nw=c.crossedAt&&(Date.now()-new Date(c.crossedAt))<7*864e5;
 return `<article class="card club"><div class="top"><b>${esc(c.title)}</b>${nw?'<span class="chip new">New</span>':''}</div><a class="url" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${esc(c.url)}</a><div class="kv"><span>${esc(c.platform)}</span><span><b>${c.views.toLocaleString()}</b> views</span></div><div class="kv"><span>Crossed ${th().toLocaleString()}: ${c.crossedAt||'date not recorded'}</span></div><div class="kv"><span>Base ${fmt(c.base)}</span>${chip(s=='Unpaid'||s=='Pending'||s=='Disputed'?s:s)}</div><div class="kv"><label>Extra payment${c.bonus==null?' (auto)':' (custom)'}<input class="mini" type="number" min="0" step="any" value="${owed(c,'bonus')}" data-chg="bonus" data-id="${c.id}"></label>${c.bonus!=null?'<button class="btn sm" data-act="autob" data-id="'+c.id+'">Auto</button>':''}<span class="chip ${s.toLowerCase()}">${L[s]}</span></div><div class="act">${acts(c)}</div></article>`}).join('')}</div>`:`<div class="empty"><b>No clips over ${th().toLocaleString()} views yet</b><p>A clip joins the club automatically once its views go above the threshold. Exactly ${th().toLocaleString()} does not count.</p></div>`)},
payments(){const t=T();return `<div class="stats">${stat('Base earnings',fmt(t.base))}${stat('Bonus earnings',fmt(t.bonus))}${stat('Total earnings',fmt(t.total))}${stat('Received',fmt(t.recv))}${stat('Outstanding',fmt(t.out))}${stat('Disputed',fmt(t.disp))}</div><div class="note" style="border-color:var(--cyan)"><span><b>Paid via:</b> ${S.settings.payInfo?esc(S.settings.payInfo):'No payment details saved yet'}</span><button class="btn sm" data-act="details">Edit details</button></div><div class="tools"><button class="btn pri" data-act="newpay">Record payment</button><button class="btn" data-act="csvp">Export payments CSV</button></div>`+
 (S.payments.length?`<div class="tw"><table><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Covers</th><th></th></tr></thead><tbody>${[...S.payments].sort((a,b)=>b.date.localeCompare(a.date)).map(p=>`<tr><td>${p.date}</td><td><b>${fmt(p.amount)}</b></td><td>${esc(p.method)}</td><td>${esc(p.ref)}${p.notes?`<br><small>${esc(p.notes)}</small>`:''}</td><td>${p.alloc.map(x=>`${esc(x.title)} (${x.kind}) ${fmt(x.amt)}`).join('<br>')}</td><td><button class="btn sm dng" data-act="delpay" data-id="${p.id}">Delete</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty"><b>No payments recorded</b><p>Record each payment you receive. Partial payments are supported.</p></div>`)},
analytics(){const pl=PLAT.map(p=>[p,S.clips.filter(c=>c.platform==p).reduce((s,c)=>s+c.views,0)]).filter(x=>x[1]);const ms=months();
 return `<div class="two"><div class="card"><h3>Views by platform</h3>${bars(pl,compact)}</div><div class="card"><h3>Received by month</h3>${bars(ms.map(m=>[m.k,m.recv]),fmt)}</div></div><h2 class="sec">Monthly summary</h2>`+(ms.length?`<div class="tw"><table><thead><tr><th>Month</th><th>Clips</th><th>Views</th><th>Earned</th><th>Received</th></tr></thead><tbody>${[...ms].reverse().map(m=>`<tr><td>${m.k}</td><td>${m.clips}</td><td>${m.views.toLocaleString()}</td><td>${fmt(m.earned)}</td><td>${fmt(m.recv)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No data yet.</div>')},
settings(){return `<div class="card" style="max-width:640px">${settingsForm()}</div>
 <h2 class="sec">Your data</h2><div class="tools"><button class="btn" data-act="csvc">Export clips CSV</button><button class="btn" data-act="csvp">Export payments CSV</button><button class="btn" data-act="bak">Download JSON backup</button><label class="btn" style="flex-direction:row;color:var(--tx)">Restore backup<input type="file" accept=".json,application/json" id="rest" hidden></label><button class="btn dng" data-act="cleardemo">Clear demo data</button></div>
 <div class="note"><span><b>Shared access with ${esc(S.settings.manager)}:</b> data lives only in this browser (localStorage), so ${esc(S.settings.manager)} cannot see it yet. Real sharing needs a backend such as Supabase.</span></div>`}};
function settingsForm(inDlg){const s=S.settings;return `<form id="sf" novalidate><div class="grid2">${fld('Your name','user','text',s.user)}${fld('Manager name','manager','text',s.manager)}${fld('Payment details (how your manager pays you)','payInfo','text',s.payInfo||'','placeholder="e.g. BaridiMob RIP, CCP number"','full')}${fld('Currency label (shown after amounts)','currency','text',s.currency,'maxlength="6" required')}${fld('First bonus after (views)','threshold','number',s.threshold,'min="1" step="1"')}${fld('Default base payment','defaultBase','number',s.defaultBase,'min="0" step="any"')}${fld('First bonus amount','defaultBonus','number',s.defaultBonus,'min="0" step="any"')}${fld('Second bonus after (views)','threshold2','number',s.threshold2||20000,'min="1" step="1"')}${fld('Second bonus amount','bonus2','number',s.bonus2!=null?s.bonus2:2000,'min="0" step="any"')}</div><p class="mu"><small>Details are saved only in this browser. They are included in your JSON backup.</small></p><div class="fa">${inDlg?'<button type="button" class="btn" data-act="close">Cancel</button>':''}<button class="btn pri">Save details</button></div></form>`}
function openDetails(){dlg('<h2>Edit details</h2>'+settingsForm(true))}
function render(){if(!VIEWS[page])page='overview';$('#title').textContent=PAGES.find(p=>p[0]==page)[1];
 $('#nav').innerHTML=PAGES.map(p=>`<button data-go="${p[0]}" class="${p[0]==page?'on':''}" ${p[0]==page?'aria-current="page"':''}>${p[1]}</button>`).join('');$('#view').innerHTML=VIEWS[page]()}
/* forms */
function openClip(id){const c=S.clips.find(x=>x.id==id)||{platform:'TikTok',date:today(),views:0,likes:0,comments:0,base:S.settings.defaultBase,bonus:null,baseStatus:'Unpaid',bonusStatus:'Unpaid',title:'',url:'',notes:''};
 dlg(`<h2>${id?'Edit clip':'Add clip'}</h2><form id="cf" data-id="${id||''}" novalidate><div class="grid2">${fld('Title or description','title','text',c.title,'required','full')}${fld('Clip link','url','url',c.url,'required placeholder="https://" ','full')}${sel('Platform','platform',PLAT,c.platform)}${fld('Date posted','date','date',c.date,'required')}${fld('Views','views','number',c.views,'min="0" step="1"')}${fld('Likes (optional)','likes','number',c.likes||0,'min="0"')}${fld('Comments (optional)','comments','number',c.comments||0,'min="0"')}${fld('Base payment','base','number',c.base,'min="0" step="0.01"')}${sel('Base status','baseStatus',OPEN,c.baseStatus)}${fld('Custom bonus (empty = automatic by views)','bonus','number',c.bonus==null?'':c.bonus,'min="0" step="any"')}${sel('Bonus status','bonusStatus',OPEN,c.bonusStatus)}<label class="full">Notes<textarea name="notes" rows="2">${esc(c.notes)}</textarea></label></div><p class="mu"><small>Paid status is set automatically when you record a payment.</small></p><div class="fa"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn pri">Save clip</button></div></form>`)}
function saveClip(f){const d=Object.fromEntries(new FormData(f)),id=f.dataset.id,n=k=>+d[k];
 if(!d.title.trim())return toast('Add a title for the clip',1);
 try{if(!/^https?:$/.test(new URL(d.url).protocol))throw 0}catch(e){return toast('Enter a valid link starting with http:// or https://',1)}
 if(!d.date)return toast('Choose the date posted',1);
 if(!(Number.isInteger(n('views'))&&n('views')>=0))return toast('Views must be a whole number, 0 or more',1);
 if(!(n('base')>=0&&n('bonus')>=0&&n('likes')>=0&&n('comments')>=0))return toast('Amounts and counts cannot be negative',1);
 let c=S.clips.find(x=>x.id==id);if(!c){c={id:uid(),views:0,crossedAt:''};S.clips.push(c)}
 Object.assign(c,{title:d.title.trim(),url:d.url.trim(),platform:d.platform,date:d.date,likes:n('likes'),comments:n('comments'),base:n('base'),bonus:d.bonus===''?null:n('bonus'),baseStatus:d.baseStatus,bonusStatus:d.bonusStatus,notes:d.notes});
 const up=applyViews(c,n('views'));save();$('#dlg').close();render();toast(up?'Saved. This clip joined the 10K+ Club!':'Clip saved')}
function openPay(pre){const it=[];S.clips.forEach(c=>['base','bonus'].forEach(k=>{const l=left(c,k);if(l>0)it.push({c,k,l})}));
 if(!it.length)return toast('Nothing outstanding. Every clip is paid.');
 const sum=it.filter(i=>i.c.id==pre).reduce((a,i)=>a+i.l,0);
 dlg(`<h2>Record payment</h2><form id="pf" novalidate><fieldset><legend>Covers</legend><div class="items">${it.map(i=>`<label class="chk"><input type="checkbox" name="it" value="${i.c.id}:${i.k}" data-amt="${i.l}" ${i.c.id==pre?'checked':''}><span>${esc(i.c.title)} · ${i.k}</span><b>${fmt(i.l)}</b></label>`).join('')}</div></fieldset><div class="grid2">${fld('Amount received','amount','number',sum?sum.toFixed(2):'','min="0.01" step="0.01" required')}${fld('Payment date','date','date',today(),'required')}${sel('Method','method',METHODS,'BaridiMob')}${fld('Reference or note','ref','text','')}</div><p class="mu"><small>If you received less than the selected total, the rest stays outstanding. The amount is applied in the order listed.</small></p><div class="fa"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn pri">Save payment</button></div></form>`)}
function savePay(f){const d=Object.fromEntries(new FormData(f)),ch=[...f.querySelectorAll('[name=it]:checked')],amt=r2(+d.amount);
 if(!ch.length)return toast('Select at least one clip this payment covers',1);
 const max=r2(ch.reduce((a,x)=>a+ +x.dataset.amt,0));
 if(!(amt>0))return toast('Enter the amount you received',1);if(amt>max)return toast(`That is more than the selected balance (${fmt(max)})`,1);if(!d.date)return toast('Choose the payment date',1);
 let rem=amt;const alloc=[];ch.forEach(x=>{const[id,k]=x.value.split(':'),a=r2(Math.min(rem,+x.dataset.amt));if(a>0){alloc.push({clipId:id,title:S.clips.find(c=>c.id==id).title,kind:k,amt:a});rem=r2(rem-a)}});
 S.payments.push({id:uid(),amount:amt,date:d.date,method:d.method,ref:d.ref,notes:'',alloc});save();$('#dlg').close();render();toast('Payment recorded')}
function saveSettings(f){const d=Object.fromEntries(new FormData(f)),cur=d.currency.trim();
 if(!cur||cur.length>6)return toast('Enter a short currency label, like DA',1);
 if(!(+d.threshold>=1)||!(+d.threshold2>+d.threshold)||!(+d.defaultBase>=0)||!(+d.defaultBonus>=0)||!(+d.bonus2>=0))return toast('Check the numbers: the second view target must be higher than the first, and amounts cannot be negative',1);
 S.settings={...S.settings,user:d.user,manager:d.manager,currency:cur,payInfo:d.payInfo,defaultBase:+d.defaultBase,threshold:Math.floor(+d.threshold),defaultBonus:+d.defaultBonus,threshold2:Math.floor(+d.threshold2),bonus2:+d.bonus2};
 S.clips.forEach(c=>{if(!qual(c))c.crossedAt=''});save();if($('#dlg').open)$('#dlg').close();render();toast('Details saved')}
/* export */
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
const csv=r=>r.map(x=>x.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
/* events */
const A={
add:()=>openClip(),autob:id=>{S.clips.find(x=>x.id==id).bonus=null;save();render()},details:()=>openDetails(),close:()=>$('#dlg').close(),edit:id=>openClip(id),pay:id=>openPay(id),newpay:()=>openPay(),
mode:(_,t)=>{F.mode=t.dataset.v;render()},
del(id){const c=S.clips.find(x=>x.id==id),n=S.payments.filter(p=>p.alloc.some(x=>x.clipId==id)).length;
 if(!confirm(`Delete “${c.title}”?`+(n?`\n\nThis clip is part of ${n} payment record(s). The payments stay in your history, but the clip will be gone.`:'')))return;
 S.clips=S.clips.filter(x=>x.id!=id);save();render();toast('Clip deleted')},
delpay(id){if(!confirm('Delete this payment record? The amounts become outstanding again.'))return;S.payments=S.payments.filter(p=>p.id!=id);save();render();toast('Payment deleted')},
cleardemo(){if(!confirm('Remove all demo clips and demo payments? Your own records stay.'))return;S.clips=S.clips.filter(c=>!c.demo);S.payments=S.payments.filter(p=>!p.demo);save();render();toast('Demo data cleared')},
csvc:()=>dl('clips.csv',csv([['Title','URL','Platform','Date','Views','Likes','Comments','Base','Base paid','Bonus owed','Bonus paid','Base status','Bonus status','Notes'],...S.clips.map(c=>[c.title,c.url,c.platform,c.date,c.views,c.likes,c.comments,c.base,paid(c,'base'),owed(c,'bonus'),paid(c,'bonus'),status(c,'base'),status(c,'bonus'),c.notes])]),'text/csv'),
csvp:()=>dl('payments.csv',csv([['Date','Amount','Method','Reference','Covers'],...S.payments.map(p=>[p.date,p.amount,p.method,p.ref,p.alloc.map(x=>`${x.title} (${x.kind}) ${x.amt}`).join('; ')])]),'text/csv'),
bak:()=>dl('clips-backup-'+today()+'.json',JSON.stringify(S,null,1),'application/json')};
document.addEventListener('click',e=>{const t=e.target.closest('[data-act],[data-go]');if(!t)return;
 if(t.dataset.go){location.hash=t.dataset.go;$('#side').classList.remove('open');$('#scrim').classList.remove('open');return}
 A[t.dataset.act]?.(t.dataset.id,t)});
document.addEventListener('change',e=>{const t=e.target;
 if(t.id=='rest'){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d||!Array.isArray(d.clips)||!Array.isArray(d.payments)||!d.settings)throw 0;if(!confirm('Replace all current data with this backup?'))return;S=d;save();render();toast('Backup restored')}catch(x){toast('That file is not a valid backup',1)}};r.readAsText(t.files[0]);t.value='';return}
 if(t.name=='it'){const f=t.form;f.amount.value=r2([...f.querySelectorAll('[name=it]:checked')].reduce((a,x)=>a+ +x.dataset.amt,0)).toFixed(2);return}
 if(t.dataset.flt){F[t.dataset.flt]=t.value;return render()}
 const c=S.clips.find(x=>x.id==t.dataset.id);if(!c||!t.dataset.chg)return;const v=t.value;
 if(t.dataset.chg=='views'){if(v===''||!Number.isInteger(+v)||+v<0){toast('Views must be a whole number, 0 or more',1);return render()}if(applyViews(c,+v))toast('Nice! This clip joined the 10K+ Club')}
 else if(t.dataset.chg=='bonus'){if(v!==''&&!(+v>=0)){toast('Enter an amount of 0 or more',1);return render()}c.bonus=v===''?null:+v}
 else if(t.dataset.chg=='basest')c.baseStatus=v;else if(t.dataset.chg=='bonusst')c.bonusStatus=v;
 save();render()});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target;({cf:saveClip,pf:savePay,sf:saveSettings})[f.id]?.(f)});
$('#q').addEventListener('input',()=>{if(['clips','unpaid','paid','club'].includes(page))render()});
$('#menu').onclick=()=>{$('#side').classList.add('open');$('#scrim').classList.add('open')};
$('#scrim').onclick=()=>{$('#side').classList.remove('open');$('#scrim').classList.remove('open')};
addEventListener('hashchange',()=>{page=location.hash.slice(1)||'overview';render();scrollTo(0,0)});
page=location.hash.slice(1)||'overview';render();