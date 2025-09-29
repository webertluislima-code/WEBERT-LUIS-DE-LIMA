import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Converte uma string base64 em um objeto com os dados e o mimeType.
 */
const base64ToObject = (base64: string) => {
    const [header, data] = base64.split(',');
    if (!header || !data) {
        throw new Error('Invalid base64 string format.');
    }
    const mimeType = header.match(/:(.*?);/)?.[1];
    if (!mimeType) {
        throw new Error('Could not extract mimeType from base64 string.');
    }
    return { data, mimeType };
}

type ImageMode = 'Padrão' | 'Caricatura' | 'Pixel Art' | 'Aquarela';

/**
 * Gera uma nova imagem de um personagem com base em uma imagem de referência e um prompt.
 * @param base64Images As imagens de referência dos personagens em formato base64 data URL.
 * @param prompt A descrição da nova cena ou ação.
 * @param aspectRatio O formato desejado para a imagem ('1:1', '16:9', '9:16').
 * @param style O estilo artístico desejado para a imagem ('None', 'Anime', 'Realistic', 'Fantasy').
 * @param imageMode O modo de imagem desejado ('Padrão', 'Caricatura', 'Pixel Art', 'Aquarela').
 * @param apiKey A chave de API do usuário para o serviço Gemini.
 * @returns Uma promessa que resolve para um array de strings base64 das imagens geradas.
 */
export const generateCharacterImage = async (
    base64Images: string[], 
    prompt: string, 
    aspectRatio: '1:1' | '16:9' | '9:16',
    style: 'None' | 'Anime' | 'Realistic' | 'Fantasy',
    imageMode: ImageMode,
    apiKey: string
): Promise<string[]> => {
    try {
        if (!apiKey) {
            throw new Error("A chave de API não foi fornecida.");
        }
        const ai = new GoogleGenAI({ apiKey });

        const imageParts = base64Images.map(base64Image => {
            const parts = base64ToObject(base64Image);
            return {
                inlineData: {
                    data: parts.data,
                    mimeType: parts.mimeType,
                },
            };
        });

        let aspectRatioInstruction = '';
        switch (aspectRatio) {
            case '16:9':
                aspectRatioInstruction = ' A imagem final deve ser gerada em formato de paisagem (16:9).';
                break;
            case '9:16':
                aspectRatioInstruction = ' A imagem final deve ser gerada em formato de retrato (9:16).';
                break;
        }
        
        let styleInstruction = '';
        switch (style) {
            case 'Anime':
                styleInstruction = ' A imagem final deve ter um estilo de arte de anime.';
                break;
            case 'Realistic':
                styleInstruction = ' A imagem final deve ser hiper-realista.';
                break;
            case 'Fantasy':
                styleInstruction = ' A imagem final deve ter um estilo de arte de fantasia.';
                break;
        }

        let modeInstruction = '';
        switch (imageMode) {
            case 'Caricatura':
                modeInstruction = ' A imagem final deve ter um estilo de caricatura com traços exagerados.';
                break;
            case 'Pixel Art':
                modeInstruction = ' A imagem final deve ser em estilo pixel art, como um jogo retrô.';
                break;
            case 'Aquarela':
                modeInstruction = ' A imagem final deve ter um estilo de pintura em aquarela, com pinceladas visíveis.';
                break;
        }

        const fullPrompt = `Mantendo a fidelidade dos personagens nas imagens fornecidas, crie uma nova cena onde: ${prompt}.${aspectRatioInstruction}${styleInstruction}${modeInstruction}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    ...imageParts,
                    {
                        text: fullPrompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const generatedImages: string[] = [];
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                generatedImages.push(part.inlineData.data);
            }
        }
        
        if (generatedImages.length === 0) {
            const feedback = response.candidates?.[0]?.safetyRatings;
            let reason = "O prompt pode ter sido bloqueado por políticas de segurança.";
            if(feedback) {
                const blocked = feedback.find(rating => rating.blocked);
                if (blocked) {
                    reason = `Bloqueado devido a: ${blocked.category}.`;
                }
            }
            throw new Error(`A API não retornou uma imagem. ${reason}`);
        }

        return generatedImages;

    } catch (error) {
        console.error("Erro ao chamar a API Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error("A chave de API fornecida não é válida. Verifique a chave e tente novamente.");
        }
        throw new Error(error instanceof Error ? error.message : "Falha ao comunicar com o serviço de IA.");
    }
};

/**
 * Melhora um prompt de usuário para geração de imagens.
 * @param currentPrompt O prompt atual do usuário.
 * @param apiKey A chave de API do usuário para o serviço Gemini.
 * @returns Uma promessa que resolve para o prompt melhorado.
 */
export const improvePrompt = async (currentPrompt: string, apiKey: string): Promise<string> => {
    try {
        if (!apiKey) {
            throw new Error("A chave de API não foi fornecida.");
        }
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: currentPrompt,
            config: {
                systemInstruction: `Você é um assistente criativo que aprimora os prompts do usuário para um gerador de imagens de IA. 
                Pegue a entrada do usuário e torne-a mais vívida, descritiva e imaginativa, focando em detalhes sobre o ambiente, 
                iluminação, ação e emoção. Responda apenas com o texto do prompt aprimorado, sem nenhuma introdução ou texto extra.`
            }
        });
        return response.text;
    } catch (error) {
        console.error("Erro ao chamar a API Gemini para melhorar o prompt:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error("A chave de API fornecida não é válida. Verifique a chave e tente novamente.");
        }
        throw new Error(error instanceof Error ? error.message : "Falha ao comunicar com o serviço de IA para melhorar o prompt.");
    }
};