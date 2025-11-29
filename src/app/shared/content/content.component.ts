import { Component, Input, OnInit } from '@angular/core';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss']
})
export class ContentComponent implements OnInit {

  @Input('iphoneFooter') iphoneFooter :boolean = false;
  constructor(
    private eventsService : EventsService
  ) { }

  ngOnInit(): void {
    this.ocultarMenu();
  }

  ocultarMenu(){
  this.eventsService.ocultarMenu.emit(false);
  }
}
