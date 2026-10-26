const WHATSAPP = "5585998116002";
const MINIMUM = 15;

// Substitua os nomes e descrições quando a Natália definir os recheios oficiais.
const products = [
  { id: "recheio-01", name: "Recheio 01", note: "Nome do recheio a confirmar", image: "assets/brownie-1.webp" },
  { id: "recheio-02", name: "Recheio 02", note: "Nome do recheio a confirmar", image: "assets/brownie-2.webp" },
  { id: "recheio-03", name: "Recheio 03", note: "Nome do recheio a confirmar", image: "assets/brownie-1.webp" }
];

const cart = Object.fromEntries(products.map(product => [product.id, 0]));
let selectedId = products[0].id;
let modalQuantity = 1;

const orderModal = document.querySelector("#order-modal");
const infoModal = document.querySelector("#info-modal");
const productGrid = document.querySelector("#product-grid");
const modalImage = document.querySelector("#modal-image");
const modalTitle = document.querySelector("#modal-title");
const modalDescription = document.querySelector("#modal-description");
const modalQty = document.querySelector("#modal-qty");
const summaryItems = document.querySelector("#summary-items");
const totalCount = document.querySelector("#total-count");
const progressBar = document.querySelector("#progress-bar");
const sendOrder = document.querySelector("#send-order");
const floatingCount = document.querySelector("#floating-count");

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

function openWhatsApp(message) {
  window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
}

function renderProducts() {
  productGrid.innerHTML = products.map((product, index) => `
    <button class="product-card reveal" style="--delay:${index * 70}ms" type="button" data-product="${product.id}" aria-label="Escolher ${product.name}">
      <span class="tag">Brownie de 100g</span>
      <img src="${product.image}" alt="Apresentação do ${product.name}" width="560" height="560" loading="lazy" />
      <span class="product-copy"><span><small>Opção de recheio</small><h3>${product.name}</h3></span><span aria-hidden="true">＋</span></span>
    </button>
  `).join("");
  observeReveals();
}

function selectProduct(id) {
  const product = products.find(item => item.id === id) || products[0];
  selectedId = product.id;
  modalQuantity = cart[id] || 1;
  modalImage.src = product.image;
  modalImage.alt = `Brownie ${product.name}`;
  modalTitle.textContent = product.name;
  modalDescription.textContent = `${product.note}. A base artesanal e o peso de 100g são os mesmos em todas as opções.`;
  modalQty.textContent = modalQuantity;
}

function openOrder(id = selectedId) {
  selectProduct(id);
  if (!orderModal.open) orderModal.showModal();
}

function cartTotal() {
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}

function renderSummary() {
  const selected = products.filter(product => cart[product.id] > 0);
  const total = cartTotal();
  const missing = Math.max(0, MINIMUM - total);
  totalCount.textContent = `${total} ${total === 1 ? "unidade" : "unidades"}`;
  floatingCount.textContent = total;
  progressBar.style.width = `${Math.min(100, total / MINIMUM * 100)}%`;
  sendOrder.disabled = total < MINIMUM;
  sendOrder.textContent = missing ? `Faltam ${missing} ${missing === 1 ? "unidade" : "unidades"}` : "Enviar pedido pelo WhatsApp ↗";

  if (!selected.length) {
    summaryItems.innerHTML = `<p class="empty">Escolha seus brownies. O mínimo é ${MINIMUM} unidades.</p>`;
    return;
  }

  summaryItems.innerHTML = selected.map(product => `
    <div class="summary-row">
      <strong>${product.name}</strong>
      <span>${cart[product.id]} un.</span>
      <button type="button" data-remove="${product.id}" aria-label="Remover ${product.name}">remover</button>
    </div>
  `).join("");
}

function observeReveals() {
  const elements = document.querySelectorAll(".reveal:not(.visible)");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach(element => element.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }), { threshold: .12 });
  elements.forEach(element => {
    if (element.dataset.delay) element.style.setProperty("--delay", `${element.dataset.delay}ms`);
    observer.observe(element);
  });
}

productGrid.addEventListener("click", event => {
  const card = event.target.closest("[data-product]");
  if (card) openOrder(card.dataset.product);
});

document.querySelectorAll("[data-open-order]").forEach(button => button.addEventListener("click", () => openOrder()));
document.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", () => orderModal.close()));
document.querySelectorAll("[data-open-info]").forEach(button => button.addEventListener("click", () => infoModal.showModal()));
document.querySelectorAll("[data-close-info]").forEach(button => button.addEventListener("click", () => infoModal.close()));

document.querySelector("#minus").addEventListener("click", () => {
  modalQuantity = Math.max(1, modalQuantity - 1);
  modalQty.textContent = modalQuantity;
});
document.querySelector("#plus").addEventListener("click", () => {
  modalQuantity = Math.min(99, modalQuantity + 1);
  modalQty.textContent = modalQuantity;
});
document.querySelector("#add-item").addEventListener("click", () => {
  cart[selectedId] = modalQuantity;
  renderSummary();
});

summaryItems.addEventListener("click", event => {
  const remove = event.target.closest("[data-remove]");
  if (!remove) return;
  cart[remove.dataset.remove] = 0;
  if (selectedId === remove.dataset.remove) {
    modalQuantity = 1;
    modalQty.textContent = 1;
  }
  renderSummary();
});

sendOrder.addEventListener("click", () => {
  const lines = products.filter(product => cart[product.id] > 0).map(product => `• ${product.name}: ${cart[product.id]} unidade(s)`);
  openWhatsApp(`Olá, Natália! Montei esta solicitação de brownies para revenda:\n\n${lines.join("\n")}\n\nPode me enviar a cotação e confirmar os recheios disponíveis?`);
});

document.querySelectorAll("[data-whatsapp]").forEach(button => button.addEventListener("click", () => {
  openWhatsApp("Olá, Natália! Conheci a Dulce di Naty e gostaria de saber mais sobre a revenda de brownies e receber uma cotação.");
}));

[orderModal, infoModal].forEach(dialog => dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
}));

document.querySelector("#year").textContent = new Date().getFullYear();
renderProducts();
renderSummary();
observeReveals();
