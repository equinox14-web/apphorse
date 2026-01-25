import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
let API_KEY = "";

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (match && match[1]) {
        API_KEY = match[1].trim();
    }
} catch (e) {
    console.error("Could not read .env", e);
}

if (!API_KEY) {
    console.error("No API KEY found in .env");
    process.exit(1);
}

console.log("Using Key ending in...", API_KEY.slice(-4));

async function listModels() {
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await resp.json();

        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }

        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                // Filter for models that support generateContent
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models listed", data);
        }

    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

listModels();
