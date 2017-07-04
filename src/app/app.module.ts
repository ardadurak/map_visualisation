import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MyDatePickerModule } from 'mydatepicker';
import { D3Service } from 'd3-ng2-service';

import { AppComponent } from './app.component';
import { DatamapComponent } from './d3-graphs/datamap/datamap.component';
import { WrapperDatamapComponent } from './d3-graphs/wrapper-datamap/wrapper-datamap.component';
import { MultiSeriesLineChartComponent } from './d3-graphs/multi-series-line-chart/multi-series-line-chart.component';
import { WrapperMultiSeriesLineChartComponent } from './d3-graphs/wrapper-multi-series-line-chart/wrapper-multi-series-line-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    DatamapComponent,
    WrapperDatamapComponent,
    MultiSeriesLineChartComponent,
    WrapperMultiSeriesLineChartComponent
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
