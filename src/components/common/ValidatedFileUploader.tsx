import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UploadedFileRecord } from '../../types';
import {
  UploadCloud,
  FileCheck,
  X,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Lock,
  CloudOff,
} from 'lucide-react';

interface ValidatedFileUploaderProps {
  onUploadSuccess: (fileRecord: UploadedFileRecord) => void;
  onRemove?: () => void;
  category?: string;
  projectId?: string;
  maxSizeMb?: number;
  allowedExtensions?: string[];
  label?: string;
  labelHi?: string;
  description?: string;
  descriptionHi?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file from local device'));
    reader.readAsDataURL(file);
  });
}

export const ValidatedFileUploader: React.FC<ValidatedFileUploaderProps> = ({
  onUploadSuccess,
  onRemove,
  category = 'general_attachment',
  projectId,
  maxSizeMb = 25,
  allowedExtensions = ['pdf', 'docx', 'zip', 'apk', 'png', 'jpg', 'jpeg', 'txt', 'json'],
  label,
  labelHi,
  description,
  descriptionHi,
}) => {
  const { language, t, showToast } = useLanguage();
  const { currentUser, openAuthModal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedRecord, setUploadedRecord] = useState<UploadedFileRecord | null>(null);
  const [, setClientSha256] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fileUploadEnabled, setFileUploadEnabled] = useState<boolean | null>(null);
  const [storageMode, setStorageMode] = useState<string>('local_container_disk');

  useEffect(() => {
    let active = true;
    fetch('/api/system/capabilities')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data && typeof data.fileUploadEnabled === 'boolean') {
          setFileUploadEnabled(data.fileUploadEnabled);
          if (typeof data.storageMode === 'string') {
            setStorageMode(data.storageMode);
          }
        } else {
          setFileUploadEnabled(true);
        }
      })
      .catch(() => {
        if (active) setFileUploadEnabled(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Calculate SHA-256 in browser via Web Cryptography API
  const computeClientHash = async (file: File): Promise<string> => {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return 'client-hash-unavailable';
    }
  };

  const processFile = async (file: File) => {
    setErrorMessage('');

    if (fileUploadEnabled === false) {
      const storageErr = t(
        'File upload is temporarily disabled on the server.',
        'सर्वर पर फ़ाइल अपलोड अस्थायी रूप से बंद है।'
      );
      setErrorMessage(storageErr);
      showToast(storageErr, 'info');
      return;
    }

    if (!currentUser) {
      const authErr = t(
        'Sign in with a verified account to upload files to encrypted enterprise storage.',
        'सुरक्षित फ़ाइल अपलोड करने के लिए कृपया अपने खाते से साइन इन करें।'
      );
      setErrorMessage(authErr);
      showToast(authErr, 'alert');
      openAuthModal('login');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(ext)) {
      const err = language === 'hi'
        ? `अस्वीकृत फ़ाइल प्रारूप .${ext}। अनुमत प्रारूप: ${allowedExtensions.map((e) => `.${e}`).join(', ')}`
        : `Forbidden format .${ext}. Allowed formats: ${allowedExtensions.map((e) => `.${e}`).join(', ')}`;
      setErrorMessage(err);
      showToast(err, 'alert');
      return;
    }

    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const err = language === 'hi'
        ? `फ़ाइल का आकार (${(file.size / (1024 * 1024)).toFixed(1)} MB) अधिकतम सीमा ${maxSizeMb} MB से अधिक है।`
        : `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum ${maxSizeMb} MB limit.`;
      setErrorMessage(err);
      showToast(err, 'alert');
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      // 1. Calculate local cryptographic SHA-256
      const hash = await computeClientHash(file);
      setClientSha256(hash);
      setUploadProgress(45);

      // 2. Read file as base64 cleanly inside awaited Promise
      const base64Data = await readFileAsDataUrl(file);
      setUploadProgress(70);

      const postUpload = async (forceRefresh: boolean) => {
        const idToken = await currentUser.getIdToken(forceRefresh);
        return fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || `application/${ext}`,
            fileData: base64Data,
            category,
            ...(projectId ? { projectId } : {}),
          }),
        });
      };

      // 3. Post to backend authenticated storage endpoint (refresh token once if expired)
      let response = await postUpload(false);
      if (response.status === 401) {
        response = await postUpload(true);
      }

      setUploadProgress(95);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          openAuthModal('login');
        }
        throw new Error(errData.error || `Server responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      setUploadProgress(100);
      setUploadedRecord(data.file);
      onUploadSuccess(data.file);

      showToast(
        language === 'hi'
          ? `फ़ाइल "${file.name}" सफलतापूर्वक अपलोड एवं सत्यापित हुई।`
          : `File "${file.name}" verified & saved to enterprise vault.`,
        'success'
      );
    } catch (err: any) {
      console.error('[Upload Failed]', err);
      const msg = err?.message || 'File upload failed';
      setErrorMessage(msg);
      showToast(msg, 'alert');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = '';
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleRemove = () => {
    setUploadedRecord(null);
    setClientSha256('');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-2">
      {/* Label & Description */}
      {(label || labelHi) && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            {language === 'hi' && labelHi ? labelHi : label}
          </label>
          <span className="text-[11px] font-mono text-slate-400">
            Max: {maxSizeMb} MB
          </span>
        </div>
      )}

      {/* Disabled Storage State (Only if backend explicitly disables uploads) */}
      {fileUploadEnabled === false ? (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3 text-xs">
          <div className="w-8 h-8 rounded bg-slate-200/70 text-slate-600 flex items-center justify-center shrink-0">
            <CloudOff className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-slate-800">
              {t(
                'File Upload Temporarily Unavailable',
                'फ़ाइल अपलोड अस्थायी रूप से उपलब्ध नहीं है'
              )}
            </div>
            <p className="text-slate-600 leading-relaxed">
              {t(
                'Server file storage is currently disabled. You can submit the form cleanly without attachments.',
                'सर्वर फ़ाइल स्टोरेज अभी बंद है। आप बिना फ़ाइल जोड़े भी फॉर्म या टिकट सुरक्षित रूप से भेज सकते हैं।'
              )}
            </p>
          </div>
        </div>
      ) : fileUploadEnabled === null ? (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2.5 text-xs text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-700 shrink-0" />
          <span>{t('Checking Storage Vault status...', 'स्टोरेज वॉल्ट स्थिति की जांच हो रही है...')}</span>
        </div>
      ) : !currentUser ? (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5 text-slate-700">
            <Lock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              {t(
                'Authenticated session required to upload RFP specs or diagnostic files.',
                'दस्तावेज़ अपलोड करने के लिए सुरक्षित खाता लॉगिन अनिवार्य है।'
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer shrink-0"
          >
            {t('Sign In to Attach File', 'फ़ाइल अपलोड हेतु साइन इन करें')}
          </button>
        </div>
      ) : uploadedRecord ? (
        /* Uploaded State Card */
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-300 rounded-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-slate-900 truncate">
                {uploadedRecord.fileName}
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex flex-wrap items-center gap-1.5">
                <span>{uploadedRecord.fileSizeFormatted}</span>
                <span>·</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                  SHA-256 Verified
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title={t('Remove File', 'फ़ाइल हटाएं')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Dropzone / Upload Trigger */
        <div
          role="button"
          tabIndex={0}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-lg p-4 sm:p-5 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-700 bg-blue-50/50'
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleInputChange}
            onClick={(e) => e.stopPropagation()}
            accept={allowedExtensions.map((e) => `.${e}`).join(',')}
            className="sr-only"
          />

          {uploading ? (
            <div className="py-2 space-y-2">
              <RefreshCw className="w-6 h-6 text-blue-700 animate-spin mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                {t('Verifying magic bytes & generating SHA-256 hash...', 'फ़ाइल बाइट्स एवं SHA-256 हैश सत्यापन जारी...')}
              </div>
              <div className="w-48 bg-slate-200 rounded-full h-1.5 mx-auto overflow-hidden">
                <div
                  className="bg-blue-700 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <UploadCloud className="w-7 h-7 text-blue-700 mx-auto" />
              <div className="text-xs text-slate-700 font-medium">
                <span className="font-bold text-blue-700 hover:underline">
                  {t('Click to upload', 'अपलोड करने के लिए क्लिक करें')}
                </span>{' '}
                {t('or drag & drop file here', 'या फ़ाइल यहां खींचें')}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {language === 'hi' && descriptionHi ? descriptionHi : description || (
                  `PDF, DOCX, ZIP, APK, PNG, JPG (up to ${maxSizeMb} MB)`
                )}
              </p>
              <div className="text-[10px] font-mono text-slate-400">
                {storageMode === 'google_cloud_storage'
                  ? t('Encrypted Google Cloud Storage Vault · SHA-256', 'एन्क्रिप्टेड Cloud Storage वॉल्ट · SHA-256')
                  : t('Authenticated Server Vault · Magic-Byte & SHA-256 Checked', 'प्रमाणित सर्वर वॉल्ट · Magic-Byte व SHA-256 सत्यापित')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message if any */}
      {errorMessage && (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
