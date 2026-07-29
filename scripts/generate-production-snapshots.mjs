import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sourceDir = join(root, "work", "production-snapshots");
const routes = {
  "": "home.html",
  "about-us": "about-us.html",
  "design-tech": "design-tech.html",
  "our-works": "our-works.html",
  "contact-us": "contact-us.html",
  "privacy-policy": "privacy-policy.html",
  "pdpa-policy": "pdpa-policy.html",
};
const darkHeaderRoutes = new Set(["", "about-us", "design-tech"]);

const snapshots = {};

for (const [route, file] of Object.entries(routes)) {
  let html = readFileSync(join(sourceDir, file), "utf8");

  // Keep presentation and first-party behaviour, while removing visitor
  // analytics from the private review mirror.
  html = html
    .replace(/<script[^>]+googletagmanager[^>]*><\/script>/gi, "")
    .replace(/<script[^>]+cdn\.parsely\.com[^>]*><\/script>/gi, "")
    .replace(/<script[^>]+wp-parsely[^>]*><\/script>/gi, "")
    .replace(/<script id="google_gtagjs-js-after">[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript>[\s\S]*?googletagmanager[\s\S]*?<\/noscript>/gi, "")
    // Root-relative WordPress assets otherwise resolve against the mirror,
    // which does not host production's uploads, animations, or theme files.
    .replace(
      /(?<![A-Za-z0-9.:])\/wp-content\//g,
      "https://www.wearesection.com/wp-content/",
    )
    .replace(
      /(?<![A-Za-z0-9.:])\/wp-includes\//g,
      "https://www.wearesection.com/wp-includes/",
    )
    .replace(
      /<section class="([^"]*)"([^>]*data-call="Masthead"[^>]*)>/i,
      '<section class="wp-block-section-masthead $1"$2>',
    )
    .replace(
      /<section class="([^"]*)"([^>]*data-call="MastheadCaseStudy"[^>]*)>/i,
      '<section class="wp-block-section-masthead $1"$2>',
    )
    .replace(
      "</head>",
      `<style id="mirror-safety-style">
.mirror-form-notice{display:none}
.wp-block-section-masthead.opacity-0{opacity:1!important}
</style>
<script id="mirror-safety">
window.addEventListener("DOMContentLoaded",function(){
  var forms=document.querySelectorAll("form");
  forms.forEach(function(form){
    form.addEventListener("submit",async function(event){
      event.preventDefault();
      event.stopImmediatePropagation();
      var note=form.querySelector(".mirror-form-notice");
      if(!note){
        var note=document.createElement("p");
        note.className="mirror-form-notice";
        note.style.marginTop="1rem";
        form.appendChild(note);
      }
      note.style.display="block";
      note.textContent="Sending…";
      var data=new FormData(form);
      try{
        var response=await fetch("/api/enquiries",{
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({
            name:data.get("name"),
            email:data.get("email"),
            contactNumber:data.get("contact-number"),
            company:data.get("company-name"),
            message:data.get("enquiries"),
            website:data.get("website")
          })
        });
        var result=await response.json();
        if(!response.ok)throw new Error(result.error||"Delivery failed");
        note.textContent=result.emailed
          ?"Thank you. Your enquiry has been emailed to our team."
          :"Thank you. Your enquiry has been securely received.";
        form.reset();
      }catch(error){
        note.textContent=error.message||"Please try again shortly.";
      }
    },true);
  });
});
</script></head>`,
    );

  if (darkHeaderRoutes.has(route)) {
    html = html.replace(
      '<html lang="en-US">',
      '<html lang="en-US" class="dark">',
    );
  }

  snapshots[route] = html;
}

writeFileSync(
  join(root, "app", "production-snapshots.json"),
  `${JSON.stringify(snapshots)}\n`,
);
