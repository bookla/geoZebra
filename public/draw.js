//Scale defined as number of radii per 1000 pixels
let universal_scale = 15
let x_shift_px = 0
let y_shift_px = 0

function updateScreen() {
    let axisCanvas = document.getElementById("axisCanvas");
    let radialCanvas = document.getElementById("radialCanvas");
    let width = window.innerWidth;
    let height = window.innerHeight;
    axisCanvas.width = width;
    axisCanvas.height = height;
    radialCanvas.width = width;
    radialCanvas.height = height;

    drawAxes(axisCanvas, width, height)
    drawRadial(radialCanvas, width, height, universal_scale)
    drawPoints()
}


function drawRadial(canvas, width, height, scale) {
    let rScale = getRadiiScaling(width, height, scale)

    document.getElementById("scaleDescription").innerText = "Scale: " + getScalingDescription(rScale)

    let nRadii = getNRadii(width, height, scale, rScale)
    nRadii = Math.floor(nRadii)

    let pen = canvas.getContext("2d")
    pen.clearRect(0, 0, width, height)

    for (let i = 0; i < nRadii; i++) {
        pen.beginPath()
        pen.strokeStyle = "darkGrey"
        pen.arc(width/2 + x_shift_px, height/2 + y_shift_px, ((rScale * 1000)/scale)*i, 0, 2*Math.PI)
        pen.stroke()
    }
}



function drawAxes(canvas, width, height) {
    let pen = canvas.getContext("2d")
    pen.clearRect(0, 0, width, height)

    //x-axis
    pen.beginPath()
    pen.moveTo(0, height/2 + y_shift_px)
    pen.lineTo(width, height/2 + y_shift_px)
    pen.stroke()

    //y-axis
    pen.beginPath()
    pen.moveTo(width/2 + x_shift_px, 0)
    pen.lineTo(width/2 + x_shift_px, height)
    pen.stroke()

    let diagonalLength = Math.sqrt(Math.pow(width + Math.abs(x_shift_px), 2) + Math.pow(height + Math.abs(y_shift_px), 2))

    //Quadrant 1/3
    pen.beginPath()
    pen.moveTo(width/2 + diagonalLength * Math.sin(Math.PI/4) + x_shift_px, height/2 - diagonalLength * Math.cos(Math.PI/4) + y_shift_px)
    pen.lineTo(width/2 - diagonalLength * Math.sin(Math.PI/4) + x_shift_px, height/2 + diagonalLength * Math.cos(Math.PI/4) + y_shift_px)
    pen.stroke()

    //Quadrant 2/4
    pen.beginPath()
    pen.moveTo(width/2 - diagonalLength * Math.sin(Math.PI/4) + x_shift_px, height/2 - diagonalLength * Math.cos(Math.PI/4) + y_shift_px)
    pen.lineTo(width/2 + diagonalLength * Math.sin(Math.PI/4) + x_shift_px, height/2 + diagonalLength * Math.cos(Math.PI/4) + y_shift_px)
    pen.stroke()

}

function drawPoints() {

    let inputField = document.getElementById("expression")

    let shifted = replaceShiftInput(inputField.value, "pi", "π", inputField.selectionStart)

    inputField.value = inputField.value.replaceAll("pi", "π")
    inputField.value = inputField.value.replaceAll("x", "θ")

    inputField.setSelectionRange(shifted, shifted)

    let exp = inputField.value


    interpretedText(exp)

    let precision = Math.pow(universal_scale, 0.3)/200

    if (universal_scale > 1000) {
        precision = Math.pow(1000, 0.3)/200
    }

    let polarCoordinates = getPolar(exp, precision, getRenderRange())

    if (polarCoordinates.length !== 0) {
        updateDrawLocationDisplay(polarCoordinates[polarCoordinates.length - 1])
    } else {
        updateDrawLocationDisplay([2 * Math.PI * getRenderRange(), 0])
    }

    let cartesianCoordinates = toCartesian(exp, precision, polarCoordinates, getRenderRange())

    let canvas = document.getElementById("pointsCanvas")
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width
    canvas.height = height

    let modeSelector = document.getElementById("showNegative")

    plot(canvas, width, height, universal_scale, cartesianCoordinates, modeSelector.checked)
}



function plot(canvas, width, height, scale, points, showNegative=false) {
    let pen = canvas.getContext("2d")
    pen.clearRect(0, 0, width, height)
    pen.lineWidth = 3

    for (let i = 0; i < points.length; i++) {
        let fromPoint = points[i]
        let toPoint = points[i + 1]
        let nextTwoPoint = points[i + 2]

        if (i === points.length - 1) {
            if (getRenderRange() !== 1.0) {
                toPoint = fromPoint
            } else {
                toPoint = points[0]
            }
        }


        let fromPixel = xyToPixels(fromPoint, width, height, scale)
        let toPixel = xyToPixels(toPoint, width, height, scale)

        let originX = width/2 + x_shift_px
        let originY = height/2 + y_shift_px

        if ((showNegative || (!fromPoint[2] && !toPoint[2])) && (distance(fromPoint, toPoint) < 20 || lineApproachesInfinity(fromPoint, toPoint))) {

            if (!fromPoint[2] && toPoint[2]) {
                pen.strokeStyle = "#06C6FF"
                pen.beginPath()
                pen.moveTo(fromPixel[0], fromPixel[1])
                pen.lineTo(originX, originY)
                pen.stroke()

                pen.strokeStyle = "#FF5733"
                pen.beginPath()
                pen.moveTo(originX, originY)
                pen.lineTo(toPixel[0], toPixel[1])
                pen.stroke()
            } else if (fromPoint[2] && !toPoint[2]) {
                pen.strokeStyle = "#FF5733"
                pen.beginPath()
                pen.moveTo(fromPixel[0], fromPixel[1])
                pen.lineTo(originX, originY)
                pen.stroke()

                pen.strokeStyle = "#06C6FF"
                pen.beginPath()
                pen.moveTo(originX, originY)
                pen.lineTo(toPixel[0], toPixel[1])
                pen.stroke()
            } else {
                if (fromPoint[2]) {
                    pen.strokeStyle = "#FF5733"
                } else {
                    pen.strokeStyle = "#06C6FF"
                }

                pen.beginPath()
                pen.moveTo(fromPixel[0], fromPixel[1])
                pen.lineTo(toPixel[0], toPixel[1])
                pen.stroke()
            }
        } else if (fromPoint[2] !== toPoint[2] && distance(fromPoint, [originX, originY]) < 20 ) {
            pen.beginPath()
            pen.moveTo(fromPixel[0], fromPixel[1])
            pen.lineTo(originX, originY)
            pen.stroke()
        } else if (!isFinite(fromPoint[0])){
            if (fromPoint[2]) {
                pen.strokeStyle = "#FF5733"
            } else {
                pen.strokeStyle = "#06C6FF"
            }

            if (fromPoint[0] > 0) {
                pen.beginPath()
                pen.moveTo(1000000, toPixel[1])
                pen.lineTo(xyToPixels(nextTwoPoint, width, height, scale)[0], xyToPixels(nextTwoPoint, width, height, scale)[1])
                pen.stroke()
            } else {
                pen.beginPath()
                pen.moveTo(-1000000, toPixel[1])
                pen.lineTo(xyToPixels(nextTwoPoint, width, height, scale)[0], xyToPixels(nextTwoPoint, width, height, scale)[1])
                pen.stroke()
            }
        }
    }
}



