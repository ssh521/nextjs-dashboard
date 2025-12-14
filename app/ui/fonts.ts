import { Inter, Lusitana } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'] });
export const lusitana = Lusitana({ subsets: ['latin'], weight: ['400', '700'] });

// 맑은 고딕 - 시스템 폰트 사용
// Windows에 기본 설치된 맑은 고딕을 사용합니다
// CSS 변수는 global.css에서 정의되어 있습니다
export const malgunGothic = {
  variable: '--font-malgun-gothic',
};