import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

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
export class App implements AfterViewInit {
  @ViewChild('orderDialog') private orderDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('infoDialog') private infoDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('productTrack') private productTrack?: ElementRef<HTMLElement>;

  readonly whatsappNumber = '5585998116002';
  readonly minimumOrder = 15;
  readonly currentYear = new Date().getFullYear();
  readonly products: BrownieProduct[] = [
    { id: 'ninho', name: 'Ninho', note: 'Recheio cremoso de leite Ninho', image: 'assets/brownie-1.webp' },
    { id: 'brigadeiro', name: 'Brigadeiro', note: 'Brigadeiro tradicional cremoso', image: 'assets/brownie-2.webp' },
    { id: 'dois-amores', name: '2 Amores', note: 'Chocolate e Ninho', image: 'assets/brownie-1.webp' },
    { id: 'ovomaltine', name: 'Ovo Maltine', note: 'Cremoso com crocância de Ovomaltine', image: 'assets/brownie-2.webp' },
    { id: 'crocante', name: 'Crocante', note: 'Crocante de amendoim', image: 'assets/brownie-1.webp' },
  ];

  cart: Record<string, number> = {};
  selectedProduct = this.products[0];
  modalQuantity = 1;

  ngAfterViewInit(): void {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    elements.forEach((element) => observer.observe(element));
  }

  get totalUnits(): number { return Object.values(this.cart).reduce((total, quantity) => total + quantity, 0); }
  get missingUnits(): number { return Math.max(0, this.minimumOrder - this.totalUnits); }
  get progress(): number { return Math.min(100, (this.totalUnits / this.minimumOrder) * 100); }

  scrollProducts(direction: number): void {
    const track = this.productTrack?.nativeElement;
    if (!track) return;
    const card = track.querySelector<HTMLElement>('.product-card');
    const step = (card?.offsetWidth || 340) + 22;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
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
