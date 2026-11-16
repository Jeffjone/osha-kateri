import { products, collections, menus, image, getProduct, money, collectionProducts, findProducts } from "./catalog.js";
import { icon, escapeHtml, readStorage, writeStorage } from "./icons.js";
import { accountPage, bindAccount, signedInProfile } from "./account.js";

const main = document.querySelector("#main");
const home = document.querySelector("#home");
const page = document.querySelector("#page");
const header = document.querySelector("#site-header");
const mega = document.querySelector("#mega-menu");
const drawer = document.querySelector("#drawer");
const drawerTitle = document.querySelector("#drawer-title");
const drawerContent = document.querySelector("#drawer-content");
const searchPanel = document.querySelector("#search-panel");
const searchInput = document.querySelector("#search-input");
const suggest = document.querySelector("#search-results");
const clearSearch = document.querySelector("#clear-search");
const status = document.querySelector("#store-status");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const hoverPointer = matchMedia("(hover: hover) and (pointer: fine)");
const bagKey = "osha-kateri.bag.v1";
const wishKey = "osha-kateri.wishlist.v1";
const newsletterKey = "osha-kateri.newsletter.v1";
const scrollPositions = new Map();
const shopSelections = new Map();

let bag = loadBag();
let wishlist = loadWishlist();
let drawerMode = "";
let activeMenu = "";
let pinnedMenu = "";
let menuTimer;
let currentHash = location.hash;

function loadBag() {
  const value = readStorage(bagKey, []);
  if (!Array.isArray(value)) return [];
  return value.filter((line) => {
    const product = line && getProduct(line.id);
    return product && product.sizes.includes(line.size) && Number.isSafeInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99;
  });
}

function loadWishlist() {
  const value = readStorage(wishKey, []);
  return Array.isArray(value) ? [...new Set(value.filter(getProduct))] : [];
}

