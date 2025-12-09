import { GoogleGenAI } from "@google/genai";
import { DEFAULT_STYLE_PROMPT } from "../constants";

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
};

export const generateVideoCaptionStream = async (
  file: File, 
  userStylePrompt: string,
  onChunk: (text: string) => void
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("未找到 API Key，请检查环境变量配置");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // 1. Prepare video data
    // Note: For extremely large files (>20MB base64 limit), this might hit API constraints 
    // depending on the specific model endpoint capabilities for inline data.
    const videoPart = await fileToGenerativePart(file);

    // 2. Prepare prompt
    const prompt = userStylePrompt.trim() || DEFAULT_STYLE_PROMPT;

    // 3. Call Gemini Model
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          videoPart,
          { text: prompt }
        ]
      }
    });

    let fullText = "";
    
    // 4. Handle Stream
    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText); // Update UI with partial result
      }
    }

    return fullText;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Better Error Handling for Chinese Users
    const errorMsg = error.toString();
    
    if (errorMsg.includes("403") || errorMsg.includes("Region not supported") || errorMsg.includes("PERMISSION_DENIED")) {
      throw new Error("当前地区不支持访问 (403)。请检查您的 VPN 或网络设置。");
    }
    
    if (errorMsg.includes("500") || errorMsg.includes("400") || errorMsg.includes("fetch")) {
      throw new Error("网络请求失败。可能是文件过大 (建议压缩) 或网络连接不稳定。");
    }

    throw new Error(error.message || "视频分析失败，请重试");
  }
};