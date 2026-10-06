/**
 * Utility for generating and copying official course direct links
 */

export const getCourseShareUrl = (courseId: string): string => {
  try {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?courseId=${encodeURIComponent(courseId)}`;
  } catch {
    return `?courseId=${encodeURIComponent(courseId)}`;
  }
};

export const copyCourseShareLink = async (
  courseId: string,
  courseTitle: string,
  onSuccess?: (msg: string) => void,
  onError?: (msg: string) => void
): Promise<boolean> => {
  const link = getCourseShareUrl(courseId);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      if (onSuccess) {
        onSuccess(`تم نسخ الرابط المباشر لمقرر "${courseTitle}" بنجاح! يمكنك الآن مشاركته مع الطلاب.`);
      }
      return true;
    }
  } catch (e) {
    console.warn('Clipboard write failed, attempting fallback', e);
  }

  // Fallback for browsers with restricted clipboard
  try {
    const textarea = document.createElement('textarea');
    textarea.value = link;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (successful) {
      if (onSuccess) {
        onSuccess(`تم نسخ الرابط المباشر لمقرر "${courseTitle}" بنجاح! يمكنك الآن مشاركته مع الطلاب.`);
      }
      return true;
    }
  } catch (err) {
    console.error('Fallback copy failed', err);
  }

  if (onError) {
    onError(`رابط المقرر المباشر: ${link}`);
  }
  return false;
};
