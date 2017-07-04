import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-wrapper-multi-series-line-chart',
  templateUrl: './wrapper-multi-series-line-chart.component.html',
  styleUrls: ['./wrapper-multi-series-line-chart.component.css']
})
export class WrapperMultiSeriesLineChartComponent implements OnInit {

  @Input() graphAttribute: string;
  @Input() stockData: string;

  ngOnInit() {
    this.graphAttribute = this.graphAttribute || 'change';
  }

  public onActiveButtonChange(): void {
  }


}
