const enc = new TextEncoder();
const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8', ...headers}});
function cors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGIN || 'https://inssat-travel.github.io';
  if (origin && origin !== allowed) return null;
  return {'Access-Control-Allow-Origin': allowed, 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type,Authorization', 'Access-Control-Max-Age':'86400', 'Vary':'Origin'};
}
function b64(bytes) { let s=''; for (let i=0;i<bytes.length;i+=0x8000) s+=String.fromCharCode(...bytes.subarray(i,i+0x8000)); return btoa(s); }
function unb64(s) { return Uint8Array.from(atob(s), c=>c.charCodeAt(0)); }
async function sign(payload, secret) { const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']); return b64(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(payload)))).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_'); }
async function tokenFor(secret) { const payload=b64(enc.encode(JSON.stringify({exp:Date.now()+8*60*60*1000,scope:'offers'}))).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_'); return payload+'.'+await sign(payload,secret); }
async function validToken(request, env) { const t=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,''); const [p,s]=t.split('.'); if(!p||!s)return false; if(await sign(p,env.SESSION_SECRET)!==s)return false; try{const raw=atob(p.replace(/-/g,'+').replace(/_/g,'/'));const data=JSON.parse(new TextDecoder().decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));return data.scope==='offers'&&data.exp>Date.now()}catch{return false} }
const ghHeaders = env => ({'Authorization':`Bearer ${env.GH_TOKEN}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'});
function ghUrl(env,path){return `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(env.GH_BRANCH||'main')}`}
async function getFile(env,path){const r=await fetch(ghUrl(env,path),{headers:ghHeaders(env)});if(r.status===404)return {content:null,sha:null};if(!r.ok)throw new Error(`GitHub read failed (${r.status})`);const d=await r.json();const content=new TextDecoder().decode(unb64(d.content.replace(/\n/g,'')));return {content,sha:d.sha}}
async function putFile(env,path,content,message,alreadyBase64=false){const old=await getFile(env,path);const body={message,content:alreadyBase64?content:b64(enc.encode(content)),branch:env.GH_BRANCH||'main'};if(old.sha)body.sha=old.sha;const r=await fetch(`https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'PUT',headers:ghHeaders(env),body:JSON.stringify(body)});if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.message||`GitHub write failed (${r.status})`)}return r.json()}
async function loadOffers(env){const f=await getFile(env,'data/offers.json');if(!f.content)return [];try{const a=JSON.parse(f.content);return Array.isArray(a)?a:[]}catch{return []}}
export default { async fetch(request,env) {
 const headers=cors(request,env); if(!headers)return json({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 const url=new URL(request.url);
 try {
  if(request.method==='GET'&&url.pathname==='/offers')return json({offers:await loadOffers(env)},200,headers);
  if(request.method==='POST'&&url.pathname==='/login') {const body=await request.json();if(!env.ADMIN_PASSWORD||body.password!==env.ADMIN_PASSWORD)return json({error:'Unauthorized'},401,headers);return json({token:await tokenFor(env.SESSION_SECRET)},200,headers)}
  if(request.method==='POST'&&url.pathname==='/offers') {
   if(!await validToken(request,env))return json({error:'Unauthorized'},401,headers);
   const body=await request.json();let offers=await loadOffers(env);
   if(body.action==='delete'){offers=offers.filter(o=>o.id!==String(body.id));}
   else if(body.action==='save'&&body.offer){const o=body.offer;if(!o.id||!o.title)return json({error:'Missing offer title or id'},400,headers);let image=o.image||'';
    if(o.imageData){const m=String(o.imageData).match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);if(!m)return json({error:'Unsupported image format'},400,headers);const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'}[m[1]];const path=`assets/offers/${String(o.id).replace(/[^a-zA-Z0-9_-]/g,'')}.${ext}`;const bytes=unb64(m[2]);if(bytes.length>2*1024*1024)return json({error:'Image exceeds 2 MB'},400,headers);await putFile(env,path,m[2],'Add or update INSSAT offer image',true);image=`https://${env.GH_OWNER}.github.io/${env.GH_REPO}/${path}`;}
    const clean={id:String(o.id),title:String(o.title).slice(0,160),price:String(o.price||'').slice(0,80),date:String(o.date||'').slice(0,120),category:String(o.category||'').slice(0,80),details:String(o.details||'').slice(0,3000),image:image||((offers.find(x=>x.id===o.id)||{}).image||'')};
    offers=offers.filter(x=>x.id!==clean.id);offers.unshift(clean);
   } else return json({error:'Invalid action'},400,headers);
   await putFile(env,'data/offers.json',JSON.stringify(offers,null,2)+'\n','Update INSSAT travel offers');return json({ok:true,offers},200,headers);
  }
  return json({error:'Not found'},404,headers);
 } catch(e){return json({error:e.message||'Server error'},500,headers)}
 }};
