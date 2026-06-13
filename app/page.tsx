"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const CONTACT_EMAIL = "blackthorntropicals@gmail.com";
const CART_KEY = "blackthorn_quote_cart";

type Stage = "node" | "rooting" | "rooted" | "baby" | "juvenile" | "mature";
type Filter = "all" | Stage;

type Plant = {
  sku: string;
  stage: Stage;
  stageLabel: string;
  title: string;
  price: number;
  badge: string;
  description: string;
  image: string;
  alt: string;
};

type CartItem = Plant & {
  quantity: number;
};

const stages = [
  {
    key: "node",
    title: "Node cutting",
    copy: "For propagation-minded growers.",
    image: "/assets/images/stage-node-cutting.webp",
    alt: "Fresh monstera node cutting",
  },
  {
    key: "rooting",
    title: "Rooting node",
    copy: "Roots are forming and growth is starting.",
    image: "/assets/images/stage-rooting-node.webp",
    alt: "Monstera node with a new root",
  },
  {
    key: "rooted",
    title: "Rooted cutting",
    copy: "Established roots, ready to pot.",
    image: "/assets/images/stage-rooted-cutting.webp",
    alt: "Rooted monstera cutting",
  },
  {
    key: "baby",
    title: "Baby plant",
    copy: "New leaves and new beginnings.",
    image: "/assets/images/stage-baby-plant.webp",
    alt: "Small baby monstera plant",
  },
  {
    key: "juvenile",
    title: "Juvenile plant",
    copy: "Stronger, bolder, growing beautifully.",
    image: "/assets/images/stage-juvenile-plant.webp",
    alt: "Juvenile monstera in a nursery pot",
  },
  {
    key: "mature",
    title: "Mature plant",
    copy: "A living jungle in the making.",
    image: "/assets/images/stage-mature-plant.webp",
    alt: "Mature variegated monstera plant",
  },
] satisfies Array<{
  key: Stage;
  title: string;
  copy: string;
  image: string;
  alt: string;
}>;

const plants: Plant[] = [
  {
    sku: "queen-node",
    stage: "node",
    stageLabel: "Node cutting",
    title: "Queen Chloe Node Cutting",
    price: 38,
    badge: "Limited",
    description: "Fresh-cut node from the nursery's matriarch line, sealed and ready for your prop box.",
    image: "/assets/images/stage-node-cutting.webp",
    alt: "Queen Chloe monstera node cutting",
  },
  {
    sku: "albo-rooted",
    stage: "rooted",
    stageLabel: "Rooted cutting",
    title: "Albo Rooted Cutting",
    price: 74,
    badge: "Root checked",
    description: "Established aerial roots with balanced green and cream marbling, ready for chunky mix.",
    image: "/assets/images/stage-rooted-cutting.webp",
    alt: "Rooted variegated monstera cutting",
  },
  {
    sku: "thai-baby",
    stage: "baby",
    stageLabel: "Baby plant",
    title: "Thai Constellation Baby",
    price: 88,
    badge: "Nursery pot",
    description: "Small but sturdy plant with speckled variegation and a care plan for steady sizing up.",
    image: "/assets/images/stage-baby-plant.webp",
    alt: "Baby Thai Constellation monstera plant",
  },
  {
    sku: "juvenile-deliciosa",
    stage: "juvenile",
    stageLabel: "Juvenile plant",
    title: "Juvenile Monstera Deliciosa",
    price: 46,
    badge: "Beginner friendly",
    description: "Bold leaf growth, acclimated indoors, and ready for a moss pole or brighter window.",
    image: "/assets/images/stage-juvenile-plant.webp",
    alt: "Juvenile Monstera deliciosa in a pot",
  },
  {
    sku: "mature-variegated",
    stage: "mature",
    stageLabel: "Mature plant",
    title: "Mature Variegated Monstera",
    price: 185,
    badge: "Local pickup",
    description: "Statement plant with developed fenestration, selected for collectors and styled rooms.",
    image: "/assets/images/stage-mature-plant.webp",
    alt: "Mature variegated monstera specimen",
  },
  {
    sku: "aurea-rooting",
    stage: "rooting",
    stageLabel: "Rooting node",
    title: "Aurea Rooting Node",
    price: 62,
    badge: "Prop box ready",
    description: "Warm variegation potential with an active root nub and detailed transition notes.",
    image: "/assets/images/stage-rooting-node.webp",
    alt: "Monstera aurea rooting node",
  },
];

