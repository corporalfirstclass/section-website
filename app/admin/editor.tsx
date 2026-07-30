"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const pages = [
  ["home", "Home"],
  ["about-us", "About Us"],
  ["design-tech", "Design + Tech"],
  ["our-works", "Our Works"],
  ["contact-us", "Contact Us"],
  ["privacy-policy", "Privacy Policy"],
  ["pdpa-policy", "PDPA Policy"],
] as const;

const navigation = [
  ["overview", "Overview", "⌂"],
  ["pages", "Pages", "▤"],
  ["projects", "Projects", "◇"],
  ["leadership", "Leadership", "◉"],
  ["offices", "Offices", "⌖"],
  ["images", "Images", "▧"],
  ["enquiries", "Enquiries", "✉"],
] as const;

type Section = (typeof navigation)[number][0];
type CopyField = { key: string; label: string; tag: string; value: string };
type ImageField = { key: string; alt: string; url: string };
type LeaderField = { key: string; name: string; role: string; image: string };
type OfficeField = { key: string; country: string; address: string };
type Project = {
  id: number;
  title?: string;
  acf?: {
    name?: string;
    title?: string;
    body?: string;
    region?: string;
    banner_image?: string;
    background_image?: string;
  };
};
type Enquiry = {
  id: number;
  name: string;
  email: string;
  contact_number?: string;
  company?: string;
  message: string;
  delivery_status: string;
  created_at: number;
};

