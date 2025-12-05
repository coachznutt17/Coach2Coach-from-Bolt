import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { uploadFiles, validateFiles, FileValidation, UploadResult, formatFileSize, getFileTypeIcon } from '../lib/fileUpload';

interface FileUploadZoneProps {
  onFilesUploaded: (results: UploadResult[]) => void;
  bucket: string;
  userId: string;
  validation: FileValidation;
  multiple?: boolean;
  accept?: string;
  title?: string;
  description?: string;
  className?: string;
}

interface FileWithStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  result?: UploadResult;
  progress?: number;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesUploaded,
  bucket,
  userId,
  validation,
  multiple = true,
  accept,
  title = "Upload Files",
  description = "Drag and drop files here, or click to browse",
  className = ""
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (newFiles: File[]) => {
    setErrors([]);

    // Validate files
    const validationResult = validateFiles(newFiles, validation);
    if (!validationResult.valid) {
      setErrors(validationResult.errors);
      return;
    }

    // Add files to state
    const filesWithStatus: FileWithStatus[] = newFiles.map(file => ({
      file,
      status: 'pending'
    }));

    if (multiple) {
      setFiles(prev => [...prev, ...filesWithStatus]);
    } else {
      setFiles(filesWithStatus);
    }

    // Auto-upload files immediately
    await uploadFilesImmediately(newFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesImmediately = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;

    setUploading(true);
    setErrors([]);

    try {
      // Update files to uploading status
      setFiles(prev => prev.map(f =>
        filesToUpload.includes(f.file)
          ? { ...f, status: 'uploading' as const }
          : f
      ));

      const results = await uploadFiles(
        filesToUpload,
        bucket,
        userId,
        validation,
        (progress) => {
          setFiles(prev => prev.map(f =>
            filesToUpload.includes(f.file) && f.status === 'uploading'
              ? { ...f, progress }
              : f
          ));
        }
      );

      // Update files with results
      setFiles(prev => prev.map((f) => {
        const resultIndex = filesToUpload.indexOf(f.file);
        if (resultIndex === -1) return f;

        return {
          ...f,
          status: results[resultIndex].success ? 'success' : 'error',
          result: results[resultIndex],
          progress: 100
        };
      }));

      // Call callback with results
      onFilesUploaded(results);

      // Clear successful uploads after a delay
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status === 'error'));
      }, 2000);

    } catch (error) {
      setErrors(['Upload failed. Please try again.']);
      setFiles(prev => prev.map(f =>
        filesToUpload.includes(f.file)
          ? { ...f, status: 'error' as const }
          : f
      ));
    } finally {
      setUploading(false);
    }
  };

  const uploadAllFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors([]);

    try {
      // Update all files to uploading status
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

      const filesToUpload = files.map(f => f.file);
      
      const results = await uploadFiles(
        filesToUpload,
        bucket,
        userId,
        validation,
        (progress) => {
          // Update progress for all files (simplified)
          setFiles(prev => prev.map(f => ({ 
            ...f, 
            progress: f.status === 'uploading' ? progress : f.progress 
          })));
        }
      );

      // Update files with results
      setFiles(prev => prev.map((f, index) => ({
        ...f,
        status: results[index].success ? 'success' : 'error',
        result: results[index],
        progress: 100
      })));

      // Call callback with results
      onFilesUploaded(results);

      // Clear successful uploads after a delay
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status === 'error'));
      }, 2000);

    } catch (error) {
      setErrors(['Upload failed. Please try again.']);
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const })));
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAcceptString = () => {
    if (accept) return accept;
    return validation.allowedTypes.join(',');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        
        <div className="text-xs text-gray-400 space-y-1">
          <p>Max file size: {formatFileSize(validation.maxSize)}</p>
          <p>Allowed types: {validation.allowedTypes.map(type => type.split('/')[1]).join(', ')}</p>
          {validation.maxFiles && <p>Max files: {validation.maxFiles}</p>}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptString()}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800 mb-1">Upload Errors</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700">Files ({files.length})</h4>
            <div className="flex space-x-2">
              {files.some(f => f.status === 'pending') && (
                <button
                  onClick={uploadAllFiles}
                  disabled={uploading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload All
                    </>
                  )}
                </button>
              )}
              <button
                onClick={clearAll}
                className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {files.map((fileWithStatus, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center flex-1 min-w-0">
                  <span className="text-2xl mr-3">{getFileTypeIcon(fileWithStatus.file.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-700 truncate">{fileWithStatus.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(fileWithStatus.file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    {fileWithStatus.status === 'uploading' && fileWithStatus.progress !== undefined && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fileWithStatus.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {fileWithStatus.status === 'error' && fileWithStatus.result?.error && (
                      <p className="text-sm text-red-600 mt-1">{fileWithStatus.result.error}</p>
                    )}
                  </div>
                </div>

                {/* Status Icon */}
                <div className="flex items-center space-x-2 ml-4">
                  {fileWithStatus.status === 'pending' && (
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs text-gray-600">•</span>
                    </div>
                  )}
                  {fileWithStatus.status === 'uploading' && (
                    <Loader className="w-5 h-5 text-emerald-600 animate-spin" />
                  )}
                  {fileWithStatus.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {fileWithStatus.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  
                  {/* Remove Button */}
                  {fileWithStatus.status !== 'uploading' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;