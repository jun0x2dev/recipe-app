import { Recipe } from '../types/recipe';

/**
 * - 백엔드 연결 전 화면 검증에 사용하는 레시피 mock 데이터다.
 * - 목록, 상세, 검색, 공개/비공개 표시 흐름을 확인할 수 있게 구성한다.
 * - 실제 API 연동 시 repository 또는 API client 계층으로 대체한다.
 */
export const mockRecipes: Recipe[] = [
  {
    id: 'recipe-1',
    title: '고추장 닭가슴살 덮밥',
    description: '매콤한 양념과 간단한 채소로 빠르게 만드는 한 그릇 식사',
    cookingTimeMinutes: 20,
    visibility: 'public',
    ingredients: ['닭가슴살 180g', '양파 1/2개', '고추장 1.5큰술', '간장 1큰술', '밥 1공기'],
    steps: [
      '닭가슴살과 양파를 먹기 좋은 크기로 썬다.',
      '팬에 기름을 두르고 닭가슴살을 먼저 익힌다.',
      '양파와 양념을 넣고 중불에서 볶는다.',
      '밥 위에 올리고 취향에 따라 깨를 뿌린다.',
    ],
    viewCount: 128,
    likeCount: 34,
    shareCount: 7,
    createdAt: '2026-05-14',
  },
  {
    id: 'recipe-2',
    title: '들기름 간장 비빔국수',
    description: '불을 오래 쓰지 않고 만드는 고소한 비빔국수',
    cookingTimeMinutes: 15,
    visibility: 'private',
    ingredients: ['소면 1인분', '간장 1큰술', '들기름 1.5큰술', '김가루', '쪽파'],
    steps: [
      '소면을 삶은 뒤 찬물에 헹군다.',
      '간장과 들기름을 먼저 섞어 소스를 만든다.',
      '면에 소스를 버무리고 김가루와 쪽파를 올린다.',
    ],
    viewCount: 42,
    likeCount: 11,
    shareCount: 2,
    createdAt: '2026-05-13',
  },
  {
    id: 'recipe-3',
    title: '토마토 계란 볶음',
    description: '재료가 적고 아침 식사로 부담 없는 기본 볶음 요리',
    cookingTimeMinutes: 10,
    visibility: 'public',
    ingredients: ['토마토 2개', '계란 3개', '소금', '후추', '올리브오일'],
    steps: [
      '토마토는 큼직하게 썰고 계란은 소금과 함께 풀어둔다.',
      '팬에 계란을 부드럽게 익힌 뒤 잠시 덜어낸다.',
      '토마토를 볶다가 계란을 다시 넣고 가볍게 섞는다.',
    ],
    viewCount: 203,
    likeCount: 56,
    shareCount: 12,
    createdAt: '2026-05-11',
  },
];
