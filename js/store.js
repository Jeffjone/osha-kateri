const products = [
  { id: "andros", name: "Andros Double-Breasted Suit", group: "men", type: "Tailoring", color: "Aubergine", price: 890, sizes: ["46 EU", "48 EU", "50 EU", "52 EU", "54 EU"], description: "A six-button silhouette with a broad peak lapel and a softly structured shoulder.", care: "Wool blend. Dry clean." },
  { id: "antheia", name: "Antheia Linen Blazer", group: "women", type: "Tailoring", color: "Limestone", price: 485, sizes: ["34 EU", "36 EU", "38 EU", "40 EU", "42 EU"], description: "A single-breasted linen blazer with a relaxed fit and softly defined waist.", care: "Linen. Dry clean." },
  { id: "naxos", name: "Naxos Knit Polo", group: "men", type: "Knitwear", color: "Olive Taupe", price: 225, sizes: ["XS", "S", "M", "L", "XL"], description: "An open-collar polo in textured cotton knit, finished with short sleeves and a ribbed hem.", care: "Cotton. Hand wash cold and dry flat." },
  { id: "melania", name: "Melania Silk Dress", group: "women", type: "Dresses", color: "Dusty Mauve", price: 595, sizes: ["34 EU", "36 EU", "38 EU", "40 EU", "42 EU"], description: "A fluid, sleeveless silk dress with a softly gathered neckline and a clean, long hem.", care: "Silk. Dry clean." },
  { id: "paros", name: "Paros Linen Shirt", group: "men", type: "Shirts", color: "Chalk", price: 180, sizes: ["XS", "S", "M", "L", "XL"], description: "An airy linen shirt with an open collar and a straight cut for warm coastal evenings.", care: "Linen. Wash cold and air dry." },
  { id: "delos", name: "Delos Silk Scarf", group: "accessories", type: "Accessories", color: "Olive and Mauve", price: 115, sizes: ["One size"], description: "A silk scarf in muted olive and mauve with a banded edge.", care: "Silk. Dry clean." }
];

