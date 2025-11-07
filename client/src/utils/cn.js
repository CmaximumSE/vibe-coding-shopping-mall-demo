import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 클래스명을 조건부로 결합하고 Tailwind CSS 클래스를 병합합니다.
 * @param {...(string | object | Array)} inputs - 클래스명 또는 조건부 객체
 * @returns {string} 병합된 클래스명
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
