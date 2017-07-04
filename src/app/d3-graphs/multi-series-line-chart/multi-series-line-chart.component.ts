import { Component, Input, ElementRef, NgZone, OnDestroy, OnInit, OnChanges, ViewChild, SimpleChange } from '@angular/core';
import { D3Service, D3, Axis, BrushBehavior, BrushSelection, D3BrushEvent, ScaleTime, ScaleLinear, ScaleOrdinal, Selection, Transition} from 'd3-ng2-service';

@Component({
  selector: 'app-multiserieslinechart',
  template: `<svg class="line-chart" width="400" height="180"></svg>`
})

export class MultiSeriesLineChartComponent implements OnInit, OnDestroy {

  @Input() graphAttribute: string;
  @Input() stockData: string;

  private d3: D3;
  private parentNativeElement: any;
  private d3Svg: Selection<SVGSVGElement, any, null, undefined>;
  private x: ScaleTime<number, number>;
  private updateFunction;

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
    let d3G: Selection<SVGGElement, any, null, undefined>; //  g: any;
    let width: number;
    let height: number;
    let x: ScaleTime<number, number>; // x
    let y: ScaleLinear<number, number>; //   y;
    let z: ScaleOrdinal<number, string>; //  z;
    let xAxis: any;
    let yAxis: any;
    let margin: any; 
    let line; 
    let dateData: any;
    let graphAttribute = this.graphAttribute;
    this.updateFunction = updateGraph;
    
    if (this.parentNativeElement !== null) {
      d3ParentElement = d3.select(this.parentNativeElement);
      d3Svg = d3ParentElement.select<SVGSVGElement>('svg');
      drawGraph(this.stockData);
    }

    function drawGraph(targetData){
      
      let processedStocks: any = JSON.parse(targetData);
      dateData = processedStocks.map((v) => v.values.map((v) => new Date(v.date) ))[0];
      margin = {top: 20, right: 80, bottom: 30, left: 50};
      width = +d3Svg.attr('width') - margin.left - margin.right;
      height = +d3Svg.attr('height') - margin.top - margin.bottom;
      
      d3G = d3Svg
            .append<SVGGElement>('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x = d3.scaleTime().range([0, width]);
      y = d3.scaleLinear().range([height, 0]);
      z = d3.scaleOrdinal<number, string>(d3.schemeCategory10);

      xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%b"));
      yAxis  = d3.axisLeft(y)
   
      if(graphAttribute === "volume"){
        var format = d3.formatPrefix(",.0", 1e6);
        yAxis.tickFormat (function (d) { return format(d)});
      }  
      
      line = d3.line()
        .curve(d3.curveBasis)
        .x( (d: any) => x(new Date(d.date)) )
        .y( (d: any) => y(d[graphAttribute]) );

      x.domain(d3.extent(dateData, (d: Date) => d ));

      let y0 = parseFloat(d3.min(processedStocks, function(c: any) { return d3.min(c.values, function(d) { return d[graphAttribute]; }); }));
      let y1 = parseFloat(d3.max(processedStocks, function(c: any) { return d3.max(c.values, function(d) { return d[graphAttribute]; }); }));
      y.domain([y0, y1]);

      z.domain(processedStocks.map(function(c) { return c.id; }));

      //drawAxis();
      d3G.append<SVGGElement>('g')
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      d3G.append('g')
        .attr("class", "axis axis--y")
        .call(yAxis)
        .append<SVGGElement>('text')
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("color", "#ff0000")
        .text("%");
        
      //drawPath();

      let stock = d3G.selectAll(".stock")
        .data(processedStocks)
        .enter().append<SVGGElement>('g')
        .attr("fill", "none")
        .attr("class", "stock")
        .on("mouseover", mouseover);

      stock.append('path')
        .attr("d", (d : any) => line(d.values) )
        .style("stroke", (d : any) => z(d.id) )
        .attr("class", (d: any) => "line line-" + d.country_code + " line-" + d.ticker_symbol) ;

        // ardadarda
      stock.append('text')
        .datum(function(d : any) { return {id: d.id, ticker_symbol: d.ticker_symbol, value: d.values[d.values.length - 1]}; })
        .attr("transform", (d) => "translate(270," + (d.id * 20) + ")" )
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "14px sans-serif")
        .style('class', function(d,i: any){
            return ("graph-text-" + i + "-" + d.ticker_symbol);
        })
        .style("fill", (d : any) => z(d.id) )
        .text(function(d) { return d.ticker_symbol; });

      var focus = d3Svg.append("g")
          .attr("class", "focus")
          .style("display", "none");

      function mouseover(){
        //debugger;
        let bisectDate = d3.bisector(function(d : any) { return d.date; }).left;
        let x0 : any = new Date(x.invert(d3.mouse(this)[0]));
        var valueData = processedStocks[0].values;
        let i = bisectDate(valueData, x0, 1);
        let d0 = valueData[i - 1];
        let d1 = valueData[i];
        let d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        console.log(d);
        
        //var i = this.stock(processedStocks, x0, 1);
        //var d0 = d3G.data[i - 1];
        //var d1 = d3G.data[i];
        
        //console.log("d0" + d0);
          //console.log("d1" + d1);
      }
    }

