
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { NutritionData, MealPlan, UserProfile, GroceryCategory, WorkoutPlan, ProgressReview, PantryReport, SleepData, RecoveryProtocol, Substitution } from "../types";

// Helper to initialize AI inside each function call as per guidelines
const getAi = () => {
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

// Global error handler to check for "Requested entity was not found"
const handleApiError = (err: any) => {
  const errorMessage = err?.message || JSON.stringify(err);
  if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("NOT_FOUND")) {
    if ((window as any).aistudio?.openSelectKey) {
      (window as any).aistudio.openSelectKey();
    }
  }
  throw err;
};

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionData> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: "Analyze this food item deeply. Return valid JSON only. Provide a clear 'verdict' (e.g., 'Superfood', 'Healthy', 'Moderate', 'Limit Usage', 'Avoid'). Give a 'health_score' (1-100). Identify specific 'health_benefits' (e.g. 'High in Magnesium') and 'harmful_warnings' (e.g. 'Contains Artificial Red Dye #40'). Include 'key_nutrients' as short badges. Suggest 2-3 'better_alternatives' if the score is below 70. Also calculate calories and macros.",
          }
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            health_benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
            harmful_warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            nova_score: { type: Type.NUMBER, description: "1-4 NOVA scale" },
            is_ultra_processed: { type: Type.BOOLEAN },
            motivation: { type: Type.STRING },
            verdict: { type: Type.STRING },
            health_score: { type: Type.NUMBER },
            key_nutrients: { type: Type.ARRAY, items: { type: Type.STRING } },
            better_alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["calories", "protein", "carbs", "fat", "health_benefits", "harmful_warnings", "nova_score", "is_ultra_processed", "motivation", "verdict", "health_score", "key_nutrients"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}") as NutritionData;
    return { ...result, scanned_image: `data:image/jpeg;base64,${base64Image}` };
  } catch (err) {
    return handleApiError(err);
  }
};

export const speakNutritionSummary = async (data: NutritionData): Promise<string> => {
  try {
    const ai = getAi();
    const prompt = `Say in a professional but friendly nutrition coach voice: "I've analyzed your meal. It scores a ${data.health_score} out of 100. My verdict: ${data.verdict}. It provides about ${data.calories} calories. ${data.motivation}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");
    return base64Audio;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getRecoveryProtocol = async (sleep: SleepData, user: UserProfile): Promise<RecoveryProtocol> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze sleep readiness for a ${user.stats.age}yo weighing ${user.stats.weight}kg. Last night: ${sleep.hours}h sleep, ${sleep.quality}/10 quality, ${sleep.stress_level}/10 stress. Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            readiness_score: { type: Type.NUMBER },
            activity_recommendation: { type: Type.STRING },
            nutrition_focus: { type: Type.STRING },
            supplement_tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["readiness_score", "activity_recommendation", "nutrition_focus", "supplement_tips"]
        }
      }
    });
    return JSON.parse(response.text || "{}") as RecoveryProtocol;
  } catch (err) {
    return handleApiError(err);
  }
};

export const findSubstitution = async (ingredient: string, diet: string): Promise<Substitution> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a ${diet} alternative for "${ingredient}". Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            replacement: { type: Type.STRING },
            benefits: { type: Type.STRING },
            macros_diff: { type: Type.STRING }
          },
          required: ["original", "replacement", "benefits", "macros_diff"]
        }
      }
    });
    return JSON.parse(response.text || "{}") as Substitution;
  } catch (err) {
    return handleApiError(err);
  }
};

export const analyzePantry = async (base64Image: string): Promise<PantryReport> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze the contents of this fridge or pantry. Detect all food items visible. Grade the overall healthiness and suggest one immediate recipe. Return valid JSON only." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grade: { type: Type.STRING, enum: ['A', 'B', 'C', 'D', 'F'] },
            items_found: { type: Type.ARRAY, items: { type: Type.STRING } },
            top_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggested_recipe: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          required: ["grade", "items_found", "top_recommendations", "suggested_recipe"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as PantryReport;
  } catch (err) {
    return handleApiError(err);
  }
};

export const generateMealPlanFromIngredients = async (ingredients: string[], user: UserProfile): Promise<MealPlan> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a 5-meal plan using primarily these ingredients: ${ingredients.join(', ')}. The user is ${user.stats.age}yo, ${user.stats.weight}kg, aiming for ${user.goals.calories} cals. Meals should be healthy and creative. Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "Meal number or time" },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      p: { type: Type.NUMBER },
                      c: { type: Type.NUMBER },
                      f: { type: Type.NUMBER },
                    }
                  }
                }
              }
            },
            daily_tip: { type: Type.STRING }
          },
          required: ["meals", "daily_tip"]
        }
      }
    });
    return JSON.parse(response.text || '{}') as MealPlan;
  } catch (err) {
    return handleApiError(err);
  }
};

export const generateHealthPodcast = async (user: UserProfile, topic: string) => {
  try {
    const ai = getAi();
    const prompt = `Generate a 30-second conversational health update for ${user.stats.age}-year-old user.
        Joe: A high-energy fitness motivator.
        Jane: A calm, data-driven nutritionist.
        Topic: ${topic}. Mention their calorie goal of ${user.goals.calories}.
        Format as a multi-speaker TTS request.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Joe',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
              },
              {
                speaker: 'Jane',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
              }
            ]
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");
    return base64Audio;
  } catch (err) {
    return handleApiError(err);
  }
};

