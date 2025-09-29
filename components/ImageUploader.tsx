import React, { useRef } from 'react';

interface ImageUploaderProps {
  sourceImages: string[];
  onImageAdd: (file: File) => void;
  onImageRemove: (index: number) => void;
}

const AddIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const RemoveIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const ImageUploader: React.FC<ImageUploaderProps> = ({ sourceImages, onImageAdd, onImageRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageAdd(file);
    }
    if (event.target) {
        event.target.value = "";
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        2. Carregue as imagens de referência
      </label>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sourceImages.map((image, index) => (
            <div key={index} className="relative group aspect-square">
                <img src={image} alt={`Referência ${index + 1}`} className="w-full h-full object-cover rounded-lg shadow-md" />
                <button 
                    onClick={() => onImageRemove(index)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    aria-label={`Remover imagem ${index + 1}`}
                >
                    <RemoveIcon />
                </button>
            </div>
        ))}

        <div
          onClick={handleAddClick}
          className="w-full aspect-square border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-800 hover:border-indigo-500 transition-colors cursor-pointer"
          role="button"
          aria-label="Adicionar nova imagem de referência"
        >
          <AddIcon />
          <span className="text-xs mt-1 font-semibold text-center">Adicionar Imagem</span>
        </div>
      </div>
    </div>
  );
};