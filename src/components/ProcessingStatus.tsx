import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertCircle, Clock, FileText, Eye } from 'lucide-react';

interface ProcessingStatusProps {
  resourceId: string;
  onProcessingComplete?: () => void;
  className?: string;
}

interface ProcessingState {
  status: 'queued' | 'processing' | 'ready' | 'failed';
  isPreviewReady: boolean;
  previewCount: number;
  lastError?: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  resourceId,
  onProcessingComplete,
  className = ''
}) => {
  const [processingState, setProcessingState] = useState<ProcessingState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
    
    // Poll for status updates while processing
    const interval = setInterval(() => {
      if (processingState?.status === 'processing' || processingState?.status === 'queued') {
        checkStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [resourceId]);

  const checkStatus = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/resources/${resourceId}/status`);
      const data = await response.json();

      if (data.success) {
        const newState: ProcessingState = {
          status: data.status,
          isPreviewReady: data.isPreviewReady,
          previewCount: data.previewCount || 0,
          lastError: data.lastError
        };
        
        setProcessingState(newState);
        
        // Notify parent when processing completes
        if (newState.status === 'ready' && onProcessingComplete) {
          onProcessingComplete();
        }
      }
    } catch (error) {
      console.error('Error checking processing status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <Loader className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
        <p className="text-gray-600 text-sm">Checking status...</p>
      </div>
    );
  }

  if (!processingState) {
    return null;
  }

  const getStatusConfig = () => {
    switch (processingState.status) {
      case 'queued':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Queued for Processing',
          message: 'Your resource is in the processing queue. This usually takes 1-2 minutes.',
          showSpinner: false
        };
      case 'processing':
        return {
          icon: Loader,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          title: 'Generating Preview',
          message: 'We\'re creating a preview of your resource. Almost done!',
          showSpinner: true
        };
      case 'ready':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Preview Ready',
          message: `Preview generated successfully! ${processingState.previewCount} preview${processingState.previewCount !== 1 ? 's' : ''} available.`,
          showSpinner: false
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Processing Failed',
          message: processingState.lastError || 'Failed to generate preview. Please try uploading again.',
          showSpinner: false
        };
      default:
        return {
          icon: FileText,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Unknown Status',
          message: 'Processing status unknown.',
          showSpinner: false
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent 
            className={`w-6 h-6 ${config.color} ${config.showSpinner ? 'animate-spin' : ''}`} 
          />
        </div>
        <div className="ml-4 flex-1">
          <h4 className={`font-semibold ${config.color} mb-1`}>
            {config.title}
          </h4>
          <p className="text-sm text-gray-700">
            {config.message}
          </p>
          
          {processingState.status === 'ready' && processingState.previewCount > 0 && (
            <div className="mt-3 flex items-center text-sm text-green-700">
              <Eye className="w-4 h-4 mr-1" />
              <span>Preview is now available for trial users</span>
            </div>
          )}
          
          {processingState.status === 'failed' && (
            <div className="mt-3">
              <button 
                onClick={() => window.location.reload()}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;