import { app } from '@azure/functions';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

async function parseWebsite(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch the URL: ${response.statusText}`);
        }
        const html = await response.text();
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            throw new Error('Failed to extract readable content from the website.');
        }

        return {
            status: 'success',
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error.message,
            details: error.stack || '',
        };
    }
}

const httpTriggerParser = app.http('httpTriggerParser', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        const url = request.query.get('url') || await request.text();

        if (!url) {
            return {
                status: 400,
                body: { status: 'error', message: 'URL parameter is required.' }
            };
        }

        const result = await parseWebsite(url);

        return result.status === 'success'
            ? { status: 200, body: JSON.stringify(result) }
            : { status: 500, body: JSON.stringify(result) };
    }
});

export default httpTriggerParser; // Explicitly export as 'default'
