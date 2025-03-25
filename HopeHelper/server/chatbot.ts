import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Password hashing
export async function hash(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return salt + ':' + derivedKey.toString('hex');
}

export async function compare(stored: string, supplied: string): Promise<boolean> {
  const [salt, key] = stored.split(':');
  const derivedKey = await scryptAsync(supplied, salt, 64) as Buffer;
  const keyBuffer = Buffer.from(key, 'hex');
  return keyBuffer.length === derivedKey.length && 
         timingSafeEqual(keyBuffer, derivedKey);
}

// This contains the mental health information from the PDF document
export const mentalHealthInfo = {
  definition: `
    Mental health and mental illness are related but distinct concepts. Mental health refers to one's 
    overall psychological well-being and capacity to interact effectively with others and the environment.
    According to the WHO, mental health is not merely the absence of illness, but a state of well-being
    where an individual can realize their own abilities, cope with normal stresses, work productively,
    and contribute to their community.

    Mental illness, on the other hand, refers to diagnosable conditions that affect mood, thinking, and behavior, 
    often associated with distress or impaired functioning. The WHO uses the term 'mental disorders' 
    broadly to include mental illness, intellectual disability, personality disorder, substance dependence, 
    and adjustment to adverse life events.
  `,
  
  mentalHealthProblems: `
    Mental health problems can range from common conditions like depression and anxiety to more severe 
    disorders such as schizophrenia or bipolar disorder. They can affect anyone regardless of age, 
    background, or circumstances. Mental health problems may be temporary responses to life stressors 
    or long-term conditions requiring ongoing management.

    It's important to note that mental health exists on a spectrum, and everyone has mental health, 
    just as everyone has physical health. Many factors influence mental health, including biological 
    factors, life experiences, family history, and social circumstances.
  `,
  
  factors: `
    Mental, physical, and social functioning are interdependent. The quality of a person's mental health 
    is influenced by individual factors and experiences, family relationships and circumstances, and 
    the wider community. Cultural context is also important, though it's just one of many factors.

    Different factors may lead to different outcomes for different individuals due to complex interactions. 
    For children specifically, mental health involves the ability to develop psychologically, emotionally, 
    creatively, intellectually, and spiritually; initiate and sustain relationships; learn; develop moral 
    understanding; and experience and manage a range of emotions.
  `,
  
  stigma: `
    Stigma surrounding mental illness is a worldwide phenomenon that often begins during childhood. 
    It can lead to discrimination, social isolation, and reluctance to seek help. Educational interventions 
    and increased contact with people who have mental health issues can help reduce stigma.

    It's essential to promote understanding that mental health problems are common, treatable, and not a 
    sign of weakness or personal failure. Creating open conversations about mental health can help 
    normalize these experiences and encourage people to seek support when needed.
  `,

  stress: `
    Stress and anxiety are common experiences that exist on a spectrum. While temporary stress is a normal 
    response to challenging situations, persistent stress or anxiety that interferes with daily functioning 
    may indicate a mental health concern.

    According to mental health literature, the context and intensity of these feelings matter greatly. 
    Cultural factors, individual differences, and social environments all influence how stress manifests 
    and is experienced. Evidence-based coping strategies for managing stress include physical activity, 
    mindfulness practices, adequate sleep, social connection, and professional support when needed.
  `,

  selfCare: `
    Self-care is crucial for maintaining good mental health. This includes basic physical care (adequate 
    sleep, balanced nutrition, regular exercise), emotional care (acknowledging feelings, practicing 
    self-compassion), social connection, and setting healthy boundaries.

    For those experiencing mental health challenges, self-care should complement, not replace, professional 
    help when needed. Small, consistent self-care practices can have a significant positive impact on 
    overall well-being and resilience.
  `
};

// Import OpenAI response generation
import { generateAIResponse } from './openai';

// Import the PDF document content
import { getMentalHealthDocumentContent } from './openai';