function text(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function addressText(element: Element) {
  return element.innerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export default function Editor({ userEmail }: { userEmail: string }) {
  const [section, setSection] = useState<Section>("overview");
  const [slug, setSlug] = useState("home");
  const [copyFields, setCopyFields] = useState<CopyField[]>([]);
  const [imageFields, setImageFields] = useState<ImageField[]>([]);
  const [leaders, setLeaders] = useState<LeaderField[]>([]);
  const [offices, setOffices] = useState<OfficeField[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All changes are up to date.");
  const [loading, setLoading] = useState(false);
  const pageDocument = useRef<Document | null>(null);

  const readDocument = useCallback((html: string) => {
    const document = new DOMParser().parseFromString(html, "text/html");
    pageDocument.current = document;

    const content: CopyField[] = [];
    document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p").forEach(
      (element, index) => {
        if (element.closest("header,footer,.leader-wrapper,.leaders-container")) {
          return;
        }
        const value = text(element.textContent);
        if (!value || value.length > 1200) return;
        const key = `copy-${index}`;
        element.dataset.cmsKey = key;
        content.push({
          key,
          tag: element.tagName.toLowerCase(),
          label:
            element.tagName.startsWith("H")
              ? `Heading ${content.filter((item) => item.tag.startsWith("h")).length + 1}`
              : `Paragraph ${content.filter((item) => item.tag === "p").length + 1}`,
          value,
        });
      },
    );
    setCopyFields(content);

    const images: ImageField[] = [];
    document.querySelectorAll<HTMLImageElement>("img").forEach((element, index) => {
      const url = element.getAttribute("src") ?? element.dataset.src ?? "";
      if (!url) return;
      const key = `image-${index}`;
      element.dataset.cmsImageKey = key;
      images.push({ key, url, alt: element.alt || `Image ${images.length + 1}` });
    });
    setImageFields(images);

    const people: LeaderField[] = [];
    document.querySelectorAll<HTMLElement>(".leader-wrapper").forEach(
      (element, index) => {
        const name = text(element.querySelector("h4")?.textContent);
        const role = text(element.querySelector(".leader-info p")?.textContent);
        const image =
          element.querySelector<HTMLImageElement>("img.avatar")?.getAttribute("src") ??
          "";
        if (!name) return;
        const key = `leader-${index}`;
        element.dataset.cmsLeaderKey = key;
        people.push({ key, name, role, image });
      },
    );
    setLeaders(people);

    const locations: OfficeField[] = [];
    document.querySelectorAll("footer p").forEach((label, index) => {
      const country = text(label.textContent).toLowerCase();
      if (!["singapore", "malaysia", "vietnam"].includes(country)) return;
      const address = label.nextElementSibling;
      if (!address) return;
      const key = `office-${index}`;
      label.setAttribute("data-cms-office-key", key);
      address.setAttribute("data-cms-office-address-key", key);
      locations.push({
        key,
        country: text(label.textContent),
        address: addressText(address),
      });
    });
    setOffices(locations);
  }, []);

  const loadPage = useCallback(
    async (nextSlug: string) => {
      setLoading(true);
      setStatus("Loading content…");
      try {
        const response = await fetch(`/api/cms/pages/${nextSlug}`);
        if (!response.ok) throw new Error();
        const data = (await response.json()) as { html: string };
        readDocument(data.html);
        setStatus("All changes are up to date.");
      } catch {
        setStatus("This content could not be loaded.");
      } finally {
        setLoading(false);
      }
    },
    [readDocument],
  );

  useEffect(() => {
    // Loading a new page intentionally hydrates the editor's local draft state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPage(slug);
  }, [loadPage, slug]);

  useEffect(() => {
    if (section !== "projects" || projects.length) return;
    fetch("/api/cms/collections/projects")
      .then((response) => response.json())
      .then((data: { items: Project[] }) => setProjects(data.items ?? []))
      .catch(() => setStatus("Projects could not be loaded."));
  }, [projects.length, section]);

  useEffect(() => {
    if (section !== "enquiries") return;
    fetch("/api/enquiries")
      .then((response) => response.json())
      .then((data: { enquiries: Enquiry[] }) =>
        setEnquiries(data.enquiries ?? []),
      )
      .catch(() => setStatus("Enquiries could not be loaded."));
  }, [section]);

  function selectSection(next: Section) {
    setSection(next);
    setSearch("");
    if (next === "leadership" && slug !== "about-us") setSlug("about-us");
    if (next === "offices" && slug !== "home") setSlug("home");
  }

  function updateCopy(key: string, value: string) {
    setCopyFields((items) =>
      items.map((item) => (item.key === key ? { ...item, value } : item)),
    );
    setStatus("You have unpublished changes.");
  }

  function updateImage(key: string, patch: Partial<ImageField>) {
    setImageFields((items) =>
      items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
    setStatus("You have unpublished changes.");
  }

  function updateLeader(key: string, patch: Partial<LeaderField>) {
    setLeaders((items) =>
      items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
    setStatus("You have unpublished changes.");
  }

  function updateOffice(key: string, patch: Partial<OfficeField>) {
    setOffices((items) =>
      items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
    setStatus("You have unpublished changes.");
  }

  function applyFormChanges() {
    const document = pageDocument.current;
    if (!document) return "";

    copyFields.forEach((field) => {
      const element = document.querySelector<HTMLElement>(
        `[data-cms-key="${field.key}"]`,
      );
      if (element) element.textContent = field.value;
    });
    imageFields.forEach((field) => {
      const element = document.querySelector<HTMLImageElement>(
        `[data-cms-image-key="${field.key}"]`,
      );
      if (!element) return;
      element.alt = field.alt;
      if (element.hasAttribute("src")) element.src = field.url;
      else element.dataset.src = field.url;
    });
    leaders.forEach((leader) => {
      const wrapper = document.querySelector<HTMLElement>(
        `[data-cms-leader-key="${leader.key}"]`,
      );
      if (!wrapper) return;
      wrapper.querySelectorAll("h4").forEach((element) => {
        element.textContent = leader.name;
      });
      wrapper.querySelectorAll("p").forEach((element) => {
        element.textContent = leader.role;
      });
      const avatar = wrapper.querySelector<HTMLImageElement>("img.avatar");
      if (avatar) avatar.src = leader.image;
    });
    offices.forEach((office) => {
      const label = document.querySelector<HTMLElement>(
        `[data-cms-office-key="${office.key}"]`,
      );
      const address = document.querySelector<HTMLElement>(
        `[data-cms-office-address-key="${office.key}"]`,
      );
      if (label) label.textContent = office.country;
      if (address) {
        address.replaceChildren(
          ...office.address.split("\n").flatMap((line, index) => {
            const parts: Node[] = [];
            if (index) parts.push(document.createElement("br"));
            parts.push(document.createTextNode(line));
            return parts;
          }),
        );
      }
    });

    return `<!doctype html>${document.documentElement.outerHTML}`;
  }

  async function savePage(publish = false) {
    const html = applyFormChanges();
    if (!html) return;
    setStatus(publish ? "Publishing…" : "Saving draft…");
    const saveResponse = await fetch(`/api/cms/pages/${slug}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ html }),
    });
    if (!saveResponse.ok) {
      setStatus("Your changes could not be saved.");
      return;
    }
    if (publish) {
      const publishResponse = await fetch(`/api/cms/pages/${slug}`, {
        method: "POST",
      });
      setStatus(
        publishResponse.ok
          ? "Published successfully."
          : "The draft was saved but could not be published.",
      );
    } else {
      setStatus("Draft saved.");
    }
  }

  async function saveProjects(publish = false) {
    setStatus(publish ? "Publishing projects…" : "Saving project draft…");
    const saved = await fetch("/api/cms/collections/projects", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: projects }),
    });
    if (!saved.ok) {
      setStatus("Projects could not be saved.");
      return;
    }
    if (publish) {
      const result = await fetch("/api/cms/collections/projects", {
        method: "POST",
      });
      setStatus(result.ok ? "Projects published successfully." : "Publish failed.");
    } else {
      setStatus("Project draft saved.");
    }
  }

  const filteredCopy = useMemo(
    () =>
      copyFields.filter((item) =>
        item.value.toLowerCase().includes(search.toLowerCase()),
      ),
    [copyFields, search],
  );
  const filteredImages = useMemo(
    () =>
      imageFields.filter((item) =>
        `${item.alt} ${item.url}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [imageFields, search],
  );

  const pageLabel = pages.find(([value]) => value === slug)?.[1] ?? slug;
  const contentCount =
    section === "projects"
      ? projects.length
      : section === "leadership"
        ? leaders.length
        : section === "offices"
          ? offices.length
          : section === "images"
            ? imageFields.length
            : copyFields.length;

  return (
    <main className="cms-app">
      <aside className="cms-sidebar">
        <div className="cms-brand">
          <span className="cms-brand-mark">S</span>
          <div>
            <strong>Section</strong>
            <small>Content manager</small>
          </div>
        </div>
        <nav aria-label="CMS sections">
          {navigation.map(([value, label, icon]) => (
            <button
              key={value}
              className={section === value ? "active" : ""}
              onClick={() => selectSection(value)}
            >
              <span>{icon}</span>
              {label}
              {value === "enquiries" && enquiries.length > 0 && (
                <em>{enquiries.length}</em>
              )}
            </button>
          ))}
        </nav>
        <div className="cms-account">
          <span>{userEmail.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>Ryan Hoe</strong>
            <small>{userEmail}</small>
          </div>
        </div>
      </aside>

      <section className="cms-workspace">
        <header className="cms-topbar">
          <div>
            <p className="cms-breadcrumb">Website / {section}</p>
            <h1>{navigation.find(([value]) => value === section)?.[1]}</h1>
          </div>
          <div className="cms-top-actions">
            <a href="/" target="_blank" className="cms-preview-link">
              Preview website ↗
            </a>
            {section !== "overview" && section !== "enquiries" && (
              <>
                <button
                  className="cms-save"
                  onClick={() =>
                    section === "projects" ? saveProjects() : savePage()
                  }
                >
                  Save draft
                </button>
                <button
                  className="cms-publish"
                  onClick={() =>
                    section === "projects" ? saveProjects(true) : savePage(true)
                  }
                >
                  Publish
                </button>
              </>
            )}
          </div>
        </header>

        <div className="cms-statusbar">
          <span className={status.includes("unpublished") ? "warning" : ""} />
          {status}
        </div>

        {section === "overview" ? (
          <Overview onSelect={selectSection} />
        ) : section === "enquiries" ? (
          <Enquiries items={enquiries} />
        ) : (
          <>
            <div className="cms-controls">
              {["pages", "images"].includes(section) && (
                <label className="cms-select">
                  <span>Editing page</span>
                  <select
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                  >
                    {pages.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div>
                <strong>
                  {section === "pages" ? pageLabel : navigation.find(([v]) => v === section)?.[1]}
                </strong>
                <small>{contentCount} content items</small>
              </div>
              {["pages", "images"].includes(section) && (
                <input
                  className="cms-search"
                  placeholder={`Search ${section}…`}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              )}
            </div>

            {loading ? (
              <div className="cms-empty">Loading content…</div>
            ) : section === "pages" ? (
              <CopyEditor fields={filteredCopy} update={updateCopy} />
            ) : section === "projects" ? (
              <ProjectEditor items={projects} setItems={setProjects} />
            ) : section === "leadership" ? (
              <LeadershipEditor items={leaders} update={updateLeader} />
            ) : section === "offices" ? (
              <OfficeEditor items={offices} update={updateOffice} />
            ) : (
              <ImageEditor fields={filteredImages} update={updateImage} />
            )}
          </>
        )}
      </section>
    </main>
  );
}

function Overview({ onSelect }: { onSelect: (value: Section) => void }) {
  const cards: Array<[Section, string, string, string]> = [
    ["pages", "Pages", "Edit headlines, paragraphs and policy copy.", "7 pages"],
    ["projects", "Projects", "Manage case studies shown under Our Works.", "Portfolio"],
    ["leadership", "Leadership", "Update names, roles and portraits.", "Team"],
    ["offices", "Offices", "Maintain addresses for all three locations.", "3 offices"],
    ["images", "Images", "Review and replace website images.", "Media"],
    ["enquiries", "Enquiries", "Review messages received from the contact form.", "Inbox"],
  ];
  return (
    <div className="cms-overview">
      <section className="cms-welcome">
        <p>Welcome back, Ryan</p>
        <h2>What would you like to update?</h2>
        <span>Choose a content area. You can save drafts before publishing.</span>
      </section>
      <div className="cms-card-grid">
        {cards.map(([value, title, description, meta]) => (
          <button key={value} onClick={() => onSelect(value)}>
            <span>{navigation.find(([key]) => key === value)?.[2]}</span>
            <small>{meta}</small>
            <h3>{title}</h3>
            <p>{description}</p>
            <strong>Manage {title.toLowerCase()} →</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function CopyEditor({
  fields,
  update,
}: {
  fields: CopyField[];
  update: (key: string, value: string) => void;
}) {
  return (
    <div className="cms-list">
      {fields.map((field) => (
        <article className="cms-form-card" key={field.key}>
          <div className="cms-field-meta">
            <span>{field.tag.toUpperCase()}</span>
            <strong>{field.label}</strong>
          </div>
          <label>
            <span>Content</span>
            {field.tag === "p" || field.value.length > 100 ? (
              <textarea
                rows={Math.min(8, Math.max(3, Math.ceil(field.value.length / 80)))}
                value={field.value}
                onChange={(event) => update(field.key, event.target.value)}
              />
            ) : (
              <input
                value={field.value}
                onChange={(event) => update(field.key, event.target.value)}
              />
            )}
          </label>
          <small>{field.value.length} characters</small>
        </article>
      ))}
    </div>
  );
}

function ProjectEditor({
  items,
  setItems,
}: {
  items: Project[];
  setItems: (items: Project[]) => void;
}) {
  function update(index: number, field: string, value: string) {
    setItems(
      items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, acf: { ...item.acf, [field]: value } }
          : item,
      ),
    );
  }
  return (
    <div className="cms-record-grid">
      {items.map((item, index) => (
        <article className="cms-record" key={item.id}>
          <div
            className="cms-record-image"
            style={{ backgroundImage: `url("${item.acf?.banner_image ?? ""}")` }}
          />
          <div className="cms-record-body">
            <label>
              <span>Client</span>
              <input
                value={item.acf?.name ?? item.title ?? ""}
                onChange={(event) => update(index, "name", event.target.value)}
              />
            </label>
            <label>
              <span>Project headline</span>
              <input
                value={item.acf?.title ?? ""}
                onChange={(event) => update(index, "title", event.target.value)}
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                rows={4}
                value={item.acf?.body ?? ""}
                onChange={(event) => update(index, "body", event.target.value)}
              />
            </label>
            <div className="cms-two-fields">
              <label>
                <span>Region</span>
                <input
                  value={item.acf?.region ?? ""}
                  onChange={(event) => update(index, "region", event.target.value)}
                />
              </label>
              <label>
                <span>Banner image URL</span>
                <input
                  value={item.acf?.banner_image ?? ""}
                  onChange={(event) =>
                    update(index, "banner_image", event.target.value)
                  }
                />
              </label>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function LeadershipEditor({
  items,
  update,
}: {
  items: LeaderField[];
  update: (key: string, patch: Partial<LeaderField>) => void;
}) {
  return (
    <div className="cms-record-grid cms-leaders">
      {items.map((leader) => (
        <article className="cms-record" key={leader.key}>
          <img src={leader.image} alt="" />
          <div className="cms-record-body">
            <label>
              <span>Name</span>
              <input
                value={leader.name}
                onChange={(event) => update(leader.key, { name: event.target.value })}
              />
            </label>
            <label>
              <span>Role</span>
              <input
                value={leader.role}
                onChange={(event) => update(leader.key, { role: event.target.value })}
              />
            </label>
            <label>
              <span>Portrait URL</span>
              <input
                value={leader.image}
                onChange={(event) => update(leader.key, { image: event.target.value })}
              />
            </label>
          </div>
        </article>
      ))}
    </div>
  );
}

function OfficeEditor({
  items,
  update,
}: {
  items: OfficeField[];
  update: (key: string, patch: Partial<OfficeField>) => void;
}) {
  return (
    <div className="cms-office-grid">
      {items.map((office) => (
        <article className="cms-form-card" key={office.key}>
          <div className="cms-office-icon">⌖</div>
          <label>
            <span>Country</span>
            <input
              value={office.country}
              onChange={(event) =>
                update(office.key, { country: event.target.value })
              }
            />
          </label>
          <label>
            <span>Address</span>
            <textarea
              rows={6}
              value={office.address}
              onChange={(event) =>
                update(office.key, { address: event.target.value })
              }
            />
          </label>
        </article>
      ))}
    </div>
  );
}

function ImageEditor({
  fields,
  update,
}: {
  fields: ImageField[];
  update: (key: string, patch: Partial<ImageField>) => void;
}) {
  return (
    <div className="cms-media-grid">
      {fields.map((image) => (
        <article className="cms-media-card" key={image.key}>
          <div className="cms-media-preview">
            <img src={image.url} alt="" />
          </div>
          <label>
            <span>Description</span>
            <input
              value={image.alt}
              onChange={(event) => update(image.key, { alt: event.target.value })}
            />
          </label>
          <label>
            <span>Image URL</span>
            <input
              value={image.url}
              onChange={(event) => update(image.key, { url: event.target.value })}
            />
          </label>
        </article>
      ))}
    </div>
  );
}

function Enquiries({ items }: { items: Enquiry[] }) {
  if (!items.length) {
    return <div className="cms-empty">No enquiries have been received yet.</div>;
  }
  return (
    <div className="cms-enquiries">
      {items.map((item) => (
        <article key={item.id}>
          <div className="cms-enquiry-head">
            <div>
              <strong>{item.name}</strong>
              <a href={`mailto:${item.email}`}>{item.email}</a>
            </div>
            <time>{new Date(item.created_at).toLocaleString()}</time>
          </div>
          <p>{item.message}</p>
          <footer>
            <span>{item.company || "No company provided"}</span>
            <span className={`delivery ${item.delivery_status}`}>
              {item.delivery_status.replace("_", " ")}
            </span>
          </footer>
        </article>
      ))}
    </div>
  );
}
