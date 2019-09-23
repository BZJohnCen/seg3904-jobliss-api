'use strict';
const axios = require('axios')
const IndeedScraper = require('indeed-scraper')

//--------------- HELPER FUNCTIONS ---------------

const sendSuccessResponse = (statusCode, OKmessage) => {
    return {
        status: statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ message: OKmessage })
    }
}

const sendErrorResponse = (statusCode, ERRmessage) => {
    return {
        status: statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error_message: ERRmessage })
    }
}

//--------------- LAMBDA FUNCTIONS ---------------

module.exports.scrapeIndeed = async (event) => {
    let qs = event.queryStringParameters
    let queryOptions = {
        host: "www.indeed.ca",
        query: 'Software Engineer',
        city: 'Toronto, ON',
        radius: '25',
        level: 'entry_level',
        jobType: 'fulltime',
        maxAge: '7',
        sort: 'date',
        limit: 100
    }
    try {
        let indeedResults = await IndeedScraper.query(queryOptions) //array of results
        console.log('indeed results:\n', indeedResults)
    } catch (err) {
        console.error('scrape indeed caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }

};