function breadcrumb(label, collection) {
  const parent = collection ? `<a href="#shop/${collection}">${collections[collection].name}</a><span aria-hidden="true">/</span>` : "";
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span aria-hidden="true">/</span>${parent}<span aria-current="page">${label}</span></nav>`;
}

function wishButton(product) {
  const selected = wishlist.includes(product.id);
  return `<button type="button" class="icon-button wish-button" data-wish="${product.id}" aria-label="${selected ? "Remove from wishlist" : "Add to wishlist"}: ${product.name}" aria-pressed="${selected}">${icon("heart")}</button>`;
}

function productCard(product) {
  return `<article class="product-card">
    <a class="product" href="#product/${product.id}">
      <span class="product-image"><img src="${image(product.id)}" alt="" loading="lazy"></span>
      <div class="product-caption"><h3>${product.name}</h3><p>${money(product.price)}</p><p class="product-color">${product.color}</p></div>
    </a>${wishButton(product)}
  </article>`;
}

function menuColumns(menu) {
  return menu.columns.map(([title, links]) => `<div class="menu-column"><h3>${title}</h3>
    ${links.map(([text, path]) => `<a href="#${path}">${text}</a>`).join("")}</div>`).join("");
}

function menuFeatures(menu) {
  return menu.features.map(([text, path, photo]) => `<a class="menu-feature" href="#${path}"><img src="${image(photo)}" alt=""><span>${text}</span></a>`).join("");
}

function openMenu(id) {
  clearTimeout(menuTimer);
  if (activeMenu === id) return;
  activeMenu = id;
  mega.innerHTML = `<div class="mega-columns">${menuColumns(menus[id])}</div><div class="mega-features">${menuFeatures(menus[id])}</div>`;
  mega.hidden = false;
  header.classList.add("menu-open");
  header.querySelectorAll("[data-menu]").forEach((button) => button.setAttribute("aria-expanded", String(button.dataset.menu === id)));
}

function closeMenu(restore = false) {
  clearTimeout(menuTimer);
  if (!activeMenu) return;
  const trigger = header.querySelector(`[data-menu="${activeMenu}"]`);
  activeMenu = "";
  pinnedMenu = "";
  mega.hidden = true;
  header.classList.remove("menu-open");
  trigger.setAttribute("aria-expanded", "false");
  if (restore) trigger.focus();
}

header.querySelectorAll("[data-menu]").forEach((button) => {
  button.addEventListener("pointerenter", () => {
    if (!hoverPointer.matches) return;
    clearTimeout(menuTimer);
    menuTimer = setTimeout(() => openMenu(button.dataset.menu), 90);
  });
  button.addEventListener("pointerleave", () => clearTimeout(menuTimer));
  button.addEventListener("click", () => {
    const id = button.dataset.menu;
    if (activeMenu === id && pinnedMenu === id) closeMenu();
    else {
      openMenu(id);
      pinnedMenu = id;
    }
  });
  button.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    openMenu(button.dataset.menu);
    mega.querySelector("a")?.focus();
  });
});

header.addEventListener("pointerleave", () => {
  if (!hoverPointer.matches) return;
  menuTimer = setTimeout(() => {
    if (!mega.contains(document.activeElement)) closeMenu();
  }, 140);
});
header.addEventListener("pointerenter", () => clearTimeout(menuTimer));
header.addEventListener("focusout", (event) => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) closeMenu();
});
header.querySelector('a[href="#shop/gifting"]').addEventListener("pointerenter", () => closeMenu());

function shopPage(collection, group, query = "") {
  const items = group === "search" ? findProducts(query) : collectionProducts(collection);
  const types = [...new Set(items.map((item) => item.type))];
  const sizes = [...new Set(items.flatMap((item) => item.sizes))];
  const tabs = ["all", "men", "women", "accessories", "melania"];
  const safeQuery = escapeHtml(query);
  const filter = (name, options) => {
    const id = name.toLowerCase();
    return `<div><label for="filter-${id}">${name}</label><select id="filter-${id}" name="${id}"><option value="">All</option>
      ${options.map((value) => `<option>${value}</option>`).join("")}</select></div>`;
  };
  page.innerHTML = `<section class="shop-page">
    ${breadcrumb(collection.name)}
    <div class="shop-heading"><h1>${collection.name}</h1>
      ${group === "search" ? `<p>Results for “${safeQuery}”</p>` : `<p>${collection.description}</p>`}
      ${group === "search" ? "" : `<nav class="shop-tabs" aria-label="Collections">${tabs.map((id) => `<a href="#shop/${id}" ${id === group ? 'aria-current="page"' : ""}>${id === "all" ? "View all" : collections[id].name}</a>`).join("")}</nav>`}
    </div>
    <div class="shop-controls">
      <details id="shop-filters"><summary>Filters ${icon("chevron")}</summary>
        <form class="filters-form" id="filters-form">${filter("Category", types)}${filter("Size", sizes)}<button type="reset" class="text-link">Clear filters</button></form>
      </details>
      <span id="shop-count" role="status"></span>
      <label class="sort-control"><span class="visually-hidden">Sort by</span><select id="sort-products"><option value="featured">Sort by</option><option value="price-up">Price, low to high</option><option value="price-down">Price, high to low</option><option value="name">Name, A to Z</option></select></label>
    </div>
    <div class="product-grid" id="collection-products"></div>
  </section>`;
  const sort = page.querySelector("#sort-products");
  const form = page.querySelector("#filters-form");
  const grid = page.querySelector("#collection-products");
  const selection = shopSelections.get(currentHash);
  if (selection) {
    sort.value = selection.sort;
    form.elements.category.value = selection.category;
    form.elements.size.value = selection.size;
  }
  function updateGrid() {
    const category = form.elements.category.value;
    const size = form.elements.size.value;
    shopSelections.set(currentHash, { category, size, sort: sort.value });
    const sorted = items.filter((item) => (!category || item.type === category) && (!size || item.sizes.includes(size)));
    if (sort.value === "price-up") sorted.sort((a, b) => a.price - b.price);
    if (sort.value === "price-down") sorted.sort((a, b) => b.price - a.price);
    if (sort.value === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    page.querySelector("#shop-count").textContent = `${sorted.length} ${sorted.length === 1 ? "piece" : "pieces"}`;
    grid.innerHTML = sorted.length ? sorted.map(productCard).join("") : '<p class="grid-empty">No pieces match. Try a different search or filter.</p>';
  }
  sort.addEventListener("change", updateGrid);
  form.addEventListener("change", updateGrid);
  form.addEventListener("reset", (event) => {
    event.preventDefault();
    form.elements.category.value = "";
    form.elements.size.value = "";
    updateGrid();
  });
  updateGrid();
}

function productPage(product) {
  const related = products.filter((item) => item.id !== product.id).sort((a, b) => Number(b.group === product.group) - Number(a.group === product.group));
  page.innerHTML = `<section class="detail-page">
    ${breadcrumb(product.name, product.group)}
    <div class="detail-layout">
      <div class="gallery">
        <div class="gallery-thumbs" aria-label="Product images">
          <button class="gallery-thumb" type="button" data-gallery="full" aria-label="Full view" aria-pressed="true"><img src="${image(product.id)}" alt=""></button>
          <button class="gallery-thumb cropped" type="button" data-gallery="detail" aria-label="Fabric and construction detail" aria-pressed="false"><img src="${image(product.id)}" alt=""></button>
        </div>
        <div class="gallery-image"><img id="product-image" src="${image(product.id)}" alt="${product.name} in ${product.color}"></div>
      </div>
      <div class="detail-copy">
        <div class="detail-title"><h1>${product.name}</h1>${wishButton(product)}</div>
        <p class="detail-price">${money(product.price)}</p>
        <form id="product-form">
          <fieldset class="sizes">
            <legend>Size <a class="text-link" href="#sizing">Size guide</a></legend>
            ${product.sizes.map((size, index) => `<label><input type="radio" name="size" value="${size}" ${index === 0 ? "required" : ""} ${product.sizes.length === 1 ? "checked" : ""}><span>${size}</span></label>`).join("")}
          </fieldset>
          <p class="detail-color"><span>Color</span>${product.color}</p>
          <button class="button add-button" type="submit">Add to bag</button>
        </form>
        <details open><summary>Product details ${icon("chevron")}</summary><p>${product.description}</p></details>
        <details><summary>Composition &amp; care ${icon("chevron")}</summary><p>${product.care}</p></details>
        <details><summary>Delivery &amp; returns ${icon("chevron")}</summary><p><a class="text-link" href="#shipping">View shipping and returns information</a></p></details>
      </div>
    </div>
    <div class="related"><h2>Complete the look</h2><div class="product-grid">${related.slice(0, 3).map(productCard).join("")}</div></div>
  </section>`;
  page.querySelectorAll("[data-gallery]").forEach((button) => button.addEventListener("click", () => {
    page.querySelector(".gallery-image").classList.toggle("cropped", button.dataset.gallery === "detail");
    page.querySelectorAll("[data-gallery]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  }));
  page.querySelector("#product-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const size = new FormData(event.target).get("size");
    if (!product.sizes.includes(size)) return;
    bag = loadBagIfAvailable();
    const line = bag.find((item) => item.id === product.id && item.size === size);
    if (!line) bag.push({ id: product.id, size, quantity: 1 });
    else if (line.quantity < 99) line.quantity += 1;
    persistBag();
    showDrawer("bag");
  });
}

function infoPage(title, body) {
  page.innerHTML = `<section class="lined-page">${breadcrumb(title)}<div class="info-heading"><h1>${title}</h1></div><div class="info-body">${body}</div></section>`;
}

const information = {
  house: ["The House", `<div class="story-layout"><img src="${image("terrace")}" alt="Aegean collection tailoring on a Greek stone terrace">
    <div><p>Osha Kateri takes its cues from the Aegean. The colors of sunset on stone, the ease of an open collar and the texture of linen inform a wardrobe built around tailoring and ready-to-wear.</p>
    <p>The Aegean Collection pairs limestone and olive with deep mauve, moving from daylight to evening.</p><a class="text-link" href="#lookbook">View the campaign lookbook</a></div></div>`],
  shipping: ["Shipping & Returns", "<h2>Shipping</h2><p>This preview uses US dollars. Delivery estimates, shipping destinations and rates will be available when online ordering opens.</p><h2>Returns</h2><p>Return instructions and eligibility will be available when online ordering opens.</p>"],
  sizing: ["Size Guide", "<h2>Tailoring and dresses</h2><p>Numbered garment sizes use the European size system. Measure around the fullest part of the chest or bust and hips, and around the natural waist.</p><h2>Knitwear and shirts</h2><p>Lettered sizes run from XS to XL. For a relaxed fit, compare the silhouette with a similar garment you already own.</p>"],
  contact: ["Contact", '<p>Client service contact details will be available when the shop opens. In the meantime, see our <a class="text-link" href="#faq">FAQs</a>, <a class="text-link" href="#sizing">size guide</a> and <a class="text-link" href="#shipping">shipping and returns</a> information.</p>'],
  privacy: ["Privacy", "<p>This storefront preview stores your bag, wishlist, newsletter signup, and preview account details in this browser. Clear this site's browser data to remove them.</p>"],
  faq: ["Frequently Asked Questions", '<details open><summary>Can I place an order?</summary><p>The storefront supports a bag and checkout preview. Online ordering is currently unavailable.</p></details><details><summary>Where can I find size information?</summary><p>See our <a class="text-link" href="#sizing">size guide</a> and the fit notes on each product page.</p></details><details><summary>Where are saved items stored?</summary><p>Your wishlist is saved in the browser you are currently using.</p></details>']
};

function lookbook(womenswear) {
  const title = womenswear ? "The Melania Lookbook" : "Aegean After Dark";
  const photographs = womenswear ? ["evening", "chapter-women", "melania"] : ["terrace", "chapter-tailoring", "chapter-shirts"];
  const link = womenswear ? "melania" : "all";
  page.innerHTML = `<section class="lookbook">${breadcrumb(title)}
    <div class="lookbook-cover"><img src="${image(photographs[0])}" alt=""><div><p class="eyebrow">${womenswear ? "Womenswear" : "The Aegean Collection"}</p><h1>${title}</h1><a class="hero-link" href="#shop/${link}">Shop the collection</a></div></div>
    <div class="lookbook-photos">${photographs.slice(1).map((photo) => `<img src="${image(photo)}" alt="A look from ${title}" loading="lazy">`).join("")}</div>
  </section>`;
  return title;
}

function wishlistPage() {
  page.innerHTML = `<section class="lined-page wishlist-page">${breadcrumb("Wishlist")}
    <div class="info-heading"><h1>Wishlist</h1>${wishlist.length ? "" : '<p>Your wishlist is empty.</p><a class="button" href="#shop/all">Discover the collection</a>'}</div>
    ${wishlist.length ? `<div class="product-grid">${wishlist.map(getProduct).map(productCard).join("")}</div>` : ""}
  </section>`;
}

function refreshUtilities() {
  const count = bag.reduce((sum, item) => sum + item.quantity, 0);
  const bagCount = document.querySelector("#bag-count");
  const wishCount = document.querySelector("#wishlist-count");
  bagCount.hidden = !count;
  bagCount.textContent = count;
  wishCount.hidden = !wishlist.length;
  wishCount.textContent = wishlist.length;
  document.querySelector(".bag-button").setAttribute("aria-label", `Shopping bag, ${count} ${count === 1 ? "item" : "items"}`);
  document.querySelector("#header-wishlist").setAttribute("aria-label", wishlist.length ? `Wishlist, ${wishlist.length} saved` : "Wishlist");
  const account = document.querySelector("#account-link");
  const label = signedInProfile() ? "Account" : "Log in";
  account.querySelector("span").textContent = label;
  account.setAttribute("aria-label", label);
}

function updateWishButtons() {
  document.querySelectorAll("[data-wish]").forEach((button) => {
    const selected = wishlist.includes(button.dataset.wish);
    const product = getProduct(button.dataset.wish);
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute("aria-label", `${selected ? "Remove from wishlist" : "Add to wishlist"}: ${product.name}`);
  });
}

function toggleWishlist(id) {
  const product = getProduct(id);
  if (!product) return;
  if (Array.isArray(readStorage(wishKey, null))) wishlist = loadWishlist();
  const saved = wishlist.includes(id);
  wishlist = saved ? wishlist.filter((item) => item !== id) : [...wishlist, id];
  writeStorage(wishKey, wishlist);
  refreshUtilities();
  updateWishButtons();
  if (location.hash === "#wishlist") {
    wishlistPage();
    (page.querySelector(".wish-button, .info-heading a") ?? main).focus({ preventScroll: true });
  }
  status.textContent = `${product.name} ${saved ? "removed from" : "added to"} wishlist.`;
}

function loadBagIfAvailable() {
  return Array.isArray(readStorage(bagKey, null)) ? loadBag() : bag;
}

function persistBag() {
  writeStorage(bagKey, bag);
  refreshUtilities();
}

function total() {
  return bag.reduce((sum, line) => sum + getProduct(line.id).price * line.quantity, 0);
}

function lineItem(line) {
  const product = getProduct(line.id);
  const id = `${line.id}|${line.size}`;
  return `<article class="bag-line">
    <a href="#product/${line.id}" aria-label="${product.name}"><img src="${image(line.id)}" alt=""></a>
    <div><h3><a href="#product/${line.id}">${product.name}</a></h3><p>${product.color} · ${line.size}</p><p>${money(product.price * line.quantity)}</p>
      <div class="quantity">
        <button type="button" data-line="${id}" data-change="-1" aria-label="Decrease quantity for ${product.name}" ${line.quantity === 1 ? "disabled" : ""}>−</button>
        <span aria-label="Quantity">${line.quantity}</span>
        <button type="button" data-line="${id}" data-change="1" aria-label="Increase quantity for ${product.name}" ${line.quantity === 99 ? "disabled" : ""}>+</button>
        <button type="button" data-line="${id}" data-change="0" aria-label="Remove ${product.name}">Remove</button>
      </div>
    </div>
  </article>`;
}

function renderBag() {
  const count = bag.reduce((sum, line) => sum + line.quantity, 0);
  drawerTitle.textContent = `Your Shopping Bag (${count})`;
  if (!bag.length) {
    drawerContent.innerHTML = `<div class="empty-bag"><p>Your shopping bag is empty.</p><div>
      ${["tailoring", "knitwear", "shirts", "accessories"].map((id) => `<a class="outline-button" href="#shop/${id}">${collections[id].name}</a>`).join("")}</div></div>`;
    return;
  }
  const pairing = products.find((product) => !bag.some((line) => line.id === product.id));
  drawerContent.innerHTML = `<div class="bag-items">${bag.map(lineItem).join("")}
    ${pairing ? `<div class="pairing"><h3>Pair with</h3><a class="result-item" href="#product/${pairing.id}"><img src="${image(pairing.id)}" alt=""><span>${pairing.name}<small>${money(pairing.price)}</small></span></a></div>` : ""}</div>
    <div class="bag-footer"><div><strong>Subtotal</strong><span>${money(total())}</span></div><button class="button" type="button" data-panel="checkout">Preview checkout</button><p class="preview-note">Online ordering is currently unavailable.</p></div>`;
}

function renderCheckout() {
  drawerTitle.textContent = "Order Preview";
  drawerContent.innerHTML = `<div class="checkout"><h3>Order summary</h3>
    ${bag.map((line) => `<div class="checkout-line"><span>${getProduct(line.id).name}<small>${line.size} × ${line.quantity}</small></span><span>${money(getProduct(line.id).price * line.quantity)}</span></div>`).join("")}
    <div class="checkout-line"><strong>Subtotal</strong><strong>${money(total())}</strong></div>
    <p class="preview-note">Shipping, taxes and payment become available when online ordering opens.</p>
    <button type="button" class="button" data-panel="bag">Back to bag</button></div>`;
}

function showDrawer(mode) {
  closeMenu();
  if (searchPanel.open) searchPanel.close();
  drawerMode = mode;
  drawer.dataset.mode = mode;
  if (mode === "menu") {
    drawerTitle.textContent = "Menu";
    drawerContent.innerHTML = `<nav class="mobile-nav" aria-label="Mobile navigation">
      ${Object.values(menus).map((menu) => `<details name="mobile-navigation"><summary>${menu.label}<span aria-hidden="true"></span></summary><div class="mobile-submenu">${menuColumns(menu)}</div></details>`).join("")}
      <a href="#shop/gifting">Gifting</a><a href="#wishlist">Wishlist</a><a href="#account">Account</a>
    </nav>`;
  } else if (mode === "checkout" && bag.length) {
    renderCheckout();
  } else {
    drawerMode = "bag";
    drawer.dataset.mode = "bag";
    renderBag();
  }
  if (!drawer.open) drawer.showModal();
  drawer.querySelector('[aria-label="Close panel"]').focus();
}

function updateQuantity(button) {
  const [id, size] = button.dataset.line.split("|");
  const change = Number(button.dataset.change);
  bag = loadBagIfAvailable();
  const line = bag.find((item) => item.id === id && item.size === size);
  if (line) {
    if (change === 0) bag.splice(bag.indexOf(line), 1);
    else line.quantity = Math.min(99, Math.max(1, line.quantity + change));
    persistBag();
  }
  renderBag();
  const current = [...drawerContent.querySelectorAll("[data-line]:not([disabled])")].find((next) => next.dataset.line === button.dataset.line && next.dataset.change === button.dataset.change);
  (current ?? drawerContent.querySelector("button:not([disabled]), a") ?? drawer.querySelector(".icon-button")).focus();
  status.textContent = "Shopping bag updated.";
}

function searchRoute(query) {
  return `#search/${encodeURIComponent(query.trim())}`;
}

