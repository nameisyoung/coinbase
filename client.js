/**
 * Coinbase client side for CMPE 172 Midterm.
 * @Version 1.0
 * @author Younggun Chung <nameisyoung@gmail.com>
 * Due: Oct 22, 2016
 */

var request = require('request');
var _ = require('underscore');
var csv = require('fast-csv');
var fs = require('fs');
var repl = require('repl');
var readline = require('readline');

var base_url = 'https://api.coinbase.com/v1/';
var filename = 'coinbase_order_history.csv';


var exchangeRatesJson;    // Store exchange_rates object

/** Get exchange_rates from https://api.coinbase.com/v1/currencies/exchange_rates */
request(base_url + 'currencies/exchange_rates', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    exchangeRatesJson = JSON.parse(body);
  }
});

/** Update exchange rates. Doesn't use it this version.
var exchangeRate;
function getExchangeRate(){
  return exchangeRate;
}
function setExchangeRate(num){
  exchangeRate = num;
}
function updateExchangeRate(currency){
  request(base_url + 'currencies/exchange_rates', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var newBody = JSON.parse(body);
      var rate = newBody[currency];
      //return rate;
      setExchangeRate(rate);
      console.log('exchangeRate:'+getExchangeRate());
    }
  });
}
*/

/**  user account object
var user = {
  account_id: "sandbox",
  balanceBTC: 0,
  orders: null
};
*/


var orderHistory = [];  // Store order history

/**  Order object */
function order(id, type, amount, currency, rate){
  this.id       = id;       // Date
  this.type     = type;     // BUY or SELL
  this.amount   = amount;   // Qty.
  this.currency = currency; // Currency. Ex. BTC or USD
  this.rate     = rate;     // Rate of BTC/Currency
}

/**  Print order object.
  ex: "Sat Oct 22 2016 16:00:22 GMT-0700 (PDT) : BUY 10 BTC : UNFILLED" */
function orderPrint(order){
  console.log(' ' + order.id + ' : ' + order.type + ' ' + order.amount + ' ' + order.currency + ' : ' + order.rate);
}


/** Push orderHistory array
function orderPush(order){
  orderHistory.push(order);
}
*/

/** Get current date as string. Doesn't use it now.
function getDateString(){
  var d = new Date();
  var n = d.toString();
  return n;
}
*/

/** Get current date */
function getDateNow(){
  var d = new Date();
  return d;
}


/** Get exchange rate btc_to_"currency".
  default currency: USD  */
function getExchangeRateBtcPerCurrency(currency){
  if(currency === undefined){
    currency = 'btc_to_usd';
  } else {
    currency = 'btc_to_' + currency.toLowerCase();
  }
  return exchangeRatesJson[currency];
}

/** Get exchange rate "currency"_to_btc.
  default currency: USD  */
function getExchangeRateCurrencyToBTC(currency){
  if(currency === undefined){
    currency = 'usd_to_btc';
  } else {
    currency = currency.toLowerCase() + '_to_btc';
  }
  return exchangeRatesJson[currency];
}

/** Mutiple by amount and exchange rate of currency  */
function getExchangeRateMultipl(amount, currency){
  var floatAmount = parseFloat(amount);
  var floatCurrency = parseFloat(getExchangeRateCurrencyToBTC(currency));
  return floatAmount * floatCurrency;
}

/** Check if the currency is in the exchangeRates object
  false: No known exchange rate for BTC/"currency" (ex: KOR)
  ture: Yes! (ex: USD)
*/
function verifyRate(rate){
  if(rate === undefined){
    return false;
  } else {
    return true;
  }
}


/** Input: BUY */
function menuBuy(line){
  linePush(line);
  lineLog(line);
}

/** Input: SELL */
function menuSell(line){
  linePush(line);
  lineLog(line);
}

