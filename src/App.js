import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
// Inside your App component, before return()

const downloadImage = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
  }
};

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [outputUrl, setOutputUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');

  const handleChange = (e) => {
    setFile(e.target.files[0]);
    setOutputUrl('');
    setOriginalUrl('');
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
    const fileType = file.type;

    try {
      const res = await axios.post('http://localhost:5000/upload-url', {
        filename: safeName,
        filetype: fileType
      });

      const { uploadURL } = res.data;

      await axios.put(uploadURL, file, {
        headers: {
          'Content-Type': fileType
        }
      });

      const original = `https://kokilan-img-src.s3.ap-south-1.amazonaws.com/${safeName}`;
      const resized = `https://kokilan-img-out.s3.ap-south-1.amazonaws.com/resized-${safeName}`;

      setOriginalUrl(original);

      setTimeout(() => {
        setOutputUrl(resized);
        setUploading(false);
      }, 5000);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <h1>Image Compressor</h1>
      <p>Upload an image to compress it using AWS S3 + Lambda</p>
      <input type="file" accept="image/*" onChange={handleChange} />
      <button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? 'Uploading...' : 'Upload & Compress'}
      </button>

      <div className="preview-section">
        {originalUrl && (
          <div className="preview-box">
            <h3>Original Image</h3>
            <img src={originalUrl} alt="original" />
          </div>
        )}
        
        {outputUrl && (
  <div className="preview-box">
    <h3>Compressed Image</h3>
    <img src={outputUrl} alt="compressed" />
    <a
  href={outputUrl}
  download={`compressed-${file.name}`}
  className="download-btn"
  onClick={(e) => e.stopPropagation()}
>
  Download
</a>

  </div>
)}



      </div>
    </div>
  );
}

export default App;
