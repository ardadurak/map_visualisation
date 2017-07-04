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
          <div class="col col-lg-12 col-md-4 col-sm-6">
              <app-wrapper-multi-series-line-chart [stockData]="stockData" [graphAttribute]="graphTypes.daily_return"  ></app-wrapper-multi-series-line-chart>
          </div>
          <div class="col col-lg-12 col-md-4 col-sm-6">
              <app-wrapper-multi-series-line-chart [stockData]="stockData" [graphAttribute]="graphTypes.volume"  ></app-wrapper-multi-series-line-chart>
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
  private d3SvgGraph: Selection<SVGSVGElement, any, null, undefined>;
  private d3SvgDetails: Selection<SVGSVGElement, any, null, undefined>;
  private processedStocks : any;
  private filteredStocks : any;
  private xFactorUk: number;
  private yFactorUk: number;
  private xFactorUs: number;
  private yFactorUs: number;
  

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
    let d3SvgGraph: Selection<SVGSVGElement, any, null, undefined>;
    let d3SvgDetails: Selection<SVGSVGElement, any, null, undefined>;
    let d3G: Selection<SVGGElement, any, null, undefined>;
    let svgWidth: number, svgHeight: number;
    const xFactorUk = this.xFactorUk = 0.4859626225320041, yFactorUk = this.yFactorUk = 0.16291388766840606;
    const xFactorUs = this.xFactorUs = 0.3795136671202318, yFactorUs = this.yFactorUs = 0.608870085225356;
    let map = this.initMap();
    let relocate = this.relocateComponents;
    let pieData : any;
    let processedStocks : any;
    let graphTypes = this.graphTypes;
        
    processedStocks = this.processedStocks = this.processCalculations(Stocks);
    this.stockData = JSON.stringify(processedStocks);
    pieData = this.createPieData(processedStocks);
   
    d3ParentElement = d3.select(this.parentNativeElement);
    d3Svg = this.d3Svg = d3ParentElement.select<SVGSVGElement>('svg');
    d3SvgGraph = this.d3SvgGraph = d3ParentElement.select<SVGSVGElement>('.graph');
    d3SvgDetails = this.d3SvgDetails = d3ParentElement.select<SVGSVGElement>('.details');
    this.drawCircles();
    this.drawPieCharts(pieData);
    this.graphTypes = {
      "change": "change",
      "daily_return": "daily_return",
      "close": "close",
      "volume": "volume"
    }
    this.stockData = JSON.stringify(processedStocks);
    
    window.addEventListener('resize', function(event){
      map.resize();
      
      let svgWidth = parseFloat( d3Svg.style("width"));
      let svgHeight = parseFloat(d3Svg.style('height'));
      let xUk = svgWidth * xFactorUk, xUs = svgWidth * xFactorUs;
      let yUk = svgHeight * yFactorUk, yUs = svgHeight * yFactorUs;
      
      d3Svg.select('.circle-uk')
        .attr("cx", xUk)
        .attr("cy", yUk)

      d3Svg.select('.circle-us')
        .attr("cx", xUs) 
        .attr("cy", yUs)

      d3Svg.select('.pie-uk')      
        .attr("transform", ("translate(" + xUk + "," + yUk + ")"));
      
      d3Svg.select('.pie-us')      
        .attr("transform", ("translate(" + xUs + "," + yUs + ")"));
    });
  }

  public relocateComponents(){
    let d3Svg = this.d3Svg;
    let svgWidth = parseFloat( d3Svg.style("width"));
    let svgHeight = parseFloat(d3Svg.style('height'));
    let xUk = svgWidth * this.xFactorUk, xUs = svgWidth * this.xFactorUs;
    let yUk = svgHeight * this.yFactorUk, yUs = svgHeight * this.yFactorUs;
    //ardadarda
    d3Svg.select('.circle-uk')
      .attr("cx", xUk)
      .attr("cy", yUk)

    d3Svg.select('.circle-us')
      .attr("cx", xUs) 
      .attr("cy", yUs)

    d3Svg.select('.pie-uk')      
      .attr("transform", ("translate(" + xUk + "," + yUk + ")"));
    
    d3Svg.select('.pie-us')      
      .attr("transform", ("translate(" + xUs + "," + yUs + ")"));
  }

  public calculateReturn(targetObject){
    // Copy the target object
    let resultString = JSON.stringify(targetObject);
    let resultObject = JSON.parse(resultString);

    return resultObject.map((v) => {
      var length = v.values.length;
      let initialPrice = v.values[0].close ;
      let totalDailyReturn = 0;
      let totalVolume = 0;
      for(let i = 1 ; i < length ; i++){
        let currentValue = v.values[i];
        totalDailyReturn = totalDailyReturn + currentValue.daily_return;
        totalVolume = totalVolume + parseFloat(currentValue.volume);
        v.values[i].change = ((currentValue.close-initialPrice) / initialPrice) * 100;  // change rate value
      }
      v.average_daily_return = totalDailyReturn / length;
      v.average_volume = totalVolume / length;
      v.average_return = parseFloat((Math.round((Math.pow(((v.average_daily_return / 100) + 1 ), length) - 1) * 100 * 100)/ 100).toFixed(2));

      return v; 
    });
  }
  public processCalculations(targetObject){
    // Copy the target object
    let resultString = JSON.stringify(targetObject);
    let resultObject = JSON.parse(resultString);
      
    return resultObject.map((v) => {
      var length = v.values.length;
      let initialPrice = v.values[0].close ;
      let totalDailyReturn = 0;
      let totalVolume = 0;
      for(let i = 1 ; i < length ; i++){
        let currentValue = v.values[i];
        let dailyReturn = ((currentValue.close - v.values[i-1].close) / currentValue.close) * 100; // daily return
        totalDailyReturn = totalDailyReturn + dailyReturn;
        v.values[i].daily_return = dailyReturn; // daily return value
         totalVolume = totalVolume + parseFloat(currentValue.volume);
        v.values[i].change = ((currentValue.close-initialPrice) / initialPrice) * 100;  // change rate value
      }
      v.average_daily_return = totalDailyReturn / length;
      v.average_volume = totalVolume / length;
      v.average_return = parseFloat((Math.round((Math.pow(((v.average_daily_return / 100) + 1 ), length) - 1) * 100 * 100)/ 100).toFixed(2));

      return v; 
    });
  }

  public createPieData(targetObject){
    let resultString = JSON.stringify(targetObject);
    let resultObject = JSON.parse(resultString);

    let ukStocks = resultObject.filter(function(v) {
      return v.country_code == "UK"; 
    });

    let usStocks = resultObject.filter(function(v) {
      return v.country_code == "US"; 
    });

    /*
    
    ukStocks.reduce((v), (element, total) =>{
      console.log("Element: " + element);
      console.log("Total: " + total);
    })
    let ukStocksPieData = ukStocks.map((v)=> {
        return { 
          "ticker_symbol" : v.ticker_symbol,
          "name": v.name,
          "value": v.values[v.length-1].close
        }
    })*/
    /*function createObject(target){

    }
*/
    /*
      toBeChanged
        function getChartData(targetArray, targetCountry){
      return { 
        "country": targetCountry, 
        "averageDailyReturn" : ((parseFloat(targetArray[0].average_daily_return) + parseFloat(targetArray[1].average_daily_return)) / 2).toFixed(2), 
        "averageReturn" : ((parseFloat(targetArray[0].average_return) + parseFloat(targetArray[1].average_return)) / 2).toFixed(2), 
        "data" : targetArray.map((v) => {
                return { 
                  "ticker_symbol" : v.ticker_symbol,
                  "name": v.name,
                  "value": v.values[v.length-1].close
                }
            })
      };
    }
   
    let chartObject = [ getChartData(ukStocks, "uk"), getChartData(usStocks, "us") ];
    */ 
    let chartObject = [ 
      { 
        "country": "uk", 
        "averageDailyReturn" : ((parseFloat(ukStocks[0].average_daily_return) + parseFloat(ukStocks[1].average_daily_return)) / 2).toFixed(2), 
        "averageReturn" : ((parseFloat(ukStocks[0].average_return) + parseFloat(ukStocks[1].average_return)) / 2).toFixed(2), 
        "data" :[
          {
            "ticker_symbol": ukStocks[0].ticker_symbol,
            "name": ukStocks[0].name,
            "value": ukStocks[0].values[ukStocks.length-1].close,
            "averageDailyReturn": parseFloat(ukStocks[0].average_daily_return),
            "averageReturn": parseFloat(ukStocks[0].average_return)
          },
          {
            "ticker_symbol": ukStocks[1].ticker_symbol,
            "name": ukStocks[1].name,
            "value": ukStocks[1].values[ukStocks.length-1].close,
            "averageDailyReturn": parseFloat(ukStocks[1].average_daily_return),
            "averageReturn": parseFloat(ukStocks[1].average_return)
          },
        ]
      },
      { 
        "country": "us", 
        "averageDailyReturn" : ((parseFloat(usStocks[0].average_daily_return) + parseFloat(usStocks[1].average_daily_return)) / 2).toFixed(2), 
        "averageReturn" : ((parseFloat(usStocks[0].average_return) + parseFloat(usStocks[1].average_return)) / 2).toFixed(2), 
        "data" :[
          {
            "ticker_symbol": usStocks[0].ticker_symbol,
            "name": usStocks[0].name,
            "value": usStocks[0].values[usStocks.length-1].close,
            "averageDailyReturn": parseFloat(usStocks[0].average_daily_return),
            "averageReturn": parseFloat(usStocks[0].average_return)
          },
          {
            "ticker_symbol": usStocks[1].ticker_symbol,
            "name": usStocks[1].name,
            "value": usStocks[1].values[usStocks.length-1].close,
            "averageDailyReturn": parseFloat(usStocks[1].average_daily_return),
            "averageReturn": parseFloat(usStocks[1].average_return)
          },
        ]
      }
     ];
    return chartObject;
  }

  public filterStocks( targetObject, startDate, endDate){
  
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

  public changeFunction(startDate, endDate) {

    let filteredStocks = this.filterStocks(this.processedStocks, startDate, endDate);
    filteredStocks = this.calculateReturn(filteredStocks);
    let pieData = this.createPieData(filteredStocks);
    let d3Svg = this.d3Svg;
    let d3 = this.d3;
    this.stockData = JSON.stringify(filteredStocks);
    this.filteredStocks = filteredStocks;
    
    /*
    console.log("Filtered Stocks Length: " + filteredStocks[0].values.length);
    console.log("Filtered Stocks Average Return: " + filteredStocks[0].average_return);
    console.log("Filtered Stocks Average Daily Return: " + filteredStocks[0].average_daily_return);
    console.log("Pie Data: " + pieData);
    */
    
    d3Svg.selectAll('.pie-uk').select('.daily-text').text(pieData[0].averageDailyReturn); 
    d3Svg.selectAll('.pie-us').select('.daily-text').text(pieData[1].averageDailyReturn); 
   
    d3Svg.selectAll('.pie-uk').select('.average-text').text(pieData[0].averageReturn)
    d3Svg.selectAll('.pie-us').select('.average-text').text(pieData[1].averageReturn)
    
    this.drawPieCharts(pieData);
    this.relocateComponents();
   /* 
    let arc : any= d3.arc()
      .outerRadius(40)
      .innerRadius(20);

    let pie = d3.pie()
      .value(function(d: any){  return d.value });
    
    d3.selectAll('.pie-uk')
      .data(pieData)

    let path = d3.selectAll('.pie-uk').selectAll('.path')
      .data(function(d: any){
         return pie(d.data[0]) });

    path
    .transition()
    .duration(750)
    .attr("d", arc);*/

/*
    d3Svg
      .selectAll('.pie-uk')
      .data(theData.data)
      .selectAll('.slice')
      .data(function(d: any){
        debugger;
         return pie([d.data[0], d.data[1]]) })
      .selectAll('path')
      .attr('d',  arc);*/
    
   
/*
     
				 path = path.data(pie(frequency)); // update the data
				  path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
			function arcTween(a) {
			  var i = d3.interpolate(this._current, a);
			  this._current = i(0);
			  return function(t) {
			    return arc(i(t));
			  };
			}
     
     */ 
  }
  
  public drawCircles(){
    this.d3Svg.append("circle")
      .attr("r", 50)
      .attr("fill", '#747474')
      .attr('class', 'circle-uk')
      .attr('stroke-opacity', 0);
    
    this.d3Svg.append("circle")
      .attr("r", 50)
      .attr("fill",  '#747474')
      .attr('class', 'circle-us')
      .attr('stroke-opacity', 0);
  }

  public drawPieCharts(pieData){

    this.d3Svg.selectAll('.pie-uk').remove();
    this.d3Svg.selectAll('.pie-us').remove();
    
    let d3 = this.d3;
    let d3Svg = this.d3Svg;
    let color = d3.scaleOrdinal(d3.schemeCategory10);

    var arc : any= d3.arc()
       .innerRadius(20).outerRadius(40);

    var labelArc : any= d3.arc()
       .innerRadius(55).outerRadius(55);

    var pie = d3.pie()
      .value(function(d: any){ return d.value });
          
    var pies = d3Svg.selectAll('.pie')
      .data(pieData)
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'pie')
      .attr('class', function(d: any){ return 'pie-' + d.country})
    
    pies
      .append("text")
      .attr("dy", "0.5em")
      .attr("class", "daily-text")
      .style("text-anchor", "middle")
      .style("fill", "white")
      .text(function(d: any) { return d.averageDailyReturn})

    pies  
      .append("circle")
      .attr("cx", "4.6em")
      .attr("cy", 0)
      .attr("r", 25)
      .attr("fill", '#747474')
      .attr('stroke-opacity', 0);

    pies
      .append("text")
      .attr("dy", "0.3em")
      .attr("dx", "4.6em")
      .attr("class", "average-text")
      .style("text-anchor", "middle")
      .style("fill", "white")
      .style("cursor", "pointer")
      .text(function(d: any) { return d.averageReturn})
      .on('mouseover', function(d : any) {  
          tooltip.html('<div class="hoverinfo">' 
          + 'Average Return: <strong>' 
          + d.averageReturn
          + '</strong>'
          +  '</div>')
          .style('left', ( d3.event.pageX) + "px")
          .style('top', ( (d3.event.pageY - 150)) + "px")
          .style("display", "inline-block");
      }).on('mouseout', function(d : any) { 
          tooltip.style('display', 'none');  
        });

    let tooltip = d3.select(".datamaps-hoverover");
              
    pies.selectAll('.slice')
      .data(function(d: any){
         return pie([d.data[0], d.data[1]]) })
      .enter()
      .append<SVGGElement>('path')
      .attr('d',  arc)
      .style('cursor', 'pointer')
      .style('fill', function(d,i: any){
        return color(i)
      })
      .on('mouseover', function(d : any) {  
       tooltip.html('<div class="hoverinfo">' 
              + '<strong>' 
              + d.data.name 
              + '</strong> <br>'
              + 'Price: <strong>' 
              + d.value 
              + '</strong> <br>'
              + 'Averate Return: <strong>' 
              + d.data.averageReturn
              + '</strong> <br>'
              + 'Averate Daily Return: <strong>' 
              + d.data.averageDailyReturn
              + '</strong>'
              +  '</div>')
          .style('left', ( d3.event.pageX) + "px")
          .style('top', ( (d3.event.pageY - 150)) + "px")
          .style("display", "inline-block");

          d3.selectAll(".line" )
              .transition()
              .duration(300)
              .style("stroke-width", 1 );
          d3.selectAll(".line-" + d.data.ticker_symbol)
            .transition()
            .duration(300)
            .style("stroke-width", 3 );
      }).on('mouseout', function(d : any) { 
          d3.selectAll(".line" )
          .transition()
              .duration(300)
              .style("stroke-width", 1 );
          tooltip.style('display', 'none');  
        });
    

    /*
    pies.selectAll('.slice')
      .data(function(d: any){
         return pie([d.data[0], d.data[1]]) })
      .enter()    
      .append("text")
	    .text(function(d: any) { return d.data.name;})
      .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
	    .style("fill", "black");*/

      this.relocateComponents();
  }
  private initMap(){
    var map =  new Datamap({
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
        USA: { fillKey: "exists" },
        GBR: { fillKey: "exists" }
      },
       done: function(datamap) {
          function highlight(country){
            /*d3.select('body').selectAll(".line" )
              .transition()
              .duration(300)
              .style("stroke-width", 1 );
           d3.selectAll("body .line-" + country)
              .transition()
              .duration(500)
              .style("stroke-width", 3 );
            datamap.svg.selectAll("body .line-" + country).style("stroke-width", 3 );*/
          }
          
          datamap.svg.select('.datamaps-subunit.USA')
              .on('click', function(geography) { highlight("us")});
          datamap.svg.select('.datamaps-subunit.GBR')
              .on('click', function(geography) { highlight("uk")});
                    
        }
    });

    map.bubbles([
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
      }
    ]);

    map.arc([
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
      }
    ],  {strokeWidth: 1, arcSharpness: 1.4});
      return map;
    }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    
    var startDate = changes['startDate'] ?  changes['startDate'].currentValue : this.startDate;
    var endDate = changes['endDate'] ?  changes['endDate'].currentValue : this.endDate;
    
    console.log("Start Date: " + startDate);
    console.log("End Date: " + endDate);
    
    if (startDate && ( !changes['startDate'] ||  !changes['startDate'].isFirstChange())
     && endDate && ( !changes['endDate'] ||  !changes['endDate'].isFirstChange())){
      this.changeFunction(startDate, endDate);
    }
  }
}