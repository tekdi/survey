import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  provider: process.env.STORAGE_PROVIDER || 'local',

  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'survey-media',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    presignedUrlTtl: 3600,
  },

  local: {
    uploadPath: process.env.LOCAL_UPLOAD_PATH || './uploads',
    publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000/uploads',
  },

  limits: {
    image: {
      maxSize: (parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 10) * 1024 * 1024,
      allowedMimeTypes: (
        process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp'
      ).split(','),
    },
    video: {
      maxSize: (parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 100) * 1024 * 1024,
      allowedMimeTypes: (
        process.env.ALLOWED_VIDEO_TYPES ||
        'video/mp4,video/quicktime,video/x-msvideo,video/webm'
      ).split(','),
    },
  },

  imageProcessing: {
    thumbnail: {
      enabled: true,
      width: 200,
      height: 200,
      quality: 80,
    },
    compression: {
      enabled: true,
      quality: 85,
    },
  },

  videoProcessing: {
    thumbnail: {
      enabled: true,
      timeOffset: 2,
    },
  },

  virusScan: {
    enabled: process.env.VIRUS_SCAN_ENABLED === 'true',
    provider: 'clamav',
    endpoint: process.env.CLAMAV_ENDPOINT,
  },
}));
