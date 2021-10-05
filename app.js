const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { ethers } = require('ethers');
const tweet = require('./tweet');
const cache = require('./cache');

// Format tweet text
function formatAndSendTweet(event) {
    // Handle both individual items + bundle sales
  const tokenName = _.get(event, ['asset', 'name']);
  const image = _.get(event, ['asset', 'image_url']);
  const openseaLink = _.get(event, ['asset', 'permalink']);
  const totalPrice = _.get(event, 'total_price');
  const usdValue = _.get(event, ['payment_token', 'usd_price']);
  const tokenSymbol = _.get(event, ['payment_token', 'symbol']);

  const formattedTokenPrice = ethers.utils.formatEther(totalPrice.toString());
  const formattedUsdPrice = (formattedTokenPrice * usdValue).toFixed(2);
  const formattedPriceSymbol = tokenSymbol === 'WETH' || tokenSymbol === 'ETH' ? 'Ξ' : ` ${tokenSymbol}`;

  const tweetText = `🐨 ${tokenName} just sold for ${formattedTokenPrice}${formattedPriceSymbol} ($${formattedUsdPrice}) #krazykoalanft ${openseaLink}`;

// 🐨 Krazy Koala #5066 just sold for Ξ0.035 ($118.88)
// https://etherscan.io/tx/0xf03308b470ced59ec745812b2f8194369d609a8c3d79cb6fb445506fdff1885f
// #krazykoalanft

  console.log(tweetText);

  return tweet.handleDupesAndTweet(tokenName, tweetText, image);
}

// Poll OpenSea every 60 seconds & retrieve all sales for a given collection in either the time since the last sale OR in the last minute
setInterval(() => {
    const lastMinute = moment().startOf('minute').subtract(59, 'seconds').unix();

  axios
    .get('https://api.opensea.io/api/v1/events', {
      params: {
        collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
        event_type: 'successful',
        occurred_after: lastMinute,
        only_opensea: 'false',
      },
    })
    .then((response) => {
      const events = _.get(response, ['data', 'asset_events']);

      console.log(`${events.length} sales in the last minute...`);

      _.each(events, (event) => {
        return formatAndSendTweet(event);
      });
    })
    .catch((error) => {
      console.error(error);
    });
}, 60000);
