const CONTACT_EMAIL = "blackthorntropicals@gmail.com";
const CART_KEY = "blackthorn_quote_cart";

// Restore only recognizable current inventory records; corrupted localStorage must
// never prevent the public storefront from rendering.
const cart = loadCart();

function loadCart() {
  let raw;
  try {
    raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return new Map();
  }
  if (!Array.isArray(raw)) return new Map();
  const inventory = new Map(
    [...document.querySelectorAll(".plant-card[data-sku]")].map((card) => [
      card.dataset.sku,
      {
        sku: card.dataset.sku,
        title: card.dataset.title,
        price: Number(card.dataset.price || 0),
      },
    ]),
  );
  const restored = new Map();
  for (const pair of raw) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const [sku, saved] = pair;
    const current = inventory.get(sku);
    if (!current || !saved || !Number.isInteger(saved.quantity)) continue;
    if (saved.quantity < 1 || saved.quantity > 99) continue;
    restored.set(sku, { ...current, quantity: saved.quantity });
  }
  return restored;
}

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const filterButtons = document.querySelectorAll("[data-filter]");
const stageLinks = document.querySelectorAll("[data-stage-link]");
const plantCards = document.querySelectorAll(".plant-card");
const cartPanel = document.querySelector("[data-cart-panel]");
const cartItems = document.querySelector("[data-cart-items]");
const cartCount = document.querySelector("[data-cart-count]");
const cartTotal = document.querySelector("[data-cart-total]");
const contactForm = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");
let quoteOpener = null;
cartPanel.inert = true;

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify([...cart.entries()]));
  } catch {
    // Keep the in-memory cart usable when browser storage is restricted.
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getCardData(card) {
  return {
    sku: card.dataset.sku,
    title: card.dataset.title,
    price: Number(card.dataset.price || 0),
  };
}

function renderCart() {
  const entries = [...cart.values()];
  const count = entries.reduce((sum, item) => sum + item.quantity, 0);
  const total = entries.reduce((sum, item) => sum + item.quantity * item.price, 0);

  cartCount.textContent = count;
  cartTotal.textContent = formatCurrency(total);

  if (!entries.length) {
    cartItems.innerHTML = '<p class="empty-cart">No plants selected yet.</p>';
    return;
  }

  cartItems.innerHTML = entries
    .map(
      (item) => `
        <div class="quote-item">
          <div>
            <strong>${item.title}</strong>
            <span>${item.quantity} x ${formatCurrency(item.price)}</span>
          </div>
          <button type="button" data-remove-item="${item.sku}" aria-label="Remove ${item.title}">-</button>
        </div>
      `,
    )
    .join("");
}

function addToCart(card) {
  const item = getCardData(card);
  const current = cart.get(item.sku) || { ...item, quantity: 0 };
  cart.set(item.sku, { ...current, quantity: current.quantity + 1 });
  saveCart();
  renderCart();
  openCart();
}

function removeFromCart(sku) {
  const item = cart.get(sku);
  if (!item) return;
  if (item.quantity <= 1) {
    cart.delete(sku);
  } else {
    cart.set(sku, { ...item, quantity: item.quantity - 1 });
  }
  saveCart();
  renderCart();
  // The clicked Remove button is destroyed during rerender; keep focus in
  // the open drawer rather than losing keyboard position to document.body.
  if (cartPanel.classList.contains("is-open")) {
    (cartPanel.querySelector("[data-remove-item]") ||
      cartPanel.querySelector("[data-cart-close]")).focus({ preventScroll: true });
  }
}

function openCart() {
  if (!cartPanel.classList.contains("is-open")) {
    quoteOpener = document.activeElement;
  }
  cartPanel.inert = false;
  cartPanel.classList.add("is-open");
  cartPanel.setAttribute("aria-hidden", "false");
  // A separate task runs after the activating button's click finishes.
  setTimeout(() => {
    if (cartPanel.classList.contains("is-open")) {
      cartPanel.querySelector("[data-cart-close]").focus({ preventScroll: true });
    }
  }, 0);
}

function closeCart(restoreFocus = true) {
  if (!cartPanel.classList.contains("is-open")) return;
  cartPanel.classList.remove("is-open");
  cartPanel.setAttribute("aria-hidden", "true");
  cartPanel.inert = true;
  if (restoreFocus && quoteOpener?.isConnected) quoteOpener.focus({ preventScroll: true });
  quoteOpener = null;
}

function applyFilter(stage) {
  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === stage);
  });

  plantCards.forEach((card) => {
    card.hidden = stage !== "all" && card.dataset.stage !== stage;
  });
}

function buildInquiryBody(formData) {
  const lines = [
    `Name: ${formData.get("name")}`,
    `Email: ${formData.get("email")}`,
    `Interest: ${formData.get("interest")}`,
    "",
    "Selected plants:",
  ];

  const entries = [...cart.values()];
  if (entries.length) {
    entries.forEach((item) => {
      lines.push(`- ${item.quantity} x ${item.title} (${formatCurrency(item.price)} each)`);
    });
  } else {
    lines.push("- No plants selected yet");
  }

  lines.push("", "Message:", formData.get("message") || "No message provided.");
  return lines.join("\n");
}

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  siteNav.classList.toggle("is-open", !isOpen);
});

siteNav?.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    navToggle?.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("is-open");
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => applyFilter(button.dataset.filter));
});

stageLinks.forEach((link) => {
  link.addEventListener("click", () => {
    applyFilter(link.dataset.stageLink);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  });
});

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    const card = addButton.closest(".plant-card");
    if (card) addToCart(card);
  }

  const removeButton = event.target.closest("[data-remove-item]");
  if (removeButton) {
    removeFromCart(removeButton.dataset.removeItem);
  }

  if (event.target.closest("[data-cart-open]")) {
    openCart();
  }

  if (event.target.closest("[data-cart-close]")) {
    closeCart();
  }

  if (event.target.closest("[data-cart-contact]")) {
    closeCart(false);
    setTimeout(() => contactForm?.querySelector('[name="name"]')?.focus({ preventScroll: true }), 0);
  }
});

document.addEventListener("keydown", (event) => {
  if (!cartPanel.classList.contains("is-open")) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeCart();
    return;
  }
  if (event.key !== "Tab") return;
  const focusables = [...cartPanel.querySelectorAll("button, a[href]")]
    .filter(el => !el.disabled && el.getClientRects().length);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  } else if (!cartPanel.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
  }
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const subject = encodeURIComponent("Blackthorn's Tropical Plants inquiry");
  const body = encodeURIComponent(buildInquiryBody(formData));
  formNote.textContent = "Opening your email client with the inquiry details.";
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
});

renderCart();
