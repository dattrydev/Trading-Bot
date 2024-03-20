const { ActivityHandler, MessageFactory } = require('botbuilder');
const ccxt = require('ccxt');
const moment = require('moment');
const dotenv = require('dotenv');

const binance = new ccxt.binance({
    apiKey: dotenv.config().parsed.API_KEY,
    secret: dotenv.config().parsed.SECRET_KEY,
});

binance.setSandboxMode(true);

async function printBalance(btcPrice, context) {
    const balance = await binance.fetchBalance();
    const total = balance.total;
    const message = `Balance: BTC ${total.BTC} BTC\nUSDT: ${total.USDT}\nTotal USDT: ${(total.BTC - 1) * btcPrice + total.USDT}`;
    await context.sendActivity(MessageFactory.text(message, message));
}

async function tick(context) {
    try {
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

        const direction = lastPrice > averagePrice ? 'sell' : 'buy';
        const TRADE_SIDE = 100;
        const quantity = TRADE_SIDE / lastPrice;

        const order = await binance.createMarketOrder('BTC/USDT', direction, quantity);
        const orderInfo = `${moment().format()}: ${direction} ${quantity} BTC at ${lastPrice}\n`;

        await context.sendActivity(MessageFactory.text(orderInfo, orderInfo));
        await printBalance(lastPrice, context);
    } catch (error) {
        console.error(error);
        await context.sendActivity(MessageFactory.text('An error occurred while processing the trade.'));
    }
}

class TradingBot extends ActivityHandler {
    constructor() {
        super();
        this.isTrading = false; // Biến để theo dõi trạng thái của bot
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome! Type "start" to begin trading or "stop" to stop trading.';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            await next();
        });

        this.onMessage(async (context, next) => {
            const command = context.activity.text.trim().toLowerCase();
            if (command === 'start') {
                if (this.isTrading) {
                    await context.sendActivity(MessageFactory.text('Trading bot is already running.'));
                    return;
                }
                this.isTrading = true; // Set isTrading flag to true
                await context.sendActivity(MessageFactory.text('Trading bot started.'));
                while (this.isTrading) {
                    await tick(context);
                    await new Promise(resolve => setTimeout(resolve, 1000 * 60)); // Wait for 60 seconds
                }
            } else if (command === 'stop') {
                if (!this.isTrading) {
                    await context.sendActivity(MessageFactory.text('Trading bot is already stopped.'));
                    return;
                }
                this.isTrading = false; // Set isTrading flag to false
                await context.sendActivity(MessageFactory.text('Trading bot stopped.'));
            } else {
                await context.sendActivity(MessageFactory.text('Unknown command. Type "start" to begin trading or "stop" to stop trading.'));
            }
            await next();
        });
    }
}

module.exports.TradingBot = TradingBot;
