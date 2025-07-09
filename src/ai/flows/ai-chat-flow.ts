'use server';
/**
 * @fileOverview An AI chat assistant flow.
 *
 * - getAiResponse - A function that handles a conversation with the AI assistant.
 * - AiChatInput - The input type for the getAiResponse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AiChatInputSchema = z.object({
  history: z.array(MessageSchema),
});

export type AiChatInput = z.infer<typeof AiChatInputSchema>;

const aiChatFlow = ai.defineFlow(
  {
    name: 'aiChatFlow',
    inputSchema: AiChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // The history needs to be in the format the model expects.
    const historyForApi = input.history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // The user's most recent message is the last one in the history.
    const lastUserMessage = historyForApi.pop();
    if (!lastUserMessage) {
        return "Sorry, I didn't receive a message.";
    }
    
    // The rest of the messages form the conversation context.
    const conversationHistory = historyForApi;

    // Use ai.generate directly for chat-like interactions
    const { text } = await ai.generate({
        // history: The context of the conversation.
        history: conversationHistory,
        // The prompt is the user's latest message.
        prompt: lastUserMessage.parts[0].text,
        // The system prompt defines the AI's personality and instructions.
        system: `You are ByteChat AI, a friendly and helpful assistant integrated into a chat application called ByteChat. Your name is Byte. Keep your responses concise and helpful.`,
        // We expect a simple text output.
        output: { format: 'text' },
    });
    
    return text;
  }
);

export async function getAiResponse(input: AiChatInput): Promise<string> {
  return await aiChatFlow(input);
}
