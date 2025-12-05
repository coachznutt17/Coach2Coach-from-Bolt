import React, { useState, useEffect } from 'react';
import { Eye, Download, Lock, Loader, AlertCircle, FileText, Play, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMembership } from '../hooks/useMembership';
import { canDownloadFull } from '../lib/membership';

interface PreviewViewerProps {
  resourceId: string;
  title: string;
  price: number;
  onPurchaseClick?: () => void;
  className?: string;
}

interface PreviewStatus {
  processing: boolean;
  status: string;
  isPreviewReady: boolean;
  previewCount: number;
  lastError?: string;
}

const PreviewViewer: React.FC<PreviewViewerProps> = ({
  resourceId,
  title,
  price,
  onPurchaseClick,
  className = ''
}) => {
  const { user } = useAuth();
  const { membership } = useMembership();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canDownload = membership ? canDownloadFull(membership) : false;

  useEffect(() => {
    loadPreview();
    
    // Poll for preview status if processing
    const interval = setInterval(() => {
      if (previewStatus?.processing) {
        checkProcessingStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [resourceId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError('');

      // Get preview URL
      const response = await fetch(getApiUrl(`/api/resources/${resourceId}/preview`);
      const data = await response.json();

      if (data.success && data.previewUrl) {
        setPreviewUrl(data.previewUrl);
        setPreviewStatus({
          processing: false,
          status: 'ready',
          isPreviewReady: true,
          previewCount: 1
        });
      } else if (data.processing) {
        setPreviewStatus({
          processing: true,
          status: data.status,
          isPreviewReady: false,
          previewCount: 0
        });
        // Start polling for status
        checkProcessingStatus();
      } else {
        setError('Preview not available');
      }
    } catch (err) {
      setError('Failed to load preview');
      console.error('Preview load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkProcessingStatus = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/resources/${resourceId}/status`);
      const data = await response.json();

      if (data.success) {
        setPreviewStatus({
          processing: data.status === 'processing' || data.status === 'queued',
          status: data.status,
          isPreviewReady: data.isPreviewReady,
          previewCount: data.previewCount || 0
        });

        // If ready, reload preview
        if (data.isPreviewReady && !previewUrl) {
          loadPreview();
        }
      }
    } catch (err) {
      console.error('Status check error:', err);
    }
  };

  const handleDownload = () => {
    if (!canDownload) {
      onPurchaseClick?.();
      return;
    }

    // Trigger full download
    window.open(`/api/download/${resourceId}?userId=${user?.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <Loader className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center ${className}`}>
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (previewStatus?.processing) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-8 text-center ${className}`}>
        <Loader className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Processing Preview</h3>
        <p className="text-blue-700">
          We're generating a preview of this resource. This usually takes 1-2 minutes.
        </p>
        <div className="mt-4 text-sm text-blue-600">
          Status: {previewStatus.status}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Preview Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="w-5 h-5 text-gray-600 mr-2" />
            <span className="font-medium text-gray-700">Resource Preview</span>
            {!canDownload && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Trial Mode
              </span>
            )}
          </div>
          
          <button
            onClick={handleDownload}
            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${
              canDownload
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {canDownload ? (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Full
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Upgrade to Download
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4">
        {previewUrl ? (
          <div className="space-y-4">
            {/* Preview Image/Video */}
            <div className="relative">
              {previewUrl.includes('.mp4') ? (
                <video 
                  controls 
                  className="w-full max-h-96 rounded-lg"
                  poster="/api/placeholder/640/360"
                >
                  <source src={previewUrl} type="video/mp4" />
                  Your browser does not support video playback.
                </video>
              ) : (
                <img 
                  src={previewUrl} 
                  alt={`${title} preview`}
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                />
              )}
              
              {/* Watermark overlay for extra security */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                Coach2Coach Preview
              </div>
            </div>

            {/* Preview Info */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center">
                {previewUrl.includes('.mp4') ? (
                  <Play className="w-4 h-4 mr-1" />
                ) : previewUrl.includes('.png') || previewUrl.includes('.jpg') ? (
                  <ImageIcon className="w-4 h-4 mr-1" />
                ) : (
                  <FileText className="w-4 h-4 mr-1" />
                )}
                <span>
                  {previewStatus?.previewCount > 1 
                    ? `${previewStatus.previewCount} preview pages`
                    : 'Preview available'
                  }
                </span>
              </div>
              
              {!canDownload && (
                <span className="text-emerald-600 font-medium">
                  Full version: ${price}
                </span>
              )}
            </div>

            {/* Trial User Notice */}
            {!canDownload && (
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Lock className="w-5 h-5 text-emerald-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-800 mb-1">Preview Mode</h4>
                    <p className="text-emerald-700 text-sm mb-3">
                      You're viewing a limited preview. Upgrade to access the full resource with all pages, 
                      high resolution, and downloadable files.
                    </p>
                    <button
                      onClick={onPurchaseClick}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Upgrade for Full Access
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Preview Not Available</h3>
            <p className="text-gray-600">
              This resource doesn't have a preview available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewViewer;