const chart = require('asciichart');
const fs = require('fs');

function plotAsset() {
    const lines = fs.readFileSync('./trade_log.txt', 'utf8').split('\n');
    const assets = [];

    for (const line of lines) {
        if (line.includes('Total USDT')) {
            const assetValue = line.replace('Total USDT:', '').trim();
            assets.push(parseFloat(assetValue));
        }
    }

    if (assets.length > 0) { // Check if assets array is not empty
        console.clear();
        console.log(chart.plot(assets, {
            height: 30,
        }));

        console.log(assets);
    } else {
        console.log('No data available to plot.');
    }
}
plotAsset();
