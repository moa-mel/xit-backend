/**
 * AI Detection Configuration
 * 
 * This file contains configuration settings for the AI detection feature
 */

export const AI_DETECTION_CONFIG = {
  // Processing settings
  PROCESSING: {
    // Timeout for detection processing (in milliseconds)
    TIMEOUT: 30000,
    
    // Maximum concurrent detections
    MAX_CONCURRENT: 5,
    
    // Retry attempts on failure
    MAX_RETRIES: 3,
    
    // Delay between retries (in milliseconds)
    RETRY_DELAY: 1000,
  },

  // Confidence thresholds
  CONFIDENCE: {
    // Minimum confidence score to consider result valid (0-100)
    MIN_VALID_SCORE: 60,
    
    // High confidence threshold
    HIGH_CONFIDENCE: 85,
    
    // Low confidence threshold
    LOW_CONFIDENCE: 70,
  },

  // Content type settings
  CONTENT_TYPES: {
    VIDEO: {
      MAX_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
      SUPPORTED_FORMATS: ['mp4', 'avi', 'mov', 'mkv', 'webm'],
      ANALYSIS_METHODS: ['deepfake_detector', 'video_forensics', 'artifact_detection'],
    },
    AUDIO: {
      MAX_SIZE: 500 * 1024 * 1024, // 500MB
      SUPPORTED_FORMATS: ['mp3', 'wav', 'aac', 'm4a', 'flac'],
      ANALYSIS_METHODS: ['voice_analysis', 'speech_pattern_detection', 'audio_forensics'],
    },
    IMAGE: {
      MAX_SIZE: 100 * 1024 * 1024, // 100MB
      SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      ANALYSIS_METHODS: ['image_forensics', 'artifact_detection', 'metadata_analysis'],
    },
    LIVESTREAM: {
      MAX_SIZE: 10 * 1024 * 1024 * 1024, // 10GB
      SUPPORTED_FORMATS: ['mp4', 'mkv', 'webm'],
      ANALYSIS_METHODS: ['deepfake_detector', 'video_forensics', 'real_time_analysis'],
    },
    PODCAST: {
      MAX_SIZE: 1 * 1024 * 1024 * 1024, // 1GB
      SUPPORTED_FORMATS: ['mp3', 'wav', 'm4a', 'aac'],
      ANALYSIS_METHODS: ['voice_analysis', 'speech_pattern_detection', 'audio_forensics'],
    },
  },

  // Detection methods
  DETECTION_METHODS: {
    DEEPFAKE_DETECTOR: {
      name: 'deepfake_detector_v1',
      description: 'Detects deepfakes using facial analysis',
      supported_types: ['VIDEO', 'LIVESTREAM'],
      accuracy: 0.92,
    },
    AUDIO_ANALYSIS: {
      name: 'audio_analysis_v1',
      description: 'Analyzes audio for AI-generated speech',
      supported_types: ['AUDIO', 'PODCAST'],
      accuracy: 0.88,
    },
    VIDEO_FORENSICS: {
      name: 'video_forensics_v1',
      description: 'Detects video manipulation and artifacts',
      supported_types: ['VIDEO', 'LIVESTREAM'],
      accuracy: 0.85,
    },
    IMAGE_FORENSICS: {
      name: 'image_forensics_v1',
      description: 'Detects image manipulation and AI generation',
      supported_types: ['IMAGE'],
      accuracy: 0.90,
    },
  },

  // Analysis parameters
  ANALYSIS: {
    // Number of frames to analyze in video
    VIDEO_FRAMES_TO_ANALYZE: 30,
    
    // Audio sample rate for analysis
    AUDIO_SAMPLE_RATE: 16000,
    
    // Duration of audio segments to analyze (in seconds)
    AUDIO_SEGMENT_DURATION: 5,
    
    // Facial landmarks to check
    FACIAL_LANDMARKS: 68,
    
    // Eye movement sensitivity (0-1)
    EYE_MOVEMENT_SENSITIVITY: 0.8,
  },

  // Caching settings
  CACHE: {
    // Cache detection results for this duration (in seconds)
    RESULT_TTL: 86400, // 24 hours
    
    // Cache analysis details
    CACHE_ANALYSIS_DETAILS: true,
  },

  // Notification settings
  NOTIFICATIONS: {
    // Notify user when detection completes
    NOTIFY_ON_COMPLETION: true,
    
    // Notify user if AI generation detected
    NOTIFY_ON_AI_DETECTED: true,
    
    // Notify user if processing fails
    NOTIFY_ON_FAILURE: true,
  },

  // Rate limiting
  RATE_LIMIT: {
    // Maximum detections per user per hour
    MAX_PER_HOUR: 100,
    
    // Maximum bulk detections per request
    MAX_BULK_SIZE: 50,
    
    // Maximum concurrent detections per user
    MAX_CONCURRENT_PER_USER: 5,
  },

  // Logging
  LOGGING: {
    // Log detection requests
    LOG_REQUESTS: true,
    
    // Log detection results
    LOG_RESULTS: true,
    
    // Log errors
    LOG_ERRORS: true,
    
    // Log processing time
    LOG_PROCESSING_TIME: true,
  },

  // External API settings (for future integration)
  EXTERNAL_APIS: {
    // Deepfake detection API
    DEEPFAKE_API: {
      enabled: false,
      endpoint: process.env.DEEPFAKE_API_ENDPOINT || '',
      apiKey: process.env.DEEPFAKE_API_KEY || '',
      timeout: 30000,
    },
    
    // Audio analysis API
    AUDIO_API: {
      enabled: false,
      endpoint: process.env.AUDIO_API_ENDPOINT || '',
      apiKey: process.env.AUDIO_API_KEY || '',
      timeout: 30000,
    },
    
    // Image forensics API
    IMAGE_API: {
      enabled: false,
      endpoint: process.env.IMAGE_API_ENDPOINT || '',
      apiKey: process.env.IMAGE_API_KEY || '',
      timeout: 30000,
    },
  },

  // Result interpretation
  RESULT_INTERPRETATION: {
    AI_GENERATED: {
      label: 'AI Generated',
      description: 'Content appears to be AI-generated',
      recommendation: 'Exercise caution with this content',
    },
    HUMAN_CREATED: {
      label: 'Human Created',
      description: 'Content appears to be created by humans',
      recommendation: 'Content is likely authentic',
    },
    INCONCLUSIVE: {
      label: 'Inconclusive',
      description: 'Detection results are inconclusive',
      recommendation: 'Manual review recommended',
    },
  },
};

export default AI_DETECTION_CONFIG;
