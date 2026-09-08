/**
 * - 카테고리 썸네일 에셋 모음이다.
 * - 백엔드 thumbnailUrl 값(키)을 로컬 이미지 에셋에 매핑한다.
 * - 피그마 Img/Thumbnail 컴포넌트 원본 (3x 스케일, 96x96)
 */
import { ImageSourcePropType } from 'react-native';

/**
 * - thumbnailUrl 키 → 로컬 PNG 에셋 매핑이다.
 * - 새 카테고리 이미지가 추가되면 여기에 항목을 추가한다.
 */
export const categoryThumbnails: Record<string, ImageSourcePropType> = {
  rice: require('./thumbnail-rice.png'),
  bread: require('./thumbnail-bread.png'),
};
