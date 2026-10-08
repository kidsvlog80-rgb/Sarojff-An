// 0 to 9 number 3D ball stickers from github.com/predictorapikeyok-ctrl/1-to-10
export const NUMBER_IMAGES: string[] = [
  '/images/balls/ball_0.png',
  '/images/balls/ball_1.png',
  '/images/balls/ball_2.png',
  '/images/balls/ball_3.png',
  '/images/balls/ball_4.png',
  '/images/balls/ball_5.png',
  '/images/balls/ball_6.png',
  '/images/balls/ball_7.png',
  '/images/balls/ball_8.png',
  '/images/balls/ball_9.png'
];

export function getBallImageUrl(num: number | string | undefined | null): string {
  const n = typeof num === 'number' ? num : Number(num);
  if (!isNaN(n) && n >= 0 && n <= 9) {
    return NUMBER_IMAGES[n];
  }
  return NUMBER_IMAGES[0];
}

export function preloadBallImages(): void {
  if (typeof window === 'undefined') return;
  NUMBER_IMAGES.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}
