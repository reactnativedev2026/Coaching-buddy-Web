/** Install optional Google integrations in every built HTML page after build.
 * Only public identifiers are used. Never add tokens, API keys, or secrets here.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
// Read only public IDs from environment files; no npm dependency to run this script.
const project = new URL('../', import.meta.url);
const env = {};
for (const name of ['.env', '.env.production', '.env.local', '.env.production.local']) {
  try {
    const content = await readFile(new URL(name, project), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*(VITE_(?:GTM_ID|GA4_MEASUREMENT_ID|GSC_VERIFICATION))\s*=\s*(.*)\s*$/);
      if (match) env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  } catch { /* Optional build-time env file. */ }
}
// Production CI may declare blank variables. Keep the configured public .env.production
// values in that case, while allowing meaningful non-empty environment overrides.
for (const key of ['VITE_GTM_ID', 'VITE_GA4_MEASUREMENT_ID', 'VITE_GSC_VERIFICATION']) {
  if (typeof process.env[key] === 'string' && process.env[key].trim()) {
    env[key] = process.env[key].trim();
  }
}
const gtm = String(env.VITE_GTM_ID || '').trim();
const ga4 = String(env.VITE_GA4_MEASUREMENT_ID || '').trim();
const verification = String(env.VITE_GSC_VERIFICATION || '').trim();
if(gtm && !/^GTM-[A-Z0-9]+$/i.test(gtm))throw new Error('Invalid VITE_GTM_ID');
if(ga4 && !/^G-[A-Z0-9]+$/i.test(ga4))throw new Error('Invalid VITE_GA4_MEASUREMENT_ID');
if(verification && !/^[a-zA-Z0-9_\-]+$/.test(verification))throw new Error('Invalid VITE_GSC_VERIFICATION');
const headGtm = gtm ? `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');</script>` : '';
const bodyGtm = gtm ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtm}" height="0" width="0" style="display:none;visibility:hidden" title=""></iframe></noscript>` : '';
const headGa4 = !gtm && ga4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');</script>` : '';
const headVerify = verification ? `<meta name="google-site-verification" content="${verification}" />` : '';
const dist=new URL('../dist/',import.meta.url);
let count=0;
async function traverse(dir){
  for (const item of await readdir(dir,{withFileTypes:true})) {
    const url=new URL(item.name+(item.isDirectory()?'/':''),dir);
    if(item.isDirectory())await traverse(url);
    else if(item.isFile()&&item.name.endsWith('.html')){
      let html=await readFile(url,'utf8');
      // If site owner already installed GTM in source, do not duplicate it.
      const missingHead = [
        gtm && !html.includes('googletagmanager.com/gtm.js') ? headGtm : '',
        headGa4 && !html.includes('googletagmanager.com/gtag/js') ? headGa4 : '',
        headVerify && !/name=["']google-site-verification["']/i.test(html) ? headVerify : '',
      ].filter(Boolean).join('\n');
      if (missingHead) html=html.replace(/<head>/i,'<head>\n'+missingHead);
      if(bodyGtm && !html.includes('googletagmanager.com/ns.html?id='))
        html=html.replace(/<body([^>]*)>/i, (m,a)=>`<body${a}>\n${bodyGtm}`);
      await writeFile(url,html,'utf8');count++;
    }
  }
}
await traverse(dist);
console.log(`[google] Processed ${count} HTML file(s); GTM=${!!gtm}, GA4-direct=${!gtm&&!!ga4}, GSC-meta=${!!verification}`);
