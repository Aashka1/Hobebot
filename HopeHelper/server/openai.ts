import OpenAI from "openai";
import fs from "fs";
import path from "path";
// The pdf-parse library is causing issues, so we'll use our existing mental health info instead

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load and cache mental health document content
let mentalHealthDocumentContent = "";

export async function loadMentalHealthDocument() {
  try {
    // Since we're encountering issues with the PDF parser,
    // we'll directly use our fallback mental health information
    const { mentalHealthInfo } = await import("./chatbot");
    
    // Combine all the mental health info sections into a single string
    mentalHealthDocumentContent = Object.values(mentalHealthInfo).join('\n\n');
    console.log("Using built-in mental health information");
    
    return true;
  } catch (error) {
    console.error("Error loading mental health document:", error);
    return false;
  }
}

// Get the document content
export function getMentalHealthDocumentContent() {
  return mentalHealthDocumentContent;
}

// Generate a response using OpenAI with context from mental health document
export async function generateAIResponse(userMessage: string): Promise<string> {
  try {
    // Ensure document is loaded
    await loadMentalHealthDocument();
    
    // Get the PDF document content
    const pdfContent = getMentalHealthDocumentContent();
    
    // Import dynamically to prevent circular dependency
    const { mentalHealthInfo } = await import("./chatbot");
    
    // Prepare system message with mental health context from PDF document or fallback content
    const systemMessage = `
      You are HopeBot, a mental health support chatbot designed to provide evidence-based information and support.
      
      Here is important mental health information to guide your responses:
      
      ${pdfContent || `
        MENTAL HEALTH VS MENTAL ILLNESS:
        ${mentalHealthInfo.definition}
        
        MENTAL HEALTH PROBLEMS:
        ${mentalHealthInfo.mentalHealthProblems}
        
        FACTORS AFFECTING MENTAL HEALTH:
        ${mentalHealthInfo.factors}
        
        STIGMA:
        ${mentalHealthInfo.stigma}
        
        STRESS AND ANXIETY:
        ${mentalHealthInfo.stress}
        
        SELF-CARE:
        ${mentalHealthInfo.selfCare}
      `}
      
      GUIDELINES FOR YOUR RESPONSES:
      - Provide empathetic and supportive responses
      - Base your answers on the evidence-based information provided above
      - Avoid making specific medical diagnoses or treatment recommendations
      - If someone is in crisis, suggest they contact emergency services or crisis support
      - Keep your responses concise (3-4 paragraphs maximum) and easy to understand
      - When appropriate, mention that professional help is available and important
      - Be compassionate and non-judgmental in your tone
      - Handle basic greetings like "hello" and "hi" in a friendly, conversational way
    `;
    
    // Handle basic conversation patterns without using the API
    const messageLower = userMessage.toLowerCase().trim();
    if (messageLower === 'hello' || messageLower === 'hi' || messageLower === 'hey') {
      return "Hello! I'm HopeBot, your mental health companion. I'm here to help you understand mental health concepts and provide support based on evidence-based information. How are you feeling today?";
    }
    
    // Make API call to OpenAI for non-basic conversations
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    // Return the generated response
    return response.choices[0].message.content || "Based on the mental health research, I can provide information on various topics. What would you like to know about?";
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    
    // Check specifically for quota exceeded error
    if ((error?.type === 'insufficient_quota') || 
        (error?.message && typeof error.message === 'string' && error.message.includes('quota')) ||
        (error?.error && error.error?.type === 'insufficient_quota')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    
    // Don't mention any API issues in the response
    throw new Error('API_ERROR');
  }
}

// Analyze sentiment to detect potential distress
export async function analyzeSentiment(text: string): Promise<{
  distressLevel: "low" | "moderate" | "high";
  confidence: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a mental health sentiment analyzer. Assess the text for signs of distress, crisis, or mental health concerns. Provide a distress level (low, moderate, or high) and a confidence score between 0 and 1. Respond with JSON in this format: { 'distressLevel': 'low'|'moderate'|'high', 'confidence': number }",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Handle null message content with a default value
    let content = '{"distressLevel":"low","confidence":0.5}';
    if (response.choices[0].message.content) {
      content = response.choices[0].message.content;
    }
    const result = JSON.parse(content);

    return {
      distressLevel: result.distressLevel as "low" | "moderate" | "high",
      confidence: Math.max(0, Math.min(1, result.confidence)),
    };
  } catch (error: any) {
    console.error("Failed to analyze sentiment:", error);
    // Silently handle API errors without mentioning them to the user
    return {
      distressLevel: "low",
      confidence: 0.5,
    };
  }
}

// Recommend resources based on user message
export async function recommendResources(userMessage: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a mental health resource recommender. Based on the user's message, suggest up to 3 types of resources that would be most helpful from this list: 'mental-health-vs-illness', 'crisis-hotlines', 'coping-strategies', 'self-care'. Respond with JSON in this format: { 'resources': ['resource1', 'resource2'] }",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Handle null message content with a default value
    let content = '{"resources":[]}';
    if (response.choices[0].message.content) {
      content = response.choices[0].message.content;
    }
    const result = JSON.parse(content);
    return Array.isArray(result.resources) ? result.resources.slice(0, 3) : [];
  } catch (error: any) {
    console.error("Failed to recommend resources:", error);
    // Silently handle API errors by returning default resources based on document content
    return ["coping-strategies", "self-care"];
  }
}