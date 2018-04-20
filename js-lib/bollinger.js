function addBollingerBands(response, label) {
	let movingAveragePeriod = 20;
	addBollingerBands(response, label, "", movingAveragePeriod, "rgba(220, 220, 255, 1)");
}

function addBollingerBands(response, label, labelSuffix, movingAveragePeriod, backgroundColor) {
	let data = response.datasets;
	let oldDataLength = data.length;
	console.log("addBollingerBands started " + label);
	for (let dataIx = 0; dataIx < oldDataLength; dataIx++) {
		let elt = data[dataIx];
		if (elt.label == label) {
			console.log("found label \"" + label + "\" in data.");
			let eltData = elt.data;

			let movingAverageData = getMovingAverage(eltData, movingAveragePeriod);
			let maElt = cloneElt(elt, movingAverageData, label + "Moving Average", "rgb(171,171,255)", undefined, false);
			data.push(maElt);

			let standardDeviationData = getStandardDeviation(eltData, movingAverageData, movingAveragePeriod);
			// let sdElt = cloneElt(elt, standardDeviationData, label +
			// "Stddev");
			// data.push(sdElt);

			let topBollingerData = getBollinger(movingAverageData, standardDeviationData, +2);
			let bollingerTopElt = cloneElt(elt, topBollingerData, label + "Bollinger Top", "rgb(171,255,171)", undefined, false);
			data.push(bollingerTopElt);
			//			
			let botBollingerData = getBollinger(movingAverageData, standardDeviationData, -2);
			let bollingerBotElt = cloneElt(elt, botBollingerData, label + "Bollinger Bot", "rgb(255,171,171)", backgroundColor, "-1");
			data.push(bollingerBotElt);
		}
	}
	console.log("addBollingerBands complete " + label);
}

function cloneElt(elt, data, label, borderColor, backgroundColor, fill) {
	let newElt = {};
	newElt.borderColor = borderColor;
	newElt.backgroundColor = backgroundColor;
	newElt.fill = fill;
	newElt.data = data;
	newElt.label = label;
	newElt.type = elt.type;
	newElt.yAxisID = elt.yAxisID;
	return newElt;
}

function getBollinger(movingAverageData, standardDeviationData, stdevScale) {
	let bollingers = [];
	for (let dataIx = 0; dataIx < movingAverageData.length; dataIx++) {
		bollingers.push(0);
	}
	for (let dataIx = 0; dataIx < movingAverageData.length; dataIx++) {
		bollingers[dataIx] = movingAverageData[dataIx] + (standardDeviationData[dataIx] * stdevScale);
	}
	return bollingers;
}

function getStandardDeviation(data, movingAverageData, period) {
	let variances = [];
	let counts = [];
	let stddevs = [];
	for (let dataIx = 0; dataIx < data.length; dataIx++) {
		variances.push(0);
		counts.push(0);
		stddevs.push(0);
	}
	for (let dataIx = 0; dataIx < data.length; dataIx++) {
		let value = data[dataIx];
		let ma = movingAverageData[dataIx];
		let variance = (ma - value) * (ma - value);
		for (let periodIx = 0; periodIx < period; periodIx++) {
			let eltIx = dataIx + periodIx;
			if (eltIx < data.length) {
				variances[eltIx] += variance;
				counts[eltIx] += 1.0;
			}
		}
	}
	for (let dataIx = 0; dataIx < data.length; dataIx++) {
		stddevs[dataIx] = Math.sqrt(variances[dataIx] / counts[dataIx]);
	}
	return stddevs;
}

function getMovingAverage(data, period) {
	let sum = [];
	let count = [];
	let average = [];
	for (let dataIx = 0; dataIx < data.length; dataIx++) {
		sum.push(0);
		count.push(0);
		average.push(0);
	}
	for (let dataIx = 0; dataIx < data.length; dataIx++) {
		let value = data[dataIx];
		for (let periodIx = 0; periodIx < period; periodIx++) {
			let eltIx = dataIx + periodIx;
			if (eltIx < data.length) {
				sum[eltIx] += value;
				count[eltIx] += 1.0;
			}
		}
	}
	for (let dataIx = 0; dataIx < data.length; dataIx++) {
		average[dataIx] = sum[dataIx] / count[dataIx];
	}
	return average;
}