export const analyzeProgress = async (beforeImg: string, afterImg: string): Promise<ProgressReview> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: beforeImg } },
          { inlineData: { mimeType: 'image/jpeg', data: afterImg } },
          { text: "Compare these two physical progress photos. Analyze muscle tone, posture, and visible health markers. Return valid JSON only." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            changes: { type: Type.ARRAY, items: { type: Type.STRING } },
            encouragement: { type: Type.STRING }
          },
          required: ["summary", "changes", "encouragement"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as ProgressReview;
  } catch (err) {
    return handleApiError(err);
  }
};

export const transformToHealthyMeal = async (base64Image: string): Promise<string> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: 'Redraw this exact meal but as a ultra-healthy, nutrient-dense version of itself. Use clean plating and fresh ingredients. Cinematic lighting.' },
        ],
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Transformation failed");
  } catch (err) {
    return handleApiError(err);
  }
};

export const generateWorkout = async (user: UserProfile, remainingCalories: number): Promise<WorkoutPlan> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user has ${remainingCalories} calories remaining today. Generate a ${remainingCalories > 500 ? 'high intensity' : 'light'} workout plan for a ${user.stats.age} year old. Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING },
            total_duration: { type: Type.STRING },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  instructions: { type: Type.STRING },
                  target_calories: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}') as WorkoutPlan;
  } catch (err) {
    return handleApiError(err);
  }
};

export const generateGoalVision = async (prompt: string): Promise<string> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A cinematic, ultra-high-definition 4k inspirational health and fitness visualization: ${prompt}. Photo-realistic, epic lighting.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (err) {
    return handleApiError(err);
  }
};

export const findHealthyNearby = async (lat: number, lng: number) => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: "Find 3 highly-rated healthy restaurants or salad bars nearby.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return chunks.filter(c => c.maps).map(c => ({
      name: c.maps.title,
      uri: c.maps.uri,
      snippet: c.maps.placeAnswerSources?.[0]?.reviewSnippets?.[0]
    }));
  } catch (err) {
    return handleApiError(err);
  }
};

export const searchFoodFact = async (query: string) => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text,
      sources: sources.filter(c => c.web).map(c => ({
        title: c.web.title,
        uri: c.web.uri
      }))
    };
  } catch (err) {
    return handleApiError(err);
  }
};

export const generateShoppingList = async (mealPlan: MealPlan): Promise<GroceryCategory[]> => {
  try {
    const ai = getAi();
    const prompt = `Based on these meals, create a consolidated grocery shopping list categorized by section: ${JSON.stringify(mealPlan.meals)}. Return valid JSON.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              items: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["category", "items"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]') as GroceryCategory[];
  } catch (err) {
    return handleApiError(err);
  }
};

export const generateMealPlan = async (user: UserProfile): Promise<MealPlan> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a 1-day meal plan for a ${user.stats.age} year old weighing ${user.stats.weight}kg with a goal of ${user.goals.calories} calories. Provide 4 meals (Breakfast, Lunch, Dinner, Snack).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      p: { type: Type.NUMBER },
                      c: { type: Type.NUMBER },
                      f: { type: Type.NUMBER },
                    }
                  }
                }
              }
            },
            daily_tip: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}') as MealPlan;
  } catch (err) {
    return handleApiError(err);
  }
};

export function encodePCM(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodePCM(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
