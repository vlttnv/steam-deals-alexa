var Alexa = require('alexa-sdk');
var rp = require("request-promise");
var sprintf = require("sprintf-js").sprintf;

var states = {
    ONESHOT: '_ONESHOT',
    LIST: '_LIST'
};

var phrases = {
    singleDeal: "%(name)s is discounted by %(percent)s percent and is now %(price_0)s.%(price_1)s %(currency)s. ",
    topSellers: "The top selling game is %(game1)s, for %(price1_0)s.%(price1_1)s %(currency1)s, followed by %(game2)s, for %(price2_0)s.%(price2_1)s %(currency2)s, and %(game3)s, for %(price3_0)s.%(price3_1)s %(currency3)s."
};


//===============
//  Helpers
//===============
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function pickPhrase(phrases) {
    var index = getRandomInt(0, phrases.length);
    return phrases[index];
}

function buildFeaturedMessage(deals) {
    var finalString = "";
    for (var i = 0; i < deals.length; i++) {
        var deal = deals[i];
        var price = deal.final_price.toString()
        var dealStringObject = {
            name: deal['name'],
            percent: deal.discount_percent,
            price_1: price.slice(-2, price.length),
            price_0: price.slice(0, -2),
            currency: deal.currency
        };
        finalString += sprintf(phrases.singleDeal, dealStringObject);
    }

    return finalString;
}

function buildTopSellersMessage(top_sellers) {
    var finalString = "";
    var price1 = top_sellers[0].final_price.toString()
    var price2 = top_sellers[1].final_price.toString()
    var price3 = top_sellers[2].final_price.toString()

    var topSellersStringObject = {
        game1: top_sellers[0]['name'],
        game2: top_sellers[1]['name'],
        game3: top_sellers[2]['name'],
        percent1: top_sellers[0].discount_percent,
        percent2: top_sellers[1].discount_percent,
        percent3: top_sellers[2].discount_percent,
        price1_1: price1.slice(-2, price1.length),
        price2_1: price2.slice(-2, price2.length),
        price3_1: price3.slice(-2, price3.length),
        price1_0: price1.slice(0, -2),
        price2_0: price2.slice(0, -2),
        price3_0: price3.slice(0, -2),
        currency1: top_sellers[0].currency,
        currency2: top_sellers[1].currency,
        currency3: top_sellers[2].currency
    };

    finalString += sprintf(phrases.topSellers, topSellersStringObject);

    return finalString;
}

function makeRequest() {
    var backend_request = {
        method: 'GET',
        uri: 'http://store.steampowered.com/api/featuredcategories?cc=uk',
        json: true
    };
    return rp(backend_request);
}


//===============
//  Handlers
//===============
var handlers = {
    'LaunchRequest': function () {
        this.emit(':tell', 'Hello!');
    },

    'GetSpecials': function () {
        var self_obj = this;
        var reqPromise = makeRequest();

        reqPromise.then(function (parsedBody) {
            self_obj.handler.state = states.LIST;

            var firstThree = parsedBody.specials.items.slice(0, 3);
            var theRest = parsedBody.specials.items.slice(3);

            self_obj.attributes['theRest'] = theRest;

            var introMessage = sprintf("I found %(number)s specials. Here are the first three. ", {number: parsedBody.specials.items.length});
            var finalMessage = buildFeaturedMessage(firstThree);
            var question = " Would you like to hear more?"

            self_obj.emit(':ask', introMessage + finalMessage + question);

        }).catch(function (err) {
            console.log(err);
            self_obj.emit(':tell', 'Oops, Error!');
        });
    },

    'GetTopSellers': function () {
        var self_obj = this;
        var reqPromise = makeRequest();

        reqPromise.then(function (parsedBody) {
            var firstThree = parsedBody.specials.items.slice(0, 3);
            var finalMessage = buildTopSellersMessage(firstThree);
            self_obj.emit(':tell', finalMessage);
            self_obj.shouldEndSession = true;
        }).catch(function (err) {
            console.log(err);
            self_obj.emit(':tell', 'Oops, Error!');
        });
    },

    'GetMidweekMadness': function () {
        this.emit(':tell', 'Hello Get Today\'s Featured!');
    },

    'GetNewReleases': function () {
        this.emit(':tell', 'Hello Get Today\'s Featured!');
    },

    'Unhandled': function () {
        console.log('Unhandled event');
        this.emit(':ask', 'Sorry. Please say that again?', 'Sorry, we had a problem, would you mind repeating what you said please?');
    }
};

var dealstListStateHandler = Alexa.CreateStateHandler(states.LIST, {
    'AMAZON.YesIntent': function(){
        var self_obj = this;
        if ('theRest' in self_obj.attributes) {
            if (self_obj.attributes['theRest'].length > 3) {
                var firstThree = self_obj.attributes['theRest'].slice(0, 3);
                var theRest = self_obj.attributes['theRest'].slice(3);
                self_obj.attributes['theRest'] = theRest;

                var finalMessage = buildFeaturedMessage(firstThree);
                self_obj.emit(':ask', 'Sure. ' + finalMessage + ' Would you like to hear more?');
            } else {
                var finalMessage = buildFeaturedMessage(
                    self_obj.attributes['theRest']
                );
                self_obj.handler.state = states.ONESHOT;
                self_obj.emit(':tell', 'Sure. ' + finalMessage);
                self_obj.shouldEndSession = true;
            }
        }
    },
    'AMAZON.NoIntent': function() {
        this.handler.state = states.ONESHOT;
        this.shouldEndSession = true;
        this.emit(':tell', 'OK.');
    },
    'Unhandled': function () {
        console.log('Unhandled event');
        this.emit(':ask', 'Sorry. Please say that again?', 'Sorry, we had a problem, would you mind repeating what you said please?');
    }
});

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers, dealstListStateHandler);
    alexa.execute();
};