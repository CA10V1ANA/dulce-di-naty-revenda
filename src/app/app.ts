import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';

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
  @ViewChild('spinStage') private spinStage?: ElementRef<HTMLElement>;
  @ViewChild('spinner') private spinner?: ElementRef<HTMLElement>;
  private readonly zone = inject(NgZone);
  private spinAngle = -25;
  private spinVelocity = 0;
  private spinDragging = false;
  private spinLastX = 0;
  private spinFrame = 0;
  private spinCleanup: Array<() => void> = [];
  @ViewChild('orderDialog') private orderDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('infoDialog') private infoDialog!: ElementRef<HTMLDialogElement>;

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
  activeFlavorIndex = 0;
  selectedProduct = this.products[0];
  modalQuantity = 1;
  menuOpen = false;

  get featuredProduct(): BrownieProduct { return this.products[this.activeFlavorIndex]; }
  get totalUnits(): number { return Object.values(this.cart).reduce((total, quantity) => total + quantity, 0); }
  get missingUnits(): number { return Math.max(0, this.minimumOrder - this.totalUnits); }
  get progress(): number { return Math.min(100, (this.totalUnits / this.minimumOrder) * 100); }

  showcaseImage(product: BrownieProduct): string { return `assets/showcase-${product.id}.webp`; }

  chooseFlavor(index: number): void {
    this.activeFlavorIndex = index;
    this.selectedProduct = this.products[index];
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }

  selectProduct(product: BrownieProduct): void {
    this.selectedProduct = product;
    this.activeFlavorIndex = this.products.findIndex(item => item.id === product.id);
    this.modalQuantity = 1;
  }

  openOrder(product = this.featuredProduct): void {
    this.selectProduct(product);
    this.orderDialog.nativeElement.showModal();
  }

  closeOrder(): void { this.orderDialog.nativeElement.close(); }
  openInfo(): void { this.infoDialog.nativeElement.showModal(); }
  closeInfo(): void { this.infoDialog.nativeElement.close(); }

  closeOnBackdrop(event: MouseEvent, dialog: HTMLDialogElement): void {
    if (event.target === dialog) dialog.close();
  }

  changeQuantity(delta: number): void {
    this.modalQuantity = Math.max(1, Math.min(99, this.modalQuantity + delta));
  }

  addSelectedProduct(): void {
    this.cart = {
      ...this.cart,
      [this.selectedProduct.id]: (this.cart[this.selectedProduct.id] || 0) + this.modalQuantity,
    };
    this.modalQuantity = 1;
  }

  removeProduct(productId: string): void {
    const nextCart = { ...this.cart };
    delete nextCart[productId];
    this.cart = nextCart;
    if (this.selectedProduct.id === productId) this.modalQuantity = 1;
  }

  sendWhatsApp(): void {
    const items = this.products
      .filter(product => (this.cart[product.id] || 0) > 0)
      .map(product => `• ${product.name}: ${this.cart[product.id]} unidade(s)`)
      .join('\n');
    const message = `Olá, Natália! Montei esta solicitação de brownies para revenda:\n\n${items}\n\nPode me enviar a cotação e confirmar os recheios disponíveis?`;
    window.open(`https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  ngAfterViewInit(): void {
    const stage = this.spinStage?.nativeElement;
    const spinner = this.spinner?.nativeElement;
    if (!stage || !spinner || typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const autoSpeed = reducedMotion ? 0 : 0.45; // graus por quadro

    this.zone.runOutsideAngular(() => {
      const onDown = (event: PointerEvent) => {
        this.spinDragging = true;
        this.spinLastX = event.clientX;
        this.spinVelocity = 0;
        stage.classList.add('dragging');
        stage.setPointerCapture(event.pointerId);
      };
      const onMove = (event: PointerEvent) => {
        if (!this.spinDragging) return;
        const delta = (event.clientX - this.spinLastX) * 0.6;
        this.spinLastX = event.clientX;
        this.spinAngle += delta;
        this.spinVelocity = delta;
      };
      const onUp = (event: PointerEvent) => {
        if (!this.spinDragging) return;
        this.spinDragging = false;
        stage.classList.remove('dragging');
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      };

      stage.addEventListener('pointerdown', onDown);
      stage.addEventListener('pointermove', onMove);
      stage.addEventListener('pointerup', onUp);
      stage.addEventListener('pointercancel', onUp);
      this.spinCleanup.push(() => {
        stage.removeEventListener('pointerdown', onDown);
        stage.removeEventListener('pointermove', onMove);
        stage.removeEventListener('pointerup', onUp);
        stage.removeEventListener('pointercancel', onUp);
      });

      const tick = () => {
        if (!this.spinDragging) {
          // Inércia do arraste, voltando suavemente para a rotação automática
          if (Math.abs(this.spinVelocity) > autoSpeed) {
            this.spinVelocity *= 0.95;
          } else {
            const direction = Math.sign(this.spinVelocity) || 1;
            this.spinVelocity += (direction * autoSpeed - this.spinVelocity) * 0.05;
          }
          this.spinAngle += this.spinVelocity;
        }
        const radians = (this.spinAngle * Math.PI) / 180;
        spinner.style.transform = `rotateX(${(Math.sin(radians) * 4).toFixed(2)}deg) rotateY(${this.spinAngle.toFixed(2)}deg)`;
        stage.style.setProperty('--shadow-scale', (0.7 + Math.abs(Math.cos(radians)) * 0.3).toFixed(3));
        this.spinFrame = requestAnimationFrame(tick);
      };
      this.spinFrame = requestAnimationFrame(tick);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.spinFrame);
    this.spinCleanup.forEach(cleanup => cleanup());
  }

  contactWhatsApp(): void {
    const message = 'Olá, Natália! Conheci a Dulce di Naty e gostaria de saber mais sobre a revenda de brownies e receber uma cotação.';
    window.open(`https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }
}
