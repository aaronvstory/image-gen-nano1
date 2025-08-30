
import { GoogleGenAI, Modality } from "@google/genai";

function base64ToGenerativePart(base64Data: string, mimeType: string) {
  return {
    inlineData: {
      data: base64Data.split(',')[1],
      mimeType,
    },
  };
}

export async function expandImage(imageBase64: string, prompt: string, apiKey: string): Promise<string[]> {
  if (!apiKey) {
    throw new Error("API key is not configured. Please add it via the settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const imagePart = base64ToGenerativePart(imageBase64, 'image/png');
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No content generated. The response may have been blocked.");
    }

    const imageParts = response.candidates[0].content.parts.filter(part => part.inlineData);
    if (imageParts.length === 0) {
        // Check for text part which might contain block reason
        const textPart = response.candidates[0].content.parts.find(part => part.text);
        if (textPart && textPart.text) {
             throw new Error(`Image generation failed: ${textPart.text}`);
        }
      throw new Error("Image generation failed. No image data received.");
    }

    return imageParts.map(part => part.inlineData!.data);
  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    if (error.message && (error.message.includes('API key not valid') || error.message.includes('permission denied'))) {
       throw new Error(`Gemini API Error: Permission denied. Please check that your API key is correct and has the necessary permissions.`);
    }
    if (error.message) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while communicating with the Gemini API.");
  }
}
