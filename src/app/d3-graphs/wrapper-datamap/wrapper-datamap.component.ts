import { Component, Input, OnInit } from '@angular/core';
import {IMyDpOptions, IMyDateModel} from 'mydatepicker';

@Component({
  selector: 'app-wrapper-datamap',
  templateUrl: './wrapper-datamap.component.html',
  styleUrls: ['./wrapper-datamap.component.css']
})

export class WrapperDatamapComponent implements OnInit {

  @Input() startDate: Date;
  @Input() endDate: Date;
  @Input() stockData: any;

  private defaultStartDate = new Date('2016/06/27');
  private defaultEndDate= new Date('2017/06/27');

  public myDatePickerOptions: IMyDpOptions = {
      // other options...
      dateFormat: 'dd/mm/yyyy',
      disableUntil: {year: 2016, month: 6, day: 26},
      disableSince: {year: 2017, month: 6, day: 27},
      disableWeekends: true
  };
  
  ngOnInit() {
    this.startDate = this.defaultStartDate;
    this.endDate = this.defaultEndDate;
  }

  public startDateChanged(event: IMyDateModel) {

    let selectedDate = new Date(event.jsdate);
    let startDateTime = selectedDate.setHours(0, 0, 0, 0);
    let endDateTime = this.endDate.setHours(0, 0, 0, 0);

    if(selectedDate.getFullYear() == 1970 || startDateTime >= endDateTime){
      this.startDate = this.defaultStartDate;
    }
    else{
      this.startDate = selectedDate;
    }
  }
  public endDateChanged(event: IMyDateModel) {

    let selectedDate = new Date(event.jsdate);
    let startDateTime = this.startDate.setHours(0, 0, 0, 0);
    let endDateTime = selectedDate.setHours(0, 0, 0, 0);

    if(selectedDate.getFullYear() == 1970 || startDateTime >= endDateTime){
      this.endDate = this.defaultEndDate;
    }
    else{
      this.endDate = selectedDate;
    }
  }
}
