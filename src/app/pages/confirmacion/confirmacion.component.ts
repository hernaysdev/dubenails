import { Component, OnInit } from '@angular/core';
import { PagoService } from 'src/app/services/pago.service';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { AgendaService } from 'src/app/services/agenda.service';
import { ActivatedRoute } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-confirmacion',
  templateUrl: './confirmacion.component.html',
  styleUrls: ['./confirmacion.component.scss']
})
export class ConfirmacionComponent implements OnInit {

  constructor(
    private pagoService: PagoService,
    private usuariosService: UsuariosService,
    private router: ActivatedRoute,
    private sharedService: SharedService,
    private agendaService: AgendaService,
    private eventsService: EventsService
  ) { }

  ngOnInit(): void {
    this.verificarUsuario();
    this.verificarAgenda();
  }

  verificarUsuario() {
    const token = this.router.snapshot.paramMap.get('token');
    if (token) {
      this.usuariosService.autorizarToken(token).subscribe({
        next: (data: any) => {
          this.sharedService.setRolUser(data);
/*           this.eventsService.cerrarModalLogin.emit(false); */
        },
        error: (error) => {

        }
      })
    }
  }


  verificarAgenda() {
    const id = this.router.snapshot.paramMap.get('tokenUsuario') as string;
    const mes = this.router.snapshot.paramMap.get('mes') as string;
    const dia = this.router.snapshot.paramMap.get('dia') as string;
    const hora = this.router.snapshot.paramMap.get('hora') as string;
    this.agendaService.buscarAgendaPorUsuario(id, mes, dia, hora).subscribe({
      next: (data: any) => {
        const { id, token } = data;
        this.pagoService.verificarPago(token, id).subscribe({
          next: (data) => {
          }, error: (error) => {
            console.log("error---------", error)
          }, complete: () => {
            window.close();
          }
        })

      }, error: (error) => {

      }
    })

  }

}
