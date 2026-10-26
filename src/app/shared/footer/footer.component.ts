import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  @Input('iphoneFooter') iphoneFooter : boolean = false;
  // la admin va a su calendario; las clientas (o sin sesion) a la reserva guiada
  esAdmin = false;
  constructor(
    private router : Router,
    public eventsService: EventsService,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.sharedService.getRolUser().subscribe((rol: any) => this.esAdmin = rol?.rol === 'admin');
  }

  cerrarMenu(){

    this.eventsService.offMenu.emit(false);

  }


 

}
