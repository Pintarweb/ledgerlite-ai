
import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });

/**
 * Converts a File object to a Base64 string (raw data for Gemini).
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a File object to a full Data URI string (for <img> src), 
 * resizing it to max 800px width/height and compressing to JPEG to save space.
 */
export const fileToDataUri = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
             reject(new Error("Could not get canvas context"));
             return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Return compressed JPEG data URI
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes a receipt image using Gemini to extract key information.
 */
export const analyzeReceipt = async (file: File): Promise<ReceiptData> => {
  try {
    const base64Data = await fileToGenerativePart(file);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: `Analyze this receipt image. Extract the merchant name, the total amount, the date (YYYY-MM-DD format), and suggest a category from this list: Sales, Services, Rent, Utilities, Salaries, Supplies, Travel, Meals, Software, Other. If you can't find something, return null for that field.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            date: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            items: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ReceiptData;
    }
    throw new Error("No data returned from AI");

  } catch (error) {
    console.error("Error analyzing receipt:", error);
    throw error;
  }
};
