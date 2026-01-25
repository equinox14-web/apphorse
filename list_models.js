import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Just to init
        // Actually the SDK doesn't expose listModels nicely on the instance usually, 
        // but newer versions might not have it directly on genAI instance without looking at docs.
        // Wait, typical usage:
        // const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        // But I want to use the SDK if possible.
        // The SDK might not have a helper for listing models in the browser-centric export.

        // Let's try to just fetch directly to debug.
        console.log("Checking API Key availability...");
        if (!API_KEY) {
            console.error("No API KEY found in env");
            return;
        }
        console.log("Key starts with: " + API_KEY.substring(0, 5));

        // Direct fetch to list models
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await resp.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods})`);
                }
            });
        } else {
            console.log("Error listing models:", data);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