function renderSearch() {
  const query = searchInput.value.trim();
  clearSearch.hidden = !query;
  suggest.hidden = !query;
  if (!query) {
    suggest.replaceChildren();
    status.textContent = "";
    return;
  }
  const results = findProducts(query);
  const suggestions = [...new Set(results.flatMap((product) => [product.type, product.color]))].slice(0, 5);
  suggest.innerHTML = `<div class="search-suggestions"><h2>Suggestions</h2><a href="${escapeHtml(searchRoute(query))}">${escapeHtml(query)}</a>
    ${suggestions.map((value) => `<a href="${escapeHtml(searchRoute(value))}">${value}</a>`).join("")}</div>
    <div class="search-products"><h2>Products</h2>
      ${results.length ? results.slice(0, 4).map((product) => `<a class="result-item" href="#product/${product.id}"><img src="${image(product.id)}" alt=""><span>${product.name}<small>${money(product.price)}</small></span></a>`).join("") : "<p>No matching pieces. Try a material, color or product name.</p>"}
      ${results.length ? `<a class="text-link" href="${escapeHtml(searchRoute(query))}">View all results</a>` : ""}</div>`;
  status.textContent = `${results.length} matching ${results.length === 1 ? "piece" : "pieces"}.`;
}

function openSearch() {
  closeMenu();
  if (drawer.open) drawer.close();
  if (!searchPanel.open) searchPanel.showModal();
  searchInput.focus();
}

