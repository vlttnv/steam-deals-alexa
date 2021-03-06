
SchemaPrinterEvent = {
    "session": {
        "sessionId": "SessionId.test",
        "application": {
            "applicationId": "amzn1.echo-sdk-ams.app.test"
        },
        "attributes": {},
        "user": {
            "userId": "amzn1.echo-sdk-account.test"
        },
        "new": false
    },
    "request": {
        "type": "IntentRequest",
        "requestId": "EdwRequestId.test",
        "timestamp": "2016-03-13T10:04:55Z",
        "intent": {
            "name": "SchemaPrinter",
            "slots": {}
        }
    }
};

describe('steam deals', function () {
    console.log('Integration tests: all intents');

    var alexa = require('alexa-app');
    var app = new alexa.app();
    var chai = require('chai');
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);
    var expect = chai.expect;

    app.intent('GetSpecials',
        {
            "utterances": [
                "What are the {current|} {specials|discounts|dicounted games}",
                "Tell me {the|} {specials|discounts|discounted games}",
                "{specials|discounts|discounted games}"
            ]
        },
        function (request, response) {
            return true;
        }
    );

    app.intent('GetTopSellers',
        {
            "utterances": [
                "What are the {current|} {top selling games|top sellers}",
                "What is on the top selling list",
                "What is top selling",
                "Top selling games",
                "Top sellers"
            ]
        },
        function (request, response) {
            return true;
        }
    );

    app.intent('GetDailyDeals',
        {
            "utterances": [
                "What are {the current|today's} {daily deals|daily discount}",
                "What is the daily {deal|discount}",
                "{the|} daily {discount|deal}",
            ]
        },
        function (request, response) {
            return true;
        }
    );


    app.intent('AMAZON.YesIntent',
        {
            "slots": {
            },
            "utterances": [
                "{yes|yes please|yes sure|sure|yeah}"
            ]
        },
        function (request, response) {
            return true;
        }
    );

    app.intent('AMAZON.NoIntent',
        {
            "slots": {
            },
            "utterances": [
                "{no|nope|not really|nah|no thanks}"
            ]
        },
        function (request, response) {
            return true;
        }
    );

    app.intent('AMAZON.HelpIntent',
        {
            "slots": {
            },
            "utterances": [
                "{help|help me|what can you do}"
            ]
        },
        function (request, response) {
            return true;
        }
    );

    app.intent('AMAZON.StopIntent',
        {
            "slots": {
            },
            "utterances": [
                "{stop|exit|cancel}"
            ]
        },
        function (request, response) {
            return true;
        }
    );

    app.intent('SchemaPrinter',
        {
            "slots": {}
            , "utterances": ["get all utterances"]
        },
        function (request, response) {
            var schemaPrinter = "\n\nSCHEMA:\n\n" + app.schema() + "\n\n";
            schemaPrinter += "\n\nUTTERANCES:\n\n" + app.utterances() + "\n\n";
            console.log(schemaPrinter);
            response.say(schemaPrinter);
            response.shouldEndSession(true);
            response.send();
        }
    );

    describe('#app.SchemaPrinter', function () {
        context('Should return the entire schema and utterances of the Interaction Model in this skill', function () {
            it('returns a a non-null response', function () {
                return app.request(SchemaPrinterEvent)
                    .then(function (response) {
                        expect(response).to.have.deep.property('response.outputSpeech.ssml')
                            .that.deep.contains('SCHEMA:');
                        expect(response).to.have.deep.property('response.outputSpeech.ssml')
                            .that.deep.contains('UTTERANCES:');
                    });
            });
        });
    });
});


