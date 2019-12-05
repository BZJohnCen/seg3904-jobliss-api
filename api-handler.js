'use strict';
const axios = require('axios')
const IndeedScraper = require('indeed-scraper')
const cheerio = require('cheerio')

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
        let response = await axios.get(url)
        // console.log('response.data:\n', response.data)
        let html = response.data
        
        const $ = cheerio.load(html)
        let jobList = []
        $('div[id="SearchResults"]').find('section > div.flex-row').each((i, element) => {
            jobList.push({
                job_title: $('div.summary > header > h2.title > a:not([class])', element).text().trim(),
                url: $('div.summary > header > h2.title > a:not([class])', element).attr('href'),
                job_company: $('div.summary > div.company > span.name', element).text(),
                location: $('div.summary > div.location > span.name', element).text().trim(),
                date_posted: $('div.meta.flex-col > time', element).text(),
                source: "monster"
            })
        })
        return sendSuccessResponse(200, jobList)
    } catch (err) {
        console.error('scrape monster caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }
}

module.exports.scrapeJobBanks = async (event) => {
    let qs = event.queryStringParameters
    let qParams = {
        query: qs.query
    }
    let url = `https://www.jobbank.gc.ca/jobsearch/jobsearch?sort=M&searchstring=${qParams.query}`

    const formatFields = (jobInfo) => {
        let url = "https://www.jobbank.gc.ca" + jobInfo.url.substring(0, jobInfo.url.indexOf(";")) + jobInfo.url.substring(jobInfo.url.indexOf("?"), jobInfo.url.length)
        let location = jobInfo.location.split(" ")
        location = (location[location.length - 2] + location[location.length - 1]).trim()
        let salary = jobInfo.salary.split(" ")
        salary = (salary.indexOf("\t\t\tSalary:") === -1) ? salary.slice(salary.indexOf("\t\t\tSalary"), salary.length) : salary.slice(salary.indexOf("\t\t\tSalary:") + 1, salary.length)
        salary = salary.join(" ").trim()
        let job_title = (jobInfo.job_title.includes("\n")) ? 
            jobInfo.job_title.substring(0, jobInfo.job_title.indexOf("\n")) : jobInfo.job_title
        return { ...jobInfo, url, location, salary, job_title }
    }

    try { 
        let response = await axios.get(url)
        console.log('url:', url)
        // console.log('response.data:\n', response.data)
        let html = response.data
        
        const $ = cheerio.load(html)
        let jobList = []
        $('div.results-jobs').find('article').each((i, element) => {
            let rawJobInfo = {
                job_title: $('a.resultJobItem > h3.title > span.noctitle', element).text().trim(),
                url: $('a.resultJobItem', element).attr('href'),
                job_company: $('a.resultJobItem > ul.list-unstyled > li.business', element).text().trim(),
                location: $('a.resultJobItem > ul.list-unstyled > li.location:nth-child(3)', element).text().trim(),
                date_posted: $('a.resultJobItem > ul.list-unstyled > li.date', element).text().trim(),
                salary: $('a.resultJobItem > ul.list-unstyled > li.salary', element).text().trim()
            }
            let formattedJobInfo = formatFields(rawJobInfo)
            jobList.push({
                job_title: formattedJobInfo.job_title,
                url: formattedJobInfo.url,
                job_company: formattedJobInfo.job_company,
                location: formattedJobInfo.location,
                date_posted: formattedJobInfo.date_posted,
                salary: formattedJobInfo.salary,
                source: "jobbanks"
            })
        })
        return sendSuccessResponse(200, jobList)
    } catch (err) {
        console.error('scrape jobbanks caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }
}

module.exports.scrapeWowJobs = async (event) => {
    let qs = event.queryStringParameters
    let qParams = {
        query: qs.query,
        location: qs.location,
        radius: qs.radius || "25", //km
    }
    let url = `https://www.wowjobs.ca/BrowseResults.aspx?q=${qParams.query}&l=${qParams.location}&sr=${qParams.radius}`
    try { 
        let response = await axios.get(url)
        // console.log('response.data:\n', response.data)
        let html = response.data
        
        const $ = cheerio.load(html)
        let jobList = []
        $('div.jobs').find('div.result.js-job').each((i, element) => {            
            jobList.push({
                job_title: $('div:not([class]) > a.link.js-job-link', element).text().trim(),
                url: `https://www.wowjobs.ca` + $('div:not([class]) > a.link.js-job-link', element).attr('href'),
                job_company: $('div.employer', element).text().split(" - ")[0],
                location: $('div.employer > span.location', element).text().trim(),
                summary: $('div.snippet', element).text().trim(),
                date_posted: ($('div.tags', element).text().trim() === "More") ? "N/A" : $('div.tags', element).text().trim().split(" - ")[0],
                source: "wowjobs"
            })
        })
        return sendSuccessResponse(200, jobList)
    } catch (err) {
        console.error('scrape wowjobs caught err:', err.message)
        return sendErrorResponse(400, err.message)
    }
}