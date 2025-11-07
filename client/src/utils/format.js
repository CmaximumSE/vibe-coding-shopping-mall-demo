/**
 * 숫자를 한국 원화 형식으로 포맷팅합니다.
 * @param {number} amount - 포맷팅할 금액
 * @returns {string} 포맷팅된 금액 문자열
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
};

/**
 * 숫자를 천 단위 구분자로 포맷팅합니다.
 * @param {number} number - 포맷팅할 숫자
 * @returns {string} 포맷팅된 숫자 문자열
 */
export const formatNumber = (number) => {
  return new Intl.NumberFormat('ko-KR').format(number);
};

/**
 * 날짜를 한국 형식으로 포맷팅합니다.
 * @param {Date|string} date - 포맷팅할 날짜
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatDate = (date) => {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * 날짜와 시간을 한국 형식으로 포맷팅합니다.
 * @param {Date|string} date - 포맷팅할 날짜
 * @returns {string} 포맷팅된 날짜시간 문자열
 */
export const formatDateTime = (date) => {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * 상대적 시간을 표시합니다 (예: "3분 전", "2시간 전").
 * @param {Date|string} date - 기준 날짜
 * @returns {string} 상대적 시간 문자열
 */
export const formatRelativeTime = (date) => {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
};

/**
 * 문자열을 지정된 길이로 자르고 생략표시를 추가합니다.
 * @param {string} str - 자를 문자열
 * @param {number} length - 최대 길이
 * @returns {string} 자른 문자열
 */
export const truncateText = (str, length = 100) => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};