/** Input: ORDER */
function menuOrder(line){
  console.log(' Current BTC/USD: ' + getExchangeRateCurrencyToBTC());
  orderCalculrater(orderHistory);
  // _.each(orderHistory, function(orders){
  //   orderPrint(orders);
  // });
}

/** Return line length
  case 1: No amount specified.
  case 2: specified amount. Currency: BTC.
  case 3: specified amount. specified currency.
    else: Invalid input.
*/
function lineLength(line){
  var lineSplit = line.split(' ');
  return lineSplit.length;
}

/** Push user's input into orderHistory. */
function linePush(line){
  var temp = new order();

  temp.id = getDateNow();             // Date
  temp.type = line.split(' ')[0];     // BUY or SELL
  temp.amount = line.split(' ')[1];   // Qty.

  if(lineLength(line) == 2){          // Case 2. Specified amount. No currency
    temp.currency = 'BTC';
    temp.rate = 'UNFILLED';
    orderHistory.push(temp);
  } else if(lineLength(line) == 3){   // Case 3. Specified amount. Specified currency
    if(verifyRate(getExchangeRateBtcPerCurrency(line.split(' ')[2])) === true){
      temp.currency = line.split(' ')[2];
      temp.rate = getExchangeRateBtcPerCurrency(line.split(' ')[2]);
      orderHistory.push(temp);
    } else{
      console.log(' No known exchange rate for BTC/' + line.split(' ')[2] + '.');
    }
  }
} // linePush(function)

/** Display results */
function lineLog(line){
  // Case 1: No amount specified.
  if(lineLength(line) == 1){
    console.log(' No amount specified.\n');
  }
  // Case 2: Specified amount. Non-specified currency. Currency: BTC.
  else if(lineLength(line) == 2){
    console.log(' Order to '+ line.split(' ')[0] + ' ' + line.split(' ')[1]+' BTC queued.\n');
  }
  // Case 3: Specified amount. Specified currency.
  else if(lineLength(line) == 3){
    console.log(' Order to '+ line.split(' ')[0] + ' ' + line.split(' ')[1]+' '+line.split(' ')[2]+
      ' worth of BTC queded @ '+ getExchangeRateBtcPerCurrency(line.split(' ')[2])+' BTC/'+line.split(' ')[2]+' ('+
      getExchangeRateMultipl(line.split(' ')[1], line.split(' ')[2]) +' BTC)\n');
  }
  // Else: Invalid input.
  else {
    console.log(' Invalid input found, ignoring request.\n');
  }
} // lineLog(function)


/** Save orderHistory as CSV file and print orders */
function orderCalculrater(orderHistory){
  var csvStream = csv.createWriteStream({headers: true}),
      writableStream = fs.createWriteStream(filename);  // filename: coinbase_order_history.csv

  // writableStream.on("finish", function(){
  //   console.log(" DONE!");
  // });

  csvStream.pipe(writableStream);
  _.each(orderHistory, function(orders){
    csvStream.write(orders);  // Write each order into csv file
    orderPrint(orders);       // Display content of the order
  });
  csvStream.end();
} // orderCalculrater(function)


/****
* Tiny CLI by Readline.
* Note: Tried to use REPL in first version. However, I had trouble with function call such as BUY, SELL, and ORDER.
        So I changed REPL to readline.
* References:
    EC6: https://nodejs.org/api/readline.html#readline_example_tiny_cli
    EC5: http://node.readthedocs.io/en/latest/api/readline/#example-tiny-cli
****/
rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('coinbase> ');
rl.prompt();

rl.on('line', function(line) {
  switch(line.split(' ')[0]) {
    case 'BUY':
      menuBuy(line);
      break;
    case 'SELL':
      menuSell(line);
      break;
    case 'ORDERS':
      menuOrder();
      break;
    default:
      console.log('Invalid input found, ignoring request.');
      console.log(' Options: BUY, SELL, ORDERS\n');
      break;
  }
  rl.prompt();
}).on('close', function() {
  console.log(' Have a great day!\n');
  process.exit(0);
});
