// Automated content scanning utilities for Coach2Coach

export interface ScanResult {
  riskScore: number;
  flags: string[];
  details: {
    copyrightPhrases?: string[];
    suspiciousMetadata?: string[];
    fileIssues?: string[];
  };
}

export interface ScannerConfig {
  copyrightPhrases: string[];
  maxFileSizeMB: number;
  autoApproveThreshold: number;
  enableAutoApproval: boolean;
}

// Default scanner configuration
export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  copyrightPhrases: [
    'Pearson Education',
    'McGraw-Hill',
    'Houghton Mifflin',
    'Holt McDougal',
    'Oxford University Press',
    'Cambridge University Press',
    'Cengage Learning',
    'Wiley',
    'Prentice Hall',
    'Scholastic',
    'Teachers Pay Teachers',
    'TpT',
    'All rights reserved',
    '© Copyright',
    'Unauthorized reproduction'
  ],
  maxFileSizeMB: 500,
  autoApproveThreshold: 10,
  enableAutoApproval: true
};

// Extract text content from various file types
export async function extractTextContent(filePath: string, mimeType: string): Promise<string> {
  try {
    if (mimeType.includes('pdf')) {
      return await extractPdfText(filePath);
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return await extractDocumentText(filePath);
    } else if (mimeType.includes('presentation')) {
      return await extractPresentationText(filePath);
    } else {
      return '';
    }
  } catch (error) {
    console.error('Text extraction failed:', error);
    return '';
  }
}

// Extract text from PDF using pdftotext
async function extractPdfText(filePath: string): Promise<string> {
  const { spawn } = await import('child_process');
  const { promisify } = await import('util');
  const exec = promisify(spawn);

  try {
    const result = await exec('pdftotext', [filePath, '-']);
    return result.stdout?.toString() || '';
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    return '';
  }
}

// Extract text from Word/PowerPoint via LibreOffice conversion
async function extractDocumentText(filePath: string): Promise<string> {
  // Convert to PDF first, then extract text
  const pdfPath = await convertToPdf(filePath);
  return extractPdfText(pdfPath);
}

async function extractPresentationText(filePath: string): Promise<string> {
  // Convert to PDF first, then extract text
  const pdfPath = await convertToPdf(filePath);
  return extractPdfText(pdfPath);
}

async function convertToPdf(filePath: string): Promise<string> {
  const { spawn } = await import('child_process');
  const path = await import('path');
  const os = await import('os');

  const outputDir = path.join(os.tmpdir(), `convert_${Date.now()}`);
  const outputPath = path.join(outputDir, 'converted.pdf');

  return new Promise((resolve, reject) => {
    const libreOffice = spawn('libreoffice', [
      '--headless',
      '--convert-to', 'pdf',
      '--outdir', outputDir,
      filePath
    ]);

    libreOffice.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`LibreOffice conversion failed with code ${code}`));
      }
    });
  });
}

