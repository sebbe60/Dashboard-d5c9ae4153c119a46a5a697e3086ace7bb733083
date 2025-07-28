import React, { useState } from 'react';
import { Image, Plus, X, RotateCcw, Upload, Link, Camera } from 'lucide-react';
import { ImageGalleryItem } from '../types';

interface ImageGalleryProps {
  images: ImageGalleryItem[];
  onAddImage: (image: Omit<ImageGalleryItem, 'id' | 'addedAt'>) => void;
  onRemoveImage: (id: string) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onAddImage, onRemoveImage }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageName, setNewImageName] = useState('');
  const [rotationInterval, setRotationInterval] = useState(30); // seconds
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-rotate images
  React.useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, rotationInterval * 1000);
    
    return () => clearInterval(interval);
  }, [images.length, rotationInterval]);

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadMethod === 'url') {
      if (newImageUrl.trim() && newImageName.trim()) {
        try {
          console.log('Adding URL image:', newImageUrl.trim(), newImageName.trim());
          onAddImage({
            url: newImageUrl.trim(),
            name: newImageName.trim()
          });
          resetForm();
        } catch (error) {
          console.error('Failed to save image:', error);
          alert('Failed to save image.');
        }
      }
    } else {
      if (selectedFile && newImageName.trim()) {
        handleFileUpload();
      }
    }
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        try {
          console.log('Adding file image:', newImageName.trim(), 'Size:', result.length);
          onAddImage({
            url: result,
            name: newImageName.trim()
          });
          resetForm();
        } catch (error) {
          console.error('Failed to save image:', error);
          alert('Failed to save image. File might be too large.');
        }
      }
      setIsUploading(false);
    };
    
    reader.onerror = () => {
      setIsUploading(false);
      alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(selectedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.');
        return;
      }
      
      setSelectedFile(file);
      // Auto-fill name from filename if empty
      if (!newImageName.trim()) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
        setNewImageName(nameWithoutExtension);
      }
    }
  };

  const resetForm = () => {
    setNewImageUrl('');
    setNewImageName('');
    setSelectedFile(null);
    setIsAddingImage(false);
    setUploadMethod('file');
  };

  // Reset current index when images change
  React.useEffect(() => {
    if (images.length === 0) {
      setCurrentImageIndex(0);
    } else if (currentImageIndex >= images.length) {
      setCurrentImageIndex(images.length - 1);
    }
  }, [images.length, currentImageIndex]);

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Image Gallery</h2>
            <p className="text-blue-200 text-sm">{images.length} images</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsAddingImage(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Image</span>
        </button>
      </div>

      {/* Add Image Form */}
      {isAddingImage && (
        <form onSubmit={handleAddImage} className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          {/* Upload Method Toggle */}
          <div className="flex space-x-2 mb-4">
            <button
              type="button"
              onClick={() => setUploadMethod('file')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                uploadMethod === 'file'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Upload File</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('url')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                uploadMethod === 'url'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              <Link className="w-4 h-4" />
              <span>From URL</span>
            </button>
          </div>

          {uploadMethod === 'file' ? (
            <div className="mb-3">
              <label className="block text-white font-medium mb-2">Select Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-pink-500 file:text-white hover:file:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              {selectedFile && (
                <div className="mt-2 p-2 bg-white/5 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <input
              type="url"
              placeholder="Image URL..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-3"
              autoFocus
            />
          )}
          
          <input
            type="text"
            placeholder="Image name..."
            value={newImageName}
            onChange={(e) => setNewImageName(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-3"
          />
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isUploading || (uploadMethod === 'file' && !selectedFile) || (uploadMethod === 'url' && !newImageUrl.trim()) || !newImageName.trim()}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg py-2 font-medium transition-all duration-200 transform hover:scale-105"
            >
              {isUploading ? 'Uploading...' : 'Add Image'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Rotation Settings */}
      {images.length > 1 && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">Auto-rotate every:</span>
            <select
              value={rotationInterval}
              onChange={(e) => setRotationInterval(parseInt(e.target.value))}
              className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>
        </div>
      )}

      {/* Image Display */}
      {images.length === 0 ? (
        <div className="text-center py-12 text-blue-200">
          <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No images yet. Add some to get started!</p>
        </div>
      ) : (
        <div className="relative">
          <div className="aspect-video bg-white/5 rounded-xl overflow-hidden border border-white/10 relative group">
            <img
              src={images[currentImageIndex]?.url}
              alt={images[currentImageIndex]?.name}
              className="w-full h-full object-cover transition-opacity duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800';
              }}
            />
            
            {/* Image Controls */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between p-4">
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 transform hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 transform hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              <button
                onClick={() => onRemoveImage(images[currentImageIndex].id)}
                className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-all duration-200 transform hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Image Info */}
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{images[currentImageIndex]?.name}</h3>
              {images.length > 1 && (
                <p className="text-blue-200 text-sm">
                  {currentImageIndex + 1} of {images.length}
                </p>
              )}
            </div>
            
            {/* Dots Indicator */}
            {images.length > 1 && (
              <div className="flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex 
                        ? 'bg-pink-400' 
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;