const collections = {
  all: { name: "The Aegean Collection", description: "Tailoring, ready-to-wear and accessories in shades of the Aegean at dusk." },
  men: { name: "Men", description: "Softly structured tailoring, textured knitwear and coastal linen." },
  women: { name: "Women", description: "Relaxed tailoring and fluid silhouettes in silk and linen." },
  accessories: { name: "Accessories", description: "The finishing details of the Aegean wardrobe." },
  melania: { name: "Melania", description: "Silk and softened tailoring in the colors of a late Mediterranean evening.", includes: ["melania", "antheia", "delos"] }
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const information = {
  house: { name: "The House", body: `
    <div class="story-layout">
      <img src="images/campaign/aegean.webp" alt="A plum suit against a stone terrace overlooking the Aegean">
      <div><p>Osha Kateri takes its cues from the Aegean. The colors of sunset on stone, the ease of an open collar and the texture of linen inform a wardrobe built around tailoring and ready-to-wear.</p>
      <p>The Aegean Collection pairs limestone and olive with deep mauve, moving from daylight to evening.</p>
      <a class="text-link" href="#lookbook">View the lookbook</a></div>
    </div>` },
  lookbook: { name: "Aegean After Dark", body: `
    <p>The Aegean Collection lookbook.</p>
    <div class="product-grid">${[products[0], products[3], products[4]].map(productCard).join("")}</div>` },
  shipping: { name: "Shipping & Returns", body: `
    <h2>Shipping</h2><p>This preview uses US dollars. Shipping destinations, rates and delivery estimates will be available when online ordering opens.</p>
    <h2>Returns</h2><p>Return instructions and eligibility will be available when online ordering opens.</p>` },
  sizing: { name: "Size Guide", body: `
    <h2>Tailoring and dresses</h2><p>Numbered sizes on garment pages use the European size system. Measure around the fullest part of the chest or bust and hips, and around the natural waist.</p>
    <h2>Knitwear and shirts</h2><p>Lettered sizes run from XS to XL. For a relaxed fit, compare the silhouette with a similar garment you already own.</p>` },
  contact: { name: "Contact", body: `
    <p>Client services contact details will be available when the shop opens. In the meantime, browse the <a class="text-link" href="#sizing">size guide</a> or <a class="text-link" href="#shipping">shipping and returns</a> information.</p>` },
  privacy: { name: "Privacy", body: `
    <p>This storefront demo stores shopping bag selections and preview newsletter signups locally in your browser. You can remove this data by clearing this site's browser storage.</p>` }
};

const main = document.getElementById("main");
const home = document.getElementById("home");
const page = document.getElementById("page");
const drawer = document.getElementById("drawer");
const drawerTitle = document.getElementById("drawer-title");
const drawerContent = document.getElementById("drawer-content");
const status = document.getElementById("store-status");
const bagKey = "osha-kateri.bag.v1";
const newsletterKey = "osha-kateri.newsletter.v1";

let bag = readStoredArray(bagKey).filter((item) => {
  const product = item && products.find(({ id }) => id === item.id);
  return product && product.sizes.includes(item.size) && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99;
});

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function photo(product) {
  return `images/campaign/${product.id}.webp`;
}

function productCard(product) {
  return `<a class="product" href="#product/${product.id}">
    <span class="product-image"><img src="${photo(product)}" alt="" loading="lazy"></span>
    <h3>${product.name}</h3><p>${product.color} · ${currency.format(product.price)}</p>
  </a>`;
}

function breadcrumb(label, collection) {
  const parent = collection ? `<a href="#shop/${collection}">${collections[collection].name}</a><span aria-hidden="true">/</span>` : "";
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span aria-hidden="true">/</span>${parent}<span aria-current="page">${label}</span></nav>`;
}

function collectionProducts(group) {
  const collection = collections[group];
  if (collection.includes) return collection.includes.map((id) => products.find((product) => product.id === id));
  return group === "all" ? [...products] : products.filter((product) => product.group === group);
}

function shop(group) {
  const collection = collections[group];
  const items = collectionProducts(group);
  page.innerHTML = `<section class="shop-page">
    ${breadcrumb(collection.name)}
    <div class="page-heading"><h1>${collection.name}</h1><p>${collection.description}</p></div>
    <nav class="shop-tabs" aria-label="Collections">${Object.entries(collections).map(([id, entry]) =>
      `<a href="#shop/${id}" ${id === group ? 'aria-current="page"' : ""}>${id === "all" ? "Shop all" : entry.name}</a>`).join("")}</nav>
    <div class="shop-controls"><span>${items.length} ${items.length === 1 ? "piece" : "pieces"}</span>
      <label>Sort by <select id="sort-products"><option value="featured">Featured</option><option value="price-up">Price, low to high</option><option value="price-down">Price, high to low</option></select></label>
    </div>
    <div class="product-grid" id="collection-products">${items.map(productCard).join("")}</div>
  </section>`;
  page.querySelector("#sort-products").addEventListener("change", (event) => {
    const order = event.target.value;
    const sorted = [...items];
    if (order === "price-up") sorted.sort((a, b) => a.price - b.price);
    if (order === "price-down") sorted.sort((a, b) => b.price - a.price);
    page.querySelector("#collection-products").innerHTML = sorted.map(productCard).join("");
  });
}

function detail(product) {
  page.innerHTML = `<section class="detail-page">
    ${breadcrumb(product.name, product.group)}
    <div class="detail-layout">
      <img src="${photo(product)}" alt="${product.name} in ${product.color}">
      <div class="detail-copy">
        <p class="eyebrow">${product.type.toUpperCase()}</p>
        <h1>${product.name}</h1>
        <p class="detail-price">${currency.format(product.price)}</p><p>${product.color}</p>
        <p>${product.description}</p>
        <form id="product-form" class="product-form">
          <label for="product-size">Size</label>
          <select id="product-size" name="size" required>
            ${product.sizes.length === 1 ? "" : '<option value="">Select a size</option>'}
            ${product.sizes.map((size) => `<option>${size}</option>`).join("")}
          </select>
          <button class="button" type="submit">Add to bag</button>
        </form>
        <details><summary>Composition &amp; care</summary><p>${product.care}</p></details>
        <details><summary>Size &amp; fit</summary><p><a href="#sizing">View the size guide</a></p></details>
        <details><summary>Delivery &amp; returns</summary><p><a href="#shipping">View shipping and returns information</a></p></details>
      </div>
    </div>
  </section>`;
  page.querySelector("#product-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const size = new FormData(event.target).get("size");
    if (!product.sizes.includes(size)) return;
    const line = bag.find((item) => item.id === product.id && item.size === size);
    if (!line) bag.push({ id: product.id, size, quantity: 1 });
    else if (line.quantity < 99) line.quantity += 1;
    syncBag();
    showPanel("bag");
  });
}

function renderRoute(moveFocus = false) {
  const hash = location.hash.slice(1);
  if (hash === "main") return;
  const [route, id] = hash.split("/");
  const product = route === "product" && products.find((item) => item.id === id);
  const collection = route === "shop" && Object.hasOwn(collections, id) && collections[id];
  const info = Object.hasOwn(information, route) && information[route];
  const isHome = route === "" || route === "home";
  home.hidden = !isHome;
  page.hidden = isHome;
  let title = "The Aegean Collection";
  let activePath = "";

  if (product) {
    detail(product);
    title = product.name;
    activePath = `shop/${product.group}`;
  } else if (collection) {
    shop(id);
    title = collection.name;
    activePath = hash;
  } else if (info) {
    title = info.name;
    activePath = hash;
    page.innerHTML = `<section class="info-page">${breadcrumb(title)}<div class="page-heading"><h1>${title}</h1></div><div class="info-body">${info.body}</div></section>`;
  } else if (!isHome) {
    title = "Page unavailable";
    page.innerHTML = `<section class="info-page"><div class="page-heading"><h1>${title}</h1></div><a class="button" href="#shop/all">Explore the collection</a></section>`;
  }
  document.title = `Osha Kateri | ${title}`;
  document.querySelectorAll(".main-nav a").forEach((link) => {
    if (link.hash === `#${activePath}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (moveFocus) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}

function syncBag() {
  save(bagKey, bag);
  const count = bag.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("bag-count").textContent = count;
  document.querySelector(".bag-button").setAttribute("aria-label", `Shopping bag, ${count} ${count === 1 ? "item" : "items"}`);
}

function bagTotal() {
  return bag.reduce((sum, item) => sum + item.quantity * products.find(({ id }) => id === item.id).price, 0);
}

function bagContents() {
  if (!bag.length) {
    return '<p>Your shopping bag is empty.</p><a class="button" href="#shop/all">Explore the collection</a>';
  }
  const rows = bag.map((item, index) => {
    const product = products.find(({ id }) => id === item.id);
    return `<div class="row-item">
      <a href="#product/${product.id}" aria-label="${product.name}"><img src="${photo(product)}" alt=""></a>
      <div><h3><a href="#product/${product.id}">${product.name}</a></h3><p>${item.size} · ${currency.format(product.price)}</p>
      <div class="quantity">
        <button type="button" data-index="${index}" data-change="-1" aria-label="Decrease quantity for ${product.name}" ${item.quantity === 1 ? "disabled" : ""}>−</button>
        <span>${item.quantity}</span>
        <button type="button" data-index="${index}" data-change="1" aria-label="Increase quantity for ${product.name}" ${item.quantity === 99 ? "disabled" : ""}>+</button>
        <button type="button" data-index="${index}" data-change="0" aria-label="Remove ${product.name}">Remove</button>
      </div></div>
    </div>`;
  });
  return `${rows.join("")}<div class="bag-total"><strong>Subtotal</strong><span>${currency.format(bagTotal())}</span></div>
    <button class="button" type="button" data-panel="checkout">Preview checkout</button>
    <p class="preview-note">Online ordering is currently unavailable.</p>`;
}

function searchResults(query) {
  const target = document.getElementById("search-results");
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = tokens.length ? products.filter((product) => {
    const searchable = [product.name, product.color, product.type, collections[product.group].name, product.description].join(" ").toLowerCase();
    return tokens.every((token) => searchable.includes(token));
  }) : products.slice(0, 3);
  target.innerHTML = matches.length ? matches.map((product) => `<a class="row-item" href="#product/${product.id}">
    <img src="${photo(product)}" alt=""><div><h3>${product.name}</h3><small>${currency.format(product.price)}</small></div>
  </a>`).join("") : "<p>No pieces found. Try a material, color or product name.</p>";
  status.textContent = tokens.length ? `${matches.length} search results` : "";
}

function showPanel(panel) {
  const titles = { menu: "Menu", search: "Search", bag: "Shopping Bag", checkout: "Order Preview" };
  drawerTitle.textContent = titles[panel];
  if (panel === "menu") {
    drawerContent.innerHTML = `<nav class="drawer-nav" aria-label="Mobile navigation">
      ${Object.entries(collections).map(([id, collection]) => `<a href="#shop/${id}">${collection.name}</a>`).join("")}
      <a href="#house">The House</a><a href="#lookbook">Lookbook</a><a href="#contact">Client Services</a>
    </nav>`;
  } else if (panel === "search") {
    drawerContent.innerHTML = `<div class="drawer-search">
      <label for="search-input">Search the collection</label><input id="search-input" type="search" placeholder="Try linen or tailoring" autocomplete="off">
    </div><div class="search-results" id="search-results"></div>`;
    drawerContent.querySelector("input").addEventListener("input", (event) => searchResults(event.target.value));
    searchResults("");
  } else if (panel === "checkout") {
    drawerContent.innerHTML = `<div class="preview-layout">
      <p>Check the items in your bag before returning to the collection.</p>
      <ul>${bag.map((item) => `<li>${products.find(({ id }) => id === item.id).name} · ${item.size} × ${item.quantity}</li>`).join("")}</ul>
      <p><strong>Subtotal ${currency.format(bagTotal())}</strong></p>
      <p class="preview-note">Online ordering is currently unavailable.</p>
      <button class="button" type="button" data-panel="bag">Back to bag</button>
    </div>`;
  } else {
    drawerContent.innerHTML = bagContents();
  }

  if (!drawer.open) drawer.showModal();
  if (panel === "search") drawerContent.querySelector("input").focus();
  else drawer.querySelector('[aria-label="Close panel"]').focus();
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-panel]");
  if (trigger) showPanel(trigger.dataset.panel);

  if (event.target.closest('.drawer a[href^="#"]')) drawer.close();

  const quantity = event.target.closest("[data-change]");
  if (quantity) {
    const index = Number(quantity.dataset.index);
    const change = Number(quantity.dataset.change);
    const item = bag[index];
    if (change === 0) bag.splice(index, 1);
    else item.quantity += change;
    syncBag();
    drawerContent.innerHTML = bagContents();
    const buttons = drawerContent.querySelectorAll(`[data-index="${index}"]:not([disabled])`);
    const next = [...buttons].find((button) => Number(button.dataset.change) === change) ?? buttons[0] ?? drawerContent.querySelector("a, button");
    next?.focus();
    status.textContent = "Shopping bag updated.";
  }

  if (event.target === drawer) {
    const bounds = drawer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right) drawer.close();
  }
});

document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
});

document.getElementById("newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("newsletter-email");
  const message = document.getElementById("newsletter-status");
  const email = input.value.trim().toLowerCase();
  const saved = readStoredArray(newsletterKey);
  if (saved.includes(email)) {
    message.textContent = "This email is already saved in this browser.";
  } else if (save(newsletterKey, [...saved, email])) {
    message.textContent = "Your preview signup was saved in this browser.";
    event.target.reset();
  } else {
    message.textContent = "This browser could not save your signup.";
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("featured-products").innerHTML = products.slice(0, 3).map(productCard).join("");
window.addEventListener("hashchange", () => renderRoute(true));
syncBag();
renderRoute();
