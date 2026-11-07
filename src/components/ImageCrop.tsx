import React from 'react';

// Master reference images
export const MASTER_IMG_SRC = '/assets/aistudio/GauKripa__Seva__Shanti___Samriddhi_7b3a3fcf.png';
export const BANNER_HERO_SRC = '/assets/aistudio/image_a875da24.png';
export const DIWALI_HERO_SRC = '/assets/aistudio/image_a83a3632.png';

// Normalized or exact pixel coordinates
export interface CropBounds {
  x: number;
  y: number;
  w: number;
  h: number;
  src?: string;
  sourceWidth?: number;
  sourceHeight?: number;
}

export const CROPS: Record<string, CropBounds> = {
  // Festive Diwali Gau Puja Hero Banner from image_a83a3632.png (1452 x 804)
  diwaliHeroBanner: {
    x: 0,
    y: 0,
    w: 1452,
    h: 804,
    src: DIWALI_HERO_SRC,
    sourceWidth: 1452,
    sourceHeight: 804,
  },
  // Panoramic Banner from image_a875da24.png (1563 x 600)
  newHeroBanner: {
    x: 0,
    y: 76,
    w: 1563,
    h: 524,
    src: BANNER_HERO_SRC,
    sourceWidth: 1563,
    sourceHeight: 600,
  },
  newNavLogo: {
    x: 24,
    y: 4,
    w: 390,
    h: 74,
    src: BANNER_HERO_SRC,
    sourceWidth: 1563,
    sourceHeight: 600,
  },
  // Master visual crops from GauKripa__Seva__Shanti___Samriddhi_7b3a3fcf.png (1024 x 1536)
  logoIcon: { x: 26, y: 5, w: 86, h: 62 },
  heroCows: { x: 375, y: 35, w: 649, h: 360 },
  sevaChara: { x: 16, y: 462, w: 156, h: 114 },
  sevaRoti: { x: 178, y: 462, w: 133, h: 114 },
  sevaGudChana: { x: 316, y: 462, w: 134, h: 114 },
  sevaPakshi: { x: 456, y: 462, w: 236, h: 114 },
  sevaCheenti: { x: 698, y: 462, w: 136, h: 114 },
  sevaDogs: { x: 840, y: 462, w: 168, h: 114 },
  kundaliWheel: { x: 20, y: 748, w: 175, h: 175 },
  giftBox: { x: 872, y: 798, w: 122, h: 124 },
  astroSophia: { x: 26, y: 1032, w: 170, h: 118 },
  astroRohan: { x: 213, y: 1032, w: 170, h: 118 },
  astroMaria: { x: 400, y: 1032, w: 170, h: 118 },
  bottomCow: { x: 650, y: 1305, w: 155, h: 125 },
};

interface ImageCropProps {
  cropKey?: keyof typeof CROPS;
  bounds?: CropBounds;
  className?: string;
  alt?: string;
  preserveAspectRatio?: string;
}

export const ImageCrop: React.FC<ImageCropProps> = ({
  cropKey,
  bounds: customBounds,
  className = '',
  alt = 'GauKripa Sacred Visual',
  preserveAspectRatio = 'xMidYMid slice',
}) => {
  const b = customBounds || (cropKey ? CROPS[cropKey] : null);

  if (!b) {
    return <div className={`bg-amber-100 ${className}`} />;
  }

  const imageSource = b.src || MASTER_IMG_SRC;
  const imageWidth = b.sourceWidth || 1024;
  const imageHeight = b.sourceHeight || 1536;

  return (
    <div className={`overflow-hidden relative select-none ${className}`} role="img" aria-label={alt}>
      <svg
        viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`}
        className="w-full h-full block"
        preserveAspectRatio={preserveAspectRatio}
        xmlns="http://www.w3.org/2000/svg"
      >
        <image
          href={imageSource}
          x="0"
          y="0"
          width={imageWidth}
          height={imageHeight}
          preserveAspectRatio="none"
        />
      </svg>
    </div>
  );
};
