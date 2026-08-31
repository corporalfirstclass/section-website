import snapshots from "../production-snapshots.json";
import { getCmsPage } from "../../db/cms";

type SnapshotKey = keyof typeof snapshots;

const responsiveOverrides = `
<style id="section-responsive-overrides">
html,body{width:100%;max-width:100%;overflow-x:clip}
img,video,svg{max-width:100%}
@media (max-width:767px){
  header{max-width:100vw}
  header>div,header nav{min-width:0}
  header [class*="right-"],header [class*="justify-between"]{max-width:100%}
  header button,header a{flex-shrink:0}
  .text-p3{overflow-wrap:anywhere}
  h1,h2,h3,p{max-width:100%}
  [class*="w-1/2"]{min-width:0}
}
@media (min-width:768px) and (max-width:1024px){
  html,body{overflow-x:hidden}
}
</style>`;

const canvasFallback = `
<style id="section-canvas-fallback">
html.dark body.home.section-canvas-fallback .wp-block-section-masthead{
  isolation:isolate;
  background:
    radial-gradient(ellipse 48% 72% at 82% 16%,rgba(230,242,213,.98) 0%,rgba(165,196,184,.72) 24%,rgba(81,113,156,.28) 52%,transparent 72%),
    radial-gradient(ellipse 52% 68% at 18% 84%,rgba(104,129,177,.72) 0%,transparent 68%),
    linear-gradient(135deg,#243666 0%,#334b7c 48%,#6f8e9d 100%);
}
</style>
<script id="section-canvas-fallback-check">
(function(){
  function checkForCanvas(){
    if(!document.querySelector("body.home"))return;
    document.body.classList.toggle(
      "section-canvas-fallback",
      !document.querySelector("body > canvas")
    );
  }
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",function(){setTimeout(checkForCanvas,1200)});
  }else{
    setTimeout(checkForCanvas,1200);
  }
  window.addEventListener("load",function(){setTimeout(checkForCanvas,1200)});
})();
</script>`;

function addResponsiveOverrides(html: string) {
  const additions = [
    html.includes("section-responsive-overrides") ? "" : responsiveOverrides,
    html.includes("section-canvas-fallback-check") ? "" : canvasFallback,
  ].join("");
  if (!additions) return html;
  return html.includes("</head>")
    ? html.replace("</head>", `${additions}</head>`)
    : `${additions}${html}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await context.params;
  const key = slug.join("/") as SnapshotKey;
  const snapshot = snapshots[key];

  if (!snapshot) {
    return new Response("Not found", { status: 404 });
  }

  let html = snapshot;
  try {
    const cmsPage = await getCmsPage(key);
    if (cmsPage?.publishedHtml) html = cmsPage.publishedHtml;
  } catch {
    // The static mirror remains available while local or hosted storage is
    // being initialized.
  }

  return new Response(addResponsiveOverrides(html), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
