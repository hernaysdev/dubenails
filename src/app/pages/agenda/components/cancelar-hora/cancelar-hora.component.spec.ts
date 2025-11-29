import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelarHoraComponent } from './cancelar-hora.component';

describe('CancelarHoraComponent', () => {
  let component: CancelarHoraComponent;
  let fixture: ComponentFixture<CancelarHoraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CancelarHoraComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CancelarHoraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
