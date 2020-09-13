function getScalingDescription(rScale) {
    if (rScale > 1) {
        return rScale.toString() + ":1"
    } else {
        return "1:" + Math.pow(rScale, -1).toString()
    }
}

function zoomIn() {
    if (universal_scale - 1 > 0) {
        universal_scale -= 1
        x_shift_px += x_shift_px * (1/universal_scale)
        y_shift_px += y_shift_px * (1/universal_scale)
    }
    updateScreen()
}


function replaceShiftInput(exp, searchValue, replaceValue, cursorPosition) {
    let cursorShift = 0
    let myExp = exp
    while (myExp.includes(searchValue)) {
        let index = myExp.indexOf(replaceValue)
        if (index <= cursorPosition) {
            cursorShift += (searchValue.length - replaceValue.length)
        }
        myExp = myExp.replace(searchValue, replaceValue)
    }

    return cursorShift
}


function updateField() {
    let inputField = document.getElementById("expression")

    let shift = replaceShiftInput(inputField.value, "pi", "π", inputField.selectionStart)
    shift += replaceShiftInput(inputField.value, "^", "**", inputField.selectionStart)

    let shifted = inputField.selectionStart - shift

    inputField.value = inputField.value.replaceAll("pi", "π")
    inputField.value = inputField.value.replaceAll("x", "θ")
    inputField.value = inputField.value.replaceAll("^", "**")
    inputField.value = inputField.value.toLowerCase()

    inputField.setSelectionRange(shifted, shifted)
}

function zoomOut() {
    universal_scale += 1
    x_shift_px -= x_shift_px * (1/universal_scale)
    y_shift_px -= y_shift_px * (1/universal_scale)
    updateScreen()
}

function resetZoom() {
    universal_scale = 15
    x_shift_px = 0
    y_shift_px = 0
    document.getElementById("renderRange").value = "100"

    updateScreen()
}


function inputRed() {
    let inputBox = document.getElementById("expression")
    inputBox.style.color = "red"
}

function inputNormal() {
    let inputBox = document.getElementById("expression")
    inputBox.style.color = "black"
}


function getRenderRange() {
    let range = document.getElementById("renderRange")
    return range.value/100
}

function initEnterListener() {
    document.getElementById("expression").onkeyup = function (event) {
        console.log("KEY UP")
        if (event.keyCode === 13 || event.key === "Enter") {
            this.blur();
        }
    };
}

window.addEventListener('wheel', function(event) {
    if (universal_scale + event.deltaY/23 >= 0.3 || event.deltaY > 0) {

        /*
        let width = window.innerWidth;
        let height = window.innerHeight;

        let mouseX = event.clientX - (width/2)
        let mouseY = event.clientY - (height/2)

        console.log([mouseX, mouseY])

        if (mouseX - x_shift_px > 1) {
            mouseX = -Math.pow(mouseX, 0.8)
        } else if (mouseX - x_shift_px < 1) {
            mouseX = Math.pow(Math.abs(mouseX), 0.8)
        }

        if (mouseY - y_shift_px > 1) {
            mouseY = -Math.pow(mouseY, 0.8)
        } else if (mouseY - y_shift_px < 1) {
            mouseY = Math.pow(Math.abs(mouseY), 0.8)
        }

        consol e.log(mouseX * ((event.deltaX/23)/universal_scale), mouseY * ((event.deltaY/23)/universal_scale))

        if (event.deltaY < 0) {
            x_shift_px -= (mouseX - x_shift_px) * ((event.deltaX/23)/universal_scale)
            y_shift_px -= (mouseY - y_shift_px) * ((event.deltaY/23)/universal_scale)
        } else {
            x_shift_px += (mouseX - x_shift_px) * ((event.deltaX/23)/universal_scale)
            y_shift_px += (mouseX - y_shift_px) * ((event.deltaY/23)/universal_scale)
        }
        */

        universal_scale += event.deltaY/23
        x_shift_px -= x_shift_px * ((event.deltaY/23)/universal_scale)
        y_shift_px -= y_shift_px * ((event.deltaY/23)/universal_scale)
        updateScreen()
    }
})

window.onzoom = function(event) {
    if (universal_scale + event.deltaY/23 >= 0.3 || event.deltaY > 0) {
        universal_scale += event.deltaY/23
        updateScreen()
    }
}


//Disable scroll
window.onscroll = function() {
    document.getElementById("expression").blur()
    window.scrollTo(0, 0)
}


function updateDrawLocationDisplay(polarCoordinate) {
    let r = roundTo(polarCoordinate[1], 5)
    let theta = roundTo(polarCoordinate[0], 5)
    let element = document.getElementById("renderRangeDisplay")
    element.innerText = "r = " + r.toString() + ", theta = " + theta.toString()
}


