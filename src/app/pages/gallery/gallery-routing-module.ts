import { NgModule } from "@angular/core";
import { Routes , RouterModule } from "@angular/router";
import { GalleryComponent } from "./gallery.component";
import { MenuComponent } from "./components/menu/menu.component";

const galleryRoutes: Routes = [
    {
        path:'home',
        component:GalleryComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(galleryRoutes),
    ],
    exports: [RouterModule]
})

export class GalleryRoutes {};