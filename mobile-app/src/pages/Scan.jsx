import React from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import './Scan.css';

const Scan = () => {
  return (
    <div className="scan-screen">
      <div className="camera-viewfinder">
        <div className="scanner-frame">
          <div className="corner top-left"></div>
          <div className="corner top-right"></div>
          <div className="corner bottom-left"></div>
          <div className="corner bottom-right"></div>
          <div className="scan-line"></div>
        </div>
        <p className="scan-instructions">Point your camera at your food</p>
      </div>

      <div className="scan-actions">
        <button className="btn-scan primary-btn">
          <Camera size={24} />
          <span>Scan Food</span>
        </button>
        <button className="btn-upload secondary-btn">
          <ImageIcon size={24} />
          <span>Upload from Gallery</span>
        </button>
      </div>
    </div>
  );
};

export default Scan;
