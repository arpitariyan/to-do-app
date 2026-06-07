import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { documentDirectory, getInfoAsync, downloadAsync, cacheDirectory } from 'expo-file-system/legacy';
import { storage, ID, STORAGE_BUCKETS, ENDPOINT, PROJECT_ID } from '../lib/appwrite';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uri?: string;
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
    return `${ENDPOINT}/storage/buckets/${STORAGE_BUCKETS.ATTACHMENTS}/files/${fileId}/download?project=${PROJECT_ID}`;
  };

  const getFileDetails = async (fileId: string): Promise<Attachment | null> => {
    try {
      const file = await storage.getFile(STORAGE_BUCKETS.ATTACHMENTS, fileId);
      const localUri = await getLocalFileUri(file.$id, file.name);
      return {
        id: file.$id,
        name: file.name,
        type: file.mimeType,
        size: file.sizeOriginal,
        url: localUri || getFileViewUrl(file.$id),
      };
    } catch (error) {
      console.error(`Error fetching file details for ${fileId}:`, error);
      return null;
    }
  };

  const getLocalFileUri = async (fileId: string, fileName: string): Promise<string | null> => {
    try {
      const dir = documentDirectory || cacheDirectory;
      const fileUri = `${dir}${fileId}_${fileName}`;
      const fileInfo = await getInfoAsync(fileUri);
      
      if (fileInfo.exists) {
        return fileInfo.uri;
      }
      
      // Download to local cache
      const downloadUrl = getFileViewUrl(fileId);
      const downloadRes = await downloadAsync(downloadUrl, fileUri);
      return downloadRes.uri;
    } catch (error) {
      console.error(`Error downloading file ${fileId} locally:`, error);
      return null;
    }
  };

  return {
    pickDocument,
    uploadFile,
    getFileViewUrl,
    getFileDownloadUrl,
    getFileDetails,
    getLocalFileUri,
    isUploading,
  };
}
