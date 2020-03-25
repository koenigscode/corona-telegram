# Corona Telegram

This bot gets the current number of corona cases in Austria and sends them to a telegram channel every 15 minutes.

All data is from
[https://info.gesundheitsministerium.at/](https://info.gesundheitsministerium.at/)
and fetched as JS files (sadly there is no api) and then evaluated.

For example, the basic data can be fetched from
[https://info.gesundheitsministerium.at/data/SimpleData.js](https://info.gesundheitsministerium.at/data/SimpleData.js)

## Growth

To determine the spread/growth of the corona virus in Austria, the data is being saved to a local sqlite database every 15 minutes.

## Configuration

You can set the env variables in a file called env_file.
Make sure not to wrap the values in quotes since docker parses the quotes as part of the value.
Make sure to set the correct timezone so the data fetched from the government site can be correctly parsed.
