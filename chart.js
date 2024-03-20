const chart = require('asciichart');
const fs = require('fs');

function plotAsset() {
    const lines = fs.readFileSync('trade_log.txt', 'utf-8').split('\n');
    const assets = [];

    for (const line of lines) {
        if (line.includes('Total USDT:')) {
            const assetValue = line.replace('Total USDT:', '').trim();
            assets.push(parseFloat(assetValue));
        }
    }

    console.log(assets);

    // console.clear();
    // console.log(chart.plot(assets, {
    //     height: 30,
    // }));
}

plotAsset();
