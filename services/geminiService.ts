import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enhanceMarkdown = async (text: string, instruction: string): Promise<string> => {
  try {
    if (!text.trim()) return "";

    const systemInstruction = `You are an expert technical writer and markdown editor. 
    Your goal is to improve the provided markdown content based on the user's specific instruction.
    Maintain the original meaning but improve clarity, grammar, and structure.
    Ensure the output is valid Markdown.
    Do not wrap the output in markdown code blocks (e.g. \`\`\`markdown ... \`\`\`) unless specifically asked to generate code examples. Just return the raw markdown content.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `Instruction: ${instruction}\n\nContent:\n${text}` }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || text; // Return original if empty response
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to enhance text. Please check your API key and try again.");
  }
};

export const generateTableOfContents = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: `Generate a markdown Table of Contents for the following text. Use standard markdown links like [Title](#title-slug). \n\nText:\n${text}` }]}
            ]
        });
        return response.text || "";
    } catch (error) {
        console.error("Gemini ToC Error", error);
        return "";
    }
}