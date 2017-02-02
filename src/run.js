var Alexa = require('alexa-sdk');
var rp = require("request-promise");
var sprintf = require("sprintf-js").sprintf;

var states = {
    ONESHOT: '_ONESHOT',
    LIST: '_LIST'
};

var phrases = {
    singleDeal: "%(name)s is discounted by %(percent)s percent and is now %(price_0)s.%(price_1)s %(currency)s. ",
    topSellers: "The top selling game is %(game1)s, for %(price1_0)s.%(price1_1)s %(currency1)s, followed by %(game2)s, for %(price2_0)s.%(price2_1)s %(currency2)s, and %(game3)s, for %(price3_0)s.%(price3_1)s %(currency3)s.",
    hearMore: [" Would you like to hear more?", " Do you want to hear more?", " Should I continue?"],
    hello: [
        "I can tell you what the current discounted games on Steam are, as well as the top selling games and daily deals.",
        "You can ask me about the current discounted games on Steam, the top sellers and daily deals.",
    ]
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
        var price = deal.final_price.toString();
        var dealStringObject = {
            name: deal.name,
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
    var price1 = top_sellers[0].final_price.toString();
    var price2 = top_sellers[1].final_price.toString();
    var price3 = top_sellers[2].final_price.toString();

    var topSellersStringObject = {
        game1: top_sellers[0].name,
        game2: top_sellers[1].name,
        game3: top_sellers[2].name,
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

function makeRequest(locale) {
    var default_locale = 'uk';
    if (locale === 'en-US') {
        default_locale = 'us';
    }
    var backend_request = {
        method: 'GET',
        uri: 'http://store.steampowered.com/api/featuredcategories?cc=' + default_locale,
        json: true
    };
    return rp(backend_request);
}


//===============
//  Handlers
//===============
var handlers = {
    'LaunchRequest': function () {
        this.handler.state = states.ONESHOT;
        this.shouldEndSession = true;
        this.emit(':tell', pickPhrase(phrases.hello));
    },

    'GetSpecials': function () {
        var self_obj = this;
        var reqPromise = makeRequest(self_obj.locale);

        reqPromise.then(function (parsedBody) {
            self_obj.handler.state = states.LIST;

            var firstThree = parsedBody.specials.items.slice(0, 3);
            var theRest = parsedBody.specials.items.slice(3);

            self_obj.attributes.theRest = theRest;

            var introMessage = sprintf("I found %(number)s discounted games. Here are the first three. ", { number: parsedBody.specials.items.length });
            var finalMessage = buildFeaturedMessage(firstThree);
            var question = pickPhrase(phrases.hearMore);

            self_obj.emit(':ask', introMessage + finalMessage + question);

        }).catch(function (err) {
            console.log(err);
            self_obj.emit(':tell', 'I am having some trouble finding the special deals right now. Please try again later.');
        });
    },

    'GetTopSellers': function () {
        var self_obj = this;
        var reqPromise = makeRequest(self_obj.locale);

        reqPromise.then(function (parsedBody) {
            var firstThree = parsedBody.specials.items.slice(0, 3);
            var finalMessage = buildTopSellersMessage(firstThree);
            self_obj.emit(':tell', finalMessage);
            self_obj.shouldEndSession = true;
        }).catch(function (err) {
            console.log(err);
            self_obj.emit(':tell', 'I am having some trouble finding the top sellers right now. Please try again later.');
        });
    },
    'GetDailyDeals': function () {
        var self_obj = this;
        var reqPromise = makeRequest(self_obj.locale);
        reqPromise.then(function (parsedBody) {
            var finalMessage;
            for (var dailyDeal in parsedBody) {
                if (!parsedBody.hasOwnProperty(dailyDeal)) continue;
                if (parsedBody[dailyDeal].id == 'cat_dailydeal') {
                    finalMessage = 'Here are today\'s deals: ' + buildFeaturedMessage(parsedBody[dailyDeal].items);
                    break;
                } else {
                    finalMessage = 'There are no daily deals today. Check back again tomorrow.';
                }

            }
            self_obj.emit(':tell', finalMessage);
            self_obj.shouldEndSession = true;
        }).catch(function (err) {
            console.log(err);
            self_obj.emit(':tell', 'I am having some trouble finding the daily deals right now. Please try again later.');
        });
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = states.ONESHOT;
        this.shouldEndSession = true;
        this.emit(':ask', 'You can ask me for the current deals and top selling games on Steam.', 'Just ask me for the current special deals and top sellers on Steam.');
    },
    'AMAZON.StopIntent': function () {
        this.handler.state = states.ONESHOT;
        this.shouldEndSession = true;
        this.emit(':tell', 'OK.');
    },

    'Unhandled': function () {
        console.log('Unhandled event');
        this.emit(':ask', 'Sorry, can you please repeat your question?', 'Sorry, I didn\'t quite understand that. Can you please try again?');
    }
};

var dealstListStateHandler = Alexa.CreateStateHandler(states.LIST, {
    'AMAZON.YesIntent': function () {
        var self_obj = this;
        if ('theRest' in self_obj.attributes) {
            var finalMessage;
            if (self_obj.attributes.theRest.length > 3) {
                var firstThree = self_obj.attributes.theRest.slice(0, 3);
                var theRest = self_obj.attributes.theRest.slice(3);
                self_obj.attributes.theRest = theRest;

                finalMessage = buildFeaturedMessage(firstThree);
                self_obj.emit(':ask', 'Sure. ' + finalMessage + ' Would you like to hear more?');
            } else {
                finalMessage = buildFeaturedMessage(
                    self_obj.attributes.theRest
                );
                self_obj.handler.state = states.ONESHOT;
                self_obj.emit(':tell', 'Sure. ' + finalMessage);
                self_obj.shouldEndSession = true;
            }
        }
    },
    'AMAZON.NoIntent': function () {
        this.handler.state = states.ONESHOT;
        this.shouldEndSession = true;
        this.emit(':tell', 'OK.');
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = states.ONESHOT;
        this.shouldEndSession = true;
        this.emit(':ask', 'You can ask me for the current deals and top selling games on Steam.', 'Just ask me for the current special deals and top sellers on Steam.');
    },
    'AMAZON.StopIntent': function () {
        this.handler.state = states.ONESHOT;
        this.shouldEndSession = true;
        this.emit(':tell', 'OK.');
    },
    'Unhandled': function () {
        console.log('Unhandled event');
        this.emit(':ask', 'Sorry, can you please repeat your question?', 'Sorry, I didn\'t quite understand that. Can you please try again?');
    }
});

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers, dealstListStateHandler);
    alexa.execute();
};