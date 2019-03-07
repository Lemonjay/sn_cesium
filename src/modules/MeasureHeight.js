//****************************高度测量 第一个点的经纬度，第二个点的高度，两点水平距离为半径************************************************//
import Cesium from 'cesium/Source/Cesium'
export class measureHeight1 {
    constructor(viewer, style) {
        this.viewer = viewer;

        this.style = style;

        this.handler = null
        this.tempEntities = [];
        this.lineEntities = []
        this.linePositionList = [];
        this.areaPositionList = []
        this.labelPosition = {
            x: 1,
            y: 1,
            z: 1
        };
        this._addDisListener()
    }
    _addDisListener() {


    }
}
var measureHeight = function (viewer, handler) {
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
    var positions = [];
    var poly = null;
    var tooltip = document.createElement("div");
    var height = 0;
    var cartesian = null;
    // var floatingPoint ;
    tooltip.style.display = "block";
    var measure_entities = [];
    handler.setInputAction(function (movement) {
        tooltip.style.left = movement.endPosition.x + 3 + "px";
        tooltip.style.top = movement.endPosition.y - 25 + "px";
        tooltip.innerHTML = '<p>单击开始，双击结束</p>';
        cartesian = viewer.scene.pickPosition(movement.endPosition);


        if (positions.length >= 2) {
            if (!Cesium.defined(poly)) {
                poly = new PolyLinePrimitive(positions);
            } else {
                positions.pop();
                positions.push(cartesian);
            }
            height = getHeight(positions);
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function (movement) {
        tooltip.style.display = "none";

        cartesian = viewer.scene.pickPosition(movement.position);

        if (positions.length == 0) {
            positions.push(cartesian.clone());
            positions.push(cartesian);

            viewer.entities.add({
                parent: measure_entities,
                name: '高度',
                position: positions[0],
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.none
                },
                label: {
                    text: "0米",
                    font: '18px sans-serif',
                    fillColor: Cesium.Color.GOLD,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(20, -40)
                }
            });
        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function () {
        handler.destroy();
        //positions.pop();//清除移动点			
        tooltip.style.display = "none";
        //viewer_g.entities.remove(floatingPoint);
        // console.log(positions);
        //在三维场景中添加Label

        var textDisance = height + "米";

        var point1cartographic = Cesium.Cartographic.fromCartesian(positions[0]);
        var point2cartographic = Cesium.Cartographic.fromCartesian(positions[1]);
        var point_temp = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(point1cartographic.longitude), Cesium.Math.toDegrees(point1cartographic.latitude), point2cartographic.height);


        viewer.entities.add({
            parent: measure_entities,
            name: '直线距离',
            position: point_temp,
            point: {
                pixelSize: 5,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.none
            },
            label: {
                text: textDisance,
                font: '18px sans-serif',
                fillColor: Cesium.Color.GOLD,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(20, -20)
            }
        });
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    function getHeight(_positions) {
        var cartographic = Cesium.Cartographic.fromCartesian(_positions[0]);
        var cartographic1 = Cesium.Cartographic.fromCartesian(_positions[1]);
        var height_temp = cartographic1.height - cartographic.height;
        return height_temp.toFixed(2);
    }

    var PolyLinePrimitive = (function () {
        function _(positions) {
            this.options = {
                parent: measure_entities,
                name: '直线',
                polyline: {
                    show: true,
                    positions: [],
                    material: Cesium.Color.AQUA,
                    width: 2
                },
                ellipse: {
                    show: true,
                    // semiMinorAxis : 30.0,
                    // semiMajorAxis : 30.0,
                    // height: 20.0,
                    material: Cesium.Color.GREEN.withAlpha(0.5),
                    outline: true // height must be set for outline to display
                }
            };
            this.positions = positions;
            this._init();
        }

        _.prototype._init = function () {
            var _self = this;
            var _update = function () {
                var temp_position = [];
                temp_position.push(_self.positions[0]);
                var point1cartographic = Cesium.Cartographic.fromCartesian(_self.positions[0]);
                var point2cartographic = Cesium.Cartographic.fromCartesian(_self.positions[1]);
                var point_temp = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(point1cartographic.longitude), Cesium.Math.toDegrees(point1cartographic.latitude), point2cartographic.height);
                temp_position.push(point_temp);

                return temp_position;
            };
            var _update_ellipse = function () {
                return _self.positions[0];
            };
            var _semiMinorAxis = function () {
                var point1cartographic = Cesium.Cartographic.fromCartesian(_self.positions[0]);
                var point2cartographic = Cesium.Cartographic.fromCartesian(_self.positions[1]);
                /**根据经纬度计算出距离**/
                var geodesic = new Cesium.EllipsoidGeodesic();
                geodesic.setEndPoints(point1cartographic, point2cartographic);
                var s = geodesic.surfaceDistance;
                return s;
            };
            var _height = function () {
                var height_temp = getHeight(_self.positions);
                return height_temp;
            };
            //实时更新polyline.positions
            this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);
            this.options.position = new Cesium.CallbackProperty(_update_ellipse, false);
            this.options.ellipse.semiMinorAxis = new Cesium.CallbackProperty(_semiMinorAxis, false);
            this.options.ellipse.semiMajorAxis = new Cesium.CallbackProperty(_semiMinorAxis, false);
            this.options.ellipse.height = new Cesium.CallbackProperty(_height, false);
            viewer.entities.add(this.options);
        };

        return _;
    })();
};
export default measureHeight;