function updateMousePositionDisplay(position) {

    let width = window.innerWidth;
    let height = window.innerHeight;

    position = [position[0] - width/2 - x_shift_px, position[1] - height/2 - y_shift_px]

    position = pixelsToXY(position, width, height, universal_scale)

    let r = Math.sqrt(Math.pow(position[0],2) + Math.pow(position[1], 2))
    let theta = Math.atan(position[1]/position[0])


    if ((position[0] < 0 && position[1] > 0) || (position[0] < 0 && position[1] < 0)) {
        theta += Math.PI
    } else if (position[0] > 0 && position[1] < 0) {
        theta += 2*Math.PI
    }

    r = roundTo(r, 5)
    theta = roundTo(theta, 5)

    let description = "r = " + r.toString() + ", theta = " + theta.toString()

    let label = document.getElementById("mousePosition")
    label.innerText = description
}

function getExpression() {
    let textBox = document.getElementById("expression")
    return textBox.value
}

function mouseInTextBox(position) {
    let textBox = document.getElementById("expression")
    let bounds = textBox.getBoundingClientRect()
    return (position[0] < bounds.right && position[0] > bounds.left && position[1] < bounds.bottom && position[1] > bounds.top)
}


function mouseInSlide(position) {
    let textBox = document.getElementById("renderRange")
    let bounds = textBox.getBoundingClientRect()
    return (position[0] < bounds.right + 10 && position[0] > bounds.left - 10 && position[1] < bounds.bottom + 40 && position[1] > bounds.top - 10)
}


function interpretedText(exp) {

    exp = replaceFunctions(exp)

    exp = tryReplaceSyntax(exp, "θ", "L")

    exp = exp.replaceAll("K", "")
    exp = exp.replaceAll("L", "θ")

    exp = tryBracketMatch(exp)


    let element = document.getElementById("interpreted")
    element.innerText = "Interpreted as : " + exp
}


function shareCurrent() {
    let url = location.protocol + '//' + location.host + location.pathname + "?exp=" + getExpression().replaceAll(" ", "").replaceAll("θ", "x") + "&x=" + ((-1)*pixelsToXY([x_shift_px, 0], window.innerWidth, window.innerHeight, universal_scale)[0]).toString() + "&y=" + ((-1)*pixelsToXY([0, y_shift_px], window.innerWidth, window.innerHeight, universal_scale)[1]).toString() + "&zoom=" + universal_scale.toString() + "&range=" + (100*getRenderRange()).toString() + "&minRange=" + minRange.toString() + "&maxRange=" + maxRange.toString()
    if (!document.getElementById("showNegative").checked) {
        url += "&hideNegative"
    }

    const el = document.createElement('textarea');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    alert("Link Copied to Clipboard\n" + url)
    console.log(url)
}



let mouseDown = false
let touchDown = false
let lastPosition = [0, 0]


function onMouseDown(event) {
    if (!mouseInTextBox([event.clientX, event.clientY]) && !mouseInSlide([event.clientX, event.clientY])) {
        mouseDown = true
    }
}


function onMouseUp() {
    mouseDown = false
}


function onMouseMove(event) {
    if (lastPosition !== [0, 0] && mouseDown) {
        let dx = event.clientX - lastPosition[0]
        let dy = event.clientY - lastPosition[1]

        if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
            x_shift_px += dx
            y_shift_px += dy
            updateScreen()
        }
    }

    updateMousePositionDisplay([event.clientX, event.clientY])
    lastPosition = [event.clientX, event.clientY]
}

function onTouchMove(event) {
    let touch = event.touches[0]
    if (lastPosition !== [0, 0] && !mouseInSlide([event.touches[0].clientX, event.touches[0].clientY])) {
        let dx = event.changedTouches[0].clientX - lastPosition[0];
        let dy = event.changedTouches[0].clientY - lastPosition[1];


        if (Math.abs(dx) > 0.000 || Math.abs(dy) > 0.000) {
            x_shift_px += dx
            y_shift_px += dy
            updateScreen()
        }
    }


    lastPosition = [touch.clientX, touch.clientY]
}



window.onmouseup = function() {onMouseUp()}
window.onmousedown = function(event) {onMouseDown(event)}
window.onmousemove = function(event) {onMouseMove(event)}

window.ontouchstart = function(event) {if (!mouseInSlide([event.touches[0].clientX, event.touches[0].clientY])) {touchDown = true} lastPosition = [event.touches[0].clientX, event.touches[0].clientY]; updateMousePositionDisplay(lastPosition)}
window.ontouchend = function() {touchDown = false}
window.ontouchcancel = function() {touchDown = false}
window.ontouchmove = function(event) {onTouchMove(event)}

