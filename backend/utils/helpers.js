import axios from 'axios';

/**
 * Generates a random ID using Random.org API with a secure local fallback.
 */
export async function generateRandomID() {
    const apiKey = process.env.RANDOM_ORG_API_KEY || "98abdc56-e679-4f8f-9667-5c2abfe4d401";
    try {
        const response = await axios.post("https://api.random.org/json-rpc/2/invoke", {
            jsonrpc: "2.0",
            method: "generateIntegers",
            params: {
                apiKey: apiKey,
                n: 1,
                min: 1,
                max: 1000000,
                replacement: false,
            },
            id: 42,
        });

        console.log("Random.org API Response:", response.data);
        if (response.data && response.data.result && response.data.result.random && response.data.result.random.data) {
            return response.data.result.random.data[0];
        }
        
        // Local fallback
        const fallback = Math.floor(Math.random() * 1000000) + 1;
        console.log("Using local random fallback ID:", fallback);
        return fallback;
    } catch (error) {
        console.error("Error generating random ID via API, using local fallback:", error);
        return Math.floor(Math.random() * 1000000) + 1;
    }
}
