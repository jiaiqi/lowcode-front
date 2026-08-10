
let $ = require("jquery");

let MapPlus = {};

if(window.BMapGL){
MapPlus.Map = class Map extends BMapGL.Map {
  constructor(dom) {
    super(dom);
   
    var point = new BMapGL.Point('108.948024',' 34.263161');

 
    this.centerAndZoom(point,10);


    // this.defaultViewData = {
    //     zoom: 12,
    //     center: point
    // };
    this.enableScrollWheelZoom();
    this.overlays=[]


  }


  clearOverlays(){
    // this.remove
    this.overlays.forEach((item)=>{
      this.removeOverlay(item)
    })
    this.overlays=[];
    super.clearOverlays()
  }


  addOverlay(overlay) {


    if (overlay instanceof MapPlus.Covers) {
      let centerData = this.getViewport(overlay.viewDatas);
      overlay.collection.forEach((item, index) => {
        this.overlays.push(item)
        super.addOverlay(item);
      });

      console.log(overlay, "==overlay==overlay==")
      if (overlay.autoView) {
        let centerAnd = this.getViewport(overlay.viewDatas);
        this.centerAndZoom(centerAnd.center, centerAnd.zoom);
      }
    } else {
      this.overlays.push(overlay)
      super.addOverlay(overlay);
    }
  }


};



MapPlus.Cover = class Cover extends BMapGL.Overlay {
  constructor(data) {
    let { point, size, str, mapJd = 'jd', mapWd = 'wd' } = data;

    /**  
     * 
     * mapJd:'',
     * mapWd:''
     * 
     * 
     */

    super();
    this.point = point;
    this.mapJd = mapJd;
    this.mapWd = mapWd;
    this.size = size || 2;
    this.str = str;
    this.callBack = data.callBack;
    this.viewDatas = [];
    if (this.point instanceof BMapGL.Point) {
      this.viewDatas.push(this.point)
    } else {

      let viewData = new BMapGL.Point(this.point[`${this.mapJd}`], this.point[`${this.mapWd}`]);

      this.viewDatas.push(viewData);
    }

    this.dom = $(this.str)[0];
  }

  initialize(map) {
    this._map = map;


    // console.log(this.dom, "dom-dom-");

    if (this.callBack) {
      if (this.callBack.click) {
        this.dom.addEventListener("click", (e) => {
          this.callBack.click.call(map, {
            cover: this,
            e: e,
          });
        });
      }

      if (this.callBack.mouseover) {
        this.dom.addEventListener("mouseover", (e) => {
          this.callBack.mouseover.call(map, {
            cover: this,
            e: e,
          });
        });
      }

      if (this.callBack.mouseout) {
        this.dom.addEventListener("mouseout", (e) => {
          this.callBack.mouseout.call(this, {
            cover: this,
            e: e,
          });
        });
      }
    }
    map.getPanes().labelPane.appendChild(this.dom);
    return this.dom;
  }

  draw() {
    // 根据地理坐标转换为像素坐标，并设置给容器
    let transfromPoint = this.viewDatas[0]
    // console.log(this.point.path, transfromPoint, "==transfromPoint==")
    const position = this._map.pointToOverlayPixel(transfromPoint);
    // console.log(position, `${this.point.path}==position==`)

    this.dom.style.left = `${position.x}px`;
    this.dom.style.top = `${position.y}px`;
    this.dom.style.position = `absolute`;
  }
}

MapPlus.Covers = class Covers {
  constructor(data) {
    /**
     * {
     *   points:[],
     *   callBack:{
     *      render(){
     *         
     *       }
     * 
     *   },
     *  
     *   mapJd:'',
     *   mapWd:'',
     *   autoView:true
     *   
     * 
     * }
     * 
     * 
     */

    this.data = data;
    this.viewDatas = [];
    this.collection = [];
    this.autoView = data.autoView ? data.autoView : true;
    
    this.mapJd = this.data.mapJd || this.data.points[0].mapJd || 'jd';
    this.mapWd = this.data.mapWd ||   this.data.points[0].mapWd  || 'wd';

    this.initData();
  }

  initData() {
    if (this.data.points.length > 0) {
      if (this.data.points[0] instanceof BMapGL.Point) {
        this.viewDatas = this.data.points;

        this.data.points.forEach((item, index) => {

          let point = item;
          item.truePoint=point;
          let str = this.data.callBack.render.call(this, item, index, this.data.points);
          if (str instanceof MapPlus.Cover) {
            this.collection.push(str);
          } else {
            let covers = new MapPlus.Cover({
              point: point,
              size: 2,
              str,
              callBack: this.data.callBack

            })

            this.collection.push(covers)
          }



        })
      } else {
   
        this.data.points.forEach((item, index) => {

        

          let point = new BMapGL.Point(item[`${this.mapJd}`], item[`${this.mapWd}`]);
          this.viewDatas.push(point);
          item.truePoint=point;
          let str = this.data.callBack.render.call(this, item, index, this.data.points);
          if (str instanceof MapPlus.Cover) {
            this.collection.push(str);
          } else {
            let covers = new MapPlus.Cover({
              point: point,
              size: 2,
              str,
              callBack: this.data.callBack

            })
          }



        })
      }
    }

  }

};

MapPlus.Lusu = class Lusu {
  constructor(data) {
    /**{
     *  cover:,
     *  points,
     *  map,
     * 
     * 
     * } */
    let { cover, points, map, speed } = data;
    this.cover = cover;
    if (points[0] instanceof BMapGL.Point) {

      this.points = points;


    } else {
      this.points=[];
      this.mapJd = points[0].mapJd || 'jd';
      this.mapWd = points[0].mapWd ||  'wd';
      points.forEach((item, index) => {


        let point = new BMapGL.Point(item[`${this.mapJd}`], item[`${this.mapWd}`]);
        this.points.push(point)


      })
    }

    this.map = map;
    this.cover = cover;
    this.speed = speed || 20;
    this.isIndex = 0
    this.startPoint = null;
    this.endPoint = null;
    this.isEnd = false;
    this.position = {
      x: 0,
      y: 0
    }
    this.allPoints = []
  }


  start() {
    console.log("=============")
    this.map.addOverlay(this.cover);

    for (let i = 0; i < this.points.length; i++) {
      this.isIndex = i;

      if (i == this.points.length - 1) {
        this.isEnd = true;
        return
      } else {
        this.startPoint = this.points[i];
        this.endPoint = this.points[i + 1];
        this.setData()
        this.move()

      }


    }

  }

  setData() {
    // console.log(this.startPoint, "this.startPoint")
    let start = this.map.pointToOverlayPixel(this.startPoint);

    // console.log(start, "start")
    let end = this.map.pointToOverlayPixel(this.endPoint);
    let miNumber = this.map.getDistance(this.startPoint, this.endPoint);
    let count = Math.round(miNumber / this.speed);
    this.count = count;
    this.currentCount = 0;




  }

  move() {

    let _this = this;


    let timer = setInterval(() => {
      _this.currentCount++;
      // console.log(_this.startPoint, "==_this.startPoint=_this.startPoint=");
      let start = _this.map.pointToPixel(_this.startPoint);

      let end = _this.map.pointToPixel(_this.endPoint);

      let pixel2 = new BMapGL.Pixel(start.x, start.y)
      let finallPoint2 = _this.map.pixelToPoint(pixel2);
      // console.log(finallPoint2, "==finallPoint2==finallPoint2=")

      let distanceX = end.x - start.x;
      let distanceY = end.y - start.y;

      let avgX = distanceX / this.count;
      let avgY = distanceY / this.count;

      let finalX = 0;
      let finalY = 0;
      if (_this.currentCount == _this.count) {
        clearInterval(timer);
        finalX = end.x;
        finalY = end.y;
      } else {
        if (_this.currentCount == 1) {
          finalX = start.x;
          finalY = start.y;
        } else {
          finalX = start.x + _this.currentCount * avgX;
          finalY = start.y + _this.currentCount * avgY;
        }

        // if (_this.position.y == 0) {
        //   _this.position.y = start.y;
        // } else {
        //   _this.position.y = _this.position.y + _this.currentCount*avgY;
        // }
      }

      let pixel = new BMapGL.Pixel(finalX, finalY)
      let finallPoint = _this.map.pixelToPoint(pixel);
      this.allPoints.push(finallPoint);


      if (this.allPoints.length > 1) {
        let startLine = this.allPoints[this.allPoints.length - 2];
        let endLine = this.allPoints[this.allPoints.length - 1];
        let linePoints = [startLine, endLine]

        var polyline = new BMapGL.Polyline(linePoints, {
          strokeColor: "blue",
          strokeWeight: 6,
          strokeOpacity: 0.5,
        });

        this.map.addOverlay(polyline)
      }
      this.cover.viewDatas = [finallPoint];

      this.cover.draw.call(this.cover);

      // $(this.cover.dom).css({
      //   "left": `${this.position.x}px`,
      //   "top": `${this.position.y}px`,
      // })



    }, 100)

  }












}




// setRotation: function (prePos, curPos, targetPos) {

//   prePos是不可用的

//   var me = this;
//   var deg = 0;
//   //start!
//   curPos = me._map.pixelToPoint(curPos);
//   targetPos = me._map.pixelToPoint(targetPos);

//   if (targetPos.x != curPos.x) {
//       var tan = (targetPos.y - curPos.y) / (targetPos.x - curPos.x),
//           atan = Math.atan(tan);
//       deg = atan * 360 / (2 * Math.PI);

//       //degree  correction;
//       if (targetPos.x < curPos.x) {
//           deg = -deg + 90 + 90;

//       } else {

//           deg = -deg;
//       }

//       me._marker.setRotation(-deg);

//   } else {
//       var disy = targetPos.y - curPos.y;
//       var bias = 0;
//       if (disy > 0)
//           bias = -1
//       else
//           bias = 1
//       me._marker.setRotation(-bias * 90);
//   }
//   return;

// }


// effect: function (initPos, targetPos, currentCount, count) {
//   var b = initPos, c = targetPos - initPos, t = currentCount,
//       d = count;
//   return c * t / d + b;
// }



// me.currentCount++;
// var x = effect(init_pos.x, target_pos.x, me.currentCount, me.count),
//     y = effect(init_pos.y, target_pos.y, me.currentCount, me.count),
//     pos = me._map.pixelToPoint(new BMapGL.Pixel(x, y));
// //璁剧疆marker
// if (me.currentCount == 1) {
//     var proPos = null;
//     if (me.i - 1 >= 0) {
//         proPos = me._path[me.i - 1];
//     }
//     if (me._opts.enableRotation == true) {
//         me.setRotation(proPos, initPos1, targetPos1);
//     }

// }



MapPlus.cutLine = function (data) {
  let { points, number } = data;
  let start = points[0];
  let end = points[1];


}











}
export default MapPlus;
