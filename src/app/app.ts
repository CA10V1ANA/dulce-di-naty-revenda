import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';

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
export class App {
  @ViewChild('orderDialog') private orderDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('infoDialog') private infoDialog!: ElementRef<HTMLDialogElement>;

  readonly whatsappNumber = '5585998116002';
  readonly minimumOrder = 15;
  readonly currentYear = new Date().getFullYear();
  readonly products: BrownieProduct[] = [
    {
      id: 'ninho',
      name: 'Ninho',
      note: 'Massa intensa de chocolate com recheio cremoso de Ninho.',
      image: 'assets/ninho.webp',
    },
    {
      id: 'brigadeiro',
      name: 'Brigadeiro',
      note: 'Brownie de chocolate com recheio cremoso de brigadeiro. Intenso e irresistível.',
      image: 'assets/brigadeiro.webp',
    },
    {
      id: 'dois-amores',
      name: '2 Amores',
      note: 'O equilíbrio perfeito entre chocolate tradicional e Ninho cremoso.',
      image: 'assets/dois-amores.webp',
    },
    {
      id: 'ovomaltine',
      name: 'Ovo Maltine',
      note: 'Cremoso e irresistível com a crocância clássica de Ovomaltine.',
      image: 'assets/showcase-ovomaltine.webp',
    },
    {
      id: 'crocante',
      name: 'Crocante',
      note: 'Recheio cremoso com crocante especial de amendoim.',
      image: 'assets/crocante.webp',
    },
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
    this.modalQuantity = this.cart[product.id] || 1;
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
      [this.selectedProduct.id]: this.modalQuantity,
    };
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
    const message = `Olá! Montei esta solicitação de brownies da Dulce di Naty para revenda:\n\n${items}\n\nPode me enviar a cotação e confirmar os recheios disponíveis?`;
    window.open(`https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  contactWhatsApp(): void {
    const message = 'Olá! Conheci a Dulce di Naty e gostaria de saber mais sobre a revenda de brownies e receber uma cotação.';
    window.open(`https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }
}