// Function to generate responses based on user input
export async function generateResponse(userMessage: string): Promise<string> {
  try {
    // Use advanced AI-generated response
    return await generateAIResponse(userMessage);
  } catch (error: any) {
    console.error("Error using AI response, falling back to basic response:", error);
    
    // Silently handle API errors without mentioning them
    if (error?.message === 'QUOTA_EXCEEDED' || error?.message === 'API_ERROR' || error?.message?.includes('API')) {
      return `Based on the mental health research by Leighton and Dogra, I can help you understand various aspects of mental health. 

Mental health is not merely the absence of illness, but a state of wellbeing where individuals can realize their abilities, cope with normal stresses, work productively, and contribute to their community.

What specific aspect of mental health would you like to learn more about today?`;
    }
    
    // Fallback to basic response generation if AI fails
    const messageLower = userMessage.toLowerCase().trim();
    
    // Get document content or fallback to the mentalHealthInfo
    const pdfContent = getMentalHealthDocumentContent();
    const useDocumentContent = pdfContent && pdfContent.length > 100;
    
    // First check for basic conversation patterns
    // Check for greetings
    if (messageLower === 'hello' || messageLower === 'hi' || messageLower === 'hey') {
      return `Hello! I'm HopeBot, your mental health companion. I'm here to help you understand mental health concepts and provide support based on evidence-based information from academic resources. How are you feeling today?`;
    }
    
    if (messageLower === 'how are you' || messageLower === 'how are you doing') {
      return `I'm functioning well, thanks for asking! I'm here and ready to provide mental health information and support based on the research of Leighton, Dogra, and the World Health Organization. How can I assist you today?`;
    }
    
    if (messageLower.includes('thank you') || messageLower.includes('thanks')) {
      return `You're welcome! I'm glad I could help. If you have any other questions about mental health concepts, feel free to ask anytime.`;
    }
    
    // Response based on the mental health document - provide more academic content
    // Check for "what is mental health" type questions
    if ((messageLower.includes('what') || messageLower.includes('define') || messageLower.includes('meaning')) && 
        (messageLower.includes('mental health'))) {
      return `According to Ryff and Singer (1998), as cited in the academic literature, health is not merely a medical concept associated with absence of illness, but rather a philosophical one that requires an explanation of a good life – being one where an individual has a sense of purpose, is engaged in quality relationships with others, and possesses self-respect and mastery. This is synonymous with the World Health Organization (WHO) (2000, 2005b) definition of positive mental health.

Rowling et al. (2002) define mental health as "the capacity of individuals and groups to interact with one another and the environment in ways that promote subjective wellbeing, the optimal development and use of cognitive, affective and relational abilities, the achievement of individual and collective goals consistent with justice."

It's important to understand that mental health is just one of many factors that influence overall wellbeing, and neither physical nor mental health exist separately – mental, physical and social functioning are interdependent (WHO, 2004).`;
    }
    
    // Check for child-specific mental health questions
    if (messageLower.includes('children') || messageLower.includes('child') || messageLower.includes('kid') || 
        (messageLower.includes('mental health') && (messageLower.includes('young') || messageLower.includes('youth')))) {
      return `Definitions of mental health as they relate specifically to children have been provided by the Health Advisory Service (HAS) (1995) and the Mental Health Foundation (1999). These definitions recognize the developmental context of childhood, including the ability to:

- Develop psychologically, emotionally, creatively, intellectually and spiritually
- Initiate, develop and sustain mutually satisfying personal relationships
- Use and enjoy solitude
- Become aware of others and empathize with them
- Play and learn
- Develop a sense of right and wrong
- Resolve problems and setbacks and learn from them

Such definitions are useful as they relate to 'societal' expectations of children. All health issues need to be considered within a cultural and developmental context, as do the social constructs of childhood and adolescence (Walker, 2005).`;
    }
    
    // Check for questions about mental health vs mental illness
    if ((messageLower.includes('difference') || messageLower.includes('versus') || messageLower.includes('vs')) && 
        (messageLower.includes('mental health') && messageLower.includes('mental illness'))) {
      return `According to the academic literature by Leighton and Dogra, there is often terminological confusion in relation to issues associated with mental health. Mental health and mental illness can be perceived as two separate, yet related, issues.

The WHO (1992) uses the term 'mental disorders' broadly, to include mental illness, intellectual disability, personality disorder, substance dependence and adjustment to adverse life events. The WHO acknowledges that the word 'disorder' is used to avoid perceived greater difficulties associated with 'illness' – for example, stigma and the emphasis on a medical model.

One way of distinguishing between distress associated with adverse life events and more severe disorders which involve physiological symptoms and underlying biological changes is to distinguish between mental health problems and mental illness, using a multi-dimensional model. This has an additional advantage in enabling normal 'distress' (e.g. grief following bereavement) to be recognized as part of the 'human condition', rather than being medicalized.

Kendall (1988) presents the relative merits of using categories and dimensions with respect to mental disorders. Where psychotic illness is concerned a categorical approach may be preferable, whereas in other conditions the situation is more likely to be changeable, and would perhaps benefit from a dimensional perspective.`;
    }
    
    // Check for questions about stigma
    if (messageLower.includes('stigma') || messageLower.includes('prejudice') || messageLower.includes('discrimination')) {
      return `According to the academic literature on mental health, stigma around mental health issues is a worldwide phenomenon. Ironically, referring to mental illness in terms of mental health originated in the 1960s in an attempt to reduce stigma (Rowling et al., 2002).

The WHO acknowledges that the word 'disorder' is used to avoid perceived greater difficulties associated with 'illness' – for example, stigma and the emphasis on a medical model. Stigmatization of mental illness is a significant barrier that often originates during childhood.

Stigma leads to discrimination, fear, and avoidance behaviors, creating obstacles for people seeking help and support. Research shows that educational interventions and increased contact with individuals experiencing mental health issues can help reduce stigma in communities.`;
    }
    
    // If we have PDF content, do a basic keyword search for relevant content
    if (useDocumentContent) {
      // Get a relevant section of the PDF that might answer the question
      // First, break the PDF into paragraphs
      const paragraphs = pdfContent.split('\n\n').filter(p => p.trim().length > 30);
      
      // Look for paragraphs containing keywords from the user's message
      const words = messageLower.split(/\s+/).filter(w => w.length > 3);
      
      const relevantParagraphs = paragraphs.filter(p => {
        const pLower = p.toLowerCase();
        return words.some(word => pLower.includes(word));
      });
      
      // If we found relevant paragraphs, use them for the response
      if (relevantParagraphs.length > 0) {
        // Limit to 2-3 most relevant paragraphs to avoid very long responses
        const responseText = relevantParagraphs.slice(0, 2).join('\n\n');
        return `Based on the academic literature by Leighton and Dogra on mental health, here's what I can tell you:\n\n${responseText}\n\nThis information comes from peer-reviewed research. Is there anything specific about this topic you'd like to know more about?`;
      }
    }
    
    // If PDF content didn't yield results or wasn't available, use our built-in knowledge base
    // Check for questions about mental health vs mental illness
    if (messageLower.includes('mental health') && messageLower.includes('mental illness') || 
        messageLower.includes('difference between') || 
        messageLower.includes('what is mental health') || 
        messageLower.includes('define mental')) {
      return mentalHealthInfo.definition;
    }
    
    // Check for questions about mental health problems
    if (messageLower.includes('mental health problem') || 
        messageLower.includes('mental disorder') || 
        messageLower.includes('mental illness') || 
        messageLower.includes('depression') || 
        messageLower.includes('anxiety')) {
      return mentalHealthInfo.mentalHealthProblems;
    }
    
    // Check for questions about stress/anxiety
    if (messageLower.includes('stress') || messageLower.includes('anxiety') || 
        messageLower.includes('worried') || messageLower.includes('anxious') || 
        messageLower.includes('overwhelmed')) {
      return mentalHealthInfo.stress;
    }
    
    // Check for questions about self-care
    if (messageLower.includes('self-care') || messageLower.includes('self care') || 
        messageLower.includes('take care') || messageLower.includes('cope') || 
        messageLower.includes('manage')) {
      return mentalHealthInfo.selfCare;
    }
    
    // Check for questions about stigma
    if (messageLower.includes('stigma') || messageLower.includes('judged') || 
        messageLower.includes('judgment') || messageLower.includes('discrimination')) {
      return mentalHealthInfo.stigma;
    }
    
    // Check for questions about factors affecting mental health
    if (messageLower.includes('factor') || messageLower.includes('cause') || 
        messageLower.includes('influence') || messageLower.includes('affect')) {
      return mentalHealthInfo.factors;
    }
    
    // Default response for other queries
    return `Thank you for sharing. Your experiences are valid and important. Based on mental health research, many factors contribute to our overall wellbeing, including social connections, physical health, and how we process our emotions. 

Is there a specific aspect of mental health you'd like to explore further? You can ask me about the difference between mental health and mental illness, common mental health problems, factors that affect mental health, stress management, self-care techniques, or mental health stigma.`;
  }
}
