let cartesianCache = []
let polarCache = []
let cacheExp = "|"
let cacheRange = -1
let cacheQuality = -1

let maxRange = 200
let minRange = 0

let useCache = false

function tryReplaceSyntax(exp, searchValue, replaceValue) {
    while (exp.includes(searchValue)) {
        let index = exp.indexOf(searchValue)

        let letterBefore = exp[index - 1]
        let letterAfter = exp[index + searchValue.length]
        let addBracket = ""


        if (searchValue !== "θ" && searchValue !== "π" && searchValue !== "e" && letterAfter !== "(") {
            addBracket = "("
        }

        if (index === 0) {
            exp = exp.replace(searchValue, replaceValue + addBracket)
            continue
        }

        if ([" ", "-", "+", "*", "/"].includes(letterBefore)) {
            exp = exp.replace(searchValue, replaceValue + addBracket)
        } else {
            if (searchValue === "θ" && letterBefore === "(") {
                exp = exp.replace(searchValue, replaceValue + addBracket)
            } else if ([")", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(letterBefore)) {
                exp = exp.replace(searchValue, "*" + replaceValue + addBracket)
            } else {
                exp = exp.replace(searchValue, replaceValue + addBracket)
            }
        }
    }
    return exp
}


function xyToPixels(coordinate, width, height, scale) {
    if (coordinate === undefined) {return NaN}

    let x = coordinate[0]
    let y = coordinate[1]

    let pixelsPerRadial = 1000/scale

    return [x * pixelsPerRadial + width/2 + x_shift_px, y * pixelsPerRadial + height/2 + y_shift_px]
}


function pixelsToXY(coordinate, width, height, scale) {
    let x = coordinate[0]
    let y = coordinate[1]

    let pixelsPerRadial = 1000/scale

    return [x / pixelsPerRadial, -(y / pixelsPerRadial)]
}


function tryBracketMatch(exp) {
    while (occurrences(exp, "(", false) > occurrences(exp, ")", false)) {
        exp = exp + ")"
    }
    while (occurrences(exp, "(", false) < occurrences(exp, ")", false)) {
        exp = "(" + exp
    }
    return exp
}

function occurrences(string, subString, allowOverlapping) {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}

function inputIsClean(exp) {
    exp = exp.replaceAll("sin", "")
    exp = exp.replaceAll("cosec", "")
    exp = exp.replaceAll("sec", "")
    exp = exp.replaceAll("cos", "")
    exp = exp.replaceAll("tan", "")
    exp = exp.replaceAll("cot", "")
    exp = exp.replaceAll("e", "")



    for (let i = 0; i < exp.length; i++) {
        if (!["π", "θ", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "(", ")", ".", "+", "-", "*", "/", "**", " "].includes(exp.charAt(i))) {
            console.log(exp.charAt(i))
            return false
        }
    }

    return true
}


function replaceFunctions(exp) {
    exp = tryReplaceSyntax(exp, "sin", "Math.siKn")
    exp = tryReplaceSyntax(exp, "cosec", "1/Math.siKn")
    exp = tryReplaceSyntax(exp, "sec", "1/Math.coKs")
    exp = tryReplaceSyntax(exp, "cos", "Math.coKs")
    exp = tryReplaceSyntax(exp, "tan", "Math.taKn")
    exp = tryReplaceSyntax(exp, "cot", "1/Math.taKn")
    exp = tryReplaceSyntax(exp, "π", "Math.PKI")
    exp = tryReplaceSyntax(exp, "e", "Math.E")

    return exp
}


function evaluate(exp, val) {
    if (!inputIsClean(exp)) {
        inputRed()
        return [null, false]
    }

    exp = replaceFunctions(exp)

    exp = tryReplaceSyntax(exp, "θ", val.toString())

    exp = exp.replaceAll("K", "")

    exp = tryBracketMatch(exp)


    try {
        let res = eval(exp)
        inputNormal()
        return [res, true]
    }
    catch (err){
        console.log(exp)
        console.log(err)
        inputRed()
        return [null, false]
    }
}

function isFunction(variable) {
    return variable && {}.toString.call(variable) === '[object Function]';
}


function getPolar(exp, precision, renderRange) {
    if (exp === cacheExp && renderRange === cacheRange && cacheQuality/precision < 3) {
        useCache = true
        return polarCache
    } else {
        useCache = false
    }

    let polarCoordinates = []
    if (renderRange < 0) {
        for (let theta = 0; theta > 2*Math.PI*renderRange; theta -= precision) {
            let res = evaluate(exp, theta)
            if (res[1] && !isFunction(res[0]) && res[0] !== undefined) {
                polarCoordinates.push([theta, res[0]])
            } else {
                if (theta > 0 && polarCoordinates.length === 0) {
                    console.log("Invalid expression")
                    break
                }
            }
        }
    } else {
        for (let theta = 0; theta < 2*Math.PI*renderRange; theta += precision) {
            let res = evaluate(exp, theta)
            if (res[1] && !isFunction(res[0]) && res[0] !== undefined) {
                polarCoordinates.push([theta, res[0]])
            } else {
                if (theta > 0 && polarCoordinates.length === 0) {
                    console.log("Invalid expression")
                    break
                }
            }
        }
    }

    let res = evaluate(exp, 2*Math.PI*renderRange)
    polarCoordinates.push([2*Math.PI*renderRange, res[0]])


    return polarCoordinates
}


function toCartesian(exp, precision, polarCoordinates, renderRange) {
    if (useCache) {
        return cartesianCache
    }

    let cartesianCoordinates = []
    polarCoordinates.forEach(function(polar) {
        let theta = polar[0]
        let r = polar[1]

        let x = r * Math.cos(theta)
        let y = r * Math.sin(theta)

        cartesianCoordinates.push([x, -y, (r < 0)])
    });

    cacheExp = exp
    cartesianCache = cartesianCoordinates
    cacheRange = renderRange
    cacheQuality = precision

    return cartesianCoordinates
}

function distance(origin, destination) {
    let x1 = origin[0]
    let y1 = origin[1]

    let x2 = destination[0]
    let y2 = destination[1]

    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2))
}


function getNRadii(width, height, scale, rScale) {
    let nRadii = (width + Math.abs(x_shift_px))/(rScale * 1000) * scale
    if ((height/2 + Math.abs(y_shift_px)) > (width/2 + Math.abs(x_shift_px))) {
        nRadii = (height + Math.abs(y_shift_px))/(rScale * 1000) * scale
    }

    return nRadii
}


function roundTo(input, dp) {
    return Math.round(input*Math.pow(10, dp))/Math.pow(10, dp)
}


function lineApproachesInfinity(origin, destination) {
    let x1 = origin[0]
    let y1 = origin[1]

    let x2 = destination[0]
    let y2 = destination[1]

    return (!(-50 < (x1 + x2)/2 < 50 || -50 < (y1 + y2)/2 < 50))
}



function getRadiiScaling(width, height, scale) {
    const maxRadii = 30

    let nRadii = getNRadii(width, height, scale, 1)

    if (nRadii > maxRadii/2) {
        return Math.floor(nRadii/maxRadii) + 1
    } else {
        return Math.floor(nRadii/maxRadii * 10)/10 + 0.1
    }

}



