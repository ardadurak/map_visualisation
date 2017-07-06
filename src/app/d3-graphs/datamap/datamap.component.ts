import { Stocks } from '../shared';
import { NgModule, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChange } from '@angular/core';
import { D3Service, D3, Axis, BrushBehavior, BrushSelection, D3BrushEvent, ScaleTime, ScaleLinear, ScaleOrdinal, Selection, Transition} from 'd3-ng2-service';
import * as Datamap from 'datamaps';
import { MultiSeriesLineChartComponent } from '../multi-series-line-chart/multi-series-line-chart.component';
import { WrapperMultiSeriesLineChartComponent } from '../wrapper-multi-series-line-chart/wrapper-multi-series-line-chart.component';

@Component({
  selector: 'app-datamap',
  template: `
    <div class="row">
      <div class="col col-lg-7 col-md-12 col-sm-12">
        <div id="map" class="map" style="position: relative; width: 100%; height: 100%;"></div>
      </div>
      <div class="col col-lg-5 col-md-12 col-sm-12">  
        <div class="row">
          <div class="col col-lg-12 col-md-4 col-sm-6">
              <app-wrapper-multi-series-line-chart [stockData]="stockData" [graphAttribute]="graphTypes.change"  ></app-wrapper-multi-series-line-chart>
          </div>
        </div>
      </div>
   </div>
  `
})
@NgModule({
  providers: [
    MultiSeriesLineChartComponent,
    WrapperMultiSeriesLineChartComponent
  ]
})
export class DatamapComponent implements OnInit, OnChanges, OnDestroy {

  @Input() startDate: Date;
  @Input() endDate: Date;
  @Input() graphTypes: any;
  @Input() stockData: String;

  private d3: D3;
  private parentNativeElement: any;
  private d3ParentElement: any;
  private d3Svg: Selection<SVGSVGElement, any, null, undefined>;
  private processedStocks : any;
  private filteredStocks : any;
  private color : any;
  