function decodeQuery(value) {
  try {
    return decodeURIComponent(value ?? "");
  } catch {
    return "";
  }
}

function renderRoute({ navigate = false } = {}) {
  currentHash = location.hash;
  const [route, id] = currentHash.slice(1).split("/");
  const collection = route === "shop" && Object.hasOwn(collections, id) && collections[id];
  const product = route === "product" && getProduct(id);
  const isHome = ["", "home", "collections", "main"].includes(route);
  const restoring = history.state?.oshaRoute === currentHash;
  home.hidden = !isHome;
  page.hidden = isHome;
  document.documentElement.classList.toggle("home-route", isHome);
  let title = "Aegean After Dark";

  if (collection) {
    shopPage(collection, id);
    title = collection.name;
  } else if (product) {
    productPage(product);
    title = product.name;
  } else if (route === "search") {
    title = "Search";
    shopPage({ name: title }, route, decodeQuery(id));
  } else if (route === "account") {
    const mode = id === "register" || id === "recover" ? id : "login";
    page.innerHTML = accountPage(mode, breadcrumb);
    bindAccount(page, renderRoute);
    title = page.querySelector("h1").textContent;
  } else if (route === "wishlist") {
    wishlistPage();
    title = "Wishlist";
  } else if (route === "lookbook") {
    title = lookbook(id === "women");
  } else if (Object.hasOwn(information, route)) {
    [title] = information[route];
    infoPage(...information[route]);
  } else if (!isHome) {
    title = "Page unavailable";
    infoPage(title, '<a class="button" href="#shop/all">Explore the collection</a>');
  }

  document.title = `Osha Kateri | ${title}`;
  refreshUtilities();
  updateHeader();
  if (!restoring) history.replaceState({ ...history.state, oshaRoute: currentHash }, "");
  if (route === "collections") jumpTo(chapters[1], false);
  else if (navigate) {
    window.scrollTo({ top: restoring ? (scrollPositions.get(currentHash) ?? 0) : 0, behavior: "instant" });
    main.focus({ preventScroll: true });
  }
}

