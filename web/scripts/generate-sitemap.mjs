import { writeFile, mkdir, readFile } from 'node:fs/promises';
const SITE_URL = 'https://coachingbuddy.co.in';
const API_URL = (process.env.COACHING_BUDDY_API_URL || `${SITE_URL}/api`).replace(/\/$/, '');
const REQUIRE_API = process.env.COACHING_BUDDY_SITEMAP_REQUIRE_API === '1';
const slug = (s='') => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const str = v => String(v ?? '').replace(/\s+/g,' ').trim();
const sitemapFile = new URL('../public/sitemap.xml', import.meta.url);
const cacheDir = new URL('./.cache/', import.meta.url);
const urls = new Map();
const add = (pathname, data = {}) => { if (/^\/[A-Za-z0-9/_%.~-]*$/.test(pathname) && !pathname.includes('..')) urls.set(pathname, data); };
async function getJson(route) {
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(),12000);
  try {
    const r=await fetch(API_URL+route,{headers:{Accept:'application/json'},signal:controller.signal});
    if(!r.ok) throw new Error(`HTTP ${r.status}: ${route}`);
    return await r.json();
  } finally { clearTimeout(timeout); }
}
function fromResponse(data, label) {
  if (!Array.isArray(data?.data)) throw new Error(`Invalid ${label} API response - expected data[]`);
  return data.data;
}
function xmlDocument(paths) {return ['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...paths.map(p=>`  <url><loc>${esc(SITE_URL+p)}</loc></url>`),'</urlset>',''].join('\n');}
async function main() {
  for (const p of ['/', '/explore', '/about', '/contact-support', '/privacy-policy', '/terms']) add(p);
  let categories=[],stores=[];
  try {
    const [cats,all] = await Promise.all([getJson('/category/parents'),getJson('/store?status=1')]);
    categories=fromResponse(cats,'categories');stores=fromResponse(all,'stores');
  } catch (error) {
    if(REQUIRE_API) throw new Error(`Refusing to deploy stale sitemap: ${error.message}`);
    console.warn('[sitemap] API unavailable; keeping previously committed sitemap if present:',error.message);
    let exists=false;
    try { const text=await readFile(sitemapFile,'utf8');exists=text.includes('<urlset')||text.includes('<sitemapindex'); } catch {}
    if(!exists) throw new Error('No existing sitemap and public API is unavailable.');
    await mkdir(cacheDir,{recursive:true});
    await writeFile(new URL('seo-pages.json',cacheDir),JSON.stringify({},null,2));
    return;
  }
  const records = {};
  const cities = new Map();
  const liveStores = stores.filter(s => str(s.uid||s.id) && str(s.name));
  for(const store of liveStores) {
    const city=str(store.address?.city); const citySlug=slug(city)||'india';
    const name=str(store.name); const id=str(store.uid||store.id);
    // Public URL path segments must be safe; never generate disk paths from unsafe IDs.
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) { console.warn('[sitemap] Skipping unsafe institute ID in static HTML/sitemap.'); continue; }
    const path=`/institute/${citySlug}/${slug(name)||'coaching-institute'}--${id}`;
    add(path);
    records[path] = {kind:'institute',name,city,area:str(store.address?.area)};
    if(citySlug!=='india') cities.set(citySlug,city);
  }
  for (const [citySlug,city] of cities) {
    const path=`/coaching-institutes/${citySlug}`;
    add(path);records[path]={kind:'city',city};
  }
  for(const category of categories) {
    const categoryId=str(category.uid||category.id), categoryName=str(category.name);
    if(!categoryName)continue;
    const matching=liveStores.filter(s=>(Array.isArray(s.categories)?s.categories:[]).some(c =>
      (categoryId&&str(c.uid||c.id)===categoryId) || slug(str(c.name))===slug(categoryName)));
    if(!matching.length)continue;
    const allIndia=`/coaching-institutes/india/${slug(categoryName)}`;
    add(allIndia);records[allIndia]={kind:'category',category:categoryName,city:''};
    const categoryCities=new Set(matching.map(s=>str(s.address?.city)).filter(Boolean));
    for(const city of categoryCities){const path=`/coaching-institutes/${slug(city)}/${slug(categoryName)}`;
      add(path);records[path]={kind:'category',category:categoryName,city};}
  }
  const paths=[...urls.keys()];
  const chunkSize=20000;
  if(paths.length<=chunkSize){await writeFile(sitemapFile,xmlDocument(paths));}
  else {
    const chunks=[];
    for(let i=0;i<paths.length;i+=chunkSize){const n=chunks.length+1;const name=`sitemap-${n}.xml`;
      chunks.push(name);await writeFile(new URL('../public/'+name,import.meta.url),xmlDocument(paths.slice(i,i+chunkSize)));}
    await writeFile(sitemapFile,['<?xml version="1.0" encoding="UTF-8"?>','<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...chunks.map(n=>`<sitemap><loc>${esc(SITE_URL+'/'+n)}</loc></sitemap>`),'</sitemapindex>',''].join('\n'));
  }
  await mkdir(cacheDir,{recursive:true});
  await writeFile(new URL('seo-pages.json',cacheDir),JSON.stringify(records,null,2));
  console.log(`[sitemap] ${paths.length} public URLs (${liveStores.length} institutes; ${cities.size} cities).`);
}
main().catch(error=>{ console.error('[sitemap]',error);process.exitCode=1; });
