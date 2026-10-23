import { readFile, writeFile, mkdir } from 'node:fs/promises';
const dist=new URL('../dist/',import.meta.url);
const escape = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const meta=(html,key,value,property=false)=> {
  const att=property?'property':'name';
  const tag=`<meta ${att}="${escape(key)}" content="${escape(value)}" />`;
  const re=new RegExp('<meta\\s+[^>]*\\b'+att+'="'+key+'"[^>]*>','i');
  return re.test(html)?html.replace(re,tag):html.replace('</head>',tag+'\n</head>');
};
const humanize=s=>String(s).replace(/-/g,' ').replace(/\b\w/g,x=>x.toUpperCase());
function defaults(data){
  if(data.kind==='city')return {
    title:`Best Coaching Institutes in ${data.city} - Courses, Fees & Reviews`,
    description:`Explore coaching institutes in ${data.city}. Compare available courses, fees, locations and student reviews on Coaching Buddy.`,
  };
  if(data.kind==='category')return{
    title:`Best ${data.category} Coaching Institutes in ${data.city || 'India'}`,
    description:`Explore ${data.category} coaching institutes${data.city ? ' in '+data.city : ' across India'}. Compare available courses, fees, locations and student reviews.`,
  };
  if(data.kind==='institute')return{
    title:`${data.name} Coaching in ${data.city||'India'} - Courses, Fees & Reviews`,
    description:`${data.name}${data.area?' in '+data.area:''}${data.city?', '+data.city:''}. Compare available courses, fees, admissions and student reviews on Coaching Buddy.`,
  };
  return null;
}
function render(base,path,data,override){
  const d=defaults(data);if(!d)return base;
  const title=(override?.title||d.title)+' | Coaching Buddy';
  const description=override?.description||d.description;
  const url=override?.canonical||('https://coachingbuddy.co.in'+path);
  if(!url.startsWith('https://coachingbuddy.co.in/'))throw new Error('Invalid canonical for '+path);
  let html=base.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+escape(title)+'</title>');
  html=meta(html,'description',description);html=meta(html,'og:title',title,true);html=meta(html,'og:description',description,true);
  html=meta(html,'og:url',url,true);html=meta(html,'twitter:title',title);html=meta(html,'twitter:description',description);
  html=meta(html,'robots',override?.index===false?'noindex, follow':'index, follow, max-image-preview:large');
  html=html.replace(/<link\s+[^>]*rel="canonical"[^>]*>/i,`<link rel="canonical" href="${escape(url)}" />`);
  if(Array.isArray(override?.faqs)&&override.faqs.length){const faqs=override.faqs.filter(f=>f.question&&f.answer).slice(0,12);
    if(faqs.length){const schema=JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))}).replace(/</g,'\\u003c');
      html=html.replace('</head>',`<script id="cb-seo-faqs" type="application/ld+json">${schema}</script>\n</head>`);}}
  return html;
}
async function main(){
  const base=await readFile(new URL('index.html',dist),'utf8');
  let records={};try{records=JSON.parse(await readFile(new URL('./.cache/seo-pages.json',import.meta.url),'utf8'));}catch{}
  const published=JSON.parse(await readFile(new URL('../public/seo-overrides.json',import.meta.url),'utf8'));
  const entries=published.entries||{};
  const slug = s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const keyFor=(path,rec)=>rec.kind==='city'?'city:'+slug(rec.city):rec.kind==='category'?'category:'+(slug(rec.city)||'india')+':'+slug(rec.category):'institute:'+path.split('--').slice(-1)[0];
  let count=0;
  for(const [p,rec] of Object.entries(records)){
    const parts=p.split('/').filter(Boolean);
    if(!parts.length||!parts.every(s=>/^[\w.%-]+$/.test(s))||parts.some(s=>s==='.'||s==='..')) continue;
    const key=keyFor(p,rec);
    const html=render(base,p,rec,entries[key]);
    const folder=new URL('./'+parts.join('/')+'/',dist);
    await mkdir(folder,{recursive:true});await writeFile(new URL('index.html',folder),html);count++;
  }
  console.log(`[seo] Created initial HTML metadata for ${count} public URLs; SPA auth routes untouched.`);
}
main().catch(e=>{console.error('[seo]',e);process.exitCode=1});