  constructor(element: ElementRef, private ngZone: NgZone, d3Service: D3Service) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
  }

  ngOnDestroy() {
    if (this.d3Svg.empty && !this.d3Svg.empty()) {
      this.d3Svg.selectAll('*').remove();
    }
  }

  ngOnInit() {
    let self = this;
    let d3 = this.d3;
    let d3ParentElement: Selection<HTMLElement, any, null, undefined>;
    let d3Svg: Selection<SVGSVGElement, any, null, undefined>;
    let d3G: Selection<SVGGElement, any, null, undefined>;
    let worldMap : any = this.initMap();
    let pieData : any;   
    let pieAttribute = "main_pie_data";
    this.color = d3.scaleOrdinal(d3.schemeCategory10);
    
     // Initialize the canvas and draw the pie charts
    d3ParentElement = d3.select(this.parentNativeElement);
    d3Svg = this.d3Svg = d3ParentElement.select<SVGSVGElement>('svg');

    // Processing the stock data
    let processedStocks = this.processedStocks = this.processCalculations(Stocks);
    pieData = this.createPieData(processedStocks);
    this.drawPieCharts(pieData, pieAttribute);
    
    // Set parameters for the line graph
    this.graphTypes = {
      "change": "change",
      "daily_return": "daily_return",
      "close": "close",
      "volume": "volume"
    }
    this.stockData = JSON.stringify(processedStocks);
  }

  /*
    CALCULATION AND PROCESSING FUNCTIONS
  */
  private calculateReturn(targetObject){
    // Copy the target object
    let resultObject = JSON.parse(JSON.stringify(targetObject));

    return resultObject.map((v) => {
      let length = v.values.length;
      let initialPrice = v.values[0].close;
      let totalDailyReturn = 0;
      let totalVolume = 0;
      for(let i = 1 ; i < length ; i++){
        let currentValue = v.values[i];
        totalDailyReturn = totalDailyReturn + parseFloat(currentValue.daily_return);
        totalVolume = totalVolume + parseFloat(currentValue.volume);
        v.values[i].change = parseFloat((Math.round(((currentValue.close-initialPrice) / initialPrice) * 100 * 100) / 100 ).toFixed(2));  // change rate value
      }
      v.average_daily_return = parseFloat((totalDailyReturn / length).toFixed(2));
      v.average_volume = parseFloat((Math.round((totalVolume / length) * 100 ) / 100 ).toFixed(2));
      v.average_return = (Math.round((Math.pow(((v.average_daily_return / 100) + 1 ), length) - 1) * 100 * 100)/ 100);

      return v; 
    });
  }
  private processCalculations(targetObject){
    // Copy the target object
    let resultObject = JSON.parse(JSON.stringify(targetObject));
      
    return resultObject.map((v) => {
      var length = v.values.length;
      let initialPrice = parseFloat(v.values[0].close) ;
      let totalDailyReturn = 0;
      let totalVolume = 0;
      for(let i = 1 ; i < length ; i++){
        v.values[i].close = parseFloat( v.values[i].close);
        v.values[i].volume = parseFloat( v.values[i].volume);
        let currentValue = v.values[i];
        let dailyReturn = ((currentValue.close - v.values[i-1].close) / currentValue.close) * 100; // daily return
        totalDailyReturn = totalDailyReturn + dailyReturn;
        v.values[i].daily_return = dailyReturn; // daily return value
        totalVolume = totalVolume + parseFloat(currentValue.volume);
        v.values[i].change = parseFloat((Math.round(((currentValue.close-initialPrice) / initialPrice) * 100 * 100) / 100 ).toFixed(2));  // change rate value
        v.values[i].close = (Math.round( v.values[i].close * 100) / 100).toFixed(2);
        v.values[i].volume = (Math.round( v.values[i].volume * 100) / 100).toFixed(2);
    }
      v.average_daily_return = parseFloat((totalDailyReturn / length).toFixed(2));
      v.average_volume = parseFloat((Math.round((totalVolume / length) * 100 ) / 100 ).toFixed(2));
      v.average_return = parseFloat((Math.round((Math.pow(((v.average_daily_return / 100) + 1 ), length) - 1) * 100 * 100)/ 100).toFixed(2));

      return v; 
    });
  }

  /*
    PIE DATA FUNCTIONS
  */
  private createPieData(targetObject){
    // Copy the target object
    let resultObject = JSON.parse(JSON.stringify(targetObject));

    // returns object
    let groupBy = function(data, attribute) {
      let result = data.reduce(function(rv, x) {
        (rv[x[attribute]] = rv[x[attribute]] || []).push(x);
        return rv;
      }, {});
      let pieArray = [];
      for (const key of Object.keys(result)) {
        let data = result[key]
        let dataLength = data.length;
        let totalAverageDailyReturn = 0, totalAverageReturn = 0, total_main_pie_data = 0;
       
        data.map(v => {
          totalAverageDailyReturn = totalAverageDailyReturn + v.average_daily_return;
          totalAverageReturn = totalAverageReturn + v.average_return;
          total_main_pie_data = total_main_pie_data + v.main_pie_data;
       });
        let additionalData = {
          "total_main_pie_data": total_main_pie_data,
          "pie_average_daily_return": Math.round((totalAverageDailyReturn / dataLength) * 100) / 100,
          "pie_average_return": Math.round((totalAverageReturn / dataLength) * 100) / 100,
        }

        let singlePieData = {
          "additionalData" : additionalData,
          "data": data
        }
        pieArray.push(singlePieData);
      }
      console.log(pieArray);
      return pieArray;
    };   
    
    let groupedData = groupBy(targetObject, 'country_code');
    return groupedData;
  }

  private drawPieChartDynamicComponents(pies){
    
    let d3 = this.d3;
    let tooltip = d3.select(".datamaps-hoverover");

    pies
      .append("text")
      .attr("dy", "0.3em")
      .attr("dx", "6em")
      .attr("class", "average-text")
      .style("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "white")
      .style("cursor", "pointer")
      .text(function(d: any) { return d.additionalData.pie_average_return + '%'})
      .on('mouseover', function(d : any) { 
          let content = '<div class="hoverinfo"> <strong> Periodic Return </strong> </div>';
          tooltip.html(content)
            .style('left', ( d3.event.pageX) + "px")
            .style('top', ( (d3.event.pageY - 150)) + "px")
            .style("display", "inline-block");

      }).on('mouseout', function(d : any) { 
          tooltip.style('display', 'none');  
        });

    pies
      .append("text")
      .attr("dy", "4em")
      .attr("dx", "5.2em")
      .attr("class", "daily-text")
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "white")
      .style("cursor", "pointer")
      .text(function(d: any) { return d.additionalData.pie_average_daily_return + '%'})
      .on('mouseover', function(d : any) {  
          let content = '<div class="hoverinfo"> <strong> Average Daily Return </strong> </div>';
          tooltip.html(content)
            .style('left', ( d3.event.pageX) + "px")
            .style('top', ( (d3.event.pageY - 150)) + "px")
            .style("display", "inline-block");
      }).on('mouseout', function(d : any) { 
          tooltip.style('display', 'none');  
        });

      pies
        .append("text") 
        .attr("dx", "0")
        .attr("dy", "-3.4em")
        .style("font-size", "15px")
        .attr("class", "top-text")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .text((d : any) => {return d.data[0].country});
  }

  private bindSliceEvents(slices, pieAttribute){
    let d3 = this.d3;
    let d3Svg = this.d3Svg;
    let tooltip = d3.select(".datamaps-hoverover");

    slices.on('mouseover', function(d : any) {  
        let content = '<div class="hoverinfo">' + '<strong>' + d.data.name + '</strong> <br>'
                + 'Value <strong>' + d.data[pieAttribute] + '</strong> <br>'
                + 'Periodic Return: <strong>' + d.data.average_return + '%</strong> <br>'
                + 'Averate Daily Return: <strong>' + d.data.average_daily_return + '%</strong>' +  '</div>';
        tooltip.html(content)
            .style('left', ( d3.event.pageX) + "px")
            .style('top', ( (d3.event.pageY - 150)) + "px")
            .style("display", "inline-block");

            d3Svg
              .selectAll('.pie-' + d.data.country_code)
              .select(".middle-text" )
              .text((Math.round(((d.endAngle - d.startAngle)/(2*Math.PI)*100) * 100 ) / 100 ) + '%')
              .style("font-size", "10px")
              .style("fill", "white");

            d3.selectAll(".line" )
                .transition()
                .duration(300)
                .style("stroke-width", 1 );
            d3.selectAll(".line-" + d.data.ticker_symbol)
              .transition()
              .duration(300)
              .style("stroke-width", 3 );
        })
        .on('mouseout', function(d : any) { 
          d3.selectAll(".line" )
            .transition()
            .duration(300)
            .style("stroke-width", 1 );
          tooltip.style('display', 'none');  
          d3Svg
            .selectAll('.pie-' + d.data.country_code)
            .select(".middle-text" )
            .text('');
        });
        
  }

  private drawPieCharts(pieData, pieAttribute){
    let d3 = this.d3, d3Svg = this.d3Svg;
    let tooltip = d3.select(".datamaps-hoverover");
    let color = this.color;
    
    var arc : any = d3.arc().innerRadius(20).outerRadius(40);
    var pie = d3.pie().value(function(d: any){ return d[pieAttribute] });

    var pies = d3Svg.selectAll('.pie')
      .data(pieData)
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'pie')
      .attr('class', function(d: any){  return 'pie-' + d.data[0].country_code})
    
     pies  
      .append("circle")
      .attr("class", "back-circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 50)
      .attr("fill", '#747474')
      .attr('stroke-opacity', 0)
      .style('cursor', 'pointer')
      .on('click', function(d : any) { 
          updatePieChart(d);
      });
      
    this.drawPieChartStaticComponents(pies);
    this.drawPieChartDynamicComponents(pies);
    
    let slices = pies.selectAll('.slice')
      .data(function(d: any){
         return pie(d.data) })
      .enter()
      .append<SVGGElement>('path')
      .attr('d',  arc)
      .style('cursor', 'pointer')
      .style('fill', (d : any) => this.color(d.data.id));
      
      this.bindSliceEvents(slices, pieAttribute); 
      slices.on('click', function(d : any) { 
        drawDrilledPieChart(d);
      });

      // ardadarda label arcs should be added  
      var labelArc : any = d3.arc()
        .innerRadius(55)
        .outerRadius(55);

      pies
        .selectAll('path') 
        .append("text")
        .text(function(d : any) { 
          return (Math.round(((d.endAngle - d.startAngle)/(2*Math.PI)*100) * 100 ) / 100 ) + '%';
        })
        .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
        .style("font-size", "25px")
        .style("text-anchor", "middle")
        .style("fill", "black");
        
        // Locate pie charts
        d3Svg.select('.pie-US').attr("transform", ('translate(265.88082345209335,239.93560787450036)'));
        d3Svg.select('.pie-UK').attr("transform", ('translate(340.45715198133905,64.19898697182578) '));  
        // d3Svg.select('.pie-JP').attr("transform", ('translate(500,300) '));  tochange


      function updatePieChart(countryData){

        let pie = d3.pie().value(function(d: any){ return d[pieAttribute] });
        let currentPie = d3Svg
          .selectAll('.pie-' + countryData.data[0].country_code)
          .data([countryData])
          
        let slices = currentPie.selectAll('.slice')
          .data(function(d: any){
            return pie(d.data) })
          .enter()
          .append<SVGGElement>('path')
          .attr('d',  arc)
          .style('cursor', 'pointer')
          .style('fill', (d: any) => color(d.data.id));
   
          slices.on('click', function(d : any) { 
            drawDrilledPieChart(d);
          });


          
         [countryData].map((v) => {
          let pieSvg = d3Svg.selectAll('.pie-' + v.data[0].country_code);
          pieSvg.select('.daily-text').text(v.additionalData.pie_average_daily_return); 
          pieSvg.select('.average-text').text(v.additionalData.pie_average_return); 
          pieSvg.select('.top-text').text(v.data[0].country_code); 
        });  
      }

      function drawDrilledPieChart(stockData){
        let color = d3.scaleOrdinal(d3.schemeCategory20b);
        let tooltip = d3.select(".datamaps-hoverover");
        
        var pieNew = d3.pie().value(function(d: any){ return d.value  });

        let currentPie = d3Svg
          .selectAll('.pie-' + stockData.data.country_code)
          .data(stockData.data.drilled_pie_data)

        currentPie.selectAll('.slice')
          .data(function(d: any){
            return pieNew(stockData.data.drilled_pie_data) })
          .enter()
          .append<SVGGElement>('path')
          .attr('d',  arc)
          .style('cursor', 'pointer')
          .style('fill', (d, i: any) => color(i))
          .on('mouseover', function(d : any) { 
            let content = '<div class="hoverinfo">' + d.data.name + '<br>' +
              ' Value: <strong>' + d.data.value + '</strong><br> ' +
              ' <strong>' + (Math.round(((d.endAngle - d.startAngle)/(2*Math.PI)*100) * 100 ) / 100  + '%') + '</strong></div>';
            tooltip.html(content)
              .style('left', ( d3.event.pageX) + "px")
              .style('top', ( (d3.event.pageY - 150)) + "px")
              .style("display", "inline-block");
          });

          [stockData].map((v) => {
            let pieSvg = d3Svg.selectAll('.pie-' + v.data.country_code);
            pieSvg.select('.daily-text').text(v.data.average_daily_return); 
            pieSvg.select('.average-text').text(v.data.average_return); 
            pieSvg.select('.top-text').text(v.data.name); 
          }); 
      }
      
  }
  private drawPieChartStaticComponents(pies){

    pies  
      .append("circle")
      .attr("cx", "4.6em")
      .attr("cy", 0)
      .attr("r", 25)
      .attr("fill", '#747474')
      .attr('stroke-opacity', 0);

    pies  
      .append("circle")
      .attr("cx", "3.6em")
      .attr("cy", "2.5em")
      .attr("r", 20)
      .attr("fill", '#747474')
      .attr('stroke-opacity', 0);

    pies
      .append("text")
      .attr("dx", "0")
      .attr("dy", "0.5em")
      .attr("class", "middle-text")
      .style("text-anchor", "middle")
      .style("fill", "white");

  }

  /*
    MAP FUNCTIONS
  */
  private initMap(){
    var worldMap =  new Datamap({
      element: document.getElementById('map'),
      projection: 'mercator',
      responsive: true,
      highlightFillColor: 'defaultFill',
      geographyConfig: {
          borderWidth: 0
      },
      fills: {
          defaultFill: "#E6E6E6",
          exists: "#00599C",
          bubble: "#747474"
      },data: {
        'USA': { fillKey: "exists" },
        'GBR': { fillKey: "exists" },
        //'JPN': {fillKey: 'exists'}, tochange
      }
    });
    
    worldMap.bubbles([
      {
        name: 'USA',
        radius: 7,
        fillKey: 'bubble',
        borderWidth: 0,
        fillOpacity: 1,
        highlightOnHover: false,
        highlightFillColor: 'bubble',
        highlightBorderColor: 'bubble',
        latitude: 41,
        longitude: -100
      },{
        name: 'GBR',
        radius: 5,
        fillKey: 'bubble',
        centered: 'GBR',
        borderWidth: 0,
        fillOpacity: 1,
        highlightOnHover: false,
        highlightFillColor: 'bubble',
        highlightBorderColor: 'bubble'
      }/* tochange
      ,{
        name: 'JPN',
        radius: 5,
        fillKey: 'bubble',
        centered: 'SGP',
        borderWidth: 0,
        fillOpacity: 1,
        highlightOnHover: false,
        highlightFillColor: 'bubble',
        highlightBorderColor: 'bubble'
      }*/ 
    ]);

    worldMap.arc([
      {
          origin: 'USA',
          destination: {
            latitude: 20,
            longitude: -57
          },
            options: {
            strokeWidth: 3,
            strokeColor: '#747474',
            greatArc: true,
            animationSpeed: 1000,
            arcSharpness: 0
          }
      },
      {
          origin: 'GBR',
          destination: {
          latitude: 70,
          longitude: -5
          },
          options: {
            strokeWidth: 3,
            strokeColor: '#747474',
            greatArc: false,
            animationSpeed: 1000,
            arcSharpness: 0
          }
      },
      /*{ tochange
          origin: 'JPN',
          destination: {
          latitude: -30,
          longitude: 60
          },
          options: {
            strokeWidth: 3,
            strokeColor: '#747474',
            greatArc: false,
            animationSpeed: 1000,
            arcSharpness: 0
          }
      }*/
    ],  {strokeWidth: 1, arcSharpness: 1.4});
      return worldMap;
    }

  /*
    DATE CHANGE FUNCTIONS
  */
  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    
    var startDate = changes['startDate'] ?  changes['startDate'].currentValue : this.startDate;
    var endDate = changes['endDate'] ?  changes['endDate'].currentValue : this.endDate;
    
    console.log("Start Date: " + startDate);
    console.log("End Date: " + endDate);
    
    if (startDate && ( !changes['startDate'] ||  !changes['startDate'].isFirstChange())
     && endDate && ( !changes['endDate'] ||  !changes['endDate'].isFirstChange())){
      this.updateView(startDate, endDate);
    }
  }

 private filterStocks( targetObject, startDate, endDate){

    let startDateTime = startDate.setHours(0, 0, 0, 0);
    let endDateTime = endDate.setHours(0, 0, 0, 0);

    // Copy the target object
    let filteredResultString = JSON.stringify(targetObject);
    let filteredResult = JSON.parse(filteredResultString);

    // Filter the result depending on the dates
    filteredResult = filteredResult.map((v) => {
        let filtered = v.values.filter(isBetweenDates);
        v.values = filtered;
        return v;
    })
    
    function isBetweenDates(value) {
      let currentDate = new Date(value.date).setHours(0, 0, 0, 0);
      return (currentDate >= startDateTime && currentDate <= endDateTime);
    }
    
    return filteredResult;
  } 

  private updateView(startDate, endDate) {

    let filteredStocks = this.filterStocks(this.processedStocks, startDate, endDate);
    filteredStocks = this.calculateReturn(filteredStocks);
    let pieData = this.createPieData(filteredStocks);
    let d3Svg = this.d3Svg;
    let d3 = this.d3;
    this.stockData = JSON.stringify(filteredStocks);
    this.filteredStocks = filteredStocks;
    var arc : any = d3.arc().innerRadius(20).outerRadius(40);
    var pie = d3.pie().value(function(d: any){ return d[this.pieAttribute] });

    pieData.map((v) => {
      let pieSvg = d3Svg.selectAll('.pie-' + v.data[0].country_code);
      pieSvg.select('.daily-text').text(v.additionalData.pie_average_daily_return); 
      pieSvg.select('.average-text').text(v.additionalData.pie_average_return); 
      pieSvg.select('.top-text').text(v.data[0].country_code); 
    });
    
    let pies = d3.pie().value(function(d: any){ return d[this.pieAttribute] });
      let currentPie = d3Svg
        .selectAll('.pies')
        .data(filteredStocks)
        
      let slices = currentPie.selectAll('.slice')
        .data(function(d: any){
          return pie(d.data) })
        .enter()
        .append<SVGGElement>('path')
        .attr('d',  arc)
        .style('cursor', 'pointer')
        .style('fill', (d: any) => this.color(d.data.id));
  
  }

}