// Scan content for copyright violations and other issues
export async function scanContent(
  filePath: string, 
  mimeType: string, 
  fileName: string,
  config: ScannerConfig = DEFAULT_SCANNER_CONFIG
): Promise<ScanResult> {
  const result: ScanResult = {
    riskScore: 0,
    flags: [],
    details: {}
  };

  try {
    // 1. File size check
    const fs = await import('fs/promises');
    const stats = await fs.stat(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > config.maxFileSizeMB) {
      result.flags.push('oversized_file');
      result.riskScore += 20;
      result.details.fileIssues = [`File size ${fileSizeMB.toFixed(1)}MB exceeds limit`];
    }

    // 2. File name analysis
    const suspiciousNamePatterns = [
      /test|sample|demo|trial/i,
      /\.(exe|bat|sh|cmd)$/i,
      /copyright|©|all.?rights.?reserved/i
    ];

    suspiciousNamePatterns.forEach(pattern => {
      if (pattern.test(fileName)) {
        result.flags.push('suspicious_filename');
        result.riskScore += 15;
      }
    });

    // 3. Content text analysis
    const textContent = await extractTextContent(filePath, mimeType);
    
    if (textContent) {
      // Copyright phrase detection
      const foundPhrases: string[] = [];
      config.copyrightPhrases.forEach(phrase => {
        if (textContent.toLowerCase().includes(phrase.toLowerCase())) {
          foundPhrases.push(phrase);
          result.riskScore += 25;
        }
      });

      if (foundPhrases.length > 0) {
        result.flags.push('copyright_phrases');
        result.details.copyrightPhrases = foundPhrases;
      }

      // Publisher/textbook detection
      const publisherPatterns = [
        /isbn\s*:?\s*\d{10,13}/i,
        /published\s+by\s+[a-z\s]+press/i,
        /all\s+rights\s+reserved/i,
        /unauthorized\s+reproduction/i
      ];

      publisherPatterns.forEach(pattern => {
        if (pattern.test(textContent)) {
          result.flags.push('publisher_content');
          result.riskScore += 30;
        }
      });

      // Educational material detection
      const educationalPatterns = [
        /chapter\s+\d+\s*:/i,
        /homework|assignment|test\s+\d+/i,
        /answer\s+key|solutions\s+manual/i
      ];

      educationalPatterns.forEach(pattern => {
        if (pattern.test(textContent)) {
          result.flags.push('educational_material');
          result.riskScore += 20;
        }
      });
    }

    // 4. Metadata analysis (for PDFs)
    if (mimeType.includes('pdf')) {
      try {
        const metadata = await extractPdfMetadata(filePath);
        
        // Check for suspicious creators/producers
        const suspiciousCreators = [
          'Adobe Acrobat',
          'Microsoft Office',
          'Google Docs',
          'Canva',
          'Teachers Pay Teachers'
        ];

        suspiciousCreators.forEach(creator => {
          if (metadata.creator?.includes(creator) || metadata.producer?.includes(creator)) {
            result.flags.push('suspicious_metadata');
            result.riskScore += 10;
            result.details.suspiciousMetadata = result.details.suspiciousMetadata || [];
            result.details.suspiciousMetadata.push(`Creator: ${creator}`);
          }
        });
      } catch (error) {
        // Metadata extraction failed, not critical
      }
    }

    // 5. Final risk assessment
    if (result.riskScore >= 75) {
      result.flags.push('high_risk');
    } else if (result.riskScore >= 50) {
      result.flags.push('medium_risk');
    } else if (result.riskScore >= 25) {
      result.flags.push('low_risk');
    }

  } catch (error) {
    console.error('Content scanning failed:', error);
    result.flags.push('scan_failed');
    result.riskScore += 50; // High risk if we can't scan
  }

  return result;
}

// Extract PDF metadata
async function extractPdfMetadata(filePath: string): Promise<any> {
  const { spawn } = await import('child_process');
  
  return new Promise((resolve, reject) => {
    const pdfinfo = spawn('pdfinfo', [filePath]);
    let output = '';
    
    pdfinfo.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pdfinfo.on('close', (code) => {
      if (code === 0) {
        const metadata: any = {};
        output.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            metadata[key.trim().toLowerCase()] = valueParts.join(':').trim();
          }
        });
        resolve(metadata);
      } else {
        reject(new Error(`pdfinfo failed with code ${code}`));
      }
    });
  });
}

// Get scanner configuration from environment
export function getScannerConfig(): ScannerConfig {
  return {
    copyrightPhrases: process.env.SCANNER_COPYRIGHT_PHRASES?.split(';') || DEFAULT_SCANNER_CONFIG.copyrightPhrases,
    maxFileSizeMB: parseInt(process.env.SCANNER_MAX_FILE_MB || '500'),
    autoApproveThreshold: parseInt(process.env.AUTO_APPROVE_THRESHOLD || '10'),
    enableAutoApproval: process.env.AUTO_APPROVE_SAFE_UPLOADS === 'true'
  };
}