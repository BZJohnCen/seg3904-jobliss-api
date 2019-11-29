'use strict';
const axios = require('axios')
const IndeedScraper = require('indeed-scraper')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')

//--------------- HELPER FUNCTIONS ---------------

const sendSuccessResponse = (httpCode, response) => {
    return {
        statusCode: httpCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(response)
    }
}

const sendErrorResponse = (httpCode, ERRmessage) => {
    return {
        statusCode: httpCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error_message: ERRmessage })
    }
}

//--------------- LAMBDA FUNCTIONS ---------------

module.exports.scrapeIndeed = async (event, context, cb) => {
    let qs = event.queryStringParameters
    console.log("qs:", qs)
    let queryOptions = {
        host: qs.host || "www.indeed.ca",
        query: qs.query,
        city: qs.city,
        radius: qs.radius,
        level: qs.level,
        jobType: qs.jobType || "fulltime",
        maxAge: qs.maxAge,
        sort: qs.sort,
        limit: qs.limit || 50
    }
    try {
        let indeedResults = await IndeedScraper.query(queryOptions) //array of results
        // console.log('indeed results:\n', indeedResults)
        return sendSuccessResponse(200, indeedResults)
    } catch (err) {
        console.error('scrape indeed caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }

};

module.exports.scrapeMonster = async (event) => {
    let qs = event.queryStringParameters
    let qParams = {
        query: qs.query,
        location: qs.location,
        radius: qs.radius || "5", //km
    }
    let url = `https://www.monster.ca/jobs/search/?q=${qParams.query}&where=${qParams.location}&rad=${qParams.radius}`

    try {
        let browser = await puppeteer.launch()
        let page = await browser.newPage()
        await page.goto(url)
        let html = await page.content()
        const $ = cheerio.load(html)
        let jobList = []
        $('div[id="SearchResults"]').find('section > div.flex-row').each((i, element) => {
            jobList.push({
                job_title: $('div.summary > header > h2.title > a:not([class])', element).text(),
                link: $('div.summary > header > h2.title > a:not([class])', element).attr('href'),
                job_company: $('div.summary > div.company > span.name', element).text(),
                location: $('div.summary > div.location > span.name', element).text(),
                date_posted: $('div.meta.flex-col > time', element).text()
            })
        })
        await browser.close()
        return sendSuccessResponse(200, jobList)
    } catch (err) {
        console.error('scrape monster caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }
}

module.exports.scrapeJobBanks = async (event) => {
    let qs = event.queryStringParameters
    // let qParams = {
    //     query: qs.query,
    //     location: qs.location,
    //     radius: qs.radius || "5", //km
    // }
    let url = `www.jobbank.gc.ca/jobsearch/jobsearch?`

    try { 
        let browser = await puppeteer.launch()
        let page = await browser.newPage()
        await page.goto(url)
        let html = await page.content()
        const $ = cheerio.load(html)
        let jobList = []
        $('div[id="SearchResults"]').find('section > div.flex-row').each((i, element) => {
            jobList.push({
                job_title: $('div.summary > header > h2.title > a:not([class])', element).text(),
                link: $('div.summary > header > h2.title > a:not([class])', element).attr('href'),
                job_company: $('div.summary > div.company > span.name', element).text(),
                location: $('div.summary > div.location > span.name', element).text(),
                date_posted: $('div.meta.flex-col > time', element).text()
            })
        })
        await browser.close()
        // return sendSuccessResponse(200, jobList)
    } catch (err) {
        console.error('scrape jobbanks caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }
}

module.exports.scrapeWowJobs = async (event) => {
    let qs = event.queryStringParameters
    try { 
    } catch (err) {
        console.error('scrape wowjobs caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }
}