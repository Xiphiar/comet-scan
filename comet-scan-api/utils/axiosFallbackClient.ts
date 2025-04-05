import axios, { AxiosError, AxiosRequestConfig } from "axios";

type Verifier<T> = (result: T) => boolean;

export default class AxiosFallbackClient {
    urls: string[];
    config: any = {};
    timedOutUrls: Map<string, number> = new Map();
    constructor(urls: string[], config?: AxiosRequestConfig) {
        this.urls = urls;
        this.config = config || {};
    }

    async get<T>(path: string, config: AxiosRequestConfig = {}, verifier: Verifier<T> = () => true, debug = false): Promise<T> {
        // Check existing timed out URLs and remove them if they have been timed out for more than 1 minute
        const now = Date.now();
        for (const [url, time] of this.timedOutUrls.entries()) {
            if ((now.valueOf() - time.valueOf()) > 60 * 1000) {
                this.timedOutUrls.delete(url);
            }
        }

        // Get all URLs that are not timed out
        const validUrls = this.urls.filter(url => !this.timedOutUrls.has(url));

        if (!validUrls.length) {
            throw new Error(`All URLs are timed out. Cannot fetch ${path}`);
        }

        const errors: any[] = [];
        for (const url of validUrls) {
            try {
                if (debug) console.debug(`Fetching path '${path}' using endpoint '${url}'`);
                const { data } = await axios.get<T>(url + path, { ...this.config, ...config });
                if (debug) console.debug('Response data before verification:', data);
                const verified = verifier(data);
                if (!verified) throw `Response from ${url} did not pass the verifier.`;
                return data;
            } catch (error: any) {
                errors.push(error);
                // Only timeout if status code is not 501 or 404 (501 on LCD indicates a logic issue, not a server issue)
                const responseCode = (error as AxiosError).response?.status
                if (responseCode !== 501 && responseCode !== 404) {
                    console.log(`Timing out ${url} for error: ${error.toString()}`)
                    this.timedOutUrls.set(url, Date.now());
                }
            }
        }

        // Throw an error if all URLs failed
        const errorStrings = errors.map(e => e.toString());
        throw new Error(`Failed to fetch ${path} from any of the urls. Errors: ${errorStrings.join(', ')}`);
    }
}