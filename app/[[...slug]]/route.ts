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

function addResponsiveOverrides(html: string) {
  if (html.includes("section-responsive-overrides")) return html;
  return html.includes("</head>")
    ? html.replace("</head>", `${responsiveOverrides}</head>`)
    : `${responsiveOverrides}${html}`;
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