function clickedOutsideDialog(event, dialog) {
  const { left, right, top, bottom } = dialog.getBoundingClientRect();
  return event.target === dialog && (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom);
}

document.addEventListener("click", (event) => {
  const panel = event.target.closest("[data-panel]");
  if (panel) {
    if (panel.dataset.panel === "search") openSearch();
    else showDrawer(panel.dataset.panel);
  }
  const wish = event.target.closest("[data-wish]");
  if (wish) toggleWishlist(wish.dataset.wish);
  const quantity = event.target.closest("[data-change]");
  if (quantity) updateQuantity(quantity);
  if (event.target.closest('.drawer a[href^="#"]') || clickedOutsideDialog(event, drawer)) drawer.close();
  if (event.target.closest('.search-panel a[href^="#"]') || clickedOutsideDialog(event, searchPanel)) searchPanel.close();
  if (!header.contains(event.target) || event.target.closest('a[href^="#"]')) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeMenu) closeMenu(true);
});

searchInput.addEventListener("input", renderSearch);
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  renderSearch();
  searchInput.focus();
});
document.querySelector("#close-search").addEventListener("click", () => searchPanel.close());
document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  searchPanel.close();
  location.hash = searchRoute(query);
});
drawer.addEventListener("close", () => { drawerMode = ""; });

