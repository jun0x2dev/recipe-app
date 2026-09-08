/**
 * - 레시피 상세 바텀시트에서 사용하는 Figma 원본 아이콘이다.
 * - SVG는 raw string으로 export하여 React Native SvgXml에서 렌더링한다.
 * - 원본 노드: Icon/Share(53:3457), Icon/Edit(57:848), Icon/Delete(57:862)
 */

/** 공유하기 액션 아이콘 */
export const recipeDetailShareIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.5 14V19H19.5V14" stroke="#343D46" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 14V4" stroke="#343D46" stroke-width="1.6" stroke-linecap="round"/>
<path d="M8 7L12 3" stroke="#343D46" stroke-width="1.6" stroke-linecap="round"/>
<path d="M12 3L16 7" stroke="#343D46" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

/** 수정 액션 아이콘 */
export const recipeDetailEditIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.7233 3.47436C15.4354 2.76226 16.59 2.76226 17.3021 3.47436L20.5255 6.6978C21.2376 7.4099 21.2376 8.56444 20.5255 9.27654L10.7053 19.0968C10.3868 19.4153 9.9616 19.6046 9.51175 19.6283L5.0976 19.8606C4.55695 19.8891 4.11076 19.4429 4.13922 18.9023L4.37154 14.4881C4.39522 14.0383 4.58457 13.6131 4.9031 13.2946L14.7233 3.47436Z" stroke="#343D46" stroke-width="1.6"/>
<path d="M5.57373 12.9559L11.0441 18.4262" stroke="#343D46" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

/** 삭제 액션 아이콘 */
export const recipeDetailDeleteIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.45459 5.47726H18.5455L18.1751 17.5774C18.121 19.3451 16.6724 20.75 14.9039 20.75H9.09619C7.32771 20.75 5.87911 19.3451 5.825 17.5774L5.45459 5.47726Z" stroke="#343D46" stroke-width="1.6"/>
<path d="M9.27295 5.47726H14.7275L14.6051 3.76317C14.5643 3.19229 14.0893 2.74998 13.5169 2.74998H10.4835C9.91119 2.74998 9.43616 3.19229 9.39538 3.76317L9.27295 5.47726Z" stroke="#343D46" stroke-width="1.6"/>
<path d="M4.36377 5.47726L19.6365 5.47726" stroke="#343D46" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;
