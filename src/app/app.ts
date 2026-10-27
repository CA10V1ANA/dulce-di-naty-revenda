import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

interface BrownieProduct {
  id: string;
  name: string;
  note: string;
  image: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('orderDialog') private orderDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('infoDialog') private infoDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('flavorShowcase') private flavorShowcase!: ElementRef<HTMLElement>;
  private rotationTimer?: ReturnType<typeof setInterval>;
  private showcaseObserver?: IntersectionObserver;
  private revealObserver?: IntersectionObserver;
  private showcaseVisible = false;
  private showcaseHovered = false;
  private showcaseFocused = false;
  autoplay = true;
  activeFlavorIndex = 1;

  readonly whatsappNumber = '5585998116002';
  readonly minimumOrder = 15;
  readonly currentYear = new Date().getFullYear();
  readonly products: BrownieProduct[] = [
    { id: 'ninho', name: 'Ninho', note: 'Recheio cremoso de leite Ninho', image: 'assets/ninho.webp' },
    { id: 'brigadeiro', name: 'Brigadeiro', note: 'Brigadeiro tradicional cremoso', image: 'assets/brigadeiro.webp' },
    { id: 'dois-amores', name: '2 Amores', note: 'Chocolate e Ninho', image: 'assets/dois-amores.webp' },
    { id: 'crocante', name: 'Crocante', note: 'Crocante de amendoim', image: 'assets/crocante.webp' },
    { id: 'ovomaltine', name: 'Ovo Maltine', note: 'Cremoso com crocância de Ovomaltine', image: 'assets/showcase-ovomaltine.webp' },
  ];

  cart: Record<string, number> = {};
  selectedProduct = this.products[0];
  modalQuantity = 1;

  get featuredProduct(): BrownieProduct { return this.products[this.activeFlavorIndex]; }

  showcaseImage(product: BrownieProduct): string { return `assets/showcase-${product.id}.webp`; }

  ngAfterViewInit(): void {
    this.autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if ('IntersectionObserver' in window) {
      this.showcaseObserver = new IntersectionObserver(([entry]) => {
        this.showcaseVisible = entry.isIntersecting;
      }, { threshold: 0.25 });
      this.showcaseObserver.observe(this.flavorShowcase.nativeElement);
    } else {
      this.showcaseVisible = true;
    }
    this.startRotation();
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('visible'));
      return;
    }

    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this.revealObserver?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    elements.forEach((element) => this.revealObserver?.observe(element));
  }

  ngOnDestroy(): void {
    clearInterval(this.rotationTimer);
    this.showcaseObserver?.disconnect();
    this.revealObserver?.disconnect();
  }

  get totalUnits(): number { return Object.values(this.cart).reduce((total, quantity) => total + quantity, 0); }
  get missingUnits(): number { return Math.max(0, this.minimumOrder - this.totalUnits); }
  get progress(): number { return Math.min(100, (this.totalUnits / this.minimumOrder) * 100); }

  private startRotation(): void {
    clearInterval(this.rotationTimer);
    if (!this.autoplay) return;
    this.rotationTimer = setInterval(() => {
      if (!this.showcaseVisible || this.showcaseHovered || this.showcaseFocused || document.hidden ||
        this.orderDialog.nativeElement.open || this.infoDialog.nativeElement.open) return;
      this.activeFlavorIndex = (this.activeFlavorIndex + 1) % this.products.length;
    }, 6000);
  }

  chooseFlavor(index: number): void {
    this.activeFlavorIndex = index;
    this.startRotation();
  }

  toggleAutoplay(): void {
    this.autoplay = !this.autoplay;
    this.startRotation();
  }

  setShowcaseHovered(hovered: boolean): void { this.showcaseHovered = hovered; }

  setShowcaseFocused(event: FocusEvent): void {
    this.showcaseFocused = event.type === 'focusin' ||
      (event.relatedTarget instanceof Node && this.flavorShowcase.nativeElement.contains(event.relatedTarget));
  }

  selectProduct(product: BrownieProduct): void {
    this.selectedProduct = product;
    this.modalQuantity = this.cart[product.id] || 1;
  }

  openOrder(product = this.selectedProduct): void {
    this.selectProduct(product);
    this.orderDialog.nativeElement.showModal();
  }

  closeOrder(): void { this.orderDialog.nativeElement.close(); }
  openInfo(): void { this.infoDialog.nativeElement.showModal(); }
  closeInfo(): void { this.infoDialog.nativeElement.close(); }

  closeOnBackdrop(event: MouseEvent, dialog: HTMLDialogElement): void {
    if (event.target === dialog) dialog.close();
  }

  changeQuantity(delta: number): void { this.modalQuantity = Math.max(1, Math.min(99, this.modalQuantity + delta)); }
  addSelectedProduct(): void { this.cart = { ...this.cart, [this.selectedProduct.id]: this.modalQuantity }; }

  removeProduct(productId: string): void {
    const nextCart = { ...this.cart };
    delete nextCart[productId];
    this.cart = nextCart;
    if (this.selectedProduct.id === productId) this.modalQuantity = 1;
  }

  sendWhatsApp(): void {
    const items = this.products.filter(product => (this.cart[product.id] || 0) > 0)
      .map(product => `• ${product.name}: ${this.cart[product.id]} unidade(s)`).join('\n');
    const message = `Olá, Natália! Montei esta solicitação de brownies para revenda:\n\n${items}\n\nPode me enviar a cotação e confirmar os recheios disponíveis?`;
    window.open(`https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  contactWhatsApp(): void {
    const message = 'Olá, Natália! Conheci a Dulce di Naty e gostaria de saber mais sobre a revenda de brownies e receber uma cotação.';
    window.open(`https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }
}

