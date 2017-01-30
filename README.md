# steam-deals-alexa
An Alexa skill that let's you ask for current deals, discounts and top selling games.


## Installing tools
`npm install -g grunt-cli`
`npm install -g chai`
`npm install -g chai-as-promised`
`npm install -g alexa-app`
`npm install -g mocha`

## Triggering intents
`grunt lambda_invoke:<NAME_OF_EVENT>`
Events are found in the `events` folder.

## Generating utterances
`mocha intents_generator.js > utterances.txt`