document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
});

document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#newsletter-email");
  const message = document.querySelector("#newsletter-status");
  const email = input.value.trim().toLowerCase();
  const data = readStorage(newsletterKey, []);
  const saved = Array.isArray(data) ? data : [];
  if (saved.includes(email)) {
    message.textContent = "This email is already saved in this browser.";
  } else if (writeStorage(newsletterKey, [...saved, email])) {
    message.textContent = "Your preview signup was saved in this browser.";
    event.target.reset();
  } else {
    message.textContent = "This browser could not save your signup.";
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === bagKey || event.key === null) {
    bag = loadBag();
    if (drawer.open && drawerMode === "bag") renderBag();
    if (drawer.open && drawerMode === "checkout") showDrawer(bag.length ? "checkout" : "bag");
  }
  if (event.key === wishKey || event.key === null) {
    wishlist = loadWishlist();
    if (location.hash === "#wishlist") wishlistPage();
    else updateWishButtons();
  }
  refreshUtilities();
});

const chapters = [...home.querySelectorAll(".hero, .campaign-tile, .editorial"), document.querySelector(".site-footer")];
const chapterNames = ["Aegean After Dark", "Tailoring", "Women", "Knitwear", "Shirts", "Melania", "Client service"];
const chapterNav = document.querySelector("#campaign-nav");
chapterNav.innerHTML = chapterNames.map((name, index) => `<button type="button" aria-label="${name}" data-chapter="${index}"><span></span></button>`).join("");
const chapterButtons = [...chapterNav.querySelectorAll("button")];
let activeChapter = -1;
let scrolling = false;

