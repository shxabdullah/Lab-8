(() => {
  "use strict";

  const FALLBACK_PRODUCTS = {
    "arc-headphones": { id: "arc-headphones", name: "Arc Headphones", category: "Audio", priceCents: 12900, image: "/assets/product-headphones.png" },
    "day-bottle": { id: "day-bottle", name: "Day Bottle", category: "Hydration", priceCents: 3800, image: "/assets/product-bottle.png" },
    "field-pack": { id: "field-pack", name: "Field Pack", category: "Carry", priceCents: 9400, image: "/assets/product-backpack.png" },
    "tempo-runner": { id: "tempo-runner", name: "Tempo Runner", category: "Footwear", priceCents: 11200, image: "/assets/product-sneaker.png" },
  };
  let PRODUCTS = { ...FALLBACK_PRODUCTS };
  const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
  const STANDARD_SHIPPING_CENTS = 750;
  const TAX_RATE = 0.08;
  const CART_STORAGE_KEY = "north-pine-cart";
  const PRODUCT_PRESENTATION = {
    "arc-headphones": { imageClass: "product-cobalt", badge: "Bestseller", rating: "4.9", swatchClass: "cobalt-swatch", swatchLabel: "Cobalt" },
    "day-bottle": { imageClass: "product-apricot", badge: "New", rating: "4.8", swatchClass: "apricot-swatch", swatchLabel: "Apricot" },
    "field-pack": { imageClass: "product-cream", badge: "Few left", rating: "4.9", swatchClass: "cream-swatch", swatchLabel: "Natural canvas" },
    "tempo-runner": { imageClass: "product-blue", badge: "Staff pick", rating: "4.7", swatchClass: "white-swatch", swatchLabel: "White and blue" },
  };
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const money = (cents) => currency.format((cents || 0) / 100);
  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

  let sessionState = { user: null, signInUrl: "/signin-with-chatgpt?return_to=%2Fstore.html", signOutUrl: "/signout-with-chatgpt?return_to=%2Fstore.html" };
  let cartState = { items: [], subtotalCents: 0, shippingCents: 0, taxCents: 0, totalCents: 0 };
  let orderSubmitting = false;

  const cartCount = byId("cartCount");
  const cartButton = byId("cartButton");
  const cartItemLabel = byId("cartItemLabel");
  const cartLiveRegion = byId("cartLiveRegion");
  const emptyCart = byId("emptyCart");
  const cartContent = byId("cartContent");
  const cartItems = byId("cartItems");
  const shippingMessage = byId("shippingMessage");
  const shippingProgress = byId("shippingProgress");
  const checkoutButton = byId("checkoutButton");
  const accountButton = byId("accountButton");
  const accountLabel = byId("accountLabel");
  const accountEmail = byId("accountEmail");
  const authModal = byId("authModal");
  const checkoutModal = byId("checkoutModal");
  const checkoutForm = byId("checkoutForm");
  const orderSuccess = byId("orderSuccess");
  const placeOrderButton = byId("placeOrderButton");
  const checkoutCloseButton = byId("checkoutCloseButton");
  const toastElement = byId("storeToast");
  const productGrid = byId("productGrid");
  const productStatus = byId("productStatus");
  const storeToast = bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 2600 });

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      showAuth();
      throw new Error("Sign in to continue.");
    }
    if (!response.ok) throw new Error(data.error || "The store API could not complete that request.");
    return data;
  }

  function showAuth() {
    byId("signInLink").href = sessionState.signInUrl;
    bootstrap.Modal.getOrCreateInstance(authModal).show();
  }

  function announce(message) {
    cartLiveRegion.textContent = "";
    requestAnimationFrame(() => { cartLiveRegion.textContent = message; });
  }

  function showToast(message, icon = "bi-check-lg") {
    byId("toastMessage").textContent = message;
    toastElement.querySelector(".toast-icon i").className = `bi ${icon}`;
    storeToast.show();
  }

  function renderProducts(products) {
    productGrid.innerHTML = products.map((product) => {
      const presentation = PRODUCT_PRESENTATION[product.id] || {
        imageClass: "product-cream",
        badge: "New arrival",
        rating: "5.0",
        swatchClass: "cream-swatch",
        swatchLabel: product.category,
      };
      return `
        <div class="col-12 col-sm-6 col-lg-3">
          <article class="product-card" data-product-card="${escapeHtml(product.id)}">
            <div class="product-image-wrap ${presentation.imageClass}">
              <span class="product-badge">${presentation.badge}</span>
              <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" width="1254" height="1254" loading="lazy">
            </div>
            <div class="product-meta">
              <div class="d-flex justify-content-between gap-2"><span>${escapeHtml(product.category)}</span><span aria-label="Rated ${presentation.rating} out of 5"><i class="bi bi-star-fill" aria-hidden="true"></i> ${presentation.rating}</span></div>
              <h3>${escapeHtml(product.name)}</h3>
              <div class="d-flex justify-content-between align-items-center"><strong>${money(product.priceCents)}</strong><span class="swatch ${presentation.swatchClass}" aria-label="${escapeHtml(presentation.swatchLabel)}"></span></div>
            </div>
            <button class="btn add-button w-100" type="button" data-add-product="${escapeHtml(product.id)}"><span>Add to cart</span><i class="bi bi-plus-lg" aria-hidden="true"></i></button>
          </article>
        </div>`;
    }).join("");
    byId("shopTitle").innerHTML = `${products.length} favorites.<br>Zero filler.`;
    byId("productTotal").textContent = `${String(products.length).padStart(2, "0")} objects / responsibly packed`;
  }

  async function loadProducts() {
    productStatus.className = "small text-secondary mt-3";
    productStatus.textContent = "Loading products from the store APIâ€¦";
    try {
      const result = await api("/api/backend/products");
      if (!Array.isArray(result.products) || !result.products.length) throw new Error("No products are available.");
      PRODUCTS = Object.fromEntries(result.products.map((product) => [product.id, product]));
      renderProducts(result.products);
      productStatus.textContent = "";
    } catch (error) {
      PRODUCTS = { ...FALLBACK_PRODUCTS };
      renderProducts(Object.values(PRODUCTS));
      productStatus.className = "alert alert-warning mt-3";
      productStatus.textContent = `${error.message} Showing the built-in catalog until the backend is available.`;
    }
  }

  function calculateCart(entries) {
    const items = entries.flatMap((entry) => {
      const product = PRODUCTS[entry.id];
      const quantity = Math.min(20, Math.max(1, Number(entry.quantity) || 1));
      return product ? [{ ...product, quantity }] : [];
    });
    const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    const shippingCents = subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    return { items, subtotalCents, shippingCents, taxCents, totalCents: subtotalCents + shippingCents + taxCents };
  }

  function loadCart() {
    try {
      const savedItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      cartState = calculateCart(Array.isArray(savedItems) ? savedItems : []);
    } catch {
      cartState = calculateCart([]);
    }
  }

  function saveCart(entries) {
    cartState = calculateCart(entries);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState.items.map(({ id, quantity }) => ({ id, quantity }))));
    renderCart();
  }

  function renderAccount() {
    if (sessionState.user) {
      const firstName = (sessionState.user.name || sessionState.user.email).split(/[ @]/)[0];
      accountLabel.textContent = `Hi, ${firstName}`;
      accountEmail.textContent = sessionState.user.email;
      accountButton.removeAttribute("data-bs-target");
      accountButton.setAttribute("data-bs-toggle", "dropdown");
      accountButton.setAttribute("aria-expanded", "false");
    } else {
      accountLabel.textContent = "Sign up / Log in";
      accountEmail.textContent = "";
      accountButton.setAttribute("data-bs-toggle", "modal");
      accountButton.setAttribute("data-bs-target", "#authModal");
      accountButton.removeAttribute("aria-expanded");
    }
    byId("signInLink").href = sessionState.signInUrl;
  }

  function renderCart() {
    const entries = cartState.items || [];
    const quantity = entries.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = String(quantity);
    cartItemLabel.textContent = `(${quantity})`;
    cartButton.setAttribute("aria-label", `Open cart, ${quantity} ${quantity === 1 ? "item" : "items"}`);

    if (!entries.length) {
      emptyCart.classList.remove("d-none");
      cartContent.classList.add("d-none");
      cartContent.classList.remove("d-flex");
      cartItems.innerHTML = "";
    } else {
      emptyCart.classList.add("d-none");
      cartContent.classList.remove("d-none");
      cartContent.classList.add("d-flex");
      cartItems.innerHTML = entries.map((item) => `
        <article class="cart-item" data-cart-item="${item.id}">
          <div class="cart-item-image"><img src="${item.image}" alt="" width="88" height="88"></div>
          <div class="cart-item-info">
            <h3>${item.name}</h3><span>${item.category}</span>
            <div class="quantity-control" aria-label="Quantity for ${item.name}">
              <button type="button" data-cart-action="decrease" data-product-id="${item.id}" aria-label="Decrease ${item.name} quantity"><i class="bi bi-dash" aria-hidden="true"></i></button>
              <span aria-live="polite">${item.quantity}</span>
              <button type="button" data-cart-action="increase" data-product-id="${item.id}" aria-label="Increase ${item.name} quantity" ${item.quantity >= 20 ? "disabled" : ""}><i class="bi bi-plus" aria-hidden="true"></i></button>
            </div>
          </div>
          <div class="cart-item-side">
            <strong>${money(item.priceCents * item.quantity)}</strong>
            <button class="remove-item" type="button" data-cart-action="remove" data-product-id="${item.id}" aria-label="Remove ${item.name} from cart">Remove</button>
          </div>
        </article>
      `).join("");
    }

    byId("cartSubtotal").textContent = money(cartState.subtotalCents);
    byId("cartShipping").textContent = cartState.shippingCents === 0 && cartState.subtotalCents > 0 ? "Free" : money(cartState.shippingCents);
    byId("cartTax").textContent = money(cartState.taxCents);
    byId("cartTotal").textContent = money(cartState.totalCents);
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - cartState.subtotalCents);
    const progress = Math.min(100, (cartState.subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100);
    shippingProgress.style.width = `${progress}%`;
    shippingProgress.parentElement.setAttribute("aria-valuenow", String(Math.round(progress)));
    shippingMessage.textContent = remaining > 0 ? `Add ${money(remaining)} for free shipping` : "You unlocked free shipping";
    renderCheckoutSummary();
  }

  function renderCheckoutSummary() {
    byId("checkoutItems").innerHTML = (cartState.items || []).map((item) => `
      <div class="checkout-item">
        <div class="checkout-item-image"><img src="${item.image}" alt="" width="62" height="62"><span class="checkout-item-qty">${item.quantity}</span></div>
        <div class="checkout-item-info"><strong>${item.name}</strong><span>${item.category}</span></div>
        <strong>${money(item.priceCents * item.quantity)}</strong>
      </div>
    `).join("");
    byId("checkoutSubtotal").textContent = money(cartState.subtotalCents);
    byId("checkoutShipping").textContent = cartState.shippingCents === 0 && cartState.subtotalCents > 0 ? "Free" : money(cartState.shippingCents);
    byId("checkoutTax").textContent = money(cartState.taxCents);
    byId("checkoutTotal").textContent = money(cartState.totalCents);
  }

  async function loadStoreState() {
    await loadProducts();
    loadCart();
    renderCart();
    try {
      sessionState = await api("/api/session");
      renderAccount();
      prefillCheckout();
    } catch (error) {
      renderAccount();
      console.error(error);
    }
    registerWebMcpTools();
  }

  async function addToCart(productId, quantity = 1, options = {}) {
    if (!PRODUCTS[productId]) throw new Error("Unknown product.");
    const existing = cartState.items.find((item) => item.id === productId);
    const nextQuantity = Math.min(20, (existing?.quantity || 0) + quantity);
    saveCart([
      ...cartState.items.filter((item) => item.id !== productId),
      { id: productId, quantity: nextQuantity },
    ]);
    if (!options.silent) {
      showToast(`${PRODUCTS[productId].name} added to your cart.`);
      announce(`${PRODUCTS[productId].name} added to your cart.`);
    }
    return cartState;
  }

  async function updateCartItem(productId, quantity, options = {}) {
    if (!PRODUCTS[productId]) throw new Error("Unknown product.");
    const nextItems = cartState.items
      .filter((item) => item.id !== productId)
      .map(({ id, quantity: itemQuantity }) => ({ id, quantity: itemQuantity }));
    if (quantity > 0) nextItems.push({ id: productId, quantity: Math.min(20, quantity) });
    saveCart(nextItems);
    if (!options.silent) announce(quantity === 0 ? `${PRODUCTS[productId].name} removed.` : `Quantity updated to ${quantity}.`);
    return cartState;
  }

  function flashAddButton(button) {
    const label = button.querySelector("span");
    const icon = button.querySelector("i");
    const originalLabel = label.textContent;
    const originalIcon = icon.className;
    button.classList.add("is-added");
    label.textContent = "Added";
    icon.className = "bi bi-check-lg";
    setTimeout(() => {
      button.classList.remove("is-added");
      label.textContent = originalLabel;
      icon.className = originalIcon;
    }, 1200);
  }

  document.addEventListener("click", async (event) => {
    const addButton = event.target.closest("[data-add-product]");
    if (addButton) {
      addButton.disabled = true;
      try {
        await addToCart(addButton.dataset.addProduct);
        flashAddButton(addButton);
      } catch (error) {
        showToast(error.message, "bi-exclamation-circle");
      } finally {
        addButton.disabled = false;
      }
      return;
    }
    if (event.target.closest("[data-scroll-shop]")) {
      setTimeout(() => byId("shop").scrollIntoView({ behavior: "smooth" }), 250);
    }
  });

  cartItems.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;
    const id = button.dataset.productId;
    const item = cartState.items.find((entry) => entry.id === id);
    if (!item) return;
    button.disabled = true;
    try {
      if (button.dataset.cartAction === "increase") await updateCartItem(id, item.quantity + 1);
      if (button.dataset.cartAction === "decrease") await updateCartItem(id, item.quantity - 1);
      if (button.dataset.cartAction === "remove") {
        await updateCartItem(id, 0);
        showToast(`${PRODUCTS[id].name} removed.`, "bi-trash3");
      }
    } catch (error) {
      showToast(error.message, "bi-exclamation-circle");
    }
  });

  byId("logoutButton").addEventListener("click", () => {
    window.location.assign(sessionState.signOutUrl);
  });

  function prefillCheckout() {
    if (!sessionState.user) return;
    byId("checkoutEmail").value = sessionState.user.email || "";
    const names = (sessionState.user.name || "").trim().split(/\s+/);
    if (!byId("firstName").value) byId("firstName").value = names[0] || "";
    if (!byId("lastName").value && names.length > 1) byId("lastName").value = names.slice(1).join(" ");
  }

  function openCheckout() {
    if (!cartState.items.length) throw new Error("Your cart is empty.");
    renderCheckoutSummary();
    prefillCheckout();
    const drawerElement = byId("cartDrawer");
    const drawer = bootstrap.Offcanvas.getOrCreateInstance(drawerElement);
    const showModal = () => bootstrap.Modal.getOrCreateInstance(checkoutModal).show();
    if (drawerElement.classList.contains("show")) {
      drawerElement.addEventListener("hidden.bs.offcanvas", showModal, { once: true });
      drawer.hide();
    } else {
      showModal();
    }
    return { status: "checkout_opened", itemCount: cartState.items.reduce((sum, item) => sum + item.quantity, 0) };
  }

  checkoutButton.addEventListener("click", () => {
    try { openCheckout(); } catch (error) { showToast(error.message, "bi-exclamation-circle"); }
  });

  const cardNumber = byId("cardNumber");
  const cardExpiry = byId("cardExpiry");
  const cardCvc = byId("cardCvc");
  cardNumber.addEventListener("input", () => {
    const digits = cardNumber.value.replace(/\D/g, "").slice(0, 16);
    cardNumber.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  });
  cardExpiry.addEventListener("input", () => {
    const digits = cardExpiry.value.replace(/\D/g, "").slice(0, 4);
    cardExpiry.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  });
  cardCvc.addEventListener("input", () => {
    cardCvc.value = cardCvc.value.replace(/\D/g, "").slice(0, 4);
  });

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    checkoutForm.classList.add("was-validated");
    if (!checkoutForm.checkValidity()) {
      checkoutForm.querySelector(":invalid")?.focus();
      return;
    }

    orderSubmitting = true;
    checkoutForm.setAttribute("aria-busy", "true");
    checkoutCloseButton.disabled = true;
    placeOrderButton.disabled = true;
    placeOrderButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Saving order…';
    try {
      const firstName = byId("firstName").value.trim();
      const lastName = byId("lastName").value.trim();
      const result = await api("/api/backend/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: `${firstName} ${lastName}`.trim(),
          email: byId("checkoutEmail").value,
          address: byId("address").value,
          city: byId("city").value,
          country: byId("country").value,
          postalCode: byId("postalCode").value,
          items: cartState.items.map(({ id, quantity }) => ({ productId: id, quantity })),
        }),
      });
      byId("orderFirstName").textContent = firstName.split(/\s+/)[0] || "friend";
      byId("orderNumber").textContent = result.order.id;
      byId("orderTotal").textContent = money(result.order.totalCents);
      cartState = { items: [], subtotalCents: 0, shippingCents: 0, taxCents: 0, totalCents: 0 };
      localStorage.removeItem(CART_STORAGE_KEY);
      renderCart();
      checkoutForm.classList.add("d-none");
      orderSuccess.classList.add("is-visible");
      orderSuccess.querySelector("button").focus();
    } catch (error) {
      showToast(error.message, "bi-exclamation-circle");
    } finally {
      orderSubmitting = false;
      checkoutForm.removeAttribute("aria-busy");
      checkoutCloseButton.disabled = false;
      placeOrderButton.disabled = false;
      placeOrderButton.innerHTML = '<span>Place demo order</span><i class="bi bi-lock-fill ms-1" aria-hidden="true"></i>';
    }
  });

  checkoutModal.addEventListener("hide.bs.modal", (event) => {
    if (orderSubmitting) event.preventDefault();
  });
  checkoutModal.addEventListener("hidden.bs.modal", () => {
    if (orderSuccess.classList.contains("is-visible")) {
      orderSuccess.classList.remove("is-visible");
      checkoutForm.classList.remove("d-none", "was-validated");
      checkoutForm.reset();
      prefillCheckout();
    }
  });
  byId("continueShopping").addEventListener("click", () => {
    bootstrap.Modal.getOrCreateInstance(checkoutModal).hide();
    setTimeout(() => byId("shop").scrollIntoView({ behavior: "smooth" }), 250);
  });

  document.querySelectorAll("#mainNav a").forEach((link) => {
    link.addEventListener("click", () => {
      const collapse = byId("mainNav");
      if (collapse.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(collapse).hide();
    });
  });

  function registerWebMcpTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const tools = [
      {
        name: "list_products",
        title: "List products",
        description: "List the products available in the North & Pine storefront.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async () => (await api("/api/backend/products")).products,
      },
      {
        name: "get_cart",
        title: "Read shopping cart",
        description: "Read the browser's current shopping cart and totals.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async () => cartState,
      },
      {
        name: "add_product_to_cart",
        title: "Add product to cart",
        description: "Add a listed product to the browser's shopping cart.",
        inputSchema: {
          type: "object",
          properties: {
            productId: { type: "string", enum: Object.keys(PRODUCTS) },
            quantity: { type: "integer", minimum: 1, maximum: 20 },
          },
          required: ["productId"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (input) => addToCart(input.productId, input.quantity || 1),
      },
      {
        name: "update_cart_item",
        title: "Update cart item",
        description: "Set a product quantity in the browser's shopping cart. Use zero to remove it.",
        inputSchema: {
          type: "object",
          properties: {
            productId: { type: "string", enum: Object.keys(PRODUCTS) },
            quantity: { type: "integer", minimum: 0, maximum: 20 },
          },
          required: ["productId", "quantity"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (input) => updateCartItem(input.productId, input.quantity),
      },
      {
        name: "start_checkout",
        title: "Start checkout",
        description: "Open checkout for the browser's shopping cart.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async () => openCheckout(),
      },
    ];
    tools.forEach((tool) => {
      try { Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch {}
    });
  }

  renderCart();
  renderAccount();
  loadStoreState();
})();
