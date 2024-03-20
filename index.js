const ccxt = require('ccxt');
const moment = require('moment');
const dotenv = require('dotenv');
const fs = require('fs');

const binance = new ccxt.binance({
    apiKey: dotenv.config().parsed.API_KEY,
    secret: dotenv.config().parsed.SECRET_KEY,
});

binance.setSandboxMode(true);

async function printBalance(btcPrice) {
    const balance = await binance.fetchBalance();
    const total = balance.total;
    console.log(`Total balance: ${total.BTC} BTC, ${total.USDT} USDT`);
    console.log(`Total USD: ${(total.BTC - 1) * btcPrice + total.USDT}. \n`);

    // Write balance data to trade_log.txt
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const balanceInfo = `${timestamp}: Total balance: ${total.BTC} BTC, ${total.USDT} USDT\n`;
    fs.appendFileSync('trade_log.txt', balanceInfo);
}

async function tick() {
    try {
        // Fetch OHLCV data (candlestick data) for the BTC/USDT trading pair with 1-minute interval
        const prices = await binance.fetchOHLCV('BTC/USDT', '1m', undefined, 5);
        const bPrices = prices.map(price => {
            return {
                timestamp: moment(price[0]).format('YYYY-MM-DD HH:mm:ss'),
                open: price[1],
                high: price[2],
                low: price[3],
                close: price[4],
                volume: price[5]
            }
        })
        
        const averagePrice = bPrices.reduce((acc, price) => acc + price.close, 0) / bPrices.length;
        const lastPrice = bPrices[bPrices.length - 1].close;

        console.log(bPrices.map(p => p.close), averagePrice, lastPrice);

        const direction = lastPrice > averagePrice ? 'sell' : 'buy';

        const TRADE_SIDE = 100;
        const quantity = TRADE_SIDE / lastPrice;

        console.log(`Average price: ${averagePrice}, Last price: ${lastPrice}`);
        const order = await binance.createMarketOrder('BTC/USDT', direction, quantity);
        console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${direction} ${quantity} BTC at ${lastPrice}`);

        // Write order data to trade_log.txt
        const orderInfo = `${moment().format('YYYY-MM-DD HH:mm:ss')}: ${direction} ${quantity} BTC at ${lastPrice}\n`;
        fs.appendFileSync('trade_log.txt', orderInfo);

        printBalance(lastPrice);

    } catch (error) {
        console.error('Error occurred:', error);
    }
}

async function main() {
    while (true){
        await tick();
        await new Promise(resolve => setTimeout(resolve, 1000 * 60));
    }
}

// Call the main function
main();
