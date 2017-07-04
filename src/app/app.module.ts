import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MyDatePickerModule } from 'mydatepicker';
import { D3Service } from 'd3-ng2-service';

import { AppComponent } from './app.component';
import { DatamapComponent } from './d3-graphs/datamap/datamap.component';
import { WrapperDatamapComponent } from './d3-graphs/wrapper-datamap/wrapper-datamap.component';

@NgModule({
  declarations: [
    AppComponent,
    DatamapComponent,
    WrapperDatamapComponent
  ],
  imports: [
    BrowserModule,MyDatePickerModule
  ],
  providers: [
    D3Service
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
