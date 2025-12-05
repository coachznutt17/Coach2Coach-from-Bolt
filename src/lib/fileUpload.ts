import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  filePath?: string;
}

export interface FileValidation {
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxFiles?: number;
}

// File validation configurations
export const FILE_VALIDATIONS = {
  resources: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ],
    maxFiles: 10
  },
  images: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ],
    maxFiles: 5
  },
  avatars: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ],
    maxFiles: 1
  }
};

// Validate file against rules
export const validateFile = (file: File, validation: FileValidation): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > validation.maxSize) {
    const maxSizeMB = Math.round(validation.maxSize / (1024 * 1024));
    const currentSizeMB = Math.round(file.size / (1024 * 1024));
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size: ${maxSizeMB}MB, current size: ${currentSizeMB}MB`
    };
  }

  // Check file type
  if (!validation.allowedTypes.includes(file.type)) {
    const allowedExtensions = validation.allowedTypes
      .map(type => type.split('/')[1])
      .join(', ');
    return {
      valid: false,
      error: `File type not allowed for "${file.name}". Allowed types: ${allowedExtensions}`
    };
  }

  return { valid: true };
};

// Validate multiple files
export const validateFiles = (files: File[], validation: FileValidation): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check number of files
  if (validation.maxFiles && files.length > validation.maxFiles) {
    errors.push(`Maximum ${validation.maxFiles} files allowed. You selected ${files.length} files.`);
  }

  // Validate each file
  files.forEach((file) => {
    const result = validateFile(file, validation);
    if (!result.valid) {
      errors.push(result.error!);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// Generate unique file name with user folder structure
export const generateFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName
    .split('.').slice(0, -1).join('.')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50);
  
  return `${userId}/${timestamp}_${random}_${baseName}.${extension}`;
};

// Upload single file to Supabase Storage
export const uploadFile = async (
  file: File, 
  bucket: string, 
  userId: string,
  validation: FileValidation,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    // Validate file first
    const validationResult = validateFile(file, validation);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.error,
        fileName: file.name
      };
    }

    // FAIL LOUDLY if Supabase storage is not configured
    if (!supabase) {
      throw new Error('File storage is not configured. Please set up Supabase credentials.');
    }

    // Try Supabase upload with error handling
    try {
      // Generate unique file path
      const filePath = generateFileName(file.name, userId);

      // Report initial progress
      if (onProgress) onProgress(10);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      // Report progress
      if (onProgress) onProgress(80);

      // Get public URL for public buckets, or signed URL for private buckets
      let publicUrl: string;
      
      if (bucket === 'images' || bucket === 'avatars') {
        // Public buckets - get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      } else {
        // Private buckets - create signed URL (valid for 1 year)
        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 31536000); // 1 year

        if (signedError) {
          throw new Error(signedError.message);
        }
        
        publicUrl = signedData.signedUrl;
      }

      // Final progress
      if (onProgress) onProgress(100);

      return {
        success: true,
        url: publicUrl,
        fileName: file.name,
        filePath: filePath
      };

    } catch (supabaseError) {
      // NO FALLBACK - fail loudly so user knows storage is broken
      console.error('Supabase upload failed:', supabaseError);
      throw supabaseError;
    }

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      fileName: file.name
    };
  }
};

// Upload multiple files with progress tracking
export const uploadFiles = async (
  files: File[],
  bucket: string,
  userId: string,
  validation: FileValidation,
  onProgress?: (progress: number) => void
): Promise<UploadResult[]> => {
  // Validate all files first
  const validationResult = validateFiles(files, validation);
  if (!validationResult.valid) {
    return validationResult.errors.map(error => ({
      success: false,
      error
    }));
  }

  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    const result = await uploadFile(
      file, 
      bucket, 
      userId, 
      validation,
      (fileProgress) => {
        // Calculate overall progress
        const overallProgress = ((i / files.length) * 100) + (fileProgress / files.length);
        if (onProgress) onProgress(Math.min(overallProgress, 100));
      }
    );
    
    results.push(result);
  }

  return results;
};

// Delete file from Supabase Storage
export const deleteFile = async (bucket: string, filePath: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!supabase) {
      throw new Error('File storage is not configured');
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
};

// Get secure download URL for purchased resources
export const getSecureDownloadUrl = async (
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    if (!supabase) {
      throw new Error('File storage is not configured');
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      url: data.signedUrl
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get download URL'
    };
  }
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file type icon
export const getFileTypeIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'ppt':
    case 'pptx':
      return '📊';
    case 'xls':
    case 'xlsx':
      return '📈';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return '🖼️';
    case 'txt':
      return '📄';
    default:
      return '📎';
  }
};

// Helper to check if file is an image
export const isImageFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
};

// Helper to get file extension
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};