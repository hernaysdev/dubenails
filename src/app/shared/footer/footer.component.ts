import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  @Input('iphoneFooter') iphoneFooter : boolean = false;
  constructor(
    private router : Router,
    public eventsService: EventsService
  ) { }

  ngOnInit(): void {

  }

  cerrarMenu(){

    this.eventsService.offMenu.emit(false);

  }


 

}
