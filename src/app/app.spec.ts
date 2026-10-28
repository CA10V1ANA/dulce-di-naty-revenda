import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('Dulce di Naty order flow', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('opens the order with the selected showcase flavor', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    const index = app.products.findIndex(product => product.id === 'brigadeiro');

    app.chooseFlavor(index);
    app.openOrder(app.featuredProduct);

    expect(app.selectedProduct.id).toBe('brigadeiro');
    expect(fixture.nativeElement.querySelector('dialog').open).toBeTrue();
  });

  it('adds quantities and calculates the minimum-order progress', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    app.modalQuantity = 10;
    app.addSelectedProduct();
    expect(app.totalUnits).toBe(10);
    expect(app.missingUnits).toBe(5);

    app.selectProduct(app.products[1]);
    app.modalQuantity = 5;
    app.addSelectedProduct();
    expect(app.totalUnits).toBe(15);
    expect(app.missingUnits).toBe(0);
    expect(app.progress).toBe(100);
  });

  it('removes a flavor without changing the remaining quantities', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    app.cart = { ninho: 8, brigadeiro: 7 };
    app.removeProduct('ninho');

    expect(app.cart['ninho']).toBeUndefined();
    expect(app.totalUnits).toBe(7);
  });

  it('toggles the mobile navigation state', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    app.toggleMenu();
    expect(app.menuOpen).toBeTrue();
    app.closeMenu();
    expect(app.menuOpen).toBeFalse();
  });
});
