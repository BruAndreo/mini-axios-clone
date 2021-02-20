const Request = require('./request');
// https://www.mercadobitcoin.net/api/BTC/trades/?tid=3706
const DEFAULT_OPTIONS = {
    maxRetries: 4,
    retryTimeOut: 1000,
    maxRequestTimeout: 1000,
    threshold: 200
};

class Pagination {

    constructor(options = DEFAULT_OPTIONS) {
        this.request = new Request();

        this.maxRetries = options.maxRetries;
        this.retryTimeout = options.retryTimeOut;
        this.maxRequestTimeout = options.maxRequestTimeout;
        this.threshold = options.threshold;
    }

    async handleRequest({ url, page, retries = 1 }) {
        try {
            const finalUrl = `${url}?tid=${page}`;

            const result = await this.request.makeRequest({
                url: finalUrl,
                method: 'get',
                timeout: this.maxRequestTimeout
            });
    
            return result;
        } catch (error) {
            if (retries === this.maxRetries) {
                console.error(`[${retries}] max retries reached!`);
                throw error;
            }

            console.error(`[${retries}] an error: [${error.message}] has happend! trying again in ${this.retryTimeout}ms`);
            await Pagination.sleep(this.retryTimeout);

            return this.handleRequest({ url, page, retries: retries += 1 });
        }
    }

    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async * getPaginated({ url, page }) {
        const result = await this.handleRequest({ url, page });
        const lastId = result[result.length - 1]?.tid ?? 0;

        if (lastId === 0) return;

        yield result;

        await Pagination.sleep(this.threshold);
        yield* this.getPaginated({ url, page: lastId });
    }

}

module.exports = Pagination;