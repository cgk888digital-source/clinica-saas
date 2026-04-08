const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folders exist
const ensureDir = (dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Directory created: ${dir}`);
    }
  } catch (err) {
    console.warn(`⚠️ [Vercel] Could not create directory ${dir}:`, err.message);
    // In Vercel, this is expected for everything except /tmp
  }
};

// Factory to create multer instance with options
const createUpload = (options = {}) => {
  let dest = options.dest || 'uploads/';
  
  // En Vercel, redirigir todo a /tmp para evitar errores de solo lectura
  if (process.env.VERCEL) {
    dest = path.join('/tmp', dest);
  }
  
  ensureDir(dest);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9.\-\_]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    if (options.allowedTypes) {
      if (options.allowedTypes.includes(file.mimetype)) return cb(null, true);
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  };

  return multer({ storage, limits: { fileSize: options.maxSize || 5 * 1024 * 1024 }, fileFilter });
};

module.exports = { createUpload };
