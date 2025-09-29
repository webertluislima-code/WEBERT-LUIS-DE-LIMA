import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { Gallery } from './components/Gallery';
import { Spinner } from './components/Spinner';
import { generateCharacterImage, improvePrompt } from './services/geminiService';

type AspectRatio = '1:1' | '16:9' | '9:16';
type Style = 'None' | 'Anime' | 'Realistic' | 'Fantasy';
type ImageMode = 'Padrão' | 'Caricatura' | 'Pixel Art' | 'Aquarela';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [style, setStyle] = useState<Style>('None');
  const [imageMode, setImageMode] = useState<ImageMode>('Padrão');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    const storedHistory = localStorage.getItem('prompt-history');
    if (storedHistory) {
      setPromptHistory(JSON.parse(storedHistory));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
            setShowHistory(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, [historyRef]);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini-api-key', key);
    setError(null);
  }

  const handleImageAdd = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSourceImages(prevImages => [...prevImages, reader.result as string]);
      setGeneratedImages([]);
      setError(null);
    };
    reader.onerror = () => {
      setError("Falha ao ler o arquivo de imagem.");
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (index: number) => {
    setSourceImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleGenerateClick = async () => {
    if (!apiKey) {
        setError("Por favor, insira sua chave de API Gemini para continuar.");
        return;
    }
    if (sourceImages.length === 0 || !prompt) {
      setError("Por favor, carregue pelo menos uma imagem e insira um prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    // Add to history
    const newHistory = [prompt, ...promptHistory.filter(p => p !== prompt)].slice(0, 20); // Keep latest 20 unique prompts
    setPromptHistory(newHistory);
    localStorage.setItem('prompt-history', JSON.stringify(newHistory));

    try {
      const images = await generateCharacterImage(sourceImages, prompt, aspectRatio, style, imageMode, apiKey);
      setGeneratedImages(images);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setError(`Não foi possível gerar a imagem. Detalhes: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSurpriseMe = () => {
    const suggestions = [
      "personagens em uma floresta mágica e brilhante à noite",
      "personagens como detetives em uma rua chuvosa de uma cidade noir",
      "personagens explorando ruínas antigas em um deserto",
      "personagens meditando no topo de uma montanha com vista para as nuvens",
      "personagens em um café movimentado em Paris",
      "personagens como cavaleiros em armadura brilhante enfrentando um dragão",
      "personagens surfando em uma onda gigante ao pôr do sol",
    ];
    const randomPrompt = suggestions[Math.floor(Math.random() * suggestions.length)];
    setPrompt(randomPrompt);
  };

  const handleImprovePrompt = async () => {
    if (!prompt) return;
    if (!apiKey) {
        setError("Por favor, insira sua chave de API Gemini para melhorar o prompt.");
        return;
    }
    setIsImprovingPrompt(true);
    setError(null);
    try {
        const improved = await improvePrompt(prompt, apiKey);
        setPrompt(improved.trim());
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
        setError(`Não foi possível melhorar o prompt. Detalhes: ${errorMessage}`);
    } finally {
        setIsImprovingPrompt(false);
    }
  };

  const styles: {key: Style, label: string}[] = [
    {key: 'None', label: 'Nenhum'},
    {key: 'Anime', label: 'Anime'},
    {key: 'Realistic', label: 'Realista'},
    {key: 'Fantasy', label: 'Fantasia'},
  ];

  const imageModes: {key: ImageMode, label: string}[] = [
    {key: 'Padrão', label: 'Padrão'},
    {key: 'Caricatura', label: 'Caricatura'},
    {key: 'Pixel Art', label: 'Pixel Art'},
    {key: 'Aquarela', label: 'Aquarela'},
  ];

  const canInteract = apiKey && sourceImages.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 lg:p-8">
        <div className="grid lg:grid-cols-12 gap-8 h-full">
          {/* Painel de Controle */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-slate-300">
                1. Sua Chave de API Gemini
              </label>
              <input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="Cole sua chave de API aqui"
                  className="w-full mt-2 p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          
            <ImageUploader 
              sourceImages={sourceImages} 
              onImageAdd={handleImageAdd} 
              onImageRemove={handleImageRemove} 
            />
            
            <div ref={historyRef}>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
                  3. Descreva a nova cena
                </label>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowHistory(h => !h)} disabled={!canInteract} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Histórico</button>
                    <button onClick={handleSurpriseMe} disabled={!canInteract} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Me surpreenda</button>
                    <button onClick={handleImprovePrompt} disabled={!prompt || isImprovingPrompt || !canInteract} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                        {isImprovingPrompt && <Spinner />}
                        Melhorar
                    </button>
                </div>
              </div>
              <div className="relative">
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={apiKey ? "Ex: personagem 1 dando um high-five no personagem 2" : "Insira a chave de API para começar"}
                  className="w-full h-32 p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  disabled={!canInteract || isImprovingPrompt}
                />
                {showHistory && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {promptHistory.length > 0 ? (
                            promptHistory.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setPrompt(p);
                                        setShowHistory(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 truncate"
                                    title={p}
                                >
                                    {p}
                                </button>
                            ))
                        ) : (
                            <p className="px-4 py-2 text-sm text-slate-400">Nenhum histórico ainda.</p>
                        )}
                    </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                4. Escolha o formato da imagem
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    disabled={!canInteract}
                    className={`p-2 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      aspectRatio === ratio
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                5. Escolha um estilo
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {styles.map(({key, label}) => (
                  <button
                    key={key}
                    onClick={() => setStyle(key)}
                    disabled={!canInteract}
                    className={`p-2 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      style === key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                6. Escolha um modo de imagem
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {imageModes.map(({key, label}) => (
                  <button
                    key={key}
                    onClick={() => setImageMode(key)}
                    disabled={!canInteract}
                    className={`p-2 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      imageMode === key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateClick}
              disabled={!canInteract || !prompt || isLoading || isImprovingPrompt}
              className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {isLoading ? <><Spinner /> Gerando...</> : 'Gerar Imagem'}
            </button>
          </div>

          {/* Galeria */}
          <div className="lg:col-span-8 bg-slate-800/50 rounded-lg border border-slate-700 min-h-[50vh] lg:min-h-0">
            <Gallery 
              images={generatedImages} 
              isLoading={isLoading}
              error={error}
              hasSourceImages={sourceImages.length > 0}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;