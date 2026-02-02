import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateProductosComponent } from './update-productos.component';

describe('UpdateProductosComponent', () => {
  let component: UpdateProductosComponent;
  let fixture: ComponentFixture<UpdateProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateProductosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdateProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
