import React from 'react';
import { Spinner } from './Spinner';

interface GalleryProps {
  images: string[];
  isLoading: boolean;
  error: string | null;
  hasSourceImages: boolean;
}

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

export const Gallery: React.FC<GalleryProps> = ({ images, isLoading, error, hasSourceImages }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Spinner />
          <p className="mt-4 font-semibold text-slate-300">Gerando sua imagem...</p>
          <p className="text-sm text-slate-400">Isso pode levar alguns instantes.</p>
        </div>
      );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold">Ocorreu um erro</p>
                <p className="text-sm">{error}</p>
            </div>
        )
    }

    if (images.length > 0) {
      return (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((imgData, index) => (
            <div key={index} className="relative group">
                <img 
                  src={`data:image/png;base64,${imgData}`} 
                  alt={`Imagem gerada ${index + 1}`}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <a 
                    href={`data:image/png;base64,${imgData}`}
                    download={`personagem-gerado-${index + 1}.png`}
                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-indigo-600 text-white rounded-full p-2 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Baixar imagem"
                >
                    <DownloadIcon />
                </a>
            </div>
          ))}
        </div>
      );
    }
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-slate-300">Galeria de Imagens</h3>
            <p className="mt-1 max-w-sm">
                {hasSourceImages
                    ? "Descreva uma cena e clique em 'Gerar Imagem' para ver a magia acontecer."
                    : "Carregue uma ou mais imagens de referência para começar a criar."
                }
            </p>
        </div>
    )
  };

  return (
    <div className="w-full h-full overflow-y-auto">
        {renderContent()}
    </div>
  );
};