function jumpTo(section, smooth = true, keepFocus = false) {
  if (!keepFocus) {
    if (!section.matches("a[href]")) section.tabIndex = -1;
    section.focus({ preventScroll: true });
  }
  section.scrollIntoView({ block: "start", behavior: smooth && !reducedMotion.matches ? "smooth" : "instant" });
}

function updateHeader() {
  const marker = header.offsetHeight / 2;
  if (!home.hidden) {
    const index = chapters.findIndex((section) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= marker && bounds.bottom > marker;
    });
    if (index !== -1 && index !== activeChapter) {
      activeChapter = index;
      chapterButtons.forEach((button, i) => {
        if (i === index) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    }
  }
  const overCampaign = !home.hidden && chapters.at(-1).getBoundingClientRect().top > marker;
  header.classList.toggle("over-campaign", overCampaign);
  chapterNav.classList.toggle("on-footer", !overCampaign);
}

window.addEventListener("scroll", () => {
  scrollPositions.set(currentHash, scrollY);
  if (scrolling) return;
  scrolling = true;
  requestAnimationFrame(() => {
    updateHeader();
    scrolling = false;
  });
}, { passive: true });
window.addEventListener("resize", updateHeader);

let wheelTotal = 0;
let lastWheel = 0;
let wheelLockedUntil = 0;
window.addEventListener("wheel", (event) => {
  const { deltaX, deltaY, deltaMode, ctrlKey, target } = event;
  if (home.hidden || reducedMotion.matches || !hoverPointer.matches || ctrlKey || drawer.open || searchPanel.open
      || activeMenu || !deltaY || Math.abs(deltaX) >= Math.abs(deltaY) || (target instanceof Element && target.closest("input, select, textarea"))) return;

  const footer = chapters.at(-1);
  const furthestScroll = document.documentElement.scrollHeight - innerHeight;
  if (activeChapter === chapters.length - 1
      && ((deltaY > 0 && scrollY < furthestScroll - 2) || (deltaY < 0 && footer.getBoundingClientRect().top < -2))) return;

  const destination = chapters[activeChapter + Math.sign(deltaY)];
  if (activeChapter < 0 || !destination) return;
  event.preventDefault();
  const now = performance.now();
  if (now < wheelLockedUntil) return;

  // Accumulate trackpad input within a gesture, then let the section settle.
  if (now - lastWheel > 150 || Math.sign(wheelTotal) !== Math.sign(deltaY)) wheelTotal = 0;
  lastWheel = now;
  wheelTotal += deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? innerHeight : 1);
  if (Math.abs(wheelTotal) < 46) return;
  wheelTotal = 0;
  wheelLockedUntil = now + 680;
  jumpTo(destination, true, true);
}, { passive: false });

