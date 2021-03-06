const fs = require("fs");
const cheerio = require("cheerio");
const axios = require("axios");

const fetchData = async (url) => {
  const result = await axios.get(url || SITE_URL);
  return cheerio.load(result.data);
};

exports.fetchPage = (url) => fetchData(url);

exports.getYesterdaysAdPages = (yesterdaysAdsUrls) =>
  Promise.all(
    yesterdaysAdsUrls.map((url) => fetchData(`https://www.finn.no${url}`))
  );

exports.getKeywords = () =>
  new Set(
    fs
      .readFileSync("../keywordsList.txt", "utf-8")
      .replace(/(\r\n|\n|\r)/gm, "\n")
      .split("\n")
      .map((word) => word.toLowerCase())
  );

exports.getYesterdaysAdsUrls = ($) =>
  (yesterdaysAdsUrls = $("article.ads__unit")
    .map((i, el) => {
      if (
        $(".ads__unit__content__details", el).text().includes("1 dag siden")
      ) {
        return $("h2 a", el).attr("href");
      }
    })
    .get());

exports.getLastAdOnPageWasYesterday = ($) => {
  const lastAd = $("article.ads__unit").children().last();

  return $(".ads__unit__content__details", lastAd)
    .text()
    .includes("1 dag siden");
};

exports.getTotalDayKeywordCount = (yesterdaysAdPages, keywords) => {
  const totalDayKeywordCount = new Map();
  keywords.forEach((keyword) => totalDayKeywordCount.set(keyword, 0));

  yesterdaysAdPages.forEach(($page) => {
    const textOnPage = $page(".grid__unit.u-r-size2of3").text().toLowerCase();

    keywords.forEach((keyword) => {
      if (textOnPage.match(new RegExp(`\\b${keyword}\\b`))) {
        totalDayKeywordCount.set(
          keyword,
          totalDayKeywordCount.get(keyword) + 1
        );
      }
    });
  });

  return totalDayKeywordCount;
};