    function updateGraph(targetData){

      let processedStocks: any = JSON.parse(targetData);
      dateData = processedStocks.map((v) => v.values.map((v) => new Date(v.date) ))[0];
     
      x = d3.scaleTime().range([0, width]);
      y = d3.scaleLinear().range([height, 0]);
      z = d3.scaleOrdinal<number, string>(d3.schemeCategory10);
    	// Scale the range of the data again 
      x.domain(d3.extent(dateData, (d: Date) => d ));
      let y0 = parseFloat(d3.min(processedStocks, function(c: any) { return d3.min(c.values, function(d) { return d[graphAttribute]; }); }));
      let y1 = parseFloat(d3.max(processedStocks, function(c: any) { return d3.max(c.values, function(d) { return d[graphAttribute]; }); }));
      y.domain([y0, y1]);
      
      console.log("check difference")
      xAxis = d3.axisBottom(x);
      
      let days = Math.ceil((dateData[dateData.length-1].setHours(0, 0, 0, 0) - dateData[0].setHours(0, 0, 0, 0)) / (1000 * 3600 * 24)); 
      console.log(days);
      
      if(days > 180){
        xAxis.tickFormat(d3.timeFormat("%b"));
      }
      else{
        xAxis.tickFormat(d3.timeFormat("%d-%b"));
      }

      if(days < 8){
        console.log("a");
        xAxis.ticks(Math.ceil(days));
      }
      else if(days < 180){
        console.log("b");
        xAxis.ticks(4);
      }
      else{
        console.log("c");
        xAxis.ticks(Math.ceil(days/30));
      }
      
      let newD3Svg = d3Svg.transition();
      d3G.selectAll(".stock").remove();
        
      // would be better with transitions
      let stock = d3G.selectAll(".stock")
        .data(processedStocks)
        .enter().append<SVGGElement>('g')
        .attr("fill", "none")
        .attr("class", "stock");
        //.on("mouseover", mouseover);

      stock.append('path')
        .attr("d", (d : any) => line(d.values) )
        .style("stroke", (d : any) => z(d.id) )
        .attr("class", (d: any) => "line line-" + d.country_code + " line-" + d.ticker_symbol) ;

      stock.append('text')
        .datum(function(d : any) { return {id: d.id, ticker_symbol: d.ticker_symbol, value: d.values[d.values.length - 1]}; })
        .attr("transform", (d) => "translate(270," + (d.id * 20) + ")" )
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "14px sans-serif")
        .style("fill", (d : any) => z(d.id) )
        .text(function(d) { return d.ticker_symbol; });

      /*
      let newd3G = d3G.selectAll(".stock").transition();

        // Make the changes
        newd3G.selectAll(".line")   // change the line
            .duration(750)
            .attr("d", (d : any) => line(d.values) )
           .style("stroke", (d : any) => z(d.id) );
          */
        newD3Svg.select(".axis--x") // change the x axis
            .duration(750)
            .call(xAxis);

        newD3Svg.select(".axis--y") // change the y axis
            .duration(750)
            .call(yAxis);
    }
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    if ( changes['stockData'] &&  !changes['stockData'].isFirstChange()){
      this.updateFunction(changes["stockData"].currentValue);
    }
  }
}