window.addEventListener("hashchange", () => {
  closeMenu();
  if (drawer.open) drawer.close();
  if (searchPanel.open) searchPanel.close();
  renderRoute({ navigate: true });
});
chapterNav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chapter]");
  if (button) jumpTo(chapters[Number(button.dataset.chapter)], true, true);
});
document.querySelector(".hero-down").addEventListener("click", (event) => {
  event.preventDefault();
  jumpTo(chapters[1]);
});
document.querySelector(".back-to-top").addEventListener("click", () => {
  if (home.hidden) {
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "instant" : "smooth" });
  } else {
    jumpTo(chapters[0]);
  }
});

const frames = [...document.querySelectorAll(".campaign-frame")];
const motionButton = document.querySelector("#hero-motion");
let frame = 0;
let campaignPaused = false;
let campaignVisible = true;
let motionTimer;

function updateMotion() {
  clearInterval(motionTimer);
  const paused = campaignPaused || reducedMotion.matches;
  motionButton.hidden = reducedMotion.matches;
  motionButton.setAttribute("aria-label", paused ? "Play campaign" : "Pause campaign");
  motionButton.innerHTML = icon(paused ? "play" : "pause");
  home.classList.toggle("motion-paused", paused);
  if (paused || !campaignVisible || document.hidden) return;
  motionTimer = setInterval(() => {
    frames[frame].classList.remove("active");
    frame = (frame + 1) % frames.length;
    frames[frame].classList.add("active");
  }, 5400);
}

new IntersectionObserver(([entry]) => {
  campaignVisible = entry.isIntersecting;
  updateMotion();
}, { threshold: .35 }).observe(chapters[0]);
motionButton.addEventListener("click", () => {
  campaignPaused = !campaignPaused;
  updateMotion();
});
document.addEventListener("visibilitychange", updateMotion);
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    frames[frame].classList.remove("active");
    frame = 0;
    frames[frame].classList.add("active");
  }
  updateMotion();
});

document.querySelector("#year").textContent = new Date().getFullYear();
history.scrollRestoration = "manual";
renderRoute();
updateMotion();
