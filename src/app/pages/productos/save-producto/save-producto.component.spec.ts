import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveProductoComponent } from './save-producto.component';

describe('SaveProductoComponent', () => {
  let component: SaveProductoComponent;
  let fixture: ComponentFixture<SaveProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveProductoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SaveProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
