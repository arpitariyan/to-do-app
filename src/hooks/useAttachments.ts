import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { storage, ID, STORAGE_BUCKETS, ENDPOINT, PROJECT_ID } from '../lib/appwrite';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uri: string;
  url?: string;
}

export function useAttachments() {
  const [isUploading, setIsUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // all files
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // 10 MB limit check
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          throw new Error('File size exceeds 10MB limit.');
        }

        return {
          id: ID.unique(),
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          uri: asset.uri,
        } as Attachment;
      }
      return null;
    } catch (error) {
      console.error('Error picking document:', error);
      throw error;
    }
  };

  const uploadFile = async (attachment: Attachment): Promise<string> => {
    try {
      setIsUploading(true);
      const file = {
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        uri: attachment.uri,
      };

      const response = await storage.createFile(
        STORAGE_BUCKETS.ATTACHMENTS,
        attachment.id,
        file as any
      );
      
      return response.$id;
    } catch (error) {
      console.error('Error uploading file to Appwrite:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const getFileViewUrl = (fileId: string) => {
    return `${ENDPOINT}/storage/buckets/${STORAGE_BUCKETS.ATTACHMENTS}/files/${fileId}/view?project=${PROJECT_ID}`;
  };

  const getFileDownloadUrl = (fileId: string) => {
    return storage.getFileDownload(STORAGE_BUCKETS.ATTACHMENTS, fileId);
  };

  return {
    pickDocument,
    uploadFile,
    getFileViewUrl,
    getFileDownloadUrl,
    isUploading,
  };
}
