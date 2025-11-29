import { Component, Input, OnInit } from '@angular/core';
import { SpinnerService } from 'src/app/services/interceptor.service';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent implements OnInit {
  public isLoading$ = this.spinnerService.isLoading$;
  public show : boolean = false;
  constructor(
    public spinnerService : SpinnerService
  ) { }

  ngOnInit(): void {
    this.isLoading$.subscribe(valor => {
      this.show = valor;
    })
  }

}
