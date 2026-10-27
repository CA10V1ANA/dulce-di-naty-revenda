import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { App } from './app';

describe('Brownie flavor showcase', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    spyOn(window, 'IntersectionObserver').and.callFake(function (callback: IntersectionObserverCallback) { return {
      observe: (target: Element) => callback([{ target, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver),
      unobserve: () => {}, disconnect: () => {}, takeRecords: () => [],
      root: null, rootMargin: '', thresholds: [],
    }; });
  });

  it('opens the order with the flavor selected in the showcase', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    const index = app.products.findIndex(product => product.id === 'ninho');
    app.chooseFlavor(index);
    app.openOrder(app.featuredProduct);
    expect(app.selectedProduct.id).toBe('ninho');
    expect(fixture.nativeElement.querySelector('dialog').open).toBeTrue();
    fixture.destroy();
  });

  it('rotates every six seconds and pauses while the order is open', fakeAsync(() => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    const initialIndex = app.activeFlavorIndex;
    tick(6000);
    expect(app.activeFlavorIndex).toBe((initialIndex + 1) % app.products.length);
    app.openOrder(app.featuredProduct);
    const orderFlavor = app.featuredProduct.id;
    tick(12000);
    expect(app.featuredProduct.id).toBe(orderFlavor);
    expect(app.selectedProduct.id).toBe(orderFlavor);
    fixture.destroy();
  }));

  it('pauses for interaction and resumes only when enabled', fakeAsync(() => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    app.chooseFlavor(0);
    app.setShowcaseHovered(true);
    tick(6000);
    expect(app.activeFlavorIndex).toBe(0);
    app.setShowcaseHovered(false);
    app.toggleAutoplay();
    tick(12000);
    expect(app.activeFlavorIndex).toBe(0);
    app.toggleAutoplay();
    tick(6000);
    expect(app.activeFlavorIndex).toBe(1);
    fixture.destroy();
  }));
});