const filters: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "node", label: "Nodes" },
  { key: "rooting", label: "Rooting" },
  { key: "rooted", label: "Rooted" },
  { key: "baby", label: "Baby" },
  { key: "juvenile", label: "Juvenile" },
  { key: "mature", label: "Mature" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const [filter, setFilter] = useState<Filter>("all");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [formNote, setFormNote] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(CART_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
      setCartReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, cartReady]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addToCart(plant: Plant) {
    setCart((current) => ({
      ...current,
      [plant.sku]: {
        ...plant,
        quantity: (current[plant.sku]?.quantity ?? 0) + 1,
      },
    }));
    setCartOpen(true);
  }

  function removeFromCart(sku: string) {
    setCart((current) => {
      const item = current[sku];
      if (!item) return current;
      const next = { ...current };
      if (item.quantity <= 1) {
        delete next[sku];
      } else {
        next[sku] = { ...item, quantity: item.quantity - 1 };
      }
      return next;
    });
  }

  function chooseStage(stage: Stage) {
    setFilter(stage);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }

  function buildInquiryBody(formData: FormData) {
    const lines = [
      `Name: ${formData.get("name")}`,
      `Email: ${formData.get("email")}`,
      `Interest: ${formData.get("interest")}`,
      "",
      "Selected plants:",
    ];

    if (cartItems.length) {
      cartItems.forEach((item) => {
        lines.push(`- ${item.quantity} x ${item.title} (${formatCurrency(item.price)} each)`);
      });
    } else {
      lines.push("- No plants selected yet");
    }

    lines.push("", "Message:", String(formData.get("message") || "No message provided."));
    return lines.join("\n");
  }

  function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subject = encodeURIComponent("Blackthorn's Tropical Plants inquiry");
    const body = encodeURIComponent(buildInquiryBody(formData));
    setFormNote("Opening your email client with the inquiry details.");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="site-header" data-header>
        <a className="brand" href="#top" aria-label="Blackthorn's Tropical Plants home">
          <img src="/assets/images/blackthorn-logo-512.png" alt="" width="72" height="72" />
          <span>Blackthorn&apos;s</span>
        </a>

        <button
          className="nav-toggle"
          type="button"
          aria-expanded={navOpen}
          aria-controls="site-nav"
          onClick={() => setNavOpen((open) => !open)}
        >
          <span></span>
          <span></span>
          <span></span>
          <span className="sr-only">Menu</span>
        </button>

        <nav className={`site-nav ${navOpen ? "is-open" : ""}`} id="site-nav" aria-label="Primary navigation">
          <a href="#shop" onClick={() => setNavOpen(false)}>Shop</a>
          <a href="#stages" onClick={() => setNavOpen(false)}>Plants</a>
          <a href="#care" onClick={() => setNavOpen(false)}>Learn</a>
          <a href="#queen-chloe" onClick={() => setNavOpen(false)}>About</a>
          <a href="#contact" onClick={() => setNavOpen(false)}>Contact</a>
        </nav>

        <button className="quote-button" type="button" onClick={() => setCartOpen(true)}>
          <span>Quote</span>
          <strong>{cartCount}</strong>
        </button>
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true"></div>
          <div className="hero-content">
            <p className="eyebrow">From node to jungle</p>
            <h1 id="hero-title">Blackthorn&apos;s Tropical Plants</h1>
            <p className="hero-copy">
              Premium monstera starts, rooted cuttings, and tropical plants grown with patient roots,
              strong leaves, and clear care guidance.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#shop">Shop plants</a>
              <a className="button secondary" href="#care">Care guides</a>
            </div>
          </div>
        </section>

        <section className="cred-strip" aria-label="Business highlights">
          <div>
            <strong>Locally grown</strong>
            <span>Oregon-rooted plants raised with sustainable nursery practices.</span>
          </div>
          <div>
            <strong>Queen Chloe lineage</strong>
            <span>Mother plant genetics guide every cutting and collection drop.</span>
          </div>
          <div>
            <strong>Roots first</strong>
            <span>Cuttings ship only when the root system is ready for the next stage.</span>
          </div>
          <div>
            <strong>Education included</strong>
            <span>Each plant comes with a care path matched to its stage.</span>
          </div>
        </section>

        <section className="section parchment" id="stages" aria-labelledby="stages-title">
          <div className="section-heading">
            <p className="eyebrow">Shop by stage</p>
            <h2 id="stages-title">Every Stage. Every Jungle.</h2>
            <p>
              Choose the plant stage that matches your confidence, setup, and appetite for watching
              roots do their quiet work.
            </p>
          </div>

          <div className="stage-grid" aria-label="Plant growth stages">
            {stages.map((stage) => (
              <button className="stage-card" key={stage.key} type="button" onClick={() => chooseStage(stage.key)}>
                <img src={stage.image} alt={stage.alt} />
                <span>{stage.title}</span>
                <small>{stage.copy}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="section shop-section" id="shop" aria-labelledby="shop-title">
          <div className="shop-intro">
            <div>
              <p className="eyebrow">Current nursery board</p>
              <h2 id="shop-title">Reserve the Next Drop</h2>
            </div>
            <div className="filter-bar" role="group" aria-label="Filter inventory by stage">
              {filters.map((item) => (
                <button
                  className={`filter-button ${filter === item.key ? "is-active" : ""}`}
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="inventory-grid" data-inventory>
            {plants.map((plant) => (
              <article
                className="plant-card"
                key={plant.sku}
                data-stage={plant.stage}
                hidden={filter !== "all" && plant.stage !== filter}
              >
                <img src={plant.image} alt={plant.alt} />
                <div className="plant-card-body">
                  <p className="plant-stage">{plant.stageLabel}</p>
                  <h3>{plant.title}</h3>
                  <p>{plant.description}</p>
                  <div className="plant-meta">
                    <span>From {formatCurrency(plant.price)}</span>
                    <span>{plant.badge}</span>
                  </div>
                  <button className="button plant-action" type="button" onClick={() => addToCart(plant)}>
                    Reserve
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="queen-panel" id="queen-chloe" aria-labelledby="queen-title">
          <div className="queen-copy">
            <p className="eyebrow">Meet our matriarch</p>
            <h2 id="queen-title">Queen Chloe</h2>
            <p>
              The Blackthorn nursery starts with a mother plant that earned her crown the slow way:
              stable roots, dramatic fenestration, and the kind of variegation that makes every new
              leaf feel ceremonial.
            </p>
            <a className="button secondary" href="#contact">Ask about lineage</a>
          </div>
          <img src="/assets/images/queen-chloe-leaf.webp" alt="Close detail of a variegated monstera leaf" />
        </section>

        <section className="section collection-section" aria-labelledby="collection-title">
          <div className="section-heading">
            <p className="eyebrow">Collections</p>
            <h2 id="collection-title">Dark Leaves. Bright Variegation. Clean Roots.</h2>
          </div>

          <div className="collection-grid">
            <article>
              <img src="/assets/images/collection-noir.webp" alt="Dark tropical plant leaves" />
              <h3>Blackthorn Noir</h3>
              <p>Deep, glossy foliage for growers who like their jungle a little moody.</p>
            </article>
            <article>
              <img src="/assets/images/collection-variegated.webp" alt="Variegated monstera leaf with water droplets" />
              <h3>Premium Collectibles</h3>
              <p>Rare monsteras selected for root quality, variegation, and long-term vigor.</p>
            </article>
            <article>
              <img src="/assets/images/propagation-roots.webp" alt="Plant cuttings rooting in clear water" />
              <h3>Learn and Grow</h3>
              <p>Care support for propagation, acclimation, watering, light, and chunky substrate.</p>
            </article>
          </div>
        </section>

        <section className="section care-section parchment" id="care" aria-labelledby="care-title">
          <div className="care-layout">
            <div>
              <p className="eyebrow">Care library</p>
              <h2 id="care-title">Grow With Confidence</h2>
              <p>
                Tropical plants reward consistency. Start with the current stage, then tune light,
                water, humidity, and support as the root system expands.
              </p>
            </div>
            <div className="care-list">
              <article>
                <span>01</span>
                <h3>Light</h3>
                <p>Bright indirect light keeps variegation strong without scorching cream sectors.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Water</h3>
                <p>Let the top layer breathe before watering. Roots want oxygen as much as moisture.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Roots</h3>
                <p>Root health leads every sale. Pot up only when roots can hold the next container.</p>
              </article>
              <article>
                <span>04</span>
                <h3>Support</h3>
                <p>A pole or plank encourages larger leaves, stronger petioles, and mature fenestration.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="contact-copy">
            <p className="eyebrow">Join the jungle</p>
            <h2 id="contact-title">Ask About the Next Drop</h2>
            <p>
              Send your wishlist, care question, or pickup request. The quote drawer will include any
              reserved plants you selected.
            </p>
          </div>
          <form className="contact-form" onSubmit={submitInquiry}>
            <label>
              Name
              <input name="name" autoComplete="name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              What are you growing toward?
              <select name="interest">
                <option>Monsteras and variegated starts</option>
                <option>Beginner-friendly tropical plants</option>
                <option>Care help for a current plant</option>
                <option>Local pickup or custom sourcing</option>
              </select>
            </label>
            <label>
              Message
              <textarea name="message" rows={4} placeholder="Tell us what you are looking for."></textarea>
            </label>
            <button className="button primary" type="submit">Send inquiry</button>
            <p className="form-note">{formNote}</p>
          </form>
        </section>
      </main>

      <aside className={`quote-panel ${cartOpen ? "is-open" : ""}`} aria-label="Quote drawer" aria-hidden={!cartOpen}>
        <div className="quote-panel-inner">
          <div className="quote-panel-header">
            <div>
              <p className="eyebrow">Quote drawer</p>
              <h2>Plant Holds</h2>
            </div>
            <button className="panel-close" type="button" onClick={() => setCartOpen(false)} aria-label="Close quote drawer">
              x
            </button>
          </div>
          <div className="quote-items">
            {cartItems.length ? (
              cartItems.map((item) => (
                <div className="quote-item" key={item.sku}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.quantity} x {formatCurrency(item.price)}</span>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.sku)} aria-label={`Remove ${item.title}`}>
                    -
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-cart">No plants selected yet.</p>
            )}
          </div>
          <div className="quote-total">
            <span>Estimated starter total</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>
          <a className="button primary quote-mail" href="#contact" onClick={() => setCartOpen(false)}>
            Send inquiry
          </a>
        </div>
      </aside>

      <footer className="site-footer">
        <div>
          <img src="/assets/images/blackthorn-logo-512.png" alt="Blackthorn's Tropical Plants logo" width="92" height="92" />
        </div>
        <div>
          <strong>Blackthorn&apos;s Tropical Plants</strong>
          <span>From node to jungle. Proudly grown in Oregon, USA.</span>
        </div>
        <a href="#top">Back to top</a>
      </footer>
    </>
  );
}
