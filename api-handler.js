'use strict';
const axios = require('axios')
const IndeedScraper = require('indeed-scraper')
const osmosis = require('osmosis')

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
    try { 
        osmosis.get(`www.monster.ca/jobs/search/?q=${qs.query}`)
    } catch (err) {
        console.error('scrape monster caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }
}

module.exports.scrapeJobBanks = async (event) => {
    try { 

    } catch (err) {
        console.error('scrape jobbanks caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }
}

module.exports.scrapeWowJobs = async (event) => {
    try { 

    } catch (err) {
        console.error('scrape wowjobs caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }
}