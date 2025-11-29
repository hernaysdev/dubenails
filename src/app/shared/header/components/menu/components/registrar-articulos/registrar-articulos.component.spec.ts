import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarArticulosComponent } from './registrar-articulos.component';

describe('RegistrarArticulosComponent', () => {
  let component: RegistrarArticulosComponent;
  let fixture: ComponentFixture<RegistrarArticulosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegistrarArticulosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarArticulosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
