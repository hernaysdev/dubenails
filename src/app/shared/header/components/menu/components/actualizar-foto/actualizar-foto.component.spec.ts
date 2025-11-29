import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarFotoComponent } from './actualizar-foto.component';

describe('ActualizarUserComponent', () => {
  let component: ActualizarFotoComponent;
  let fixture: ComponentFixture<ActualizarFotoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActualizarFotoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarFotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
