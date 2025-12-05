import React, { useState } from 'react';
import { Download, Lock, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSecureDownloadUrl } from '../lib/fileUpload';

interface DownloadManagerProps {
  resource: {
    id: string;
    title: string;
    fileUrls?: string[];
    price: number;
  };
  isPurchased: boolean;
  onPurchaseRequired: () => void;
}

const DownloadManager: React.FC<DownloadManagerProps> = ({
  resource,
  isPurchased,
  onPurchaseRequired
}) => {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadCounts, setDownloadCounts] = useState<{ [key: string]: number }>({});

  const handleDownload = async (fileUrl: string, fileName: string) => {
    if (!isPurchased) {
      onPurchaseRequired();
      return;
    }

    if (!user) {
      alert('Please sign in to download files');
      return;
    }

    setDownloading(fileUrl);

    try {
      // Get secure download URL
      const result = await getSecureDownloadUrl('resources', fileUrl, 3600);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get download link');
      }

      // Create download link
      const link = document.createElement('a');
      link.href = result.url!;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Track download count
      setDownloadCounts(prev => ({
        ...prev,
        [fileUrl]: (prev[fileUrl] || 0) + 1
      }));

    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  if (!resource.fileUrls || resource.fileUrls.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No files available for download</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Resource Files</h3>
      
      {resource.fileUrls.map((fileUrl, index) => {
        const fileName = `${resource.title} - File ${index + 1}`;
        const isDownloading = downloading === fileUrl;
        const downloadCount = downloadCounts[fileUrl] || 0;
        
        return (
          <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{fileName}</p>
                <p className="text-sm text-gray-600">
                  {isPurchased ? 'Ready to download' : `$${resource.price} - Purchase required`}
                  {downloadCount > 0 && ` • Downloaded ${downloadCount} time${downloadCount !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleDownload(fileUrl, fileName)}
              disabled={isDownloading}
              className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                isPurchased
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isDownloading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : isPurchased ? (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Purchase to Download
                </>
              )}
            </button>
          </div>
        );
      })}
      
      {isPurchased && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
            <p className="text-sm text-emerald-800">
              You own this resource. Downloads are unlimited and secure